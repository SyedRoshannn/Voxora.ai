import { jsPDF } from 'jspdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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

  const [downloading, setDownloading] = useState(false);

 const handleDownloadPDF = async (note: Note) => {
  setDownloading(true);
  try {
    // Create a new PDF document with UTF-8 encoding
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Set the default font to a standard one that supports more characters
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    
    // Add title with proper encoding
    doc.text('Voice Note', 14, 20);
    
    // Add creation date
    doc.setFontSize(10);
    doc.text(`Created: ${new Date(note.timestamp).toLocaleString()}`, 14, 30);
    
    // Set font for the main content
    doc.setFontSize(12);
    
    // Normalize the text to handle any special characters
    const normalizedText = note.text.normalize('NFKC');
    
    // Split text into lines that fit the page width
    const splitText = doc.splitTextToSize(normalizedText, 180);
    let yPosition = 40;
    const lineHeight = 7;
    
    // Add text line by line
    for (let i = 0; i < splitText.length; i++) {
      if (yPosition > 270 && i < splitText.length - 1) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(splitText[i], 14, yPosition);
      yPosition += lineHeight;
    }
    
    // Save the PDF
    await new Promise<void>((resolve) => {
      const filename = `voice-note-${new Date(note.timestamp).toISOString().split('T')[0]}.pdf`;
      doc.save(filename, { returnPromise: true }).then(() => resolve());
    });
    
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
  } finally {
    setDownloading(false);
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
                onClick={() => handleDownloadPDF(note)}
                disabled={downloading}
                title="Download as PDF"
              >
                {downloading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500" />
                )}
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