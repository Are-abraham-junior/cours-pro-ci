import { useEffect, useRef } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatWindowProps {
  contractId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  contractInfo?: string;
}

function formatDateSeparator(date: Date): string {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return 'Hier';
  return format(date, 'dd MMMM yyyy', { locale: fr });
}

export function ChatWindow({ contractId, otherUser, contractInfo }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(contractId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Use setTimeout to ensure DOM is updated before scrolling
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Group messages by date for separators
  const groupedMessages = messages.reduce<{ date: string; msgs: typeof messages }[]>(
    (acc, msg) => {
      const dateKey = new Date(msg.created_at).toDateString();
      const lastGroup = acc[acc.length - 1];
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.msgs.push(msg);
      } else {
        acc.push({ date: dateKey, msgs: [msg] });
      }
      return acc;
    },
    []
  );

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border-b border-border shadow-sm">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {otherUser.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground">{otherUser.full_name}</p>
          {contractInfo && (
            <p className="text-xs text-muted-foreground">{contractInfo}</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium">Démarrez la conversation</p>
            <p className="text-xs text-center max-w-48">
              Envoyez un message pour commencer à discuter avec {otherUser.full_name}
            </p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date} className="space-y-1">
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <span className="bg-white dark:bg-zinc-700 text-xs text-muted-foreground px-3 py-1 rounded-full shadow-sm border border-border">
                  {formatDateSeparator(new Date(date))}
                </span>
              </div>
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  createdAt={msg.created_at}
                  isMine={msg.sender_id === user?.id}
                  isRead={msg.is_read}
                  audioUrl={msg.audio_url}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} sending={sending} />
    </div>
  );
}
