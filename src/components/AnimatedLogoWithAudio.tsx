// FILE: src/components/AnimatedLogoWithAudio.tsx
// Corrected animation logic for constant Knight Rider blip, static inner background,
// and a 5-second Zap within a 15-second loop.

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 
import { toast } from "sonner"; 

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null;
  onPlaybackEnd?: () => void;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
  animationVariant: number; 
  forceIsPlaying: boolean; 
  onTogglePlay: () => void; 
}

const zapSequences: string[][] = [
  ['s1','s3','s4','s5','s2','s0'],['s2','s4','s5','s1','s3','s0'],['s3','s1','s2','s4','s5','s0'],
  ['s4','s5','s3','s2','s1','s0'],['s5','s2','s1','s3','s4','s0'],['s0','s1','s2','s3','s4','s5'],
  ['s5','s4','s3','s2','s1','s0'],['s1','s2','s1','s3','s1','s4'],['s0','s2','s0','s5','s0','s3'],
  ['s2','s3','s4','s5','s1','s0'],['s1','s5','s3','s0','s4','s2']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, onPlaybackEnd, width = 180, height = 180, 
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!svgContainerRef.current || animationVariant === undefined || animationVariant < 1 || animationVariant > zapSequences.length) return;
    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null;
    if (!svgElement || typeof svgElement.querySelector !== 'function') return;

    masterTimelineRef.current?.kill();
    const masterTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1 });
    masterTimelineRef.current = masterTl;

    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    
    // CONSTANT: Knight Rider Blip Animation (runs for the full 15s loop duration)
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 1 });
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        const blipScanStartPos = scanPathX_Start;
        const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
        gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } });
        
        // This animation will yoyo back and forth for the entire timeline duration
        masterTl.to(scanBlip, { 
            attr: { x: blipScanEndPos }, 
            duration: 0.7, // A single pass takes 0.7s
            ease: "none", 
            yoyo: true, 
            repeat: -1 // Loop this individual tween indefinitely within the parent timeline
        }, 0); // Start at time 0
    }

    // ZAP ANIMATION (occurs only between 5s and 10s)
    const currentZapSequence = zapSequences[animationVariant - 1];
    if (currentZapSequence) {
        const zapSubTimeline = gsap.timeline();
        let zapTime = 0;
        currentZapSequence.forEach((className) => {
          const filteredElements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background' && el.id !== 'Knight-rider' && el.id !== 'scanBlip');
          if (filteredElements.length > 0) { 
            zapSubTimeline.fromTo(filteredElements, { opacity: 1 }, { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 1, stagger: 0.05 }, zapTime); 
          }
          zapTime += 0.25;
        });
        // Add this 5-second sub-timeline to the master timeline at the 5s mark
        masterTl.add(zapSubTimeline, 5);
    }

    // Set the total duration of one master loop to 15 seconds
    masterTl.totalDuration(15);
    
    return () => { masterTimelineRef.current?.kill(); };
  }, [animationVariant]); 

  useEffect(() => {
    const masterTl = masterTimelineRef.current; if (!masterTl) return;
    if (forceIsPlaying) { if (masterTl.paused()) masterTl.play(0); } 
    else { if (masterTl.isActive()) masterTl.pause(); }
  }, [forceIsPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); } } 
    else { audioElement.src = ""; setIsAudioLoaded(false); }
    if (forceIsPlaying) { audioElement.play().catch(console.error); } 
    else { audioElement.pause(); }
  }, [audioUrl, forceIsPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioEnded = () => { if (onTogglePlay) onTogglePlay(); };
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => { audioElement.removeEventListener('canplaythrough', handleCanPlayThrough); audioElement.removeEventListener('ended', handleAudioEnded); };
  }, [onTogglePlay]);

  return (
    <div className="flex flex-col items-center space-y-4 my-4">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      {audioUrl && (
        <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
          {forceIsPlaying ? 'Pause AI Narration' : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;