import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Cast nécessaire car la table `messages` n'est pas encore dans les types générés
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface Message {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  audio_url?: string;
}

export function useMessages(contractId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!contractId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await db
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Chat] Erreur fetch messages:', error);
        return;
      }
      setMessages((data as Message[]) || []);

      // Marquer les messages reçus comme lus
      if (data && data.length > 0) {
        await db
          .from('messages')
          .update({ is_read: true })
          .eq('contract_id', contractId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
      }
    } finally {
      setLoading(false);
    }
  }, [contractId, user]);

  useEffect(() => {
    if (!contractId || !user) return;

    fetchMessages();

    // Souscrire aux nouveaux messages via Supabase Realtime
    const channelName = `messages_contract_${contractId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          console.log('[Chat] Nouveau message reçu:', payload.new);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Marquer comme lu si le message vient de l'autre partie
          if (newMsg.sender_id !== user.id) {
            db.from('messages').update({ is_read: true }).eq('id', newMsg.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Chat] Realtime status:', status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId, user, fetchMessages]);

  const sendMessage = async (content: string, audioUrl?: string) => {
    if (!contractId || !user || (!content.trim() && !audioUrl)) return;
    setSending(true);
    try {
      const { data, error } = await db.from('messages').insert({
        contract_id: contractId,
        sender_id: user.id,
        content: content.trim() || '',
        audio_url: audioUrl || null
      }).select().single();

      if (error) {
        console.error('[Chat] Erreur envoi message:', error);
        return;
      }

      // Ajouter immédiatement le message dans l'état local (sans attendre Realtime)
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (data as Message).id)) return prev;
          return [...prev, data as Message];
        });
      }
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage };
}
