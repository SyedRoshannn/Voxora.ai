import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { VoiceButton } from '@/components/VoiceButton';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { NotesList } from '@/components/NotesList';
import { Save, Mic, Volume2, Download, FileText, Sparkles, Loader2, Link as LinkIcon, Share2, ChevronDown, MessageCircle, Instagram, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';
import aiAssistantAvatar from '@/assets/robot-chatbot-generative-ai-free-png.webp';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { useNotes, useCreateNote, useDeleteNote, useDeleteAllNotes } from '@/lib/api/notes';

interface Note {
  id: number;
  text: string;
  created_at: string;
  timestamp: Date;
}

const Index = () => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { data: notesData = [], isLoading, refetch } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const deleteAllNotes = useDeleteAllNotes();
  
  // Transform notes data to match the expected format
  const notes = notesData.map(note => ({
    ...note,
    timestamp: new Date(note.created_at)
  }));
  
  const [currentText, setCurrentText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    isListening,
    transcript,
    startListening: startRecognition,
    stopListening,
    resetTranscript,
    isSupported: speechRecognitionSupported
  } = useSpeechRecognition();

  const { speak: speakText, isSpeaking, stop: stopSpeaking, voices } = useTextToSpeech({
    defaultLanguage: language
  });

  // Log available voices for debugging
  useEffect(() => {
    console.log('Available voices:', voices);
    console.log('Current language:', language);
    const kannadaVoices = voices.filter(v => 
      v.lang.includes('kn') || v.name.toLowerCase().includes('kannada')
    );
    console.log('Kannada voices:', kannadaVoices);
    
    // If current language is Kannada and no Kannada voices are found, log a warning
    if (language === 'kn-IN' && !kannadaVoices.length) {
      console.warn('No Kannada voices found. The browser will try to use the default voice.');
    }
  }, [voices, language]);

  const startListening = () => {
    startRecognition({ language });
  };

  // Refetch notes when the component mounts or when the user toggles the notes view
  useEffect(() => {
    if (showSavedNotes) {
      refetch();
    }
  }, [showSavedNotes, refetch]);

  // Update current text when transcript changes, but not for voice commands
  useEffect(() => {
    if (transcript) {
      const lowerText = transcript.toLowerCase();
      const isCommand = 
        lowerText.includes('new note') ||
        lowerText.includes('save note') ||
        lowerText.includes('save this') ||
        lowerText.includes('clear text') ||
        lowerText.includes('clear note') ||
        lowerText.includes('read notes') ||
        lowerText.includes('read my notes') ||
        lowerText.includes('delete last note') ||
        lowerText.includes('remove last note') ||
        lowerText.includes('delete all notes') ||
        lowerText.includes('clear all notes') ||
        lowerText.includes('search notes for');
      
      if (!isCommand) {
        setCurrentText(transcript);
      }
    }
  }, [transcript]);

  // Summarize text
  const handleSummarize = async () => {
    if (!currentText.trim()) {
      toast({
        title: 'No text to summarize',
        description: 'Please enter or speak some text first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSummarizing(true);
      setSummaryError(null);
      
      // Import dynamically to avoid loading the module on initial load
      const { summarizeText } = await import('@/lib/summarize');
      const summary = await summarizeText(currentText);
      
      setCurrentText(summary);
      toast({
        title: 'Summary generated',
        description: 'Your text has been summarized successfully!',
      });
    } catch (error) {
      console.error('Summarization error:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
      toast({
        title: 'Error',
        description: 'Failed to generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentText.trim()) return;
    
    try {
      await createNote.mutateAsync(currentText);
      setCurrentText('');
      
      toast({
        title: 'Note saved',
        description: 'Your note has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const downloadAsText = (note: Note) => {
    const element = document.createElement('a');
    const file = new Blob([note.text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `note-${note.timestamp.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Note downloaded",
      description: "Your note has been downloaded as a text file."
    });
  };

  const downloadAsPDF = (note: Note) => {
    const doc = new jsPDF();
    const date = new Date(note.timestamp).toLocaleString();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Voice Note', 20, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Created: ${date}`, 20, 30);
    
    // Add note content with word wrap
    const splitTitle = doc.splitTextToSize(note.text, 170);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(splitTitle, 20, 45);
    
    // Save the PDF
    doc.save(`voice-note-${note.timestamp.toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your note has been downloaded as a PDF file."
    });
  };

  const handleDeleteNote = (id: number) => {
    deleteNote.mutate(id, {
      onSuccess: () => {
        toast({
          title: 'Note deleted',
          description: 'The note has been deleted.',
        });
      },
      onError: (error) => {
        console.error('Error deleting note:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete note. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleClearAllNotes = () => {
    if (notes.length === 0) return;
    
    if (window.confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
      deleteAllNotes.mutate(undefined, {
        onSuccess: () => {
          toast({
            title: 'All notes deleted',
            description: 'All your notes have been deleted.',
          });
        },
        onError: (error) => {
          console.error('Error deleting all notes:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete all notes. Please try again.',
            variant: 'destructive',
          });
        }
      });
    }
  };

  const handleVoiceCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Common function to handle command response
    const handleCommand = async (response: string, action?: () => void) => {
      // Clear the current transcript first
      resetTranscript();
      lastProcessedTranscript.current = '';
      
      // Execute the action if provided
      if (action) {
        await new Promise<void>((resolve) => {
          action();
          // Small delay to ensure state updates
          setTimeout(resolve, 100);
        });
      }
      
      // Only speak if not already speaking
      if (!isSpeaking) {
        await new Promise<void>((resolve) => {
          speakText(response);
          // Prevent multiple speech triggers
          setTimeout(resolve, 1000);
        });
      }
    };
    
    if (lowerText.includes('new note')) {
      handleCommand("New note created", () => setCurrentText(''));
    } else if (lowerText.includes('save note') || lowerText.includes('save this')) {
      handleCommand("Note saved successfully", handleSaveNote);
    } else if (lowerText.includes('clear text') || lowerText.includes('clear note')) {
      handleCommand("Text cleared", () => setCurrentText(''));
    } else if (lowerText.includes('read notes') || lowerText.includes('read my notes')) {
      if (notes.length > 0) {
        handleCommand(`You have ${notes.length} notes. Here's your latest note: ${notes[0].text}`);
      } else {
        handleCommand("You don't have any notes saved yet.");
      }
    } else if (lowerText.includes('delete last note') || lowerText.includes('remove last note')) {
      if (notes.length > 0) {
        const deletedNote = notes[0];
        handleCommand("Last note deleted", () => handleDeleteNote(deletedNote.id));
      } else {
        handleCommand("No notes to delete");
      }
    } else if (lowerText.includes('delete all notes') || lowerText.includes('clear all notes')) {
      handleCommand("All notes have been deleted", handleClearAllNotes);
    } else if (lowerText.includes('search notes for')) {
      const searchTerm = text.split('search notes for')[1]?.trim();
      if (searchTerm) {
        const matchingNotes = notes.filter(note => 
          note.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (matchingNotes.length > 0) {
          handleCommand(`Found ${matchingNotes.length} notes containing "${searchTerm}"`);
          // Highlight matching notes in the UI (optional)
          // You could add state to track search results and highlight them
        } else {
          handleCommand(`No notes found containing "${searchTerm}"`);
        }
      }
    } else if (lowerText.includes('stop listening') || lowerText.includes('stop voice')) {
      if (isListening) {
        stopListening();
        speakText("Stopped listening");
      }
    }
  };

  // Check for voice commands when transcript updates
  const lastProcessedTranscript = useRef('');
  const isProcessing = useRef(false);
  
  useEffect(() => {
    const processCommand = async () => {
      if (!transcript || transcript === lastProcessedTranscript.current || isProcessing.current) {
        return;
      }
      
      isProcessing.current = true;
      lastProcessedTranscript.current = transcript;
      
      try {
        await handleVoiceCommand(transcript);
      } finally {
        // Small delay to prevent rapid re-processing
        setTimeout(() => {
          isProcessing.current = false;
        }, 1000);
      }
    };

    processCommand();
  }, [transcript, handleVoiceCommand]);

  if (!speechRecognitionSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">
            Speech Recognition Not Supported
          </h1>
          <p className="text-muted-foreground">
            Your browser doesn't support speech recognition. Please use a modern browser like Chrome, Edge, or Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Voice Notes
                </h1>
                <Link 
                  to="/translator" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Translator
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSelector language={language} onChange={setLanguage} />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-4">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src={aiAssistantAvatar} 
                  alt="AI Assistant" 
                  className="w-24 h-24 rounded-full shadow-ai animate-float"
                />
              </div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Voxora</span>
              </h1>
              <p className="text-white dark:text-white text-lg font-medium">
                Speak, transcribe, and organize your thoughts with Voxora.AI
              </p>
            </div>

            {/* Main Voice Interface */}
            <Card className="max-w-2xl mx-auto mb-8 p-8 bg-[#343541] border border-[#565869] shadow-lg rounded-3xl">
              <div className="text-center mb-6">
                <VoiceVisualizer isListening={isListening} isSpeaking={isSpeaking} />
              </div>

              <div className="flex justify-center mb-6">
                <VoiceButton
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onStopSpeaking={stopSpeaking}
                />
              </div>

              <div className="text-center mb-6">
                {isListening && (
                  <p className="text-ai-voice-active font-medium animate-pulse">
                    🎤 Listening... Speak now
                  </p>
                )}
                {isSpeaking && (
                  <p className="text-accent font-medium animate-pulse">
                    🔊 Speaking...
                  </p>
                )}
                {!isListening && !isSpeaking && (
                  <p className="text-muted-foreground">
                    Click the microphone to start voice recording
                  </p>
                )}
              </div>

              {/* Text Area */}
              <div className="space-y-4 relative">
                <Textarea
                  placeholder="Your transcribed text will appear here, or you can type directly..."
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="min-h-32 resize-none pr-10"
                />
                {currentText && (
                  <div className="absolute right-2 bottom-2 flex flex-col items-end" ref={shareMenuRef}>
                    <div className="relative">
                      <button
                        id="share-menu-button"
                        onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
                        title="Share options"
                        aria-expanded={isShareMenuOpen ? "true" : "false"}
                        aria-haspopup="menu"
                        aria-controls="share-menu"
                      >
                        <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <ChevronDown className={`h-3 w-3 ml-0.5 text-gray-500 dark:text-gray-400 transition-transform ${isShareMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown menu */}
                      <div 
                        id="share-menu"
                        className={`absolute bottom-full right-0 mb-2 w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 transition-all duration-200 ${isShareMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="share-menu-button"
                        tabIndex={-1}
                      >
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Shared from Voxora',
                                text: currentText,
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(currentText);
                              toast({
                                title: 'Copied to clipboard!',
                                description: 'Text has been copied to your clipboard.',
                              });
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          {navigator.share ? 'Share via...' : 'Copy to clipboard'}
                        </button>
                        
                        <button
                          onClick={() => {
                            const encodedText = encodeURIComponent(currentText);
                            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                          Share on WhatsApp
                        </button>
                        
                        <button
                          onClick={() => {
                            const encodedText = encodeURIComponent(currentText);
                            // Instagram doesn't support text-only sharing directly, so we'll use the Instagram Direct message composer
                            window.open(`https://www.instagram.com/direct/new/?text=${encodedText}`, '_blank');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                          Share on Instagram
                        </button>
                        
                        <button
                          onClick={() => {
                            const encodedText = encodeURIComponent(currentText);
                            window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Send className="h-4 w-4 mr-2 text-blue-500" />
                          Share on Telegram
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={!currentText.trim() || isSummarizing}
                    variant="outline"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                  >
                    {isSummarizing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Summarize
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => speakText(currentText)}
                    disabled={!currentText.trim() || isSpeaking}
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                  >
                    {isSpeaking ? (
                      <span className="flex items-center">
                        <svg className="animate-pulse -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        Speaking...
                      </span>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Speak
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveNote}
                    disabled={!currentText.trim()}
                    variant="outline"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Note
                  </Button>
                </div>

                </div>

              {/* Voice Commands Info */}
              <div className="mt-6 bg-gray-800/80 border border-gray-700 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <button 
                  onClick={() => setShowVoiceCommands(!showVoiceCommands)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <h4 className="text-base font-medium text-blue-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Voice Commands
                  </h4>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${showVoiceCommands ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showVoiceCommands && (
                  <div className="p-5 pt-0">
                    <ul className="space-y-2.5">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">1</span>
                        <div>
                          <span className="text-white font-medium">Save note</span>
                          <span className="text-gray-400 text-sm ml-1.5">or</span>
                          <span className="text-white font-medium ml-1.5">Save this</span>
                          <p className="text-gray-400 text-sm mt-0.5">Save current text</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">2</span>
                        <div>
                          <span className="text-white font-medium">Clear text</span>
                          <p className="text-gray-400 text-sm mt-0.5">Clear the text area</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">3</span>
                        <div>
                          <span className="text-white font-medium">Read notes</span>
                          <p className="text-gray-400 text-sm mt-0.5">Hear your latest note</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">4</span>
                        <div>
                          <span className="text-white font-medium">New note</span>
                          <p className="text-gray-400 text-sm mt-0.5">Start a fresh note</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">5</span>
                        <div>
                          <span className="text-white font-medium">Delete last note</span>
                          <p className="text-gray-400 text-sm mt-0.5">Remove the most recent note</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">6</span>
                        <div>
                          <span className="text-white font-medium">Delete all notes</span>
                          <p className="text-gray-400 text-sm mt-0.5">Remove all saved notes</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">7</span>
                        <div>
                          <span className="text-white font-medium">Search notes for [keyword]</span>
                          <p className="text-gray-400 text-sm mt-0.5">Find notes containing specific text</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mr-2.5 mt-0.5">8</span>
                        <div>
                          <span className="text-white font-medium">Stop listening</span>
                          <p className="text-gray-400 text-sm mt-0.5">Stop voice recognition</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Saved Notes Section */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <button 
                  onClick={() => setShowSavedNotes(!showSavedNotes)}
                  className="w-full text-left p-4 pl-5 pr-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-t-lg"
                >
                  <h4 className="text-base font-medium text-blue-400 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Saved Notes {notes.length > 0 && `(${notes.length})`}
                  </h4>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ${showSavedNotes ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSavedNotes && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-700/50 rounded-b-lg border border-gray-600/50">
                      {notes.length > 0 ? (
                        <div className="max-h-[500px] overflow-y-auto">
                          <NotesList 
                            notes={notes}
                            onDeleteNote={handleDeleteNote}
                            onSpeakText={speakText}
                            className="mt-6"
                            isLoading={isLoading}
                          />
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <p className="text-sm">No saved notes yet. Start by saving your first note!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;