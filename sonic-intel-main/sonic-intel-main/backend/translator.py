from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from translate import Translator
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/translate", tags=["translation"])

class TranslationRequest(BaseModel):
    text: str
    to_lang: str = 'en'  # Default to English
    from_lang: str = 'auto'  # Auto-detect source language

def translate_chunk(translator, text, from_lang):
    """Helper function to translate a chunk of text"""
    try:
        if from_lang != 'auto':
            return translator.translate(text, src=from_lang)
        return translator.translate(text)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Translation failed: {str(e)}. Text length: {len(text)} characters"
        )

@router.post("/")
async def translate_text(request: TranslationRequest):
    try:
        logger.info(f"Received translation request. From: {request.from_lang}, To: {request.to_lang}, Text length: {len(request.text)}")
        
        # Validate input length
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="No text provided for translation")
            
        if len(request.text) > 10000:  # Limit to 10,000 characters
            raise HTTPException(status_code=400, detail="Text too long. Maximum 10,000 characters allowed.")
        
        # Initialize translator with target language
        translator = Translator(to_lang=request.to_lang)
        
        # Split text into smaller chunks if it's too long
        max_chunk_size = 500  # Smaller chunks for better reliability
        text_chunks = [request.text[i:i + max_chunk_size] 
                      for i in range(0, len(request.text), max_chunk_size)]
        
        # Translate each chunk
        translated_chunks = []
        for i, chunk in enumerate(text_chunks):
            logger.info(f"Translating chunk {i+1}/{len(text_chunks)} (length: {len(chunk)})")
            translated = translate_chunk(translator, chunk, request.from_lang)
            translated_chunks.append(translated)
        
        # Combine translated chunks
        translated_text = "".join(translated_chunks)
        
        return {
            "original_text": request.text,
            "translated_text": translated_text,
            "source_language": request.from_lang if request.from_lang != 'auto' else "auto-detected",
            "destination_language": request.to_lang,
            "chunks_processed": len(text_chunks)
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )