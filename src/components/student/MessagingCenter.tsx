import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  MessageSquare, Users, Star, Pin, Heart, ThumbsUp, Send, 
  Search, CheckCheck, Smile, HelpCircle, Archive, Bell, Eye, EyeOff
} from "lucide-react";
import { useToast } from "../ui/Toast";
import ChatModule from "../dashboard/ChatModule";


interface ChatThread {
  id: string;
  name: string;
  type: "direct" | "group";
  avatar: string;
  unreadCount: number;
  lastMessage: string;
  time: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isMe: boolean;
  isPinned: boolean;
  reactions: { emoji: string; count: number }[];
}

export default function MessagingCenter() {
  const { studentProfile } = useApp();
  const { success, info } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("t1");

  const [threads, setThreads] = useState<ChatThread[]>([
    { id: "t1", name: "David Kang (Mentor)", type: "direct", avatar: "D", unreadCount: 1, lastMessage: "Let's review your TypeScript module generic interfaces tomorrow.", time: "42m ago" },
    { id: "t2", name: "Vercel Hackathon Cohort #4", type: "group", avatar: "V", unreadCount: 0, lastMessage: "All solutions are deployed to production staging grids.", time: "2h ago" },
    { id: "t3", name: "Google Sponsor Relations", type: "direct", avatar: "G", unreadCount: 0, lastMessage: "Your trust score index looks extremely competitive.", time: "1d ago" }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", user: "David Kang (Mentor)", text: "Excellent work completing the Performance Profiler module inside the sandbox IDE. The syntax structures are immaculate.", time: "10:30 AM", isMe: false, isPinned: false, reactions: [{ emoji: "👍", count: 2 }, { emoji: "🔥", count: 1 }] },
    { id: "m2", user: "You", text: "Thanks David! I wrapped the generic hooks inside custom standard React 19 dependencies to suppress hydration flickers.", time: "10:34 AM", isMe: true, isPinned: false, reactions: [] },
    { id: "m3", user: "David Kang (Mentor)", text: "Let's review your TypeScript module generic interfaces tomorrow. I am pinning this spec link here: https://github.com/konexa", time: "10:45 AM", isMe: false, isPinned: true, reactions: [{ emoji: "❤️", count: 1 }] }
  ]);

  const [chatInput, setChatInput] = useState("");

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const sent: ChatMessage = {
      id: `msg_${Date.now()}`,
      user: "You",
      text: chatInput.trim(),
      time: "Just now",
      isMe: true,
      isPinned: false,
      reactions: []
    };

    setMessages(prev => [...prev, sent]);
    setChatInput("");

    // Simulate instant read indicators and updated last message in threads
    setThreads(prev => prev.map(t => t.id === selectedThreadId ? { ...t, lastMessage: sent.text, unreadCount: 0, time: "Just now" } : t));

    // Simulate automated quick response from David or group
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        user: activeThread.name,
        text: `Understood! Let's check back on the compiling logs. Feel free to ping me if the AI Workspace Advisor flags your generic props types.`,
        time: "Just now",
        isMe: false,
        isPinned: false,
        reactions: []
      };
      setMessages(prev => [...prev, autoReply]);
      setThreads(prev => prev.map(t => t.id === selectedThreadId ? { ...t, lastMessage: autoReply.text, unreadCount: 0, time: "Just now" } : t));
    }, 1500);

    success("Message Sent", "Synced to cloud relay gateway.");
  };

  const handleTogglePin = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m));
    info("Message Pin Synchronized", "Pinned specifications are logged in the sidebar panel.");
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const existing = m.reactions.find(r => r.emoji === emoji);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
          };
        } else {
          return {
            ...m,
            reactions: [...m.reactions, { emoji, count: 1 }]
          };
        }
      }
      return m;
    }));
  };

  // Filter threads by search query
  const filteredThreads = threads.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            SECURE RELAY MESSAGING
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Workspace Chat Gateway
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Realtime corporate sponsor communication loops. Backed by read indicators, reaction matrices, and pinned requirements tabs.
          </p>
        </div>
      </div>

      {/* BODY COLUMN SPLIT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Channels and Direct Message Threads Sidebar (4/12) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-4 space-y-4 shadow-xs">
          
          {/* Search channel */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat channels..."
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-black/50 rounded-xl py-2 pl-9 pr-4 text-xs font-sans focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block pl-2 mb-2">CHANNELS & DIRECT MESSAGES</span>
            {filteredThreads.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedThreadId(t.id);
                  // Mark read
                  setThreads(prev => prev.map(th => th.id === t.id ? { ...th, unreadCount: 0 } : th));
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                  selectedThreadId === t.id
                    ? "bg-neutral-900 border-neutral-900 text-white shadow-md shadow-neutral-900/10"
                    : "bg-white border-neutral-200/40 hover:border-neutral-300 text-neutral-500 hover:text-black"
                }`}
              >
                <div className="flex gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center border shrink-0 ${
                    selectedThreadId === t.id ? "bg-white/15 text-white border-white/10" : "bg-neutral-50 text-neutral-700 border-neutral-200"
                  }`}>
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{t.name}</span>
                    <span className="text-[10px] text-neutral-400 leading-normal block mt-0.5 truncate">{t.lastMessage}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] font-mono text-neutral-400 block">{t.time}</span>
                  {t.unreadCount > 0 && (
                    <span className="inline-block mt-1 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        
        {/* RIGHT COLUMN: Active Chat Frame with actions (8/12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[550px]">
          <ChatModule 
             matchId={activeThread.id} 
             counterpartName={activeThread.name} 
             counterpartRole="company" 
           />
        </div>
      </div>
    </div>
  );
}
