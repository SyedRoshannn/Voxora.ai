import { HfInference } from '@huggingface/inference';

const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.warn('Hugging Face token not found. Please set VITE_HUGGINGFACE_TOKEN in your .env file');
}

const hf = new HfInference(HF_TOKEN);

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: 130,
        min_length: 30,
      },
    });

    return response.summary_text;
  } catch (error) {
    console.error('Error during summarization:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
}
