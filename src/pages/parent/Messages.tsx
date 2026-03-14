import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversationList, Conversation } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function ParentMessages() {
  const { user } = useAuth();
  const { contractId: paramContractId } = useParams<{ contractId?: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    paramContractId || null
  );
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, matiere, niveau, repetiteur_id')
        .eq('parent_id', user.id)
        .eq('statut', 'actif')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!contracts || contracts.length === 0) {
        setConversations([]);
        return;
      }

      const repetiteurIds = contracts.map((c) => c.repetiteur_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', repetiteurIds);

      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const convs: Conversation[] = await Promise.all(
        contracts.map(async (contract) => {
          const [lastMsgResult, unreadResult] = await Promise.all([
            db
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('contract_id', contract.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            db
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('contract_id', contract.id)
              .neq('sender_id', user.id)
              .eq('is_read', false),
          ]);

          const profile = profilesMap.get(contract.repetiteur_id);
          const lastMsgData = lastMsgResult.data as { content: string; created_at: string; sender_id: string } | null;
          return {
            contractId: contract.id,
            otherUser: profile || {
              id: contract.repetiteur_id,
              full_name: 'Répétiteur',
              avatar_url: null,
            },
            contractInfo: `${contract.matiere} - ${contract.niveau}`,
            lastMessage: lastMsgData
              ? {
                  content: lastMsgData.content,
                  created_at: lastMsgData.created_at,
                  is_mine: lastMsgData.sender_id === user.id,
                }
              : undefined,
            unreadCount: unreadResult.count || 0,
          };
        })
      );

      setConversations(convs);
      if (!selectedContractId && convs.length > 0) {
        setSelectedContractId(convs[0].contractId);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (paramContractId) setSelectedContractId(paramContractId);
  }, [paramContractId]);

  const selectedConv = conversations.find((c) => c.contractId === selectedContractId);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showList = !isMobile || !selectedContractId;
  const showChat = !isMobile || !!selectedContractId;

  return (
    <DashboardLayout title="Messages">
      <div className="flex rounded-xl overflow-hidden border border-border shadow-sm bg-white dark:bg-zinc-900" style={{ height: 'calc(100vh - 160px)' }}>
        {showList && (
          <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-white dark:bg-zinc-900 shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-bold text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Conversations
              </h2>
            </div>
            <ConversationList
              conversations={conversations}
              selectedContractId={selectedContractId}
              onSelect={(id) => {
                setSelectedContractId(id);
                navigate(`/mes-messages/${id}`);
              }}
              loading={loading}
            />
          </div>
        )}

        {showChat && (
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {isMobile && (
                  <Button variant="ghost" size="sm" className="self-start m-2" onClick={() => setSelectedContractId(null)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Retour
                  </Button>
                )}
                <ChatWindow
                  contractId={selectedConv.contractId}
                  otherUser={selectedConv.otherUser}
                  contractInfo={selectedConv.contractInfo}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-[#f0f2f5] dark:bg-zinc-900">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Mon Répétiteur</p>
                  <p className="text-sm mt-1">Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
