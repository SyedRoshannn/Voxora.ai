import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TranslationResult {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
}

export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<TranslationResult> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/api/translate`,
    { 
      text, 
      target_lang: targetLang, 
      source_lang: sourceLang 
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
