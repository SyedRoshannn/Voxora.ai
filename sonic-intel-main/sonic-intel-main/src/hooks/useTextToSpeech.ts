import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  isOnlineTTS: boolean;
}

interface UseTextToSpeechOptions {
  defaultLanguage?: string;
}

// Load ResponsiveVoice script
const loadResponsiveVoice = () => {
  return new Promise<void>((resolve) => {
    if (window.responsiveVoice) return resolve();
    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=YOUR_API_KEY';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load ResponsiveVoice');
      resolve();
    };
    document.head.appendChild(script);
  });
};

const useTextToSpeech = (options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn => {
  const { defaultLanguage = 'en-US' } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isOnlineTTS, setIsOnlineTTS] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = 'speechSynthesis' in window;
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      // We'll enable this when we implement the API
      // loadResponsiveVoice();
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isSupported || !synthRef.current) return;
    
    const loadVoices = () => {
      try {
        const availableVoices = synthRef.current?.getVoices() || [];
        console.log('Available voices:', availableVoices);
        setVoices(availableVoices);
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    };

    // Load voices when they become available
    synthRef.current.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load

    // Check for voices periodically in case they load after the initial check
    const voiceCheckInterval = setInterval(loadVoices, 1000);

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
      clearInterval(voiceCheckInterval);
    };
  }, [isSupported]);

  // Find the best voice for the given language
  const getVoiceForLanguage = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    
    const langLower = lang.toLowerCase();
    const langCode = lang.split('-')[0].toLowerCase();
    
    // Special handling for Kannada
    if (langCode === 'kn') {
      const kannadaVoices = voices.filter(v => 
        v.lang.toLowerCase().includes('kn') || 
        v.name.toLowerCase().includes('kannada')
      );
      if (kannadaVoices.length) return kannadaVoices[0];
      
      // Try Indian English as fallback for Kannada
      const indianEnglish = voices.find(v => 
        v.lang.toLowerCase() === 'en-in' || 
        v.name.toLowerCase().includes('india')
      );
      if (indianEnglish) return indianEnglish;
    }
    
    // Try exact match
    const exactMatch = voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactMatch) return exactMatch;
    
    // Try language code match
    const langMatch = voices.find(v => 
      v.lang.toLowerCase().startsWith(langCode) ||
      v.name.toLowerCase().includes(langCode)
    );
    
    return langMatch || voices[0] || null;
  }, [voices]);

  const stop = useCallback(() => {
    try {
      // Stop any ongoing speech synthesis
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      
      // Stop ResponsiveVoice if it's active
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      
      setIsSpeaking(false);
      setIsOnlineTTS(false);
      utteranceRef.current = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }, []);

  // Placeholder for future ResponsiveVoice integration
  const speakWithResponsiveVoice = (text: string, language: string) => {
    console.log('Online TTS is not yet implemented. Language requested:', language);
    // We'll implement this when we add the API
    return false;
  };

  const speak = useCallback((text: string, language: string = defaultLanguage) => {
    if (!text.trim()) {
      console.warn('Empty text provided for speech');
      return;
    }
    
    console.log(`Speaking text: "${text}" in language: ${language}`);
    stop();

    // Check if language is Kannada
    if (language.startsWith('kn')) {
      console.log('Kannada TTS is not yet implemented. Will use default voice.');
      // We'll implement the API integration later
      language = 'en-US'; // Fallback to English for now
    }

    if (!isSupported || !synthRef.current) {
      console.log('TTS not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      
      const voice = getVoiceForLanguage(language);
      if (voice) {
        utterance.voice = voice;
        console.log(`Using voice: ${voice.name} for language: ${language}`);
      } else {
        console.warn('No suitable voice found, trying online TTS');
        speakWithResponsiveVoice(text, language);
        return;
      }
    
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
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        
        // Fall back to online TTS if local TTS fails
        console.log('Falling back to online TTS after error');
        speakWithResponsiveVoice(text, language);
      };

      try {
        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
        console.log('Started speaking with language:', language);
      } catch (error) {
        console.error('Error starting speech synthesis:', error);
        setIsSpeaking(false);
        utteranceRef.current = null;
        
        // Fall back to online TTS if local TTS fails to start
        console.log('Falling back to online TTS after start error');
        speakWithResponsiveVoice(text, language);
      }
    } catch (error) {
      console.error('Error creating speech utterance:', error);
      // Fall back to online TTS if utterance creation fails
      speakWithResponsiveVoice(text, language);
    }
  }, [isSupported, getVoiceForLanguage, defaultLanguage, stop]);

  return {
    isSpeaking,
    speak,
    stop,
    isSupported,
    voices,
    isOnlineTTS,
  };
};

export { useTextToSpeech };