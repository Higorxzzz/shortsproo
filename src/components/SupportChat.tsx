import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Paperclip, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_type?: string | null;
};

type QuickReply = {
  id: string;
  question: string;
  auto_response: string;
};

const FilePreview = ({ url, type }: { url: string; type: string }) => {
  if (type.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="attachment" className="max-w-full rounded-lg max-h-48 object-cover mt-1" />
      </a>
    );
  }
  if (type.startsWith("video/")) {
    return <video src={url} controls className="max-w-full rounded-lg max-h-48 mt-1" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-xs underline">
      <FileText className="h-4 w-4" />
      {url.split("/").pop()}
    </a>
  );
};

export const SupportChat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPt = t.language === "pt";

  // Load quick replies
  useEffect(() => {
    if (!user) return;
    supabase
      .from("support_quick_replies")
      .select("id, question, auto_response")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => { if (data) setQuickReplies(data); });
  }, [user]);

  useEffect(() => {
    if (!user || !open) return;
    const getOrCreateChat = async () => {
      setLoading(true);
      const { data: existing } = await supabase
        .from("support_chats").select("id")
        .eq("user_id", user.id).eq("status", "open").limit(1).single();
      if (existing) {
        setChatId(existing.id);
      } else {
        const { data: created } = await supabase
          .from("support_chats").insert({ user_id: user.id }).select("id").single();
        if (created) setChatId(created.id);
      }
      setLoading(false);
    };
    getOrCreateChat();
  }, [user, open]);

  useEffect(() => {
    if (!chatId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages").select("*")
        .eq("chat_id", chatId).order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    loadMessages();
    const channel = supabase
      .channel(`support-chat-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const uploadFile = async (file: File) => {
    if (!chatId || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${chatId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file);
    if (error) { setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(path);
    await supabase.from("support_messages").insert({
      chat_id: chatId, sender_id: user.id, content: file.name,
      file_url: urlData.publicUrl, file_type: file.type,
    });
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const sendMessage = async (content?: string) => {
    const text = content || newMessage.trim();
    if (!text || !chatId || !user) return;
    await supabase.from("support_messages").insert({
      chat_id: chatId, sender_id: user.id, content: text,
    });
    if (!content) setNewMessage("");
  };

  const sendQuickReply = async (qr: QuickReply) => {
    if (!chatId || !user) return;
    // Send user's question
    await supabase.from("support_messages").insert({
      chat_id: chatId, sender_id: user.id, content: qr.question,
    });
    // Send auto-response (as "system" - using a placeholder sender_id of zeros)
    setTimeout(async () => {
      await supabase.from("support_messages").insert({
        chat_id: chatId, sender_id: "00000000-0000-0000-0000-000000000000", content: qr.auto_response,
      });
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!user) return null;

  const showQuickReplies = messages.length === 0 && quickReplies.length > 0 && !loading;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-primary text-primary-foreground", open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{isPt ? "Suporte" : "Support"}</p>
              <p className="text-xs text-muted-foreground">{isPt ? "Normalmente responde em minutos" : "Usually replies in minutes"}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && <p className="text-center text-xs text-muted-foreground">{isPt ? "Carregando..." : "Loading..."}</p>}

            {!loading && messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground pt-4">
                {isPt ? "Como podemos ajudar?" : "How can we help?"}
              </p>
            )}

            {showQuickReplies && (
              <div className="flex flex-col gap-2 pt-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => sendQuickReply(qr)}
                    className="text-left rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:border-primary/30"
                  >
                    {qr.question}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isAutoReply = msg.sender_id === "00000000-0000-0000-0000-000000000000";
              return (
                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isMe ? "bg-primary text-primary-foreground rounded-br-md"
                      : isAutoReply ? "bg-accent text-accent-foreground rounded-bl-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}>
                    {msg.file_url && msg.file_type && <FilePreview url={msg.file_url} type={msg.file_type} />}
                    {!msg.file_url && <p>{msg.content}</p>}
                    <p className={cn("mt-1 text-[10px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
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
                placeholder={isPt ? "Digite sua mensagem..." : "Type your message..."} className="text-sm" />
              <Button size="icon" onClick={() => sendMessage()} disabled={!newMessage.trim() || uploading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
