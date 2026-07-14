import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, addDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useApp } from "../../context/AppContext";
import { Send, UserCircle2, Building2 } from "lucide-react";
import { UserRole } from "../../types";

interface Message {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: any;
}

export default function ChatModule({ matchId, counterpartName, counterpartRole }: { matchId: string, counterpartName: string, counterpartRole: string }) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !currentUser) return;

    const q = query(
      collection(db, "messages"),
      where("matchId", "==", matchId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [matchId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const text = newMessage.trim();
    setNewMessage("");

    await addDoc(collection(db, "messages"), {
      matchId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      text,
      createdAt: Timestamp.now()
    });
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-3">
          {counterpartRole === UserRole.COMPANY ? (
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
              <UserCircle2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="font-sans font-bold text-sm text-neutral-900">{counterpartName}</h3>
            <span className="text-[10px] font-medium text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-neutral-300" />
            </div>
            <p className="text-sm font-medium text-neutral-500">No messages yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Start the conversation with {counterpartName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-sans shadow-sm ${
                  isMe ? 'bg-black text-white rounded-br-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 font-medium px-1">
                  {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-neutral-100">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full h-12 pl-4 pr-12 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
