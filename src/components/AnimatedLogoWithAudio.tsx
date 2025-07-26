// FILE: src/components/AnimatedLogoWithAudio.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  // <<< CHANGE: audioUrl is now optional, as the component can be rendered for idle animation alone.
  audioUrl?: string | null;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  // <<< CHANGE: New prop to control the idle "Knight Rider" animation.
  isAnimationActive?: boolean;
  forceIsPlaying: boolean; 
  onTogglePlay: () => void; 
}

const zapSequences: string[][] = [
  ['s1','s3','s4'],['s2','s4','s5'],['s3','s1','s2'],['s4','s5','s3'],['s5','s2','s1'],
  ['s0','s1','s2'],['s5','s4','s3'],['s1','s2','s3'],['s0','s2','s4'],['s2','s3','s5'],['s1','s5','s3']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, width = 180, height = 180, 
  playButtonText = "Play Narration", isAnimationActive = false,
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const knightRiderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgContainerRef.current) { svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null; }
  }, []);

  // <<< CHANGE: This effect now controls the idle "Knight Rider" blip based on `isAnimationActive`.
  useEffect(() => {
    const svgElement = svgElementRef.current; if (!svgElement) return;
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    knightRiderTimelineRef.current?.kill();
    
    if (isAnimationActive && scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 0.9 });
        gsap.set(scanBlip, { opacity: 1 });
        const blipTl = gsap.timeline({ paused: true });
        knightRiderTimelineRef.current = blipTl;
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        gsap.set(scanBlip, { attr: { x: scanPathX_Start, width: blipWidth } });
        blipTl.to(scanBlip, { attr: { x: scanPathX_Start + scanPathWidth - blipWidth }, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: -1, repeatDelay: 0.15 });
        blipTl.play(); // Play the idle animation by default
    } else if (scanBlip) {
        // If not active, ensure the blip is hidden.
        gsap.set(scanBlip, { opacity: 0 });
    }
    return () => { knightRiderTimelineRef.current?.kill(); };
  }, [isAnimationActive]); 

  // <<< CHANGE: This effect now ONLY controls the audio-synced "zap" and "particle" animations.
  useEffect(() => {
    const svgElement = svgElementRef.current; if (!svgElement || animationVariant === undefined) return;
    
    zapAnimationTimelineRef.current?.kill();
    particleTimelineRef.current?.kill();

    const zapTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    zapAnimationTimelineRef.current = zapTl;

    const currentZapSequence = zapSequences[animationVariant - 1] || zapSequences[0];
    let zapTime = 0;
    currentZapSequence.forEach(className => {
        const elements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background');
        if (elements.length > 0) {
            zapTl.fromTo(elements, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 1, stagger: 0.1 }, zapTime);
        }
        zapTime += 0.3;
    });
    
    const particleTl = gsap.timeline({ paused: true, repeat: -1 });
    particleTimelineRef.current = particleTl;
    const particles = svgElement.querySelectorAll('.particle');
    if (particles.length > 0) {
        particleTl.to(particles, {
            opacity: () => Math.random() * 0.9,
            scale: () => Math.random() * 1.5,
            duration: 1, ease: 'power1.inOut', yoyo: true,
            stagger: { each: 0.05, from: "random", repeat: -1, yoyo: true }
        });
    }
    return () => { 
        zapAnimationTimelineRef.current?.kill();
        particleTimelineRef.current?.kill(); 
    };
  }, [animationVariant]);

  // This effect synchronizes playback state (audio and animations)
  useEffect(() => {
    if (forceIsPlaying) {
      // The blip is managed by isAnimationActive, so we just need to make sure it's playing
      knightRiderTimelineRef.current?.play(); 
      // The zap/particle animations ONLY play with audio
      zapAnimationTimelineRef.current?.play(); 
      particleTimelineRef.current?.play();
      audioRef.current?.play().catch(console.error);
    } else {
      // If audio is paused, pause the audio-specific animations
      zapAnimationTimelineRef.current?.pause();
      particleTimelineRef.current?.pause();
      // The blip keeps playing if active, so we don't pause it unless forceIsPlaying is its ONLY controller.
      // But for our logic, we let the idle animation run, so we don't pause it here.
      audioRef.current?.pause();
    }
  }, [forceIsPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); } } 
    else { audioElement.src = ""; setIsAudioLoaded(false); }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioEnded = () => { if (onTogglePlay) onTogglePlay(); };
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => { 
      audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      audioElement.removeEventListener('ended', handleAudioEnded); 
    };
  }, [onTogglePlay]);

  return (
    <div className="flex flex-col items-center space-y-4 my-2">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      {/* <<< CHANGE: Only show the play button if an audioUrl actually exists. */}
      {audioUrl && (
        <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
          {forceIsPlaying ? `Pause: ${playButtonText}` : `Play: ${playButtonText}`}
        </Button>
      )}
      {audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;