import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface HomeScreenProps { onNavigateToPlans: () => void; }
type ConnectState = 'ready' | 'connecting' | 'connected';

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToPlans }) => {
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectState, setConnectState] = useState<ConnectState>('ready');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connectState !== 'connected') return;
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.12, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [connectState, pulse]);

  const connect = () => {
    setConnectState('connecting');
    setTimeout(() => setConnectState('connected'), 550);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>SUNDAY · 7 SEPTEMBER</Text><Text style={styles.title}>Hey Noor</Text></View>
          <View style={styles.faces}>{['N','S','M','O'].map((x,i)=><View key={x} style={[styles.face,{backgroundColor:[theme.colors.transport,theme.colors.school,theme.colors.meals,theme.colors.plans][i],marginLeft:i?-8:0}]}><Text style={styles.faceText}>{x}</Text></View>)}</View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBlobA}/><View style={styles.heroBlobB}/>
          <Text style={styles.heroLabel}>TODAY, BOTH WAYS</Text>
          <View style={styles.peopleRow}>
            <View style={styles.person}><View style={[styles.bigFace,{backgroundColor:theme.colors.transport}]}><Text style={styles.bigFaceText}>N</Text></View><Text style={styles.personText}>Needs a ride</Text></View>
            <Animated.View style={[styles.meetPoint,{transform:[{scale:pulse}]}]}><Ionicons name={connectState==='connected'?'heart':'swap-horizontal'} size={24} color={theme.colors.connectionDark}/></Animated.View>
            <View style={styles.person}><View style={[styles.bigFace,{backgroundColor:theme.colors.plans}]}><Text style={styles.bigFaceText}>O</Text></View><Text style={styles.personText}>Can help</Text></View>
          </View>
          <View style={styles.route}><View style={styles.routeBlue}/><View style={styles.routeGreen}/></View>
          <Text style={styles.heroTitle}>{connectState==='connected'?'Handled together':'Meet halfway'}</Text>
          <Text style={styles.heroCaption}>{connectState==='connected'?'Pickup confirmed · 4:15 PM':'Noor and Omar can connect this plan'}</Text>
          <TouchableOpacity style={[styles.heroButton,connectState==='connected'&&styles.heroButtonDone]} onPress={connectState==='connected'?()=>setConnectOpen(true):connect}>
            <Text style={styles.heroButtonText}>{connectState==='ready'?'Connect':connectState==='connecting'?'Connecting…':'View plan'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Your family world</Text><Text style={styles.sectionHint}>Tap to explore</Text></View>
        <View style={styles.categoryRow}>
          {[
            ['car-outline','Transport',theme.colors.transport,theme.colors.transportDark],
            ['book-outline','School',theme.colors.school,theme.colors.schoolDark],
            ['restaurant-outline','Meals',theme.colors.meals,theme.colors.mealsDark],
            ['calendar-outline','Plans',theme.colors.plans,theme.colors.plansDark],
          ].map(([icon,label,bg,fg])=><TouchableOpacity key={label} onPress={label==='Plans'?onNavigateToPlans:()=>setConnectOpen(true)} style={styles.category}><View style={[styles.categoryIcon,{backgroundColor:bg}]}><Ionicons name={icon as any} size={25} color={fg}/></View><Text style={styles.categoryText}>{label}</Text></TouchableOpacity>)}
        </View>

        <TouchableOpacity style={styles.moment} activeOpacity={0.86} onPress={() => setConnectOpen(true)}>
          <View style={styles.sun}/><View style={styles.table}><View style={styles.plate}/></View>
          <View style={styles.momentCopy}><Text style={styles.momentOverline}>TONIGHT · 7:30</Text><Text style={styles.momentTitle}>Dinner comes together</Text><Text style={styles.momentSub}>Mariam + Noor are preparing it</Text></View>
          <View style={styles.arrow}><Ionicons name="arrow-forward" size={18} color={theme.colors.mealsDark}/></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.perspective} onPress={() => setConnectOpen(true)}>
          <View style={styles.perspectiveIcon}><Ionicons name="layers-outline" size={22} color={theme.colors.schoolDark}/></View>
          <View style={{flex:1}}><Text style={styles.perspectiveLabel}>SEE THEIR SIDE</Text><Text style={styles.perspectiveText}>Dinner started before the cooking did.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary}/>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.navWrap}><View style={styles.nav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={22} color={theme.colors.textPrimary}/><Text style={styles.navActive}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.connectNav} onPress={()=>setConnectOpen(true)}><Ionicons name="swap-horizontal" size={25} color={theme.colors.connectionDark}/></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToPlans}><Ionicons name="calendar-outline" size={22} color={theme.colors.textSecondary}/><Text style={styles.navText}>Plans</Text></TouchableOpacity>
      </View></View>

      <Modal visible={connectOpen} transparent animationType="slide" onRequestClose={()=>setConnectOpen(false)}>
        <TouchableOpacity style={styles.modalShade} activeOpacity={1} onPress={()=>setConnectOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.handle}/><Text style={styles.sheetTitle}>A two-way plan</Text><Text style={styles.sheetText}>Noor needs a ride from campus. Omar can help at 4:15 PM.</Text>
            <View style={styles.sheetPeople}><View style={[styles.bigFace,{backgroundColor:theme.colors.transport}]}><Text style={styles.bigFaceText}>N</Text></View><View style={styles.sheetLine}/><Ionicons name="heart" size={22} color={theme.colors.mealsDark}/><View style={styles.sheetLine}/><View style={[styles.bigFace,{backgroundColor:theme.colors.plans}]}><Text style={styles.bigFaceText}>O</Text></View></View>
            <TouchableOpacity style={styles.sheetButton} onPress={()=>{setConnectState('connected');setConnectOpen(false)}}><Text style={styles.sheetButtonText}>Handle it together</Text></TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:theme.colors.background},content:{padding:18,paddingBottom:112,maxWidth:520,width:'100%',alignSelf:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.2,color:theme.colors.textMuted},title:{fontSize:30,fontWeight:'900',letterSpacing:-1.1,color:theme.colors.textPrimary},faces:{flexDirection:'row'},face:{width:34,height:34,borderRadius:17,borderWidth:2,borderColor:'#FFF',alignItems:'center',justifyContent:'center'},faceText:{fontWeight:'800',fontSize:12,color:theme.colors.textPrimary},
  hero:{overflow:'hidden',backgroundColor:'#FFF',borderRadius:30,padding:20,marginBottom:22,borderWidth:1,borderColor:theme.colors.border,...theme.shadows.soft},heroBlobA:{position:'absolute',width:170,height:170,borderRadius:85,backgroundColor:theme.colors.transport,top:-95,left:-45},heroBlobB:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:theme.colors.plans,bottom:-120,right:-50},heroLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:theme.colors.textMuted,textAlign:'center'},peopleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:18},person:{alignItems:'center',width:90},bigFace:{width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:'#FFF'},bigFaceText:{fontSize:17,fontWeight:'900',color:theme.colors.textPrimary},personText:{fontSize:11,fontWeight:'700',color:theme.colors.textSecondary,marginTop:5},meetPoint:{width:54,height:54,borderRadius:27,backgroundColor:theme.colors.connection,alignItems:'center',justifyContent:'center'},route:{height:3,flexDirection:'row',marginHorizontal:42,marginTop:-52,zIndex:-1},routeBlue:{flex:1,backgroundColor:'#78B9F2'},routeGreen:{flex:1,backgroundColor:'#75C89C'},heroTitle:{fontSize:24,fontWeight:'900',letterSpacing:-.8,textAlign:'center',color:theme.colors.textPrimary,marginTop:25},heroCaption:{fontSize:12,textAlign:'center',color:theme.colors.textSecondary,marginTop:3},heroButton:{backgroundColor:theme.colors.textPrimary,minHeight:48,borderRadius:24,alignItems:'center',justifyContent:'center',marginTop:16},heroButtonDone:{backgroundColor:theme.colors.plansDark},heroButtonText:{color:'#FFF',fontWeight:'800'},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline'},sectionTitle:{fontSize:18,fontWeight:'900',color:theme.colors.textPrimary},sectionHint:{fontSize:11,color:theme.colors.textMuted},categoryRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12,marginBottom:22},category:{alignItems:'center',width:'23%'},categoryIcon:{width:62,height:62,borderRadius:22,alignItems:'center',justifyContent:'center'},categoryText:{fontSize:11,fontWeight:'700',color:theme.colors.textPrimary,marginTop:7},
  moment:{height:158,borderRadius:28,backgroundColor:theme.colors.meals,overflow:'hidden',padding:18,justifyContent:'flex-end',marginBottom:12},sun:{position:'absolute',width:110,height:110,borderRadius:55,backgroundColor:'#FFD79E',right:30,top:-45},table:{position:'absolute',width:120,height:56,borderRadius:28,backgroundColor:'#FFF4EC',right:24,top:47,alignItems:'center',justifyContent:'center',transform:[{rotate:'-4deg'}]},plate:{width:42,height:42,borderRadius:21,backgroundColor:'#FFF',borderWidth:6,borderColor:'#F2B496'},momentCopy:{maxWidth:'67%'},momentOverline:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:theme.colors.mealsDark},momentTitle:{fontSize:20,fontWeight:'900',letterSpacing:-.5,color:theme.colors.textPrimary,marginTop:3},momentSub:{fontSize:11,color:theme.colors.textSecondary,marginTop:4},arrow:{position:'absolute',right:18,bottom:18,width:36,height:36,borderRadius:18,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},
  perspective:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderRadius:22,padding:14,borderWidth:1,borderColor:theme.colors.border},perspectiveIcon:{width:44,height:44,borderRadius:15,backgroundColor:theme.colors.school,alignItems:'center',justifyContent:'center'},perspectiveLabel:{fontSize:9,fontWeight:'900',letterSpacing:1,color:theme.colors.schoolDark},perspectiveText:{fontSize:13,fontWeight:'700',color:theme.colors.textPrimary,marginTop:2},
  navWrap:{position:'absolute',left:18,right:18,bottom:12,alignItems:'center'},nav:{height:68,width:'100%',maxWidth:430,borderRadius:29,backgroundColor:'#FFF',borderWidth:1,borderColor:theme.colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:34,...theme.shadows.floatingNav},navItem:{minWidth:60,alignItems:'center',justifyContent:'center'},navText:{fontSize:10,fontWeight:'700',color:theme.colors.textMuted,marginTop:3},navActive:{fontSize:10,fontWeight:'900',color:theme.colors.textPrimary,marginTop:3},connectNav:{width:54,height:54,borderRadius:20,backgroundColor:theme.colors.connection,alignItems:'center',justifyContent:'center'},
  modalShade:{flex:1,backgroundColor:'rgba(30,32,43,.35)',justifyContent:'flex-end'},sheet:{backgroundColor:'#FFF',borderTopLeftRadius:32,borderTopRightRadius:32,padding:24,paddingBottom:36},handle:{width:42,height:5,borderRadius:3,backgroundColor:theme.colors.border,alignSelf:'center',marginBottom:20},sheetTitle:{fontSize:24,fontWeight:'900',letterSpacing:-.7,color:theme.colors.textPrimary},sheetText:{fontSize:14,lineHeight:20,color:theme.colors.textSecondary,marginTop:6},sheetPeople:{flexDirection:'row',alignItems:'center',marginVertical:24},sheetLine:{flex:1,height:2,backgroundColor:theme.colors.border},sheetButton:{height:50,borderRadius:25,backgroundColor:theme.colors.textPrimary,alignItems:'center',justifyContent:'center'},sheetButtonText:{color:'#FFF',fontWeight:'800'},
});
