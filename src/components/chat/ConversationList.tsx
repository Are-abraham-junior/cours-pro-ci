import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

export interface Conversation {
  chatId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  contractInfo: string;
  lastMessage?: {
    content: string;
    created_at: string;
    is_mine: boolean;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedChatId,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <p className="font-medium text-sm">Aucune conversation</p>
        <p className="text-xs text-muted-foreground">
          Vos conversations avec les répétiteurs apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isSelected = conv.chatId === selectedChatId;
        return (
          <button
            key={conv.chatId}
            onClick={() => onSelect(conv.chatId)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 transition-colors text-left',
              isSelected
                ? 'bg-primary/10 dark:bg-primary/20'
                : 'hover:bg-muted/50'
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conv.otherUser.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator placeholder */}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-800" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-semibold truncate', conv.unreadCount > 0 && 'font-bold')}>
                  {conv.otherUser.full_name}
                </p>
                {conv.lastMessage && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(conv.lastMessage.created_at), 'HH:mm', { locale: fr })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  'text-xs truncate',
                  conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {conv.lastMessage
                    ? `${conv.lastMessage.is_mine ? 'Vous: ' : ''}${conv.lastMessage.content}`
                    : conv.contractInfo}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 h-5 min-w-5 px-1 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
