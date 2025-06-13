// FILE: src/components/AnimatedLogoWithAudio.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; 
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { toast } from "sonner"; 
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

gsap.registerPlugin(MotionPathPlugin, Physics2DPlugin);

// <<< --- THIS IS THE FULL AND CORRECT PROPS INTERFACE --- >>>
interface AnimatedLogoWithAudioProps {
  audioUrl: string | null; 
  onPlaybackEnd?: () => void;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
  playMainAnimations?: boolean; 
  triggerZapEffect?: 'zap1' | 'zap2' | 'zap3' | 'zap5' | 'zap6' | 'zap7' | 'zap_ils' | 'zap_tlw' | 'narration1_sequence' | null;
  onZapCompleted?: () => void;
  animationVariant?: number; 
}
// <<< --- END OF PROPS INTERFACE --- >>>

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, 
  onPlaybackEnd, 
  width = 200, 
  height = 200,
  playButtonText = "Play Narration", 
  showLoadingText = false,
  playMainAnimations = false, 
  triggerZapEffect = null,
  onZapCompleted,
  animationVariant = 0,
}) => {
  const [actualIsPlayingAudio, setActualIsPlayingAudio] = useState(false);
  const shouldPlayMainAnimationsState = playMainAnimations || (actualIsPlayingAudio && !!audioUrl);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  const mainAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const outerGlowRef = useRef<SVGElement | null>(null);
  const innerBackgroundRef = useRef<SVGElement | null>(null);
  const knightRiderPathElRef = useRef<SVGPathElement | null>(null);
  const scanBlipRef = useRef<SVGRectElement | null>(null);
  const circuitBlipsRef = useRef<(SVGCircleElement | null)[]>([]);
  const svgElementRef = useRef<SVGSVGElement | null>(null);
  const innerRightShoulderRef = useRef<SVGPathElement | null>(null);
  const innerLeftShoulderRef = useRef<SVGPathElement | null>(null);
  const topLeftWindowRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.firstChild as SVGSVGElement | null; 
    if (!svgEl || typeof svgEl.querySelector !== 'function') { return; }
    svgElementRef.current = svgEl;
    outerGlowRef.current = svgEl.querySelector('#outer-glow');
    innerBackgroundRef.current = svgEl.querySelector('#Inner-background');
    knightRiderPathElRef.current = svgEl.querySelector('#Knight-rider');
    scanBlipRef.current = svgEl.querySelector('#scanBlip'); 
    const circuitPathElement = svgEl.querySelector('#circuitPathDefinition') as SVGPathElement | null;
    circuitBlipsRef.current = [ svgEl.querySelector('#circuitBlip1'), svgEl.querySelector('#circuitBlip2'), svgEl.querySelector('#circuitBlip3') ].filter(el => el !== null) as SVGCircleElement[];
    innerRightShoulderRef.current = svgEl.querySelector('#inner-right-shoulder');
    innerLeftShoulderRef.current = svgEl.querySelector('#outer-left-shoulder');
    topLeftWindowRef.current = svgEl.querySelector('#top-left-window');

    const tl = gsap.timeline({ paused: true }); mainAnimationTimelineRef.current = tl;
    let glowDuration = 0.9, innerBgDuration = 1.2, krScanDuration = 0.75;
    if (animationVariant % 3 === 1) { glowDuration = 0.7; innerBgDuration = 1.0; krScanDuration = 0.65; }
    else if (animationVariant % 3 === 2) { glowDuration = 1.1; innerBgDuration = 1.4; krScanDuration = 0.85;}
    if (outerGlowRef.current) { tl.to(outerGlowRef.current, { opacity: 0.6, duration: glowDuration, ease: 'power1.inOut', yoyo: true, repeat: -1 }, "startSync"); }
    if (innerBackgroundRef.current) { tl.to(innerBackgroundRef.current, { scale: 1.015, opacity: 0.9, transformOrigin: "center center", duration: innerBgDuration, ease: 'sine.inOut', yoyo: true, repeat: -1 }, "startSync"); }
    if (knightRiderPathElRef.current && scanBlipRef.current) {
        gsap.set(knightRiderPathElRef.current, { opacity: 1 }); 
        const sX=453, sW=304, bW=Math.floor(sW*0.33); gsap.set(scanBlipRef.current, {attr:{width:bW, x:sX}});
        tl.to(scanBlipRef.current, { attr: { x: sX+sW-bW }, duration:krScanDuration, ease:"power1.inOut", yoyo:true, repeat:-1, repeatDelay:0.1 }, "startSync"); 
    }
    if (circuitPathElement && circuitBlipsRef.current.length > 0) {
      circuitBlipsRef.current.forEach((blip, i) => {
        if (!blip) return; gsap.set(blip, {opacity:0.7, scale:0, transformOrigin:"center center"}); 
        tl.to(blip, { motionPath:{path:circuitPathElement, align:circuitPathElement, alignOrigin:[0.5,0.5], autoRotate:true, start:Math.random()*0.5, end:(Math.random()*0.5)+1}, scale:1, opacity:0.9, duration:2.0+Math.random()*1.0, ease:"none", repeat:-1, delay:i*0.5, immediateRender:false, onStart:function(){const cB=this.targets()[0]as SVGCircleElement|null;if(cB)gsap.set(cB,{scale:1,opacity:0.9});}, onRepeat: function(){this.vars.motionPath.start=Math.random()*0.8;this.vars.motionPath.end=this.vars.motionPath.start+1+Math.random();this.invalidate();}}, "startSync");
      });
    }
    return () => { mainAnimationTimelineRef.current?.kill(); };
  }, [animationVariant]); 

  useEffect(() => { 
    const knightRiderPath = knightRiderPathElRef.current;
    if (shouldPlayMainAnimationsState) { 
        mainAnimationTimelineRef.current?.play(); 
        if (knightRiderPath) gsap.to(knightRiderPath, { attr: { filter: 'url(#knightRiderGlow)' }, fill: 'white', duration: 0.1 });
    } else { 
        mainAnimationTimelineRef.current?.pause(); 
        if (knightRiderPath) gsap.to(knightRiderPath, { clearProps: "filter", fill: '#65d9e6', duration: 0.2 });
    } 
  }, [shouldPlayMainAnimationsState]);

  useEffect(() => {
    if (!triggerZapEffect || !svgElementRef.current) { if (triggerZapEffect === null && onZapCompleted) { onZapCompleted(); } return; }
    const wasMainPlaying = mainAnimationTimelineRef.current?.isActive() && shouldPlayMainAnimationsState;
    const ib = innerBackgroundRef.current; 
    const onEffectComplete = () => { 
        if ((triggerZapEffect === 'zap5' || triggerZapEffect === 'narration1_sequence') && ib) {
           gsap.killTweensOf(ib, "opacity,visibility,fill"); 
           gsap.set(ib, { visibility: 'visible', clearProps: "opacity,fill" }); 
           const mainIbTween = mainAnimationTimelineRef.current?.getTweensOf(ib)[0];
           if (mainIbTween && shouldPlayMainAnimationsState) { mainIbTween.invalidate().play(0); if(mainAnimationTimelineRef.current && !mainAnimationTimelineRef.current.isActive()) mainAnimationTimelineRef.current.play(); } 
           else if (ib) { gsap.set(ib, { opacity: 0.9, fill: '#192835' }); }
        }
        if(!wasMainPlaying&&mainAnimationTimelineRef.current?.isActive()&&!shouldPlayMainAnimationsState){mainAnimationTimelineRef.current?.pause();} if(onZapCompleted)onZapCompleted();
    };
    let zapDelay=0; 
    if ((triggerZapEffect === 'zap5' || triggerZapEffect === 'narration1_sequence') && ib) { 
        mainAnimationTimelineRef.current?.getTweensOf(ib).forEach(tween => tween.pause());
        gsap.set(ib, { opacity: 0, visibility: 'hidden' });
        if (!wasMainPlaying && triggerZapEffect === 'zap5') zapDelay = 0.3; 
    } else if (!wasMainPlaying && mainAnimationTimelineRef.current) { mainAnimationTimelineRef.current.play(); }

    const zapTl = gsap.timeline({ onComplete: onEffectComplete, delay: zapDelay });
    const og=outerGlowRef.current, kr=knightRiderPathElRef.current, irs=innerRightShoulderRef.current, ils=innerLeftShoulderRef.current, tlw=topLeftWindowRef.current, sb=scanBlipRef.current;

    if (triggerZapEffect === 'zap1' && og) {zapTl.fromTo(og,{filter:"brightness(1)"},{filter:"brightness(5.5) saturate(3.5)",duration:0.05,yoyo:true,repeat:1,ease:"power3.out"});}
    else if(triggerZapEffect === 'zap2' && kr && sb){const oF=gsap.getProperty(sb,"fill");zapTl.to(kr,{fill:"#FFFFFF",attr:{filter:"url(#knightRiderGlow)"},duration:0.04,yoyo:true,repeat:1}).fromTo(sb,{attr:{width:(gsap.getProperty(sb,"width")as number)*1.3,x:(gsap.getProperty(sb,"x")as number)-(gsap.getProperty(sb,"width")as number*0.15)},fill:"white",opacity:1},{attr:{width:gsap.getProperty(sb,"width"),x:gsap.getProperty(sb,"x")},fill:oF as string,opacity:1,duration:0.1,yoyo:true,repeat:1,ease:"power1.out"});}
    else if(triggerZapEffect === 'zap3' && og && kr){zapTl.to(kr ? [og,kr] : [og],{opacity:1,fill:(i,t)=>t===kr?"white":(t?String(gsap.getProperty(t,"fill")):"#39e5f6"),attr:{filter:(i,t)=>t===kr?'url(#knightRiderGlow)':(t?"brightness(3.5)":"none")},duration:0.06,yoyo:true,repeat:1,ease:"power3.out",onComplete:()=>{if(kr)gsap.to(kr,{clearProps:"filter",fill:shouldPlayMainAnimationsState?"white":"#65d9e6",delay:0.1});}}); }
    else if(triggerZapEffect === 'zap5' && svgElementRef.current && ib){
        let pA:SVGCircleElement[]=[];const bOY=378;for(let i=0;i<50;i++){let p=document.createElementNS("http://www.w3.org/2000/svg","circle");gsap.set(p,{attr:{cx:600,cy:bOY,r:0,fill:`hsl(${190+Math.random()*40},100%,${90+Math.random()*10}%)`},opacity:1});if(svgElementRef.current)svgElementRef.current.appendChild(p);pA.push(p);}
        zapTl.to(pA,{attr:{r:()=>7+Math.random()*16},physics2D:{velocity:()=>300+Math.random()*280,angle:()=>Math.random()*360-90,gravity:0},opacity:.8,duration:0.9+Math.random()*0.7,stagger:0.002,ease:"expo.out",onComplete:()=>pA.forEach(p=>p.remove())});
    }
    else if(triggerZapEffect === 'zap6' && kr){const zT6=gsap.timeline();zT6.set(kr,{fill:"white",attr:{filter:"url(#intenseZapGlow)"}}).to(kr,{opacity:0.2,duration:0.04}).to(kr,{opacity:1,duration:0.04}).to(kr,{opacity:0.1,duration:0.03}).to(kr,{opacity:0.9,duration:0.05}).to(kr,{opacity:0.2,duration:0.03}).to(kr,{opacity:1,duration:0.15}).to(kr,{opacity:0,duration:0.06,delay:0.2}).set(kr,{fill:shouldPlayMainAnimationsState?"white":"#65d9e6",attr:{filter:shouldPlayMainAnimationsState?"url(#knightRiderGlow)":"none"}}); zapTl.add(zT6);}
    else if(triggerZapEffect === 'zap7' && irs){gsap.set(irs,{transformOrigin:"center center"});const zT7=gsap.timeline();zT7.to(irs,{scale:1.4,fill:"white",filter:"url(#intenseZapGlow)",duration:0.07,ease:"power2.out"}).to(irs,{scale:1,fill:gsap.getProperty(irs,"fill")as string,clearProps:"filter",duration:0.3,ease:"power2.in"}); zapTl.add(zT7);}
    else if(triggerZapEffect === 'zap_ils' && ils) {gsap.set(ils,{transformOrigin:"center center"});const zTils=gsap.timeline();zTils.to(ils,{scale:1.2,rotation:"-=5",fill:"white",filter:"url(#intenseZapGlow)",duration:0.07,ease:"power2.out"}).to(ils,{scale:1,rotation:"+=5",fill:gsap.getProperty(ils,"fill")as string,clearProps:"filter",duration:0.3,ease:"power2.in"}); zapTl.add(zTils);}
    else if(triggerZapEffect === 'zap_tlw' && tlw) {gsap.set(tlw,{transformOrigin:"center center"});const zTtlw=gsap.timeline();zTtlw.to(tlw,{scale:1.5,opacity:0.3,fill:"#a0faff",filter:"brightness(3)",duration:0.06,ease:"power2.out"}).to(tlw,{scale:1,opacity:1,fill:gsap.getProperty(tlw,"fill")as string,clearProps:"filter",duration:0.3,ease:"power2.in"}); zapTl.add(zTtlw);}
    else if(triggerZapEffect === 'narration1_sequence' && ils && irs && og && ib && svgElementRef.current) {
        const seqTl = gsap.timeline(); 
        if(ib) gsap.set(ib, { opacity: 0, visibility: 'hidden' }); // Hide ib for particle part
        const shoulderTrill=gsap.timeline();if(ils&&irs){[ils,irs,ils,irs,ils].forEach((s,j)=>{if(s)shoulderTrill.fromTo(s,{scale:1,opacity:0.8,fill:gsap.getProperty(s,"fill")as string,filter:"none"},{scale:1.3,opacity:1,fill:"white",filter:"url(#intenseZapGlow)",duration:0.06,ease:"power2.out",yoyo:true,repeat:1},j*0.12);});}
        seqTl.add(shoulderTrill)
             .set(ils && irs ? [ils,irs] : [],{clearProps:"filter,fill,opacity,scale"},">")
             .fromTo(og ? og : [], {opacity:0.3, filter:"brightness(0.5)"},{opacity:1, filter:"brightness(1.5)", duration:1.5,ease:"power2.inOut"},"+=0.1")
             .call(()=>{let pA:SVGCircleElement[]=[];const bOY=378;for(let i=0;i<50;i++){let p=document.createElementNS("http://www.w3.org/2000/svg","circle");gsap.set(p,{attr:{cx:600,cy:bOY,r:0,fill:`hsl(${190+Math.random()*40},100%,${90+Math.random()*10}%)`},opacity:1});if(svgElementRef.current)svgElementRef.current.appendChild(p);pA.push(p);}gsap.to(pA,{attr:{r:()=>7+Math.random()*16},physics2D:{velocity:()=>300+Math.random()*280,angle:()=>Math.random()*360-90,gravity:0},opacity:0,duration:0.9+Math.random()*0.7,stagger:0.002,ease:"expo.out",onComplete:()=>pA.forEach(p=>p.remove())});},[],"+=0.1")
             .call(()=>{if(ib){gsap.set(ib,{visibility:'visible',clearProps:"opacity,fill"});const mIT=mainAnimationTimelineRef.current?.getTweensOf(ib)[0];if(mIT&&shouldPlayMainAnimationsState)mIT.play(0);else gsap.set(ib,{opacity:0.9,fill:'#192835'});}},[],">0.8") // Restore ib for surge
             .to(ils ? ils : [],{opacity:1,fill:"white",filter:"url(#intenseZapGlow)",duration:0.1},"shouldersOn+=0.8").to(irs ? irs : [],{opacity:1,fill:"white",filter:"url(#intenseZapGlow)",duration:0.1},"shouldersOn+=0.8")
             .to(ils && irs ? [ils,irs] : [],{opacity:0,clearProps:"filter,fill",duration:0.2,delay:0.3},"shouldersOn+=0.1")
             .to(kr ? (og ? [og,kr] : [kr]) : (og ? [og] : []), // ib NOT in this surge
                {opacity:1,fill:(i,t)=>t===kr?"white":(t?String(gsap.getProperty(t,"fill")):"#39e5f6"),attr:{filter:(i,t)=>t===kr?'url(#knightRiderGlow)':(t?"brightness(3.5)":"none")},duration:0.06,yoyo:true,repeat:1,ease:"power3.out",delay:0.2}
              );
        zapTl.add(seqTl);
    }
    else if (triggerZapEffect) { console.warn(`Zap "${triggerZapEffect}" unhandled or elements missing.`); onEffectComplete(); }
    else { if(onZapCompleted) onZapCompleted(); }
    
  }, [triggerZapEffect, onZapCompleted, shouldPlayMainAnimationsState, animationVariant]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); setActualIsPlayingAudio(false); mainAnimationTimelineRef.current?.pause().progress(0); audioElement.load(); } }
    else { audioElement.pause(); audioElement.src = ""; setActualIsPlayingAudio(false); setIsAudioLoaded(false); mainAnimationTimelineRef.current?.pause().progress(0); }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const hCPT=()=>setIsAudioLoaded(true);const hAPE=()=>{if(!actualIsPlayingAudio)setActualIsPlayingAudio(true);};const hAPauseE=()=>{if(actualIsPlayingAudio)setActualIsPlayingAudio(false);};
    const hAEnd=()=>{setActualIsPlayingAudio(false);mainAnimationTimelineRef.current?.pause().progress(0);if(onPlaybackEnd)onPlaybackEnd();};
    audioElement.addEventListener('canplaythrough',hCPT);audioElement.addEventListener('play',hAPE);audioElement.addEventListener('pause',hAPauseE);audioElement.addEventListener('ended',hAEnd);
    return ()=>{audioElement.removeEventListener('canplaythrough',hCPT);audioElement.removeEventListener('play',hAPE);audioElement.removeEventListener('pause',hAPauseE);audioElement.removeEventListener('ended',hAEnd);};
  }, [onPlaybackEnd, actualIsPlayingAudio]);

  const togglePlayPause=()=>{
    if(playMainAnimations&&!audioUrl){toast.info("Animation controlled by parent.");return;}
    if(!audioUrl){toast.error("No audio loaded.");return;}
    if(!isAudioLoaded){toast.info("Audio preparing...");return;}
    const aE=audioRef.current;if(aE){if(actualIsPlayingAudio){aE.pause();}else{aE.play().catch(console.error);}}
  };

  return (
    <div className="flex flex-col items-center space-y-4 my-4">
      <div 
        ref={svgContainerRef} 
        style={{ 
            width: typeof width === 'number' ? `${width}px` : width, 
            height: typeof height === 'number' ? `${height}px` : height, 
            overflow: 'visible' 
        }}
      >
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} />
      {(audioUrl || (playMainAnimations && playButtonText !== "")) && ( 
        <Button 
            onClick={togglePlayPause} 
            disabled={!!audioUrl && !isAudioLoaded && !playMainAnimations} 
            variant="secondary" 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md"
        >
          {shouldPlayMainAnimationsState ? `Pause ${playMainAnimations && !audioUrl ? 'Test Animation' : 'AI Narration'}` : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;