// FILE: src/components/AnimatedLogoWithAudio.tsx
// #Inner-background is STATIC DARK, NEVER animated by GSAP.
// Knight Rider blip is ALWAYS part of the main animation loop if active.
// Implements new Zap 1 (Circuit Ignition), Zap 3 (Shoulder Surge), Zap 7 (Rapid Shoulder Trill).

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'; 
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { toast } from "sonner"; 
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

gsap.registerPlugin(MotionPathPlugin, Physics2DPlugin);

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null; 
  onPlaybackEnd?: () => void;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
  playMainAnimations?: boolean; 
  triggerZapEffect?: 
    'zap1_circuit_ignition' | 
    'zap2_kr_overcharge' | // Retained for now, can be removed if truly unused
    'zap3_shoulder_surge' | 
    'zap5_particle_burst' | 
    'zap6_fluorescent' | 
    'zap7_rapid_trill' | 
    'narration1_sequence' | 
    // Placeholders for future zaps from your list
    'zap_window_flare_beam' | 
    'zap_fractal_glow' |
    'zap_color_cycle' |
    'zap_segmented_wave' |
    'zap_window_shoulder_echo' |
    null;
  onZapCompleted?: () => void;
  animationVariant?: number; 
  shoulderTrillSpeed?: 'fast' | 'medium' | 'slow';
}

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
  shoulderTrillSpeed = 'fast',
}) => {
  const [actualIsPlayingAudio, setActualIsPlayingAudio] = useState(false);
  const shouldPlayMainLoop = playMainAnimations || actualIsPlayingAudio;
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  const mainAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const outerGlowRef = useRef<SVGElement | null>(null);
  // innerBackgroundRef is not needed for GSAP manipulation
  const knightRiderPathElRef = useRef<SVGPathElement | null>(null);
  const scanBlipRef = useRef<SVGRectElement | null>(null);
  const circuitBlipsRef = useRef<(SVGCircleElement | null)[]>([]);
  const svgElementRef = useRef<SVGSVGElement | null>(null);
  const innerRightShoulderRef = useRef<SVGPathElement | null>(null);
  const innerLeftShoulderRef = useRef<SVGPathElement | null>(null);
  const topLeftWindowRef = useRef<SVGPathElement | null>(null);
  const topRightWindowRef = useRef<SVGPathElement | null>(null);

  // GSAP Main Looping Timeline Setup
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.firstChild as SVGSVGElement | null; 
    if (!svgEl || typeof svgEl.querySelector !== 'function') { return; }
    svgElementRef.current = svgEl;

    outerGlowRef.current = svgEl.querySelector('#outer-glow');
    // innerBackgroundRef.current = svgEl.querySelector('#Inner-background'); // Not needed for animation
    knightRiderPathElRef.current = svgEl.querySelector('#Knight-rider');
    scanBlipRef.current = svgEl.querySelector('#scanBlip'); 
    const circuitPathElement = svgEl.querySelector('#circuitPathDefinition') as SVGPathElement | null;
    circuitBlipsRef.current = [ svgEl.querySelector('#circuitBlip1'), svgEl.querySelector('#circuitBlip2'), svgEl.querySelector('#circuitBlip3') ].filter(el => el !== null) as SVGCircleElement[];
    innerRightShoulderRef.current = svgEl.querySelector('#inner-right-shoulder');
    innerLeftShoulderRef.current = svgEl.querySelector('#outer-left-shoulder');
    topLeftWindowRef.current = svgEl.querySelector('#top-left-window');
    topRightWindowRef.current = svgEl.querySelector('#top-right-window');

    const tl = gsap.timeline({ paused: true }); 
    mainAnimationTimelineRef.current = tl;
    let glowDuration = 0.9, krScanDuration = 0.75; 
    if (animationVariant % 3 === 1) { glowDuration = 0.7; krScanDuration = 0.65; }
    else if (animationVariant % 3 === 2) { glowDuration = 1.1; krScanDuration = 0.85;}
    
    if (outerGlowRef.current) { tl.to(outerGlowRef.current, { opacity: 0.6, duration: glowDuration, ease: 'power1.inOut', yoyo: true, repeat: -1 }, "startSync"); }
    // NO GSAP ANIMATION FOR #Inner-background in the main timeline. It remains static dark via CSS.
    
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
    if (shouldPlayMainLoop) { 
        mainAnimationTimelineRef.current?.play(); 
        if (knightRiderPath) gsap.to(knightRiderPath, { attr: { filter: 'url(#knightRiderGlow)' }, fill: 'white', duration: 0.1 });
    } else { 
        mainAnimationTimelineRef.current?.pause(); 
        if (knightRiderPath) gsap.to(knightRiderPath, { clearProps: "filter", fill: '#65d9e6', duration: 0.2 });
    } 
  }, [shouldPlayMainLoop]);

  useEffect(() => {
    if (!triggerZapEffect || !svgElementRef.current) { if (triggerZapEffect === null && onZapCompleted) { onZapCompleted(); } return; }
    
    const wasMainPlaying = mainAnimationTimelineRef.current?.isActive() && shouldPlayMainLoop;
    if (!wasMainPlaying) { mainAnimationTimelineRef.current?.play(); }
                
    const onEffectComplete = () => { 
      if (!wasMainPlaying && mainAnimationTimelineRef.current?.isActive() && !shouldPlayMainLoop) { 
        mainAnimationTimelineRef.current?.pause(); 
      }
      if (onZapCompleted) onZapCompleted(); 
    };
    
    const zapTl = gsap.timeline({ onComplete: onEffectComplete });
    const og=outerGlowRef.current, kr=knightRiderPathElRef.current, irs=innerRightShoulderRef.current, ils=innerLeftShoulderRef.current, tlw=topLeftWindowRef.current, trw=topRightWindowRef.current, sb=scanBlipRef.current;
    const allDiscoParts = [og, kr, irs, ils, tlw, trw, sb, ...circuitBlipsRef.current].filter(el => el);

    if (triggerZapEffect === 'zap1_circuit_ignition') {
        const circuitBlips = circuitBlipsRef.current.filter(b => b);
        if (circuitPathElement && circuitBlips.length > 0) { // circuitPathElement from outer scope
            zapTl.to(circuitBlips, { scale: 1.8, opacity: 1, duration: 0.2, stagger: 0.04, ease: "expo.out" }, 0)
                 .to(circuitBlips, { motionPath: { path: circuitPathElement, align: circuitPathElement, speed: 700, autoRotate: true }, duration: 0.8, ease: "none" }, 0.05);
        }
        const ignitionOrder = [ils, irs, tlw, trw, og, kr].filter(el => el);
        if (ignitionOrder.length > 0) {
            zapTl.fromTo(ignitionOrder, 
                { opacity: 0.5, filter: "brightness(1)" },
                { opacity: 1, filter: "brightness(3) saturate(2)", duration: 0.1, stagger: { each: 0.1, from: "start", yoyo: true, repeat: 1 }}, 
            0.4); 
        }
        if (og && kr && ils && irs && tlw && trw) { zapTl.to([og, kr, ils, irs, tlw, trw].filter(el=>el), { filter: "brightness(2.5) hue-rotate(15deg)", duration: 1, yoyo: true, repeat: 2 }, 1.2); }
        if(zapTl.duration() < 5) zapTl.to({}, {duration: 5 - zapTl.duration()});
    }
    else if(triggerZapEffect === 'zap3_shoulder_surge' && ils && irs && og && kr) {
        const shoulderFlare = (target: SVGElement | null) => { if(!target) return gsap.timeline(); return gsap.timeline().fromTo(target, {opacity:0.5},{opacity:1, scale:1.2, fill:"white", filter:"url(#intenseZapGlow)", duration:0.08, yoyo:true, repeat:1}).set(target, {clearProps:"filter,fill,scale,opacity"}); };
        zapTl.add(shoulderFlare(ils)).add(shoulderFlare(irs), "-=0.1").add(shoulderFlare(ils), "-=0.1").add(shoulderFlare(irs), "-=0.1")
             .to([ils, irs].filter(el=>el), { filter: "brightness(2.5)", duration: 0.5, ease: "power1.inOut" }, ">")
             .to(og, { filter: "brightness(3) saturate(2)", yoyo: true, repeat: 3, duration: 0.3, ease: "power2.inOut" }, ">-0.2")
             .to(kr, { fill: "white", attr:{filter:"url(#knightRiderGlow)"}, yoyo:true, repeat:3, duration:0.3, ease:"power2.inOut"}, "<")
             .set([ils, irs, og, kr].filter(el=>el), {clearProps: "filter,fill"}, ">");
        if(zapTl.duration() < 5) zapTl.to({}, {duration: 5 - zapTl.duration()});
    }
    else if(triggerZapEffect === 'zap5_particle_burst' && svgElementRef.current){
        let pA:SVGCircleElement[]=[];const bOY=378;for(let i=0;i<50;i++){let p=document.createElementNS("http://www.w3.org/2000/svg","circle");gsap.set(p,{attr:{cx:600,cy:bOY,r:0,fill:`hsl(${190+Math.random()*40},100%,${90+Math.random()*10}%)`},opacity:1});if(svgElementRef.current)svgElementRef.current.appendChild(p);pA.push(p);}
        zapTl.to(pA,{attr:{r:()=>7+Math.random()*16},physics2D:{velocity:()=>300+Math.random()*280,angle:()=>Math.random()*360-90,gravity:0},opacity:0,duration:0.9+Math.random()*0.7,stagger:0.002,ease:"expo.out",onComplete:()=>pA.forEach(p=>p.remove())});
        if(zapTl.duration() < 5) zapTl.to({}, {duration: 5 - zapTl.duration()}); // Ensure 5s
    }
    else if(triggerZapEffect === 'zap7_rapid_trill' && ils && irs){
        const trillSpeedVal = shoulderTrillSpeed === 'fast' ? 0.035 : shoulderTrillSpeed === 'medium' ? 0.055 : 0.08;
        const singleTrillFlare = (target: SVGElement | null) => { if (!target) return gsap.timeline(); return gsap.timeline().fromTo(target, {opacity:0.2, scale:0.95},{opacity:1, scale:1.1, fill:"white", filter:"url(#intenseZapGlow)", duration:trillSpeedVal, ease:"power1.out", yoyo:true, repeat:1}).set(target, {clearProps:"filter,fill,opacity,scale"});}
        for (let i = 0; i < 6; i++) { 
            if (irs) zapTl.add(singleTrillFlare(irs), i * (trillSpeedVal * 2 + 0.005)); 
            if (ils) zapTl.add(singleTrillFlare(ils), i * (trillSpeedVal * 2 + 0.005) + trillSpeedVal); 
        }
        const trillDuration = 6 * (trillSpeedVal * 2 + 0.005) + trillSpeedVal;
        if (trillDuration < 1) zapTl.to({}, {duration: 1 - trillDuration }); // Ensure at least 1s for trill part
        if (zapTl.duration() < 5) zapTl.to({}, {duration: 5 - zapTl.duration()}); // Pad to 5s
    }
    // Placeholder for other Zaps based on your "YES" list
    else if (triggerZapEffect === 'zap_window_flare_beam' && tlw && trw && og) { zapTl.to(og, {opacity:0.5, duration: 5}); /* Placeholder */ }
    else if (triggerZapEffect === 'zap_fractal_glow' && og) { zapTl.to(og, {opacity:0.5, duration: 5});  /* Placeholder */ }
    else if (triggerZapEffect === 'zap_color_cycle' && og && ils && irs && tlw && trw) { zapTl.to(og, {opacity:0.5, duration: 5}); /* Placeholder */ }
    else if (triggerZapEffect === 'zap_window_shoulder_echo' && tlw && trw && ils && irs) { zapTl.to(og, {opacity:0.5, duration: 5}); /* Placeholder */ }
    else if (triggerZapEffect) { console.warn(`Zap "${triggerZapEffect}" unhandled or elements missing.`); onEffectComplete(); }
    else { if(onZapCompleted) onZapCompleted(); } // If triggerZapEffect became null
    
  }, [triggerZapEffect, onZapCompleted, shouldPlayMainLoop, animationVariant, shoulderTrillSpeed]);

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
        <MyActualLogo width="100%" height="100%" 
          isParticleBursting={false} // CSS class not used for #Inner-background hiding
        /> 
      </div>
      <audio ref={audioRef} />
      {(audioUrl || (playMainAnimations && playButtonText !== "")) && ( 
        <Button 
            onClick={togglePlayPause} 
            disabled={!!audioUrl && !isAudioLoaded && !playMainAnimations} 
            variant="secondary" 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md"
        >
          {shouldPlayMainLoop ? `Pause ${playMainAnimations && !audioUrl ? 'Test Animation' : 'AI Narration'}` : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;