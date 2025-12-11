import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const VoiceVisualizer = ({ isListening, isSpeaking }: VoiceVisualizerProps) => {
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>([]);
  
  // Initialize bar heights
  if (barsRef.current.length === 0) {
    barsRef.current = [20, 20, 20, 20, 20];
  }

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      // Reset animation when not active
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      barsRef.current = [20, 20, 20, 20, 20];
      return;
    }

    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 150) { // Update every 150ms for smooth animation
        lastTime = time;
        
        // Create a smooth wave pattern
        const timeOffset = Date.now() / 1000; // Time in seconds
        
        barsRef.current = barsRef.current.map((_, i) => {
          // Create a wave pattern that moves across the bars
          const wavePosition = (i * 0.5) + (timeOffset * 0.5);
          const wave = Math.sin(wavePosition * Math.PI * 2) * 0.5 + 0.5; // 0 to 1
          
          // Base height + wave effect, with some randomness
          return 20 + (wave * 30 * (0.8 + Math.random() * 0.4));
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {barsRef.current.map((height, i) => (
        <div
          key={i}
          className="w-2 bg-gradient-voice rounded-full transition-all duration-300"
          style={{ 
            height: `${height}px`,
            transform: `scaleY(${height / 50})`
          }}
        />
      ))}
    </div>
  );
};