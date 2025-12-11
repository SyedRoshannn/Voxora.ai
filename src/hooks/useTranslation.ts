import { useMutation } from '@tanstack/react-query';
import { translateText, TranslationResult } from '@/lib/api/translation';

type TranslationParams = {
  text: string;
  targetLang: string;
  sourceLang?: string;
};

export const useTranslation = () => {
  return useMutation<TranslationResult, Error, TranslationParams>({
    mutationFn: ({ text, targetLang, sourceLang = 'auto' }) => 
      translateText(text, targetLang, sourceLang)
  });
};
