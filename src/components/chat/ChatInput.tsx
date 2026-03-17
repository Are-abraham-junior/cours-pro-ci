import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputProps {
  onSend: (content: string, audioUrl?: string) => void;
  sending: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, sending, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSendText = () => {
    if (!text.trim() || sending || disabled || isRecording || uploadingAudio) return;
    onSend(text);
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      const startTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        const duration = Date.now() - startTime;
        if (duration < 1000) {
          // Message too short (less than 1s), discard
          setRecordingTime(0);
          return;
        }

        await uploadAudioAndSend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur accès microphone:', error);
      alert('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = null; // Prevent upload
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadAudioAndSend = async (blob: Blob) => {
    setUploadingAudio(true);
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
      const filePath = `records/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_audios')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat_audios').getPublicUrl(filePath);
      
      onSend('', publicUrl);
    } catch (error) {
      console.error('Erreur upload audio:', error);
      alert('Erreur lors de l\'envoi du message vocal.');
    } finally {
      setUploadingAudio(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isInputDisabled = disabled || sending || uploadingAudio;

  return (
    <div className="flex items-end gap-2 p-3 bg-white dark:bg-zinc-900 border-t border-border relative overflow-hidden">
      {isRecording ? (
        <div className="flex-1 flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 rounded-full h-[44px] px-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500">{formatTime(recordingTime)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-muted-foreground hover:text-red-500 h-8 px-2"
          >
            Annuler
          </Button>
        </div>
      ) : (
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploadingAudio ? "Envoi du message vocal..." : "Écrivez un message..."}
            rows={1}
            disabled={isInputDisabled}
            className={cn(
              'resize-none min-h-[44px] max-h-32 rounded-full px-4 py-3',
              'bg-zinc-100 dark:bg-zinc-800 border-0 focus-visible:ring-1 focus-visible:ring-primary',
              'text-sm leading-5 overflow-y-auto'
            )}
            style={{ scrollbarWidth: 'none' }}
          />
        </div>
      )}

      {text.trim() || isRecording ? (
        <Button
          onClick={isRecording ? stopRecording : handleSendText}
          disabled={isInputDisabled && !isRecording}
          size="icon"
          className={cn(
            'h-11 w-11 rounded-full shrink-0 transition-all text-white shadow-sm',
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#f97316] hover:bg-[#ea6c0a]'
          )}
        >
          {uploadingAudio || sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
            <Send className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5 pl-1" />
          )}
        </Button>
      ) : (
        <Button
          onClick={startRecording}
          disabled={isInputDisabled}
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full shrink-0 transition-all bg-[#0fab7e] hover:bg-[#0c916a] text-white shadow-sm"
        >
          {uploadingAudio ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      )}
    </div>
  );
}
