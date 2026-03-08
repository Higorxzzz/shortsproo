import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
};

export const SupportChat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPt = t.language === "pt";

  // Get or create chat
  useEffect(() => {
    if (!user || !open) return;

    const getOrCreateChat = async () => {
      setLoading(true);
      // Check for existing open chat
      const { data: existing } = await supabase
        .from("support_chats")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .limit(1)
        .single();

      if (existing) {
        setChatId(existing.id);
      } else {
        const { data: created } = await supabase
          .from("support_chats")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (created) setChatId(created.id);
      }
      setLoading(false);
    };

    getOrCreateChat();
  }, [user, open]);

  // Load messages and subscribe to realtime
  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    loadMessages();

    const channel = supabase
      .channel(`support-chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user) return;

    await supabase.from("support_messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-primary text-primary-foreground",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isPt ? "Suporte" : "Support"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPt ? "Normalmente responde em minutos" : "Usually replies in minutes"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <p className="text-center text-xs text-muted-foreground">
                {isPt ? "Carregando..." : "Loading..."}
              </p>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground pt-8">
                {isPt
                  ? "Envie uma mensagem para iniciar o chat"
                  : "Send a message to start the chat"}
              </p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(msg.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isPt ? "Digite sua mensagem..." : "Type your message..."}
                className="text-sm"
              />
              <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
