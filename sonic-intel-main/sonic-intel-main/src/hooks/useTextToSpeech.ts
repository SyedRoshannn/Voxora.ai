import { useState, useRef, useEffect, useCallback } from 'react';

// Map of language codes to their preferred voice names
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  'ar-SA': ['Microsoft Naayf - Arabic (Saudi Arabia)'],
  'bn-BD': ['Google বাংলা'],
  'cs-CZ': ['Google čeština'],
  'da-DK': ['Google Dansk'],
  'de-DE': ['Google Deutsch', 'Anna'],
  'el-GR': ['Google Ελληνικά'],
  'en-US': ['Google US English', 'Samantha'],
  'es-ES': ['Google español', 'Monica'],
  'fi-FI': ['Google suomi'],
  'fr-FR': ['Google français', 'Amelie'],
  'hi-IN': ['Google हिन्दी'],
  'hu-HU': ['Google magyar'],
  'id-ID': ['Google Bahasa Indonesia'],
  'it-IT': ['Google italiano', 'Alice'],
  'ja-JP': ['Google 日本語', 'Kyoko'],
  'ko-KR': ['Google 한국의', 'Yuna'],
  'nl-NL': ['Google Nederlands', 'Xander'],
  'no-NO': ['Google norsk'],
  'pl-PL': ['Google polski'],
  'pt-BR': ['Google português do Brasil', 'Luciana'],
  'pt-PT': ['Google português', 'Joana'],
  'ro-RO': ['Google română'],
  'ru-RU': ['Google русский', 'Milena'],
  'sk-SK': ['Google slovenský'],
  'sv-SE': ['Google svenska'],
  'th-TH': ['Google ไทย'],
  'tr-TR': ['Google Türk'],
  'zh-CN': ['Google 普通话（中国大陆）', 'Ting-Ting'],
  'zh-HK': ['Google 粵語（香港）', 'Sin-Ji'],
  'zh-TW': ['Google 國語（臺灣）', 'Mei-Jia']
};

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
    if (!voices.length) {
      console.warn('No voices available');
      return null;
    }
    
    const langLower = lang.toLowerCase();
    const langCode = lang.split('-')[0].toLowerCase();
    
    console.log(`Looking for voice for language: ${lang} (${langCode})`);
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Check if we have a preferred voice for this language
    const preferredVoices = LANGUAGE_VOICE_MAP[lang] || [];
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => 
        v.name === voiceName || 
        v.voiceURI === voiceName ||
        v.lang.toLowerCase() === langLower
      );
      if (voice) {
        console.log(`Found preferred voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }
    
    // Try exact language match
    const exactMatch = voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactMatch) {
      console.log(`Found exact language match: ${exactMatch.name} (${exactMatch.lang})`);
      return exactMatch;
    }
    
    // Try language code match (e.g., 'es' for 'es-ES')
    const langMatch = voices.find(v => 
      v.lang.toLowerCase().startsWith(langCode) ||
      v.name.toLowerCase().includes(langCode)
    );
    
    if (langMatch) {
      console.log(`Found language code match: ${langMatch.name} (${langMatch.lang})`);
      return langMatch;
    }
    
    // Try to find any voice that might work
    const anyVoice = voices[0];
    console.warn(`No exact match found for ${lang}, using first available voice: ${anyVoice?.name} (${anyVoice?.lang})`);
    return anyVoice || null;
  }, [voices]);

  const stop = useCallback(() => {
    try {
      // Create a new speech synthesis instance to ensure we have a fresh state
      if (typeof window !== 'undefined') {
        synthRef.current = window.speechSynthesis;
      }
      
      // Stop any ongoing speech synthesis
      if (synthRef.current) {
        // Cancel any ongoing speech
        synthRef.current.cancel();
        
        // Force stop all voices (works around some browser issues)
        try {
          const voices = synthRef.current.getVoices();
          voices.forEach(voice => {
            try {
              // This helps in some browsers where cancel() alone doesn't work
              const utterance = new SpeechSynthesisUtterance('');
              utterance.voice = voice;
              synthRef.current?.speak(utterance);
              synthRef.current?.cancel();
            } catch (e) {
              console.warn('Error stopping voice:', e);
            }
          });
        } catch (e) {
          console.warn('Error getting voices for cleanup:', e);
        }
      }
      
      // Stop ResponsiveVoice if it's active
      if (typeof window !== 'undefined' && window.responsiveVoice) {
        try {
          window.responsiveVoice.cancel();
        } catch (e) {
          console.warn('Error stopping ResponsiveVoice:', e);
        }
      }
      
      // Clean up the current utterance
      if (utteranceRef.current) {
        try {
          // Remove all event listeners to prevent memory leaks
          const utterance = utteranceRef.current;
          utterance.onend = null;
          utterance.onerror = null;
          utterance.onstart = null;
        } catch (e) {
          console.warn('Error cleaning up utterance:', e);
        }
        utteranceRef.current = null;
      }
      
      // Update state
      setIsSpeaking(false);
      setIsOnlineTTS(false);
      
      // Force a small delay to ensure state is fully updated
      setTimeout(() => {
        setIsSpeaking(false);
      }, 100);
      
    } catch (error) {
      console.error('Error stopping speech:', error);
      // Ensure we still update the state even if there's an error
      setIsSpeaking(false);
      setIsOnlineTTS(false);
      utteranceRef.current = null;
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

    // Normalize language code (e.g., 'en' -> 'en-US')
    if (language.length === 2) {
      language = `${language}-${language.toUpperCase()}`;
    }
    
    // Special handling for unsupported languages
    const unsupportedLanguages = ['kn', 'ta', 'te', 'ml', 'hi'];
    const langCode = language.split('-')[0].toLowerCase();
    
    if (unsupportedLanguages.includes(langCode)) {
      console.log(`${language} TTS might not be available, trying fallback...`);
      // Try to find a fallback language
      const fallbackMap: Record<string, string> = {
        'kn': 'en-US', // Kannada -> English
        'ta': 'en-US', // Tamil -> English
        'te': 'en-US', // Telugu -> English
        'ml': 'en-US', // Malayalam -> English
        'hi': 'en-IN'  // Hindi -> Indian English
      };
      
      const fallbackLang = fallbackMap[langCode] || 'en-US';
      console.log(`Falling back to ${fallbackLang} for ${language}`);
      language = fallbackLang;
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