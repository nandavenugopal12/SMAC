export type CapabilityRole = 'anyone' | 'adult' | 'cook' | 'driver';

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  roles: CapabilityRole[];
}

export interface FamilyMember extends Omit<User, 'email'> {
  membershipRole: 'owner' | 'member';
}

export interface Family {
  id: number;
  name: string;
  joinCode: string;
  membershipRole: 'owner' | 'member';
  members: FamilyMember[];
}

export interface QuestTask {
  id: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  skill: CapabilityRole;
  doTogether: boolean;
  destination?: string;
}

export interface QuestPlan {
  questTitle: string;
  summary: string;
  totalEstimatedMinutes: number;
  tasks: QuestTask[];
}

export interface ActiveQuest {
  id: number;
  title: string;
  summary: string;
  totalEstimatedMinutes: number;
  createdAt: string;
  creator: FamilyMember;
  contributors: FamilyMember[];
  completedSubtasks: number;
  totalSubtasks: number;
  progress: number;
}

export interface TaskContributor extends FamilyMember {
  acceptedAt: string;
}

export interface QuestSubtask extends QuestTask {
  questId: number;
  status: 'open' | 'accepted' | 'completed';
  contributors: TaskContributor[];
}

export interface QuestDetails extends ActiveQuest {
  tasks: QuestSubtask[];
}

export interface EarnedBadge {
  id: 'first-finish' | 'helping-hand' | 'team-player';
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  target: number;
}
