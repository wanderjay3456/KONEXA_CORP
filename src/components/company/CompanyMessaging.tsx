import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  MessageSquare, Send, Mic, Volume2, ShieldCheck, Sparkles, Plus, 
  Trash2, Bell, Check, Clock, UserCheck, Play, Pause, ChevronRight
} from "lucide-react";
import { useToast } from "../ui/Toast";
import ChatModule from "../dashboard/ChatModule";


interface CompanyMessagingProps {
  onNavigate: (tabId: string) => void;
}

export default function CompanyMessaging({ onNavigate }: CompanyMessagingProps) {
  const { studentProfile } = useApp();
  const { success, error, info } = useToast();

  const [activeChannel, setActiveChannel] = useState<string>("alex");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Messages logs
  const [messages, setMessages] = useState<{ [key: string]: any[] }>({
    "announcements": [
      { id: "1", sender: "Corporate HR", content: "Hi team! Milestone #2 is officially live on the student dashboards.", time: "10:00 AM", isVoice: false },
      { id: "2", sender: "Lead Platform Architect", content: "Please make sure compile test suites cover React concurrent features.", time: "11:30 AM", isVoice: false }
    ],
    "alex": [
      { id: "1", sender: "Alex Rivera", content: "Hi! I completed usePerformanceProfiler. Check my sandbox compiler logs.", time: "Yesterday", isVoice: false },
      { id: "2", sender: "You", content: "Excellent! I am checking the render benchmarks now. Looks great.", time: "Yesterday", isVoice: false }
    ],
    "kaist": [
      { id: "1", sender: "Min-jun Kim", content: "I have loaded my transaction isolation buffer on the server. Code passes all lints.", time: "1 day ago", isVoice: false }
    ]
  });

  // Simulated live notifications database
  const [notifications, setNotifications] = useState([
    { id: "n1", type: "application", title: "New Candidate Submission", text: "Liam Davies submitted 'SVG draw optimizer' sandbox solution.", date: "10m ago", read: false },
    { id: "n2", type: "review", title: "Sponsor Audit Passed", text: "Vercel sandbox coordinator approved challenge specs.", date: "1h ago", read: false },
    { id: "n3", type: "project", title: "Milestone Completed", text: "Alex Rivera checked in Milestone #1 compiled package.", date: "1d ago", read: true }
  ]);

  // Voice Note simulator state
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "You",
      content: inputText,
      time: "Just now",
      isVoice: false
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg]
    }));

    setInputText("");
    success("Message Transmitted", "Direct message synced across active tunnels.");

    // Simulate typing indicator & student auto response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const studentResponse = {
        id: (Date.now() + 1).toString(),
        sender: activeChannel === "alex" ? (studentProfile?.name || "Alex Rivera") : 
                activeChannel === "kaist" ? "Min-jun Kim" : "Announcements Bot",
        content: "Understood! I will verify compile integrity logs and push the latest optimization commits shortly.",
        time: "Just now",
        isVoice: false
      };

      setMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), studentResponse]
      }));
    }, 2000);
  };

  const handleSimulateVoiceNote = () => {
    const voiceMsg = {
      id: Date.now().toString(),
      sender: "You",
      content: "Simulated Voice Note (0:12)",
      time: "Just now",
      isVoice: true,
      duration: "0:12"
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), voiceMsg]
    }));

    success("Voice Note Simulated", "Generated voice note element inside active thread.");
  };

  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    success("Notification marked read", "Operational log updated.");
  };

  const activeMessageList = messages[activeChannel] || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Workspace Communications
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Enterprise Messaging & Feed
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Coordinate with sandbox developers, monitor system announcements, and receive real-time notifications.
          </p>
        </div>
      </div>

      {/* Main Grid: Messaging (8/12) and Notifications (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Messaging pane (8/12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 h-[34rem]">
          
          {/* Side navigation for messaging directories (4/12) */}
          <div className="md:col-span-4 border-r border-neutral-100 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Messaging directory</span>
              
              {/* Directories */}
              <div className="space-y-1.5 text-xs font-semibold text-neutral-500">
                <button 
                  onClick={() => setActiveChannel("announcements")}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    activeChannel === "announcements" ? "bg-neutral-950 text-white" : "hover:bg-neutral-50"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate"># announcements</span>
                </button>

                <button 
                  onClick={() => setActiveChannel("alex")}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    activeChannel === "alex" ? "bg-neutral-950 text-white" : "hover:bg-neutral-50"
                  }`}
                >
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  <span className="truncate">{studentProfile?.name || "Alex Rivera"}</span>
                </button>

                <button 
                  onClick={() => setActiveChannel("kaist")}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    activeChannel === "kaist" ? "bg-neutral-950 text-white" : "hover:bg-neutral-50"
                  }`}
                >
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  <span className="truncate">Min-jun Kim</span>
                </button>
              </div>
            </div>
          </div>

          
          {/* Chat Interface (8/12) */}
          <div className="md:col-span-8 bg-neutral-50/50">
            {activeChannel === "announcements" ? (
               <div className="p-8 text-center text-neutral-400 font-sans text-sm h-full flex items-center justify-center">
                 Announcements channel is read-only.
               </div>
            ) : (
               <ChatModule 
                 matchId={activeChannel} 
                 counterpartName={activeChannel === "alex" ? (studentProfile?.name || "Alex Rivera") : "Min-jun Kim"} 
                 counterpartRole="student" 
               />
            )}
          </div>
          
</div>
        {/* Right System Notifications Drawer (4/12) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-neutral-900" />
              <h3 className="font-display font-bold text-sm text-neutral-900">Workspace Notifications</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">{notifications.filter(n => !n.read).length} Unread</span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-1 transition-all ${
                  notif.read ? "bg-white border-neutral-100 opacity-60" : "bg-neutral-50 border-neutral-200/60 shadow-xs"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-neutral-900 text-[11px] block">{notif.title}</span>
                    <p className="text-[11px] text-neutral-500 font-light leading-normal mt-0.5">{notif.text}</p>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-400 shrink-0">{notif.date}</span>
                </div>

                {!notif.read && (
                  <div className="flex justify-end pt-1.5">
                    <button 
                      onClick={() => handleMarkNotifRead(notif.id)}
                      className="text-[9px] font-mono font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
