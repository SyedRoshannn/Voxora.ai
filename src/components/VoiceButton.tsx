import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

export const VoiceButton = ({ 
  isListening, 
  isSpeaking, 
  onStartListening, 
  onStopListening,
  onStopSpeaking 
}: VoiceButtonProps) => {
  const handleClick = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const getButtonVariant = () => {
    if (isSpeaking) return 'secondary';
    if (isListening) return 'default';
    return 'outline';
  };

  const getIcon = () => {
    if (isSpeaking) return <Volume2 className="h-8 w-8" />;
    if (isListening) return <Mic className="h-8 w-8" />;
    return <MicOff className="h-8 w-8" />;
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
        isListening 
          ? 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
          : isSpeaking 
          ? 'bg-blue-600/90 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
          : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500'
      }`}
      aria-label={isListening ? 'Stop listening' : isSpeaking ? 'Stop speaking' : 'Start voice command'}
    >
      <div className="relative z-10">
        {getIcon()}
      </div>
      
      {/* Pulsing rings effect when listening */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-blue-500 opacity-70 animate-ping-slow" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 animate-ping-slow-2" />
        </>
      )}
    </button>
  );
};