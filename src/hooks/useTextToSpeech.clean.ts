import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

interface UseTextToSpeechOptions {
  defaultLanguage?: string;
}

const useTextToSpeech = (options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn => {
  const { defaultLanguage = 'en-US' } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = 'speechSynthesis' in window;

  // Load available voices when the component mounts
  useEffect(() => {
    if (!isSupported) return;
    
    const loadVoices = () => {
      const availableVoices = synthRef.current.getVoices();
      console.log('Available voices:', availableVoices);
      setVoices(availableVoices);
    };

    // Load voices when they become available
    synthRef.current.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load

    return () => {
      synthRef.current.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Find the best voice for the given language
  const getVoiceForLanguage = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    
    const langLower = lang.toLowerCase();
    const langCode = lang.split('-')[0].toLowerCase();
    
    // Try exact match first
    const exactMatch = voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactMatch) return exactMatch;
    
    // Try language code match (e.g., 'kn' in 'kn-IN')
    const langMatch = voices.find(v => 
      v.lang.toLowerCase().startsWith(langCode) ||
      v.name.toLowerCase().includes(langCode)
    );
    
    return langMatch || voices[0] || null;
  }, [voices]);

  const stop = useCallback(() => {
    if (isSupported && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  const speak = useCallback((text: string, language: string = defaultLanguage) => {
    if (!isSupported || !text.trim()) {
      console.warn('Speech synthesis not supported or empty text');
      return;
    }

    // Stop any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Try to find the best voice for the specified language
    const voice = getVoiceForLanguage(language);
    if (voice) {
      utterance.voice = voice;
      console.log(`Using voice: ${voice.name} for language: ${language}`);
    } else {
      console.warn(`No voice found for language: ${language}. Using default voice.`);
    }
    
    // Adjust speech parameters
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      utteranceRef.current = null;
      
      // Fall back to default language if current language fails
      if (language !== defaultLanguage) {
        console.log(`Falling back to default language (${defaultLanguage}) for TTS`);
        speak(text, defaultLanguage);
      }
    };

    try {
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
      console.log('Started speaking with language:', language);
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [isSupported, getVoiceForLanguage, defaultLanguage, stop]);

  return {
    isSpeaking,
    speak,
    stop,
    isSupported,
    voices,
  };
};

export default useTextToSpeech;
