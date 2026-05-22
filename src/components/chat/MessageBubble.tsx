import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMine: boolean;
  isRead: boolean;
  audioUrl?: string;
  isSystem?: boolean;
}

export function MessageBubble({ content, createdAt, isMine, isRead, audioUrl, isSystem }: MessageBubbleProps) {
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 px-10">
        <div className="bg-primary/5 dark:bg-primary/10 text-muted-foreground text-xs px-4 py-2 rounded-xl border border-primary/20 text-center italic max-w-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
          isMine
            ? 'bg-[#f97316] text-white rounded-br-sm'
            : 'bg-white dark:bg-zinc-800 text-foreground rounded-bl-sm border border-border'
        )}
      >
        {audioUrl ? (
          <div className="min-w-[200px]">
            <audio controls src={audioUrl} className="h-10 w-full mb-1" />
            {content && <p className="text-[15px] leading-relaxed break-words">{content}</p>}
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed break-words">{content}</p>
        )}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isMine ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isMine ? 'text-white/70' : 'text-muted-foreground'
            )}
          >
            {format(new Date(createdAt), 'HH:mm', { locale: fr })}
          </span>
          {isMine && (
            isRead ? (
              <CheckCheck className="h-3 w-3 text-white/70" />
            ) : (
              <Check className="h-3 w-3 text-white/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
