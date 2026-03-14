import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;

    // Récupère les contrats actifs de l'utilisateur
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .or(`parent_id.eq.${user.id},repetiteur_id.eq.${user.id}`)
      .eq('statut', 'actif');

    if (!contracts || contracts.length === 0) {
      setUnreadCount(0);
      return;
    }

    const contractIds = contracts.map((c) => c.id);

    const { count } = await db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('contract_id', contractIds)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, refetch: fetchUnreadCount };
}
