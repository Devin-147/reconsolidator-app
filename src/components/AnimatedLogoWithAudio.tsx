// FILE: src/components/AnimatedLogoWithAudio.tsx
// Implements 11 distinct "Zap" animation sequences on top of constant base animations.

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { toast } from "sonner"; 
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null;
  onPlaybackEnd?: () => void;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
  animationVariant: number; 
}

const zapSequences: string[][] = [
  ['s1', 's3', 's4', 's5', 's2', 's0', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's4', 's5', 's0', 's2', 's1', 's3', 's4'],
  ['s2', 's4', 's5', 's1', 's3', 's0', 's2', 's4', 's5', 's1', 's3', 's2', 's4', 's5', 's1', 's0', 's3', 's2', 's4', 's5'],
  ['s3', 's1', 's2', 's4', 's5', 's0', 's3', 's1', 's2', 's4', 's5', 's3', 's1', 's2', 's4', 's0', 's5', 's3', 's1', 's2'],
  ['s4', 's5', 's3', 's2', 's1', 's0', 's4', 's5', 's3', 's2', 's1', 's4', 's5', 's3', 's2', 's0', 's1', 's4', 's5', 's3'],
  ['s5', 's2', 's1', 's3', 's4', 's0', 's5', 's2', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's0', 's4', 's5', 's2', 's1'],
  ['s1', 's4', 's5', 's2', 's3', 's0', 's1', 's4', 's5', 's2', 's3', 's1', 's4', 's5', 's2', 's0', 's3', 's1', 's4', 's5'],
  ['s3', 's4', 's5', 's1', 's2', 's0', 's3', 's4', 's5', 's1', 's2', 's0', 's3', 's4', 's5', 's1', 's2', 's0', 's3', 's4'],
  ['s3', 's5', 's2', 's1', 's4', 's0', 's3', 's5', 's2', 's1', 's4', 's3', 's5', 's2', 's1', 's0', 's4', 's3', 's5', 's2'],
  ['s4', 's1', 's3', 's5', 's2', 's0', 's4', 's1', 's3', 's5', 's2', 's4', 's1', 's3', 's5', 's0', 's2', 's4', 's1', 's3'],
  ['s5', 's2', 's4', 's3', 's1', 's0', 's5', 's2', 's4', 's3', 's1', 's5', 's2', 's4', 's3', 's0', 's1', 's5', 's2', 's4'],
  ['s1', 's3', 's5', 's4', 's2', 's0', 's1', 's3', 's5', 's4', 's2', 's1', 's3', 's5', 's4', 's0', 's2', 's1', 's3', 's5']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, onPlaybackEnd, width = 200, height = 200, 
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  const baseAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null; 
    if (!svgElement || typeof svgElement.querySelector !== 'function') { return; }
    baseAnimationTimelineRef.current?.kill();
    const baseTl = gsap.timeline({ paused: true, repeat: -1 }); 
    baseAnimationTimelineRef.current = baseTl;
    const innerBackground = svgElement.querySelector('#Inner-background');
    const scanBlip = svgElement.querySelector('#scanBlip'); 
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    if (innerBackground) { baseTl.to(innerBackground, { opacity: 0.85, duration: 2.5, ease: 'sine.inOut', yoyo: true }, "baseStart"); }
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 1 }); 
        const scanPathX_Start = 453; const scanPathWidth = 304;  
        const blipWidth = Math.floor(scanPathWidth * 0.15); 
        const blipScanStartPos = scanPathX_Start;
        const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
        gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } }); 
        baseTl.to(scanBlip, { attr: { x: blipScanEndPos }, duration: 0.7, ease: "sine.inOut", yoyo: true, }, "baseStart"); 
    }
    return () => { baseAnimationTimelineRef.current?.kill(); };
  }, []); 

  useEffect(() => {
    if (!svgContainerRef.current || animationVariant === undefined || animationVariant < 1 || animationVariant > 11) {
        zapAnimationTimelineRef.current?.kill(); zapAnimationTimelineRef.current = null; return;
    };
    zapAnimationTimelineRef.current?.kill();
    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null;
    if (!svgElement || typeof svgElement.querySelector !== 'function') { return; }
    const currentZapSequence = zapSequences[animationVariant - 1];
    if (!currentZapSequence) { return; }
    const zapTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.5 });
    zapAnimationTimelineRef.current = zapTl;
    let currentTime = 0;
    currentZapSequence.forEach((className, classIndex) => {
      const elementsToAnimate = svgElement.querySelectorAll(`.${className}`);
      if (elementsToAnimate.length > 0) {
        zapTl.to(elementsToAnimate, {
          opacity: 0.4, duration: 1.5, ease: 'power1.inOut', yoyo: true,
          stagger: (elementsToAnimate.length > 1 && classIndex % 2 === 0) ? 0.1 : 0,
        }, currentTime);
      }
      currentTime += 0.8; 
    });
    if (isPlayingAudio) { zapTl.play(); }
    return () => { zapAnimationTimelineRef.current?.kill(); };
  }, [animationVariant]); 

  useEffect(() => { 
    if (isPlayingAudio) { baseAnimationTimelineRef.current?.restart().play(); zapAnimationTimelineRef.current?.restart().play(); } 
    else { baseAnimationTimelineRef.current?.pause(); zapAnimationTimelineRef.current?.pause(); } 
  }, [isPlayingAudio]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); setIsPlayingAudio(false); } }
    else { audioElement.pause(); audioElement.src = ""; setIsPlayingAudio(false); setIsAudioLoaded(false); }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const hCPT = () => setIsAudioLoaded(true); const hAPE = () => { if (!isPlayingAudio) setIsPlayingAudio(true);}; const hAPauseE = () => { if (isPlayingAudio) setIsPlayingAudio(false);};
    const hAEnd = () => { setIsPlayingAudio(false); if (onPlaybackEnd) onPlaybackEnd(); };
    audioElement.addEventListener('canplaythrough', hCPT); audioElement.addEventListener('play', hAPE); audioElement.addEventListener('pause', hAPauseE); audioElement.addEventListener('ended', hAEnd);
    return () => { audioElement.removeEventListener('canplaythrough', hCPT); audioElement.removeEventListener('play', hAPE); audioElement.removeEventListener('pause', hAPauseE); audioElement.removeEventListener('ended', hAEnd); };
  }, [onPlaybackEnd, isPlayingAudio]);

  const togglePlayPause = () => {
    if (!audioUrl) { toast.error("No audio loaded."); return; }
    if (!isAudioLoaded) { toast.info("Audio preparing..."); return; }
    const audioElement = audioRef.current; if (audioElement) { if (isPlayingAudio) audioElement.pause(); else audioElement.play().catch(console.error); }
  };

  return (
    <div className="flex flex-col items-center space-y-4 my-4">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} />
      {audioUrl && (
        <Button onClick={togglePlayPause} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md">
          {isPlayingAudio ? 'Pause AI Narration' : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;