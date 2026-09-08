import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ActiveQuest, CapabilityRole, EarnedBadge, Family, FamilyMember, QuestCategory, QuestDetails, QuestPlan, QuestSubtask, User } from '../types';

type UserRow = { id: number; name: string; email: string; age: number; roles: string; password_hash?: string; password_salt?: string };
type FamilyRow = { id: number; name: string; joinCode: string; membershipRole: 'owner' | 'member' };

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      age INTEGER NOT NULL CHECK(age BETWEEN 5 AND 120),
      roles TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      join_code TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS family_members (
      family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      membership_role TEXT NOT NULL CHECK(membership_role IN ('owner','member')),
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(family_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS active_session (
      id INTEGER PRIMARY KEY CHECK(id=1),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'family',
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      total_estimated_minutes INTEGER NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      skill TEXT NOT NULL,
      do_together INTEGER NOT NULL DEFAULT 0,
      destination TEXT NOT NULL DEFAULT '',
      destination_latitude REAL,
      destination_longitude REAL,
      sort_order INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','accepted','completed'))
    );
    CREATE TABLE IF NOT EXISTS subtask_contributors (
      subtask_id INTEGER NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(subtask_id,user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_quests_family_status ON quests(family_id,status);
    CREATE INDEX IF NOT EXISTS idx_subtasks_quest ON subtasks(quest_id,sort_order);
  `);
  const subtaskColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(subtasks)');
  if (!subtaskColumns.some(column => column.name === 'destination')) {
    await db.execAsync("ALTER TABLE subtasks ADD COLUMN destination TEXT NOT NULL DEFAULT ''");
  }
  if (!subtaskColumns.some(column => column.name === 'destination_latitude')) {
    await db.execAsync('ALTER TABLE subtasks ADD COLUMN destination_latitude REAL');
  }
  if (!subtaskColumns.some(column => column.name === 'destination_longitude')) {
    await db.execAsync('ALTER TABLE subtasks ADD COLUMN destination_longitude REAL');
  }
  const questColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(quests)');
  if (!questColumns.some(column => column.name === 'category')) {
    await db.execAsync('ALTER TABLE quests ADD COLUMN category TEXT');
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
function parseRoles(value: string, age: number): CapabilityRole[] {
  const selected = JSON.parse(value || '[]') as CapabilityRole[];
  return ['anyone', ...(age >= 18 ? ['adult' as const] : []), ...selected];
}
function toUser(row: UserRow): User { return { id: row.id, name: row.name, email: row.email, age: row.age, roles: parseRoles(row.roles, row.age) }; }
function toMember(row: UserRow & { membershipRole: 'owner' | 'member' }): FamilyMember {
  const user = toUser(row);
  return { id: user.id, name: user.name, age: user.age, roles: user.roles, membershipRole: row.membershipRole };
}
async function hashPassword(password: string, salt: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`); }
function fail(message: string): never { throw new Error(message); }

export async function register(db: SQLiteDatabase, input: { name: string; email: string; password: string; age: number; roles: CapabilityRole[] }) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (name.length < 2 || name.length > 60) fail('Name must be between 2 and 60 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
  if (input.password.length < 8) fail('Password must be at least 8 characters.');
  if (!Number.isInteger(input.age) || input.age < 5 || input.age > 120) fail('Age must be between 5 and 120.');
  const roles = [...new Set(input.roles.filter(role => role === 'cook' || role === 'driver'))];
  if (roles.includes('driver') && input.age < 16) fail('Drivers must be at least 16 years old.');
  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(input.password, salt);
  try {
    const result = await db.runAsync('INSERT INTO users(name,email,password_hash,password_salt,age,roles) VALUES(?,?,?,?,?,?)', name, email, passwordHash, salt, input.age, JSON.stringify(roles));
    await setSession(db, result.lastInsertRowId);
    return getUserById(db, result.lastInsertRowId);
  } catch (error) {
    if (String(error).includes('UNIQUE')) fail('An account with that email already exists.');
    throw error;
  }
}

export async function login(db: SQLiteDatabase, email: string, password: string) {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE email=?', normalizeEmail(email));
  if (!row?.password_hash || !row.password_salt || await hashPassword(password, row.password_salt) !== row.password_hash) fail('Email or password is incorrect.');
  await setSession(db, row.id);
  return toUser(row);
}

async function setSession(db: SQLiteDatabase, userId: number) { await db.runAsync('INSERT OR REPLACE INTO active_session(id,user_id) VALUES(1,?)', userId); }
export async function logout(db: SQLiteDatabase) { await db.runAsync('DELETE FROM active_session'); }
export async function getCurrentUser(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<UserRow>('SELECT u.* FROM active_session s JOIN users u ON u.id=s.user_id WHERE s.id=1');
  return row ? toUser(row) : null;
}
async function getUserById(db: SQLiteDatabase, id: number) {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id=?', id);
  return row ? toUser(row) : null;
}

export async function createFamily(db: SQLiteDatabase, userId: number, inputName: string) {
  const name = inputName.trim();
  if (name.length < 2 || name.length > 60) fail('Family name must be between 2 and 60 characters.');
  if (await getFamilyForUser(db, userId)) fail('You already belong to a family.');
  const code = Crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync('INSERT INTO families(name,join_code,created_by) VALUES(?,?,?)', name, code, userId);
    await db.runAsync("INSERT INTO family_members(family_id,user_id,membership_role) VALUES(?,?,'owner')", result.lastInsertRowId, userId);
  });
  return getFamilyForUser(db, userId);
}

export async function joinFamily(db: SQLiteDatabase, userId: number, inputCode: string) {
  if (await getFamilyForUser(db, userId)) fail('You already belong to a family.');
  const family = await db.getFirstAsync<{ id: number }>('SELECT id FROM families WHERE join_code=?', inputCode.trim().toUpperCase());
  if (!family) fail('That family code was not found on this device.');
  await db.runAsync("INSERT INTO family_members(family_id,user_id,membership_role) VALUES(?,?,'member')", family.id, userId);
  return getFamilyForUser(db, userId);
}

export async function getFamilyForUser(db: SQLiteDatabase, userId: number): Promise<Family | null> {
  const family = await db.getFirstAsync<FamilyRow>('SELECT f.id,f.name,f.join_code AS joinCode,fm.membership_role AS membershipRole FROM family_members fm JOIN families f ON f.id=fm.family_id WHERE fm.user_id=?', userId);
  if (!family) return null;
  const rows = await db.getAllAsync<UserRow & { membershipRole: 'owner' | 'member' }>('SELECT u.id,u.name,u.email,u.age,u.roles,fm.membership_role AS membershipRole FROM family_members fm JOIN users u ON u.id=fm.user_id WHERE fm.family_id=? ORDER BY fm.joined_at,u.id', family.id);
  return { ...family, members: rows.map(toMember) };
}

export async function saveQuest(db: SQLiteDatabase, familyId: number, creatorId: number, plan: QuestPlan) {
  const title = plan.questTitle.trim();
  const tasks = plan.tasks.filter(task => task.title.trim());
  if (title.length < 2) fail('Give the main task a name.');
  if (!tasks.length) fail('Add at least one subtask before publishing.');
  if (tasks.some(task => task.skill === 'driver' && (!Number.isFinite(task.destinationLatitude) || !Number.isFinite(task.destinationLongitude)))) fail('Pin a destination on the map for every driver task.');
  const totalEstimatedMinutes = tasks.reduce((total, task) => total + Math.max(1, task.estimatedMinutes), 0);
  let questId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO quests(family_id,category,title,summary,total_estimated_minutes,created_by) VALUES(?,?,?,?,?,?)',
      familyId, plan.category || 'family', title, plan.summary.trim(), totalEstimatedMinutes, creatorId,
    );
    questId = result.lastInsertRowId;
    for (const [index, task] of tasks.entries()) {
      await db.runAsync(
        'INSERT INTO subtasks(quest_id,title,description,estimated_minutes,skill,do_together,sort_order,destination,destination_latitude,destination_longitude) VALUES(?,?,?,?,?,?,?,?,?,?)',
        questId, task.title.trim(), task.description.trim(), Math.max(1, task.estimatedMinutes), task.skill, task.doTogether ? 1 : 0, index, task.destination?.trim() || 'Pinned destination', task.destinationLatitude ?? null, task.destinationLongitude ?? null,
      );
    }
  });
  return questId;
}

export async function getActiveQuests(db: SQLiteDatabase, familyId: number): Promise<ActiveQuest[]> {
  const rows = await db.getAllAsync<{
    id: number; category: string | null; title: string; summary: string; totalEstimatedMinutes: number; createdAt: string; hasDriver: number;
    creatorId: number; creatorName: string; creatorAge: number; creatorRoles: string; creatorMembershipRole: 'owner' | 'member';
    completedSubtasks: number; totalSubtasks: number;
  }>(`
    SELECT q.id,q.category,q.title,q.summary,q.total_estimated_minutes AS totalEstimatedMinutes,q.created_at AS createdAt,
      u.id AS creatorId,u.name AS creatorName,u.age AS creatorAge,u.roles AS creatorRoles,
      fm.membership_role AS creatorMembershipRole,
      SUM(CASE WHEN s.status='completed' THEN 1 ELSE 0 END) AS completedSubtasks,
      MAX(CASE WHEN s.skill='driver' THEN 1 ELSE 0 END) AS hasDriver,
      COUNT(s.id) AS totalSubtasks
    FROM quests q
    JOIN users u ON u.id=q.created_by
    JOIN family_members fm ON fm.user_id=u.id AND fm.family_id=q.family_id
    LEFT JOIN subtasks s ON s.quest_id=q.id
    WHERE q.family_id=? AND q.status='active'
    GROUP BY q.id
    ORDER BY q.created_at DESC,q.id DESC
  `, familyId);

  return Promise.all(rows.map(async row => {
    const contributorRows = await db.getAllAsync<UserRow & { membershipRole: 'owner' | 'member' }>(`
      SELECT DISTINCT u.id,u.name,u.email,u.age,u.roles,fm.membership_role AS membershipRole
      FROM subtask_contributors sc
      JOIN subtasks s ON s.id=sc.subtask_id
      JOIN users u ON u.id=sc.user_id
      JOIN family_members fm ON fm.user_id=u.id
      WHERE s.quest_id=? ORDER BY u.name
    `, row.id);
    const creator = toMember({ id: row.creatorId, name: row.creatorName, email: '', age: row.creatorAge, roles: row.creatorRoles, membershipRole: row.creatorMembershipRole });
    const total = Number(row.totalSubtasks);
    const completed = Number(row.completedSubtasks);
    return { id: row.id, category: resolveQuestCategory(row.category, row.title, row.summary, Boolean(row.hasDriver)), title: row.title, summary: row.summary, totalEstimatedMinutes: row.totalEstimatedMinutes, createdAt: row.createdAt, creator, contributors: contributorRows.map(toMember), completedSubtasks: completed, totalSubtasks: total, progress: total ? Math.round(completed / total * 100) : 0 };
  }));
}

function resolveQuestCategory(category: string | null, title: string, summary: string, hasDriver: boolean): QuestCategory {
  if (category === 'food' || category === 'clean' || category === 'family' || category === 'route') return category;
  if (hasDriver) return 'route';
  const value = `${title} ${summary}`.toLowerCase();
  if (/clean|tidy|wash|laundry|dish|vacuum|mop|organize/.test(value)) return 'clean';
  if (/food|cook|meal|dinner|lunch|breakfast|grocery|kitchen/.test(value)) return 'food';
  return 'family';
}

export async function getBadges(db: SQLiteDatabase, userId: number): Promise<EarnedBadge[]> {
  const result = await db.getFirstAsync<{ completed: number; teamCompleted: number }>(`
    SELECT COUNT(DISTINCT CASE WHEN s.status='completed' THEN s.id END) AS completed,
      COUNT(DISTINCT CASE WHEN s.status='completed' AND s.do_together=1 THEN s.id END) AS teamCompleted
    FROM subtask_contributors sc JOIN subtasks s ON s.id=sc.subtask_id WHERE sc.user_id=?
  `, userId);
  const completed = Number(result?.completed || 0);
  const teamCompleted = Number(result?.teamCompleted || 0);
  return [
    { id: 'first-finish', title: 'First Finish', description: 'Complete your first subtask', icon: '✓', earned: completed >= 1, progress: Math.min(completed, 1), target: 1 },
    { id: 'helping-hand', title: 'Helping Hand', description: 'Complete five subtasks', icon: '✦', earned: completed >= 5, progress: Math.min(completed, 5), target: 5 },
    { id: 'team-player', title: 'Team Player', description: 'Complete three pair-up tasks', icon: '∞', earned: teamCompleted >= 3, progress: Math.min(teamCompleted, 3), target: 3 },
  ];
}

export async function getQuestDetails(db: SQLiteDatabase, familyId: number, questId: number): Promise<QuestDetails | null> {
  const quest = (await getActiveQuests(db, familyId)).find(item => item.id === questId);
  if (!quest) return null;
  const rows = await db.getAllAsync<{
    id: number; questId: number; title: string; description: string; estimatedMinutes: number;
    skill: CapabilityRole; doTogether: number; destination: string; destinationLatitude: number | null; destinationLongitude: number | null; status: 'open' | 'accepted' | 'completed';
  }>(`SELECT id,quest_id AS questId,title,description,estimated_minutes AS estimatedMinutes,
      skill,do_together AS doTogether,destination,destination_latitude AS destinationLatitude,destination_longitude AS destinationLongitude,status
      FROM subtasks WHERE quest_id=? ORDER BY sort_order,id`, questId);
  const tasks: QuestSubtask[] = await Promise.all(rows.map(async row => {
    const contributors = await db.getAllAsync<UserRow & { membershipRole: 'owner' | 'member'; acceptedAt: string }>(`
      SELECT u.id,u.name,u.email,u.age,u.roles,fm.membership_role AS membershipRole,sc.accepted_at AS acceptedAt
      FROM subtask_contributors sc JOIN users u ON u.id=sc.user_id
      JOIN family_members fm ON fm.user_id=u.id AND fm.family_id=?
      WHERE sc.subtask_id=? ORDER BY sc.accepted_at`, familyId, row.id);
    return {
      ...row,
      doTogether: Boolean(row.doTogether),
      destination: row.destination || undefined,
      destinationLatitude: row.destinationLatitude ?? undefined,
      destinationLongitude: row.destinationLongitude ?? undefined,
      contributors: contributors.map(contributor => ({ ...toMember(contributor), acceptedAt: contributor.acceptedAt })),
    };
  }));
  return { ...quest, tasks };
}

export async function claimSubtask(db: SQLiteDatabase, familyId: number, subtaskId: number, userId: number) {
  let acceptedAt = '';
  await db.withTransactionAsync(async () => {
    const task = await db.getFirstAsync<{ skill: CapabilityRole; status: string }>(`
      SELECT s.skill,s.status FROM subtasks s JOIN quests q ON q.id=s.quest_id
      JOIN family_members fm ON fm.family_id=q.family_id AND fm.user_id=?
      WHERE s.id=? AND q.family_id=? AND q.status='active'`, userId, subtaskId, familyId);
    if (!task) fail('This task is no longer available.');
    if (task.status === 'completed') fail('This task has already been completed.');
    const user = await getUserById(db, userId);
    if (!user || (task.skill !== 'anyone' && !user.roles.includes(task.skill))) fail(`You need the ${task.skill} badge for this task.`);
    await db.runAsync('INSERT OR IGNORE INTO subtask_contributors(subtask_id,user_id) VALUES(?,?)', subtaskId, userId);
    await db.runAsync("UPDATE subtasks SET status='accepted' WHERE id=? AND status='open'", subtaskId);
    const contribution = await db.getFirstAsync<{ acceptedAt: string }>('SELECT accepted_at AS acceptedAt FROM subtask_contributors WHERE subtask_id=? AND user_id=?', subtaskId, userId);
    acceptedAt = contribution?.acceptedAt || new Date().toISOString();
  });
  return acceptedAt;
}

export async function completeSubtask(db: SQLiteDatabase, subtaskId: number, userId: number) {
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(`UPDATE subtasks SET status='completed' WHERE id=? AND status!='completed'
      AND EXISTS(SELECT 1 FROM subtask_contributors WHERE subtask_id=? AND user_id=?)`, subtaskId, subtaskId, userId);
    if (!result.changes) fail('Claim this task before completing it.');
    await db.runAsync(`UPDATE quests SET status='completed' WHERE id=(SELECT quest_id FROM subtasks WHERE id=?)
      AND NOT EXISTS(SELECT 1 FROM subtasks WHERE quest_id=quests.id AND status!='completed')`, subtaskId);
  });
}
