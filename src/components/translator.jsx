import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Copy, RefreshCw, X } from 'lucide-react';
import './translator.css';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ur', name: 'Urdu' }
].sort((a, b) => a.name.localeCompare(b.name));

const Translator = () => {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [fromLang, setFromLang] = useState('auto');
  const [toLang, setToLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-detect language if set to auto
  const detectLanguage = async (text) => {
    if (fromLang === 'auto' && text.trim()) {
      // Simple detection for common languages
      const detectedLang = detectLanguageFromText(text);
      if (detectedLang && detectedLang !== 'auto') {
        return detectedLang;
      }
    }
    return fromLang;
  };

  // Simple language detection based on character sets
  const detectLanguageFromText = (text) => {
    // Check for non-Latin scripts first
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(text)) return 'pa'; // Punjabi
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
    if (/[\u0900-\u097F]/.test(text)) return 'mr'; // Marathi
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u30FF]/.test(text)) return 'ja'; // Japanese
    if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian
    
    // Default to English if can't detect
    return 'en';
  };

  const MAX_CHAR_LIMIT = 5000;
  const CHUNK_SIZE = 1000; // Process 1000 characters at a time

  const splitTextIntoChunks = (text, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  };

  const translateText = async () => {
    const inputText = text.trim();
    if (!inputText) {
      setError('Please enter some text to translate');
      return;
    }

    // Check character limit
    if (inputText.length > MAX_CHAR_LIMIT) {
      setError(`Text exceeds maximum limit of ${MAX_CHAR_LIMIT} characters`);
      return;
    }

    setLoading(true);
    setError('');
    setTranslatedText('Translating...');

    try {
      const sourceLang = fromLang === 'auto' ? 'auto' : await detectLanguage(inputText);
      
      // For large texts, split into chunks and translate sequentially
      if (inputText.length > CHUNK_SIZE) {
        const chunks = splitTextIntoChunks(inputText, CHUNK_SIZE);
        let result = '';
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          setTranslatedText(`Translating... (${Math.round(((i) / chunks.length) * 100)}%)`);
          
          const response = await axios.post('http://localhost:8000/api/translate/', {
            text: chunk,
            to_lang: toLang,
            from_lang: sourceLang
          });
          
          if (response.data?.translated_text) {
            result += response.data.translated_text;
          } else {
            throw new Error('Invalid response from translation service');
          }
        }
        
        setTranslatedText(result);
      } else {
        // For small texts, translate in one go
        const response = await axios.post('http://localhost:8000/api/translate/', {
          text: inputText,
          to_lang: toLang,
          from_lang: sourceLang
        });
        
        if (response.data?.translated_text) {
          setTranslatedText(response.data.translated_text);
        } else {
          throw new Error('Invalid response from translation service');
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(`Failed to translate: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
      setTranslatedText('');
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    if (fromLang !== 'auto') {
      setFromLang(toLang);
      setToLang(fromLang);
      setText(translatedText);
      setTranslatedText(text);
    } else {
      // If auto-detecting, just swap the text
      setText(translatedText);
      setTranslatedText(text);
    }
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-translate when text changes (with debounce)
  useEffect(() => {
    if (text.trim() && fromLang !== toLang) {
      const timer = setTimeout(() => {
        translateText();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [text, fromLang, toLang]);

  return (
    <div className="translator-container">
      <div className="translator-content"></div>
      <h1>Voxora Translator</h1>
      
      <div className="language-selectors">
        <div className="language-selector">
          <label>Source Language</label>
          <select 
            value={fromLang} 
            onChange={(e) => setFromLang(e.target.value)}
            disabled={loading}
            className="lang-select"
          >
            <option value="auto">Detect Language</option>
            {languages.map(lang => (
              <option key={`from-${lang.code}`} value={lang.code}>
                {lang.name} {lang.code !== 'auto' ? `(${lang.code.toUpperCase()})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="swap-btn" 
          onClick={swapLanguages}
          disabled={loading || !text.trim()}
          title="Swap languages"
          aria-label="Swap languages"
        >
          <RefreshCw size={20} />
        </button>

        <div className="language-selector">
          <label>Target Language</label>
          <select 
            value={toLang} 
            onChange={(e) => setToLang(e.target.value)}
            disabled={loading}
            className="lang-select"
          >
            {languages.filter(lang => lang.code !== 'auto').map(lang => (
              <option key={`to-${lang.code}`} value={lang.code}>
                {lang.name} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-areas">
        <div className="text-area-container">
          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHAR_LIMIT) {
                setText(e.target.value);
              }
            }}
            placeholder={`Type or paste text here (max ${MAX_CHAR_LIMIT} characters)...`}
            disabled={loading}
            rows={8}
            maxLength={MAX_CHAR_LIMIT}
          />
          {text && (
            <button 
              className="clear-btn" 
              onClick={() => setText('')}
              disabled={loading}
              aria-label="Clear text"
            >
              <X size={16} />
            </button>
          )}
          <div className={`char-count ${text.length > MAX_CHAR_LIMIT * 0.9 ? 'char-limit-warning' : ''}`}>
            {text.length}/{MAX_CHAR_LIMIT} characters
            {text.length > MAX_CHAR_LIMIT * 0.9 && (
              <span className="warning-text"> (Approaching limit)</span>
            )}
          </div>
        </div>

        <div className="text-area-container">
          <textarea
            value={loading ? 'Translating...' : translatedText}
            readOnly
            placeholder="Translation will appear here..."
            className={loading ? 'loading' : ''}
            rows={8}
          />
          {translatedText && (
            <button 
              className={`copy-btn ${copied ? 'copied' : ''}`} 
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              disabled={loading}
              aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? '✓' : <Copy size={16} />}
            </button>
          )}
          {loading && (
            <div className="loading-spinner">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
        </div>
      </div>

      <button 
        className="translate-btn" 
        onClick={translateText}
        disabled={!text.trim() || loading}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
            Translating...
          </>
        ) : (
          'Translate'
        )}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="translation-tips">
        <h3>Translation Tips</h3>
        <ul>
          <li>• The translator supports 50+ languages including all major Indian languages</li>
          <li>• For better accuracy, try shorter sentences</li>
          <li>• Use proper punctuation for more accurate translations</li>
          <li>• You can also type in phonetic English (e.g., "namaste" for नमस्ते)</li>
        </ul>
      </div>
    </div>
  );
};

export default Translator;