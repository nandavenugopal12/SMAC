import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface HomeScreenProps { onNavigateToPlans: () => void; }
type RequestState = 'empty' | 'sent' | 'offered' | 'connected';
type SheetMode = 'menu' | 'ask' | 'offer' | 'details' | null;

const categories = [
  { key: 'Transport', icon: 'car-sport', bg: theme.colors.transport, fg: theme.colors.transportDark, motif: 'route' },
  { key: 'School', icon: 'school', bg: theme.colors.school, fg: theme.colors.schoolDark, motif: 'grid' },
  { key: 'Meals', icon: 'restaurant', bg: theme.colors.meals, fg: theme.colors.mealsDark, motif: 'sun' },
  { key: 'Plans', icon: 'map', bg: theme.colors.plans, fg: theme.colors.plansDark, motif: 'path' },
] as const;

const family = [
  { initial: 'N', name: 'Noor', color: theme.colors.transport, badge: 'Student' },
  { initial: 'S', name: 'Saif', color: theme.colors.school, badge: 'Navigator' },
  { initial: 'M', name: 'Mariam', color: theme.colors.meals, badge: 'Great cook' },
  { initial: 'O', name: 'Omar', color: theme.colors.plans, badge: 'Driver' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToPlans }) => {
  const [requestState, setRequestState] = useState<RequestState>('empty');
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [category, setCategory] = useState('Transport');
  const [recipient, setRecipient] = useState('Everyone');
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: requestState === 'connected' ? 1 : requestState === 'offered' ? .72 : requestState === 'sent' ? .34 : 0,
      useNativeDriver: false,
    }).start();
    if (requestState === 'connected') {
      Animated.sequence([
        Animated.spring(pulse, { toValue: 1.14, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [requestState, progress, pulse]);

  const heroCopy = {
    empty: ['What do you need today?', 'Ask for help or see where you can step in.'],
    sent: ['Request on the road', 'Campus pickup · Today at 4:15 PM'],
    offered: ['Omar can pick you up', 'One tap and the plan is connected.'],
    connected: ['Handled together', 'Pickup confirmed · Today at 4:15 PM'],
  }[requestState];

  const openCategory = (name: string) => name === 'Plans' ? onNavigateToPlans() : (setCategory(name), setSheet('ask'));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>SUNDAY · 7 SEPTEMBER</Text><Text style={styles.title}>Hey Noor</Text></View>
          <View style={styles.faces}>{family.map((x,i)=><View key={x.initial} style={[styles.face,{backgroundColor:x.color,marginLeft:i?-8:0}]}><Text style={styles.faceText}>{x.initial}</Text></View>)}</View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBlobA}/><View style={styles.heroBlobB}/>
          <View style={styles.heroTop}><Text style={styles.heroLabel}>TODAY · BOTH WAYS</Text><View style={styles.livePill}><View style={styles.liveDot}/><Text style={styles.liveText}>{requestState === 'empty' ? 'READY' : 'LIVE'}</Text></View></View>

          <View style={styles.trackWrap}>
            <View style={styles.track}/>
            <Animated.View style={[styles.trackFill,{width:progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}/>
            <View style={styles.person}><View style={[styles.bigFace,{backgroundColor:theme.colors.transport}]}><Text style={styles.bigFaceText}>N</Text></View><Text style={styles.personText}>{requestState === 'empty' ? 'You' : 'Needs ride'}</Text></View>
            <Animated.View style={[styles.meetPoint,{transform:[{scale:pulse}]}]}><Ionicons name={requestState==='connected'?'checkmark':'swap-horizontal'} size={23} color={theme.colors.connectionDark}/></Animated.View>
            <View style={[styles.person,{alignItems:'flex-end'}]}><View style={[styles.bigFace,{backgroundColor:requestState==='empty'?theme.colors.surfaceAlt:theme.colors.plans}]}><Text style={styles.bigFaceText}>{requestState==='empty'?'?':'O'}</Text></View><Text style={styles.personText}>{requestState==='offered'||requestState==='connected'?'Omar · Driver':'Family'}</Text></View>
          </View>

          <Text style={styles.heroTitle}>{heroCopy[0]}</Text>
          <Text style={styles.heroCaption}>{heroCopy[1]}</Text>

          {requestState === 'empty' && <View style={styles.heroActions}>
            <TouchableOpacity style={styles.askButton} onPress={()=>setSheet('ask')}><Ionicons name="arrow-up" size={18} color="#FFF"/><Text style={styles.askText}>Ask</Text></TouchableOpacity>
            <TouchableOpacity style={styles.offerButton} onPress={()=>setSheet('offer')}><Ionicons name="arrow-down" size={18} color={theme.colors.textPrimary}/><Text style={styles.offerText}>Offer</Text></TouchableOpacity>
          </View>}
          {requestState === 'sent' && <TouchableOpacity style={styles.waitButton} onPress={()=>setRequestState('offered')}><Text style={styles.waitText}>Preview family response</Text><Ionicons name="arrow-forward" size={17} color={theme.colors.transportDark}/></TouchableOpacity>}
          {requestState === 'offered' && <TouchableOpacity style={styles.askButton} onPress={()=>setRequestState('connected')}><Text style={styles.askText}>Meet halfway</Text><Ionicons name="arrow-forward" size={17} color="#FFF"/></TouchableOpacity>}
          {requestState === 'connected' && <TouchableOpacity style={styles.doneButton} onPress={()=>setSheet('details')}><Text style={styles.doneText}>View pickup</Text><Ionicons name="checkmark-circle" size={18} color={theme.colors.plansDark}/></TouchableOpacity>}
        </View>

        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Family world</Text><Text style={styles.sectionHint}>Tap to explore</Text></View>
        <View style={styles.categoryRow}>{categories.map((item)=><TouchableOpacity key={item.key} onPress={()=>openCategory(item.key)} style={styles.category} activeOpacity={.8}>
          <View style={[styles.categoryIcon,{backgroundColor:item.bg}]}><View style={styles.iconOrb}/><Ionicons name={item.icon as any} size={25} color={item.fg}/><View style={[styles.iconDash,{backgroundColor:item.fg}]}/></View><Text style={styles.categoryText}>{item.key}</Text>
        </TouchableOpacity>)}</View>

        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Family strengths</Text><Text style={styles.sectionHint}>Useful, not competitive</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
          {family.slice(1).map((member,i)=><TouchableOpacity key={member.name} style={[styles.badge,{backgroundColor:member.color}]} onPress={()=>{setRecipient(member.name);setSheet('ask')}}>
            <View style={styles.badgeMedal}><Ionicons name={(['navigate','restaurant','car-sport'] as const)[i]} size={16} color={theme.colors.textPrimary}/></View>
            <View><Text style={styles.badgeSkill}>{member.badge}</Text><Text style={styles.badgeName}>{member.name}</Text></View>
          </TouchableOpacity>)}
        </ScrollView>

        <TouchableOpacity style={styles.moment} activeOpacity={0.86} onPress={onNavigateToPlans}>
          <View style={styles.sun}/><View style={styles.table}><View style={styles.plate}/></View>
          <View style={styles.momentCopy}><Text style={styles.momentOverline}>TONIGHT · 7:30</Text><Text style={styles.momentTitle}>Dinner comes together</Text><Text style={styles.momentSub}>Mariam + Noor are preparing it</Text></View>
          <View style={styles.arrow}><Ionicons name="arrow-forward" size={18} color={theme.colors.mealsDark}/></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.perspective} onPress={()=>setSheet('details')}>
          <View style={styles.perspectiveIcon}><Ionicons name="layers" size={20} color={theme.colors.schoolDark}/></View>
          <View style={{flex:1}}><Text style={styles.perspectiveLabel}>SEE THEIR SIDE</Text><Text style={styles.perspectiveText}>Dinner started before the cooking did.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary}/>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.navWrap}><View style={styles.nav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={21} color={theme.colors.textPrimary}/><Text style={styles.navActive}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.connectNav} onPress={()=>setSheet('menu')}><Ionicons name="swap-horizontal" size={25} color={theme.colors.connectionDark}/></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToPlans}><Ionicons name="calendar-clear-outline" size={21} color={theme.colors.textSecondary}/><Text style={styles.navText}>Plans</Text></TouchableOpacity>
      </View></View>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={()=>setSheet(null)}>
        <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={()=>setSheet(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.handle}/>
            {sheet === 'menu' && <><Text style={styles.sheetKicker}>CONNECT</Text><Text style={styles.sheetTitle}>Which way today?</Text><View style={styles.choiceGrid}><TouchableOpacity style={styles.choiceAsk} onPress={()=>setSheet('ask')}><Ionicons name="arrow-up" size={25} color="#FFF"/><Text style={styles.choiceAskTitle}>Ask</Text><Text style={styles.choiceAskSub}>Send a family request</Text></TouchableOpacity><TouchableOpacity style={styles.choiceOffer} onPress={()=>setSheet('offer')}><Ionicons name="arrow-down" size={25} color={theme.colors.textPrimary}/><Text style={styles.choiceTitle}>Offer</Text><Text style={styles.choiceSub}>See who needs you</Text></TouchableOpacity></View></>}
            {sheet === 'ask' && <><Text style={styles.sheetKicker}>NEW REQUEST</Text><Text style={styles.sheetTitle}>What do you need?</Text><View style={styles.pickerRow}>{categories.map(x=><TouchableOpacity key={x.key} onPress={()=>setCategory(x.key)} style={[styles.picker,{backgroundColor:x.bg},category===x.key&&styles.pickerActive]}><Ionicons name={x.icon as any} size={20} color={x.fg}/></TouchableOpacity>)}</View><View style={styles.requestCard}><View><Text style={styles.requestLabel}>{category.toUpperCase()}</Text><Text style={styles.requestTitle}>{category==='Transport'?'Pickup from campus':category==='School'?'Check tomorrow’s timetable':category==='Meals'?'Help with dinner': 'Plan our Friday'}</Text><Text style={styles.requestMeta}>Today · 4:15 PM</Text></View><Ionicons name="time-outline" size={22} color={theme.colors.textSecondary}/></View><Text style={styles.fieldLabel}>SEND TO</Text><View style={styles.recipientRow}>{['Everyone','Omar','Mariam'].map(x=><TouchableOpacity key={x} onPress={()=>setRecipient(x)} style={[styles.recipient,recipient===x&&styles.recipientActive]}><Text style={[styles.recipientText,recipient===x&&styles.recipientTextActive]}>{x}</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.sheetButton} onPress={()=>{setRequestState('sent');setSheet(null)}}><Text style={styles.sheetButtonText}>Send request</Text><Ionicons name="arrow-up-circle" size={19} color="#FFF"/></TouchableOpacity></>}
            {sheet === 'offer' && <><Text style={styles.sheetKicker}>FAMILY NEEDS</Text><Text style={styles.sheetTitle}>Where can you step in?</Text><View style={styles.needCard}><View style={[styles.needIcon,{backgroundColor:theme.colors.transport}]}><Ionicons name="car-sport" size={23} color={theme.colors.transportDark}/></View><View style={{flex:1}}><Text style={styles.requestTitle}>Noor needs a pickup</Text><Text style={styles.requestMeta}>Campus · 4:15 PM</Text></View><View style={styles.skillMini}><Text style={styles.skillMiniText}>DRIVER</Text></View></View><TouchableOpacity style={styles.sheetButton} onPress={()=>{setRequestState('offered');setSheet(null)}}><Text style={styles.sheetButtonText}>I can help</Text><Ionicons name="heart" size={18} color="#FFF"/></TouchableOpacity></>}
            {sheet === 'details' && <><Text style={styles.sheetKicker}>TODAY · 4:15 PM</Text><Text style={styles.sheetTitle}>{requestState==='connected'?'Pickup confirmed':'Their side of the plan'}</Text><Text style={styles.sheetText}>{requestState==='connected'?'Omar will collect Noor at the campus main entrance. Both phones now have the same plan.':'Mariam started planning dinner at 5:00—checking ingredients, choosing a meal and preparing before anyone reached the kitchen.'}</Text><View style={styles.sheetPeople}><View style={[styles.bigFace,{backgroundColor:theme.colors.transport}]}><Text style={styles.bigFaceText}>N</Text></View><View style={styles.sheetLine}/><Ionicons name="heart" size={22} color={theme.colors.mealsDark}/><View style={styles.sheetLine}/><View style={[styles.bigFace,{backgroundColor:theme.colors.plans}]}><Text style={styles.bigFaceText}>O</Text></View></View><TouchableOpacity style={styles.sheetButton} onPress={()=>setSheet(null)}><Text style={styles.sheetButtonText}>Got it</Text></TouchableOpacity></>}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:theme.colors.background},content:{padding:18,paddingBottom:112,maxWidth:520,width:'100%',alignSelf:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.2,color:theme.colors.textMuted},title:{fontSize:30,fontWeight:'900',letterSpacing:-1.1,color:theme.colors.textPrimary},faces:{flexDirection:'row'},face:{width:34,height:34,borderRadius:17,borderWidth:2,borderColor:'#FFF',alignItems:'center',justifyContent:'center'},faceText:{fontWeight:'800',fontSize:12,color:theme.colors.textPrimary},
  hero:{overflow:'hidden',backgroundColor:'#FFF',borderRadius:32,padding:20,marginBottom:24,borderWidth:1,borderColor:theme.colors.border,...theme.shadows.soft},heroBlobA:{position:'absolute',width:170,height:170,borderRadius:85,backgroundColor:theme.colors.transport,top:-105,left:-55},heroBlobB:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:theme.colors.plans,bottom:-125,right:-55},heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},heroLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:theme.colors.textMuted},livePill:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:theme.colors.surfaceAlt,paddingHorizontal:8,paddingVertical:5,borderRadius:12},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:'#55B986'},liveText:{fontSize:8,fontWeight:'900',letterSpacing:.7,color:theme.colors.textSecondary},
  trackWrap:{height:77,marginTop:22,justifyContent:'center'},track:{position:'absolute',height:4,left:28,right:28,borderRadius:2,backgroundColor:theme.colors.border},trackFill:{position:'absolute',height:4,left:28,borderRadius:2,backgroundColor:'#67B8E9'},person:{position:'absolute',left:0,alignItems:'flex-start'},bigFace:{width:52,height:52,borderRadius:20,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'#FFF'},bigFaceText:{fontSize:17,fontWeight:'900',color:theme.colors.textPrimary},personText:{fontSize:10,fontWeight:'800',color:theme.colors.textSecondary,marginTop:4},meetPoint:{alignSelf:'center',width:54,height:54,borderRadius:20,backgroundColor:theme.colors.connection,alignItems:'center',justifyContent:'center',zIndex:2},
  heroTitle:{fontSize:25,fontWeight:'900',letterSpacing:-.9,textAlign:'center',color:theme.colors.textPrimary,marginTop:20},heroCaption:{fontSize:12,lineHeight:17,textAlign:'center',color:theme.colors.textSecondary,marginTop:4},heroActions:{flexDirection:'row',gap:9,marginTop:18},askButton:{flex:1,minHeight:49,borderRadius:18,backgroundColor:theme.colors.textPrimary,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',marginTop:18},askText:{color:'#FFF',fontWeight:'900'},offerButton:{flex:1,minHeight:49,borderRadius:18,backgroundColor:theme.colors.connection,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},offerText:{color:theme.colors.textPrimary,fontWeight:'900'},waitButton:{height:49,borderRadius:18,backgroundColor:theme.colors.transport,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',marginTop:18},waitText:{fontWeight:'900',color:theme.colors.transportDark},doneButton:{height:49,borderRadius:18,backgroundColor:theme.colors.plans,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',marginTop:18},doneText:{fontWeight:'900',color:theme.colors.plansDark},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline'},sectionTitle:{fontSize:18,fontWeight:'900',color:theme.colors.textPrimary},sectionHint:{fontSize:10,color:theme.colors.textMuted},categoryRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12,marginBottom:24},category:{alignItems:'center',width:'23%'},categoryIcon:{width:64,height:64,borderRadius:21,alignItems:'center',justifyContent:'center',overflow:'hidden'},iconOrb:{position:'absolute',width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,.55)',top:-15,right:-8},iconDash:{position:'absolute',height:3,width:19,borderRadius:2,bottom:11,right:8,opacity:.32},categoryText:{fontSize:11,fontWeight:'800',color:theme.colors.textPrimary,marginTop:7},
  badges:{gap:9,paddingTop:11,paddingBottom:22},badge:{minWidth:142,height:62,borderRadius:20,padding:9,flexDirection:'row',alignItems:'center',gap:9},badgeMedal:{width:40,height:40,borderRadius:14,backgroundColor:'rgba(255,255,255,.65)',alignItems:'center',justifyContent:'center'},badgeSkill:{fontSize:11,fontWeight:'900',color:theme.colors.textPrimary},badgeName:{fontSize:9,fontWeight:'700',color:theme.colors.textSecondary,marginTop:2},
  moment:{height:158,borderRadius:28,backgroundColor:theme.colors.meals,overflow:'hidden',padding:18,justifyContent:'flex-end',marginBottom:12},sun:{position:'absolute',width:110,height:110,borderRadius:55,backgroundColor:'#FFD79E',right:30,top:-45},table:{position:'absolute',width:120,height:56,borderRadius:28,backgroundColor:'#FFF4EC',right:24,top:47,alignItems:'center',justifyContent:'center',transform:[{rotate:'-4deg'}]},plate:{width:42,height:42,borderRadius:21,backgroundColor:'#FFF',borderWidth:6,borderColor:'#F2B496'},momentCopy:{maxWidth:'67%'},momentOverline:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:theme.colors.mealsDark},momentTitle:{fontSize:20,fontWeight:'900',letterSpacing:-.5,color:theme.colors.textPrimary,marginTop:3},momentSub:{fontSize:11,color:theme.colors.textSecondary,marginTop:4},arrow:{position:'absolute',right:18,bottom:18,width:36,height:36,borderRadius:18,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},
  perspective:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderRadius:22,padding:14,borderWidth:1,borderColor:theme.colors.border},perspectiveIcon:{width:44,height:44,borderRadius:15,backgroundColor:theme.colors.school,alignItems:'center',justifyContent:'center'},perspectiveLabel:{fontSize:9,fontWeight:'900',letterSpacing:1,color:theme.colors.schoolDark},perspectiveText:{fontSize:13,fontWeight:'700',color:theme.colors.textPrimary,marginTop:2},
  navWrap:{position:'absolute',left:18,right:18,bottom:12,alignItems:'center'},nav:{height:68,width:'100%',maxWidth:430,borderRadius:27,backgroundColor:'#FFF',borderWidth:1,borderColor:theme.colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:34,...theme.shadows.floatingNav},navItem:{minWidth:60,alignItems:'center',justifyContent:'center'},navText:{fontSize:10,fontWeight:'700',color:theme.colors.textMuted,marginTop:3},navActive:{fontSize:10,fontWeight:'900',color:theme.colors.textPrimary,marginTop:3},connectNav:{width:54,height:54,borderRadius:18,backgroundColor:theme.colors.connection,alignItems:'center',justifyContent:'center'},
  modalShade:{flex:1,backgroundColor:'rgba(30,32,43,.38)',justifyContent:'flex-end'},sheet:{backgroundColor:'#FFF',borderTopLeftRadius:32,borderTopRightRadius:32,padding:24,paddingBottom:36},handle:{width:42,height:5,borderRadius:3,backgroundColor:theme.colors.border,alignSelf:'center',marginBottom:18},sheetKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:theme.colors.textMuted},sheetTitle:{fontSize:25,fontWeight:'900',letterSpacing:-.8,color:theme.colors.textPrimary,marginTop:3},sheetText:{fontSize:14,lineHeight:21,color:theme.colors.textSecondary,marginTop:8},choiceGrid:{flexDirection:'row',gap:10,marginTop:20},choiceAsk:{flex:1,height:142,borderRadius:25,backgroundColor:theme.colors.textPrimary,padding:18,justifyContent:'flex-end'},choiceOffer:{flex:1,height:142,borderRadius:25,backgroundColor:theme.colors.connection,padding:18,justifyContent:'flex-end'},choiceAskTitle:{fontSize:20,fontWeight:'900',color:'#FFF',marginTop:10},choiceAskSub:{fontSize:11,color:'#DADCE7',marginTop:3},choiceTitle:{fontSize:20,fontWeight:'900',color:theme.colors.textPrimary,marginTop:10},choiceSub:{fontSize:11,color:theme.colors.textSecondary,marginTop:3},
  pickerRow:{flexDirection:'row',gap:9,marginTop:18},picker:{flex:1,height:52,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'transparent'},pickerActive:{borderColor:theme.colors.textPrimary},requestCard:{minHeight:92,borderRadius:22,backgroundColor:theme.colors.surfaceAlt,padding:15,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},requestLabel:{fontSize:8,fontWeight:'900',letterSpacing:1,color:theme.colors.textMuted},requestTitle:{fontSize:15,fontWeight:'900',color:theme.colors.textPrimary,marginTop:3},requestMeta:{fontSize:11,color:theme.colors.textSecondary,marginTop:4},fieldLabel:{fontSize:9,fontWeight:'900',letterSpacing:1,color:theme.colors.textMuted,marginTop:18,marginBottom:8},recipientRow:{flexDirection:'row',gap:7},recipient:{paddingHorizontal:13,paddingVertical:9,borderRadius:15,backgroundColor:theme.colors.surfaceAlt},recipientActive:{backgroundColor:theme.colors.textPrimary},recipientText:{fontSize:11,fontWeight:'800',color:theme.colors.textSecondary},recipientTextActive:{color:'#FFF'},sheetButton:{height:52,borderRadius:18,backgroundColor:theme.colors.textPrimary,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:22},sheetButtonText:{color:'#FFF',fontWeight:'900'},needCard:{minHeight:82,borderRadius:22,backgroundColor:theme.colors.surfaceAlt,padding:12,marginTop:18,flexDirection:'row',alignItems:'center',gap:11},needIcon:{width:52,height:52,borderRadius:17,alignItems:'center',justifyContent:'center'},skillMini:{backgroundColor:theme.colors.plans,paddingHorizontal:8,paddingVertical:6,borderRadius:12},skillMiniText:{fontSize:7,fontWeight:'900',color:theme.colors.plansDark},sheetPeople:{flexDirection:'row',alignItems:'center',marginVertical:24},sheetLine:{flex:1,height:2,backgroundColor:theme.colors.border},
});
