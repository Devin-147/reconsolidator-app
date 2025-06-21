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
  animationVariant: number; // 1 through 11, to select the Zap animation
}

// Define the class sequences for each Zap
const zapSequences: string[][] = [
  // Zap 1 (index 0)
  ['s1', 's3', 's4', 's5', 's2', 's0', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's4', 's5', 's0', 's2', 's1', 's3', 's4'],
  // Zap 2 (index 1)
  ['s2', 's4', 's5', 's1', 's3', 's0', 's2', 's4', 's5', 's1', 's3', 's2', 's4', 's5', 's1', 's0', 's3', 's2', 's4', 's5'],
  // Zap 3 (index 2)
  ['s3', 's1', 's2', 's4', 's5', 's0', 's3', 's1', 's2', 's4', 's5', 's3', 's1', 's2', 's4', 's0', 's5', 's3', 's1', 's2'],
  // Zap 4 (index 3)
  ['s4', 's5', 's3', 's2', 's1', 's0', 's4', 's5', 's3', 's2', 's1', 's4', 's5', 's3', 's2', 's0', 's1', 's4', 's5', 's3'],
  // Zap 5 (index 4)
  ['s5', 's2', 's1', 's3', 's4', 's0', 's5', 's2', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's0', 's4', 's5', 's2', 's1'],
  // Zap 6 (index 5)
  ['s1', 's4', 's5', 's2', 's3', 's0', 's1', 's4', 's5', 's2', 's3', 's1', 's4', 's5', 's2', 's0', 's3', 's1', 's4', 's5'],
  // Zap 7 (index 6) - Your original Zap 7 was rejected. I will create a new sequence using different classes.
  // Let's make this one focus on shoulders and windows with some glow.
  ['s3', 's4', 's5', 's1', 's3', 's4', 's5', 's1', 's0', 's3', 's4', 's5', 's1', 's3', 's4', 's5', 's1', 's0', 's2', 's1'],
  // Zap 8 (index 7)
  ['s3', 's5', 's2', 's1', 's4', 's0', 's3', 's5', 's2', 's1', 's4', 's3', 's5', 's2', 's1', 's0', 's4', 's3', 's5', 's2'],
  // Zap 9 (index 8)
  ['s4', 's1', 's3', 's5', 's2', 's0', 's4', 's1', 's3', 's5', 's2', 's4', 's1', 's3', 's5', 's0', 's2', 's4', 's1', 's3'],
  // Zap 10 (index 9)
  ['s5', 's2', 's4', 's3', 's1', 's0', 's5', 's2', 's4', 's3', 's1', 's5', 's2', 's4', 's3', 's0', 's1', 's5', 's2', 's4'],
  // Zap 11 (index 10)
  ['s1', 's3', 's5', 's4', 's2', 's0', 's1', 's3', 's5', 's4', 's2', 's1', 's3', 's5', 's4', 's0', 's2', 's1', 's3', 's5']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl,
  onPlaybackEnd,
  width = 200, 
  height = 200, 
  playButtonText = "Play Narration",
  showLoadingText = false,
  animationVariant, // Expecting a number 1-11
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  // Refs for GSAP timelines
  const baseAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Setup GSAP BASE animations (Blip, Inner Background)
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null; 
    if (!svgElement || typeof svgElement.querySelector !== 'function') {
      console.warn("AnimatedLogo: MyActualLogo SVG for BASE not found.");
      return;
    }
    console.log("AnimatedLogo: Initializing BASE GSAP animations.");

    const innerBackground = svgElement.querySelector('#Inner-background');
    const scanBlip = svgElement.querySelector('#scanBlip'); 
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');

    const baseTl = gsap.timeline({ paused: true, repeat: -1 }); // Base animations loop while audio plays
    baseAnimationTimelineRef.current = baseTl;

    if (innerBackground) {
      baseTl.to(innerBackground, { opacity: 0.85, duration: 2.5, ease: 'sine.inOut', yoyo: true }, "baseStart");
    }
    
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 1 }); 
        const scanPathX_Start = 453; const scanPathWidth = 304;  
        const blipWidth = Math.floor(scanPathWidth * 0.15); // Slightly narrower blip
        const blipScanStartPos = scanPathX_Start;
        const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
        gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } }); 
        baseTl.to(scanBlip, { 
            attr: { x: blipScanEndPos }, duration: 0.7, ease: "sine.inOut", yoyo: true, 
        }, "baseStart"); // Sync with inner background pulse
    }
    return () => { baseAnimationTimelineRef.current?.kill(); };
  }, []); 

  // Setup GSAP ZAP animation based on animationVariant
  useEffect(() => {
    if (!svgContainerRef.current || animationVariant === undefined || animationVariant < 1 || animationVariant > 11) return;
    
    // Kill any previous Zap timeline
    zapAnimationTimelineRef.current?.kill();

    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null;
    if (!svgElement || typeof svgElement.querySelector !== 'function') {
      console.warn("AnimatedLogo: MyActualLogo SVG for ZAP not found.");
      return;
    }
    console.log(`AnimatedLogo: Initializing ZAP ${animationVariant} animation.`);

    const currentZapSequence = zapSequences[animationVariant - 1];
    const zapTl = gsap.timeline({ paused: true, repeat: -1 });
    zapAnimationTimelineRef.current = zapTl;
    let currentTime = 0;

    currentZapSequence.forEach((className, index) => {
      const elementsToAnimate = svgElement.querySelectorAll(`.${className}`);
      if (elementsToAnimate.length > 0) {
        // Example: make one element pulse if multiple, or all pulse
        const targetElement = elementsToAnimate[index % elementsToAnimate.length] || elementsToAnimate[0]; // Cycle through or pick first
        
        zapTl.to(targetElement, {
          opacity: 0.5, // Pulse opacity
          duration: 1.5,  // Half of a 3-second pulse
          ease: 'power1.inOut',
          yoyo: true,
        }, currentTime);
      }
      currentTime += 0.75; // Stagger start of next class pulse (total pulse is 3s, start next halfway)
    });
    
    // If audio is already playing when variant changes, start the new Zap timeline
    if (isPlayingAudio) {
      zapTl.play();
    }

    return () => { zapAnimationTimelineRef.current?.kill(); };
  }, [animationVariant, isPlayingAudio]); // Re-run if variant changes or audio starts playing

  // Effect to control animation play/pause state
  useEffect(() => { 
    if (isPlayingAudio) { 
      baseAnimationTimelineRef.current?.play(); 
      zapAnimationTimelineRef.current?.play();
    } else { 
      baseAnimationTimelineRef.current?.pause(); 
      zapAnimationTimelineRef.current?.pause();
      // Optionally reset progress on pause/stop:
      // baseAnimationTimelineRef.current?.pause().progress(0);
      // zapAnimationTimelineRef.current?.pause().progress(0);
    } 
  }, [isPlayingAudio]);

  // Effect to handle changes to audioUrl
  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) {
      if (audioElement.src !== audioUrl) {
        audioElement.src = audioUrl; setIsAudioLoaded(false); setIsPlayingAudio(false); // isPlayingAudio false stops timelines
        // Timelines already paused by isPlayingAudio becoming false
      }
    } else {
      audioElement.pause(); audioElement.src = ""; setIsPlayingAudio(false); setIsAudioLoaded(false);
    }
  }, [audioUrl]);

  // Audio Element Event Listeners
  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioPlayEvent = () => { if (!isPlayingAudio) setIsPlayingAudio(true);};
    const handleAudioPauseEvent = () => { if (isPlayingAudio) setIsPlayingAudio(false);};
    const handleAudioEnded = () => { setIsPlayingAudio(false); if (onPlaybackEnd) onPlaybackEnd(); };
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('play', handleAudioPlayEvent);
    audioElement.addEventListener('pause', handleAudioPauseEvent);
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => { /* remove listeners */ };
  }, [onPlaybackEnd, isPlayingAudio]);

  const togglePlayPause = () => {
    if (!audioUrl) { toast.error("No audio loaded."); return; }
    if (!isAudioLoaded) { toast.info("Audio preparing..."); return; }
    const audioElement = audioRef.current; 
    if (audioElement) { 
        if (isPlayingAudio) audioElement.pause(); 
        else audioElement.play().catch(console.error); 
    }
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