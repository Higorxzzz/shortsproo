import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, User, Paperclip, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

type Chat = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  last_message?: string;
  unread?: boolean;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_type?: string | null;
};

const FilePreview = ({ url, type, isAdmin }: { url: string; type: string; isAdmin: boolean }) => {
  if (type.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="attachment" className="max-w-full rounded-lg max-h-60 object-cover mt-1" />
      </a>
    );
  }
  if (type.startsWith("video/")) {
    return <video src={url} controls className="max-w-full rounded-lg max-h-60 mt-1" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={cn("flex items-center gap-2 mt-1 text-xs underline", isAdmin ? "text-primary-foreground/90" : "text-foreground/80")}>
      <FileText className="h-4 w-4" />
      {url.split("/").pop()?.substring(0, 30)}
    </a>
  );
};

const AdminChats = () => {
  const { user, isTeamMember, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isPt = t.language === "pt";

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats
  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      setLoadingChats(true);
      const { data: chatData } = await supabase
        .from("support_chats").select("*").order("updated_at", { ascending: false });

      if (chatData) {
        const userIds = [...new Set(chatData.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles").select("id, name, email").in("id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        const enriched = await Promise.all(
          chatData.map(async (chat) => {
            const profile = profileMap.get(chat.user_id);
            const { data: lastMsg } = await supabase
              .from("support_messages").select("content")
              .eq("chat_id", chat.id).order("created_at", { ascending: false }).limit(1).single();
            return {
              ...chat,
              user_name: profile?.name || "—",
              user_email: profile?.email || "—",
              last_message: lastMsg?.content || "",
            } as Chat;
          })
        );
        setChats(enriched);
      }
      setLoadingChats(false);
    };
    loadChats();

    const channel = supabase
      .channel("admin-support-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_chats" }, () => loadChats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => loadChats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!selectedChatId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages").select("*")
        .eq("chat_id", selectedChatId).order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    loadMessages();

    const channel = supabase
      .channel(`admin-chat-${selectedChatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `chat_id=eq.${selectedChatId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const uploadFile = async (file: File) => {
    if (!selectedChatId || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${selectedChatId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file);
    if (error) { setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(path);

    await supabase.from("support_messages").insert({
      chat_id: selectedChatId,
      sender_id: user.id,
      content: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
    });
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !user) return;
    await supabase.from("support_messages").insert({
      chat_id: selectedChatId, sender_id: user.id, content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  if (authLoading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (!isTeamMember) return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isPt ? "Chat de Suporte" : "Support Chat"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        {/* Chat list */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm font-medium">
              {isPt ? "Conversas" : "Conversations"} ({chats.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {loadingChats ? (
              <p className="p-4 text-sm text-muted-foreground text-center">{isPt ? "Carregando..." : "Loading..."}</p>
            ) : chats.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">{isPt ? "Nenhuma conversa ainda" : "No conversations yet"}</p>
            ) : (
              chats.map((chat) => (
                <button key={chat.id} onClick={() => setSelectedChatId(chat.id)}
                  className={cn("w-full flex items-start gap-3 p-3 text-left transition-colors border-b border-border/50 hover:bg-muted/50",
                    selectedChatId === chat.id && "bg-primary/5"
                  )}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{chat.user_name}</p>
                      <Badge variant={chat.status === "open" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {chat.status === "open" ? (isPt ? "Aberto" : "Open") : (isPt ? "Fechado" : "Closed")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.user_email}</p>
                    {chat.last_message && <p className="text-xs text-muted-foreground truncate mt-1">{chat.last_message}</p>}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Chat messages */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedChatId ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{isPt ? "Selecione uma conversa" : "Select a conversation"}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{selectedChat?.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedChat?.user_email}</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground pt-8">
                    {isPt ? "Nenhuma mensagem ainda" : "No messages yet"}
                  </p>
                )}
                {messages.map((msg) => {
                  const isAdmin = msg.sender_id !== selectedChat?.user_id;
                  return (
                    <div key={msg.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                        isAdmin ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                      )}>
                        {msg.file_url && msg.file_type && <FilePreview url={msg.file_url} type={msg.file_type} isAdmin={isAdmin} />}
                        {!msg.file_url && <p>{msg.content}</p>}
                        <p className={cn("mt-1 text-[10px]", isAdmin ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border p-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={isPt ? "Digite sua resposta..." : "Type your reply..."} className="text-sm" />
                  <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim() || uploading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminChats;
