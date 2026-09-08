import React, { useRef } from 'react';
import { Animated, Image, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

export const HQ = { ink:'#152820', paper:'#F4F1E8', white:'#FFFFFF', brand:'#0F5F5A', mint:'#B9E7D0', blue:'#B9D9F3', lavender:'#E0CEF2', peach:'#FFD9A8', yellow:'#F3DF82', orange:'#FF6B47', muted:'#60716A', line:'rgba(21,40,32,.15)', success:'#258158' } as const;
export const PEOPLE = {
  noor: require('./mom.png'), omar: require('./dad.png'), ali: require('./Ali.png'), ayesha: require('./Ayesha.png'),
} as const;

export function Tap({children,onPress,style,disabled=false,label}:{children:React.ReactNode;onPress:()=>void;style?:StyleProp<ViewStyle>;disabled?:boolean;label?:string}) {
  const scale=useRef(new Animated.Value(1)).current;
  const move=(v:number)=>Animated.spring(scale,{toValue:v,useNativeDriver:true,speed:35,bounciness:3}).start();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} onPressIn={()=>move(.96)} onPressOut={()=>move(1)} style={disabled&&ui.disabled}><Animated.View style={[style,{transform:[{scale}]}]}>{children}</Animated.View></Pressable>;
}
export function Screen({title,kicker,color,art,onBack,children}:{title:string;kicker:string;color:string;art:ImageSourcePropType;onBack:()=>void;children:React.ReactNode}) {
  return <SafeAreaView style={[ui.safe,{backgroundColor:color}]}><StatusBar barStyle="dark-content" backgroundColor={color}/><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ui.scroll}>
    <View style={ui.header}><Tap onPress={onBack} label="Back to home" style={ui.back}><Text style={ui.backText}>‹</Text></Tap><View style={{flex:1}}><Text style={ui.kicker}>{kicker}</Text><Text style={ui.title}>{title}</Text></View><Image source={art} style={ui.headerArt} resizeMode="contain"/></View>
    <View style={ui.canvas}>{children}</View>
  </ScrollView></SafeAreaView>;
}
export function Avatar({source,name,badge,highlight=false}:{source:ImageSourcePropType;name:string;badge:string;highlight?:boolean}) {
  return <View style={ui.person}><View style={[ui.avatar,highlight&&ui.avatarHighlight]}><Image source={source} style={ui.avatarImage}/></View><Text style={ui.personName}>{name}</Text><View style={ui.badge}><Text style={ui.badgeText}>{badge}</Text></View></View>;
}
export function Pill({text,active,onPress}:{text:string;active?:boolean;onPress:()=>void}) { return <Tap onPress={onPress} style={[ui.pill,active&&ui.pillActive]}><Text style={[ui.pillText,active&&ui.pillTextActive]}>{text}</Text></Tap> }
export function Action({text,onPress,secondary=false,disabled=false}:{text:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) { return <Tap onPress={onPress} disabled={disabled} style={[ui.action,secondary&&ui.actionSecondary]}><Text style={[ui.actionText,secondary&&ui.actionTextSecondary]}>{text}</Text></Tap> }
export function Notice({text,tone=HQ.mint}:{text:string;tone?:string}) { return <View style={[ui.notice,{backgroundColor:tone}]}><View style={ui.noticeDot}/><Text style={ui.noticeText}>{text}</Text></View> }
export function Empty({title,action,onPress}:{title:string;action:string;onPress:()=>void}) { return <View style={ui.empty}><Text style={ui.emptyMark}>◇</Text><Text style={ui.emptyTitle}>{title}</Text><Action text={action} onPress={onPress}/></View> }

export const ui=StyleSheet.create({
  safe:{flex:1,paddingTop:Platform.OS==='android'?StatusBar.currentHeight:0},scroll:{paddingBottom:28},header:{minHeight:132,paddingHorizontal:18,paddingTop:10,flexDirection:'row',alignItems:'center',gap:12},back:{width:43,height:43,borderRadius:14,backgroundColor:'rgba(255,255,255,.72)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(21,40,32,.12)'},backText:{fontSize:29,lineHeight:31,color:HQ.ink},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.3,color:HQ.brand},title:{fontSize:29,lineHeight:34,fontWeight:'800',letterSpacing:-.7,color:HQ.ink},headerArt:{width:78,height:96},canvas:{marginHorizontal:12,padding:17,borderRadius:28,backgroundColor:HQ.paper,minHeight:620},disabled:{opacity:.4},
  person:{alignItems:'center',minWidth:72},avatar:{width:52,height:52,borderRadius:26,borderWidth:3,borderColor:HQ.white,overflow:'hidden',backgroundColor:HQ.white},avatarHighlight:{borderColor:HQ.orange,shadowColor:HQ.orange,shadowOpacity:.6,shadowRadius:9,elevation:6},avatarImage:{width:'100%',height:'100%'},personName:{fontSize:10,fontWeight:'800',color:HQ.ink,marginTop:4},badge:{marginTop:3,borderRadius:8,paddingHorizontal:7,paddingVertical:3,backgroundColor:HQ.ink},badgeText:{fontSize:8,fontWeight:'800',color:HQ.white},pill:{minHeight:38,paddingHorizontal:12,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:HQ.white,borderWidth:1,borderColor:HQ.line},pillActive:{backgroundColor:HQ.ink,borderColor:HQ.ink},pillText:{fontSize:10.5,fontWeight:'800',color:HQ.ink},pillTextActive:{color:HQ.white},action:{height:45,paddingHorizontal:17,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:HQ.brand},actionSecondary:{backgroundColor:HQ.white,borderWidth:1,borderColor:HQ.line},actionText:{fontSize:12,fontWeight:'900',color:HQ.white},actionTextSecondary:{color:HQ.ink},notice:{minHeight:42,paddingHorizontal:13,borderRadius:13,flexDirection:'row',alignItems:'center'},noticeDot:{width:8,height:8,borderRadius:4,backgroundColor:HQ.brand,marginRight:8},noticeText:{flex:1,fontSize:11,fontWeight:'800',color:HQ.ink},empty:{minHeight:210,alignItems:'center',justifyContent:'center',gap:10},emptyMark:{fontSize:34,color:HQ.brand},emptyTitle:{fontSize:16,fontWeight:'800',color:HQ.ink},
});
