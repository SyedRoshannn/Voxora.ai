import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play, FileText } from 'lucide-react';
// Import pdfmake with proper typing
import * as pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { useToast } from '@/hooks/use-toast';

// Dynamically import vfs_fonts with proper typing
const loadPdfFonts = async () => {
  if (typeof window !== 'undefined') {
    try {
      const pdfFonts = await import('pdfmake/build/vfs_fonts');
      // Access the vfs object directly from the module
      if (pdfFonts && 'default' in pdfFonts && pdfFonts.default && 'vfs' in pdfFonts.default) {
        (window as any).pdfMake = {
          ...(window as any).pdfMake,
          vfs: pdfFonts.default.vfs
        };
      }
    } catch (error) {
      console.warn('Error loading pdf fonts:', error);
    }
  }
};

// Load fonts when the component mounts
if (typeof window !== 'undefined') {
  loadPdfFonts();
}

// Function to detect if text contains non-Latin characters
const hasNonLatinText = (text: string): boolean => {
  return /[^\u0000-\u007F]/.test(text);
};

export interface Note {
  id: number | string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

interface NotesListProps {
  notes: Note[];
  onDeleteNote: (id: number | string) => void;
  onSpeakText: (text: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const NotesList = ({ 
  notes, 
  onDeleteNote, 
  onSpeakText, 
  className = '',
  isLoading = false 
}: NotesListProps & { isLoading?: boolean }) => {
  const { toast } = useToast();

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
      description: "Your note has been saved as a text file."
    });
  };

  const downloadAsPDF = (note: Note) => {
    try {
      const date = new Date(note.timestamp).toLocaleString();
      const useNotoFont = hasNonLatinText(note.text);
      const font = useNotoFont ? 'NotoSans' : 'Roboto';
      
      // Define the document definition with proper types
      const docDefinition: TDocumentDefinitions = {
        content: [
          { 
            text: 'Voice Note',
            style: 'header',
            font
          },
          { 
            text: `Created: ${date}`, 
            style: 'subheader',
            font
          },
          { 
            text: note.text, 
            style: 'content',
            font
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10] as [number, number, number, number],
            color: '#333333'
          },
          subheader: {
            fontSize: 10,
            color: '#666666',
            margin: [0, 0, 0, 15] as [number, number, number, number]
          },
          content: {
            fontSize: 12,
            lineHeight: 1.5,
            color: '#000000'
          }
        },
        defaultStyle: {
          font,
          characterSpacing: 0.5,
          lineHeight: 1.2
        }
      };

      // Create and download the PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition as TDocumentDefinitions);
      pdfDocGenerator.download(`voice-note-${new Date(note.timestamp).toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your note has been downloaded as a PDF file."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No notes yet. Start speaking to create your first note!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-white">Your Notes</h3>
      {notes.map((note) => (
        <Card key={note.id} className="p-4 bg-[#343541] border border-[#565869] text-white shadow-lg rounded-3xl">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-2">
                {note.timestamp.toLocaleString()}
              </p>
              <p className="text-white">{note.text}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => onSpeakText(note.text)}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => downloadAsText(note)}
                title="Download as Text"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => downloadAsPDF(note)}
                title="Download as PDF"
              >
                <FileText className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                className="text-destructive hover:text-destructive"
                title="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};