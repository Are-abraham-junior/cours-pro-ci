import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    // Récupère les contrats actifs de l'utilisateur
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .or(`parent_id.eq.${user.id},repetiteur_id.eq.${user.id}`)
      .eq('statut', 'actif');

    // Récupère les conversations directes de l'utilisateur
    const { data: directConvs } = await db
      .from('direct_conversations')
      .select('id')
      .or(`parent_id.eq.${user.id},repetiteur_id.eq.${user.id}`);

    const contractIds = contracts?.map((c) => c.id) || [];
    const directConvIds = directConvs?.map((c: any) => c.id) || [];

    let totalUnread = 0;

    if (contractIds.length > 0) {
      const { count: contractCount } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('contract_id', contractIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);
      totalUnread += contractCount || 0;
    }

    if (directConvIds.length > 0) {
      const { count: directCount } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', directConvIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);
      totalUnread += directCount || 0;
    }

    setUnreadCount(totalUnread);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    const setupChannel = async () => {
      channelRef = supabase
        .channel('unread_count_global')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new as { sender_id: string; is_read: boolean };
            if (msg.sender_id !== user.id && !msg.is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return channelRef;
    };

    setupChannel();

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [user, fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
}
