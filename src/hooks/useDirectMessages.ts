import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_system: boolean;
  created_at: string;
  audio_url?: string;
}

export function useDirectMessages(conversationId: string | null) {
  const { user, hasRole, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await db
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[DirectChat] Erreur fetch messages:', error);
        return;
      }
      setMessages((data as DirectMessage[]) || []);

      // Marquer les messages reçus comme lus
      if (data && data.length > 0) {
        const { error: updateError } = await db
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
          
        if (updateError) {
          console.error('[DirectChat] Erreur lors du marquage des anciens messages comme lus:', updateError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    fetchMessages();

    // Souscrire aux nouveaux messages via Supabase Realtime
    const channelName = `messages_conversation_${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Marquer comme lu si le message vient de l'autre partie
          if (newMsg.sender_id !== user.id) {
            db.from('messages').update({ is_read: true }).eq('id', newMsg.id).then(({ error }: any) => {
              if (error) console.error('[DirectChat] Erreur lors du marquage du nouveau message comme lu:', error);
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
  }, [conversationId, user, fetchMessages]);

  const sendMessage = async (content: string, audioUrl?: string) => {
    if (!conversationId || !user || (!content.trim() && !audioUrl)) return;
    
    // Déduction de token pour le répétiteur (prestataire) au 1er message
    if (hasRole('prestataire')) {
      const hasSentMessage = messages.some(m => m.sender_id === user.id && !m.is_system);
      
      if (!hasSentMessage) {
        if (!profile?.tokens || profile.tokens <= 0) {
          toast({
            title: "Tokens insuffisants",
            description: "Vous devez avoir au moins 1 token pour répondre à un parent.",
            variant: "destructive"
          });
          return;
        }

        // Déduire le token
        const { error: tokenError } = await supabase
          .from('profiles')
          .update({ tokens: (profile.tokens || 0) - 1 })
          .eq('id', user.id);

        if (tokenError) {
          console.error('[DirectChat] Erreur déduction token:', tokenError);
          toast({
            title: "Erreur",
            description: "Impossible de déduire le token. Veuillez réessayer.",
            variant: "destructive"
          });
          return;
        }
        
        await refreshProfile();
        toast({
          title: "Token déduit",
          description: "1 token a été déduit de votre solde pour cette nouvelle conversation.",
        });
      }
    }

    setSending(true);
    try {
      const { data, error } = await db.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || '',
        audio_url: audioUrl || null,
        is_system: false
      }).select().single();

      if (error) {
        console.error('[DirectChat] Erreur envoi message:', error);
        toast({
          title: "Erreur d'envoi",
          description: "Impossible d'envoyer le message. Vérifiez votre connexion.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (data as DirectMessage).id)) return prev;
          return [...prev, data as DirectMessage];
        });
      }
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage };
}
