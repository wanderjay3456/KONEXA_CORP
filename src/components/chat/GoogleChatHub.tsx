import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";
import { 
  googleSignIn, 
  googleLogout, 
  getAccessToken, 
  initGoogleAuth 
} from "../../config/googleAuth";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  Database, 
  CheckCircle, 
  RefreshCw,
  LogOut,
  Info,
  Check,
  AlertTriangle,
  Video,
  Calendar,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GoogleChatSpace {
  name: string;
  displayName: string;
  spaceType: string;
  singleUserSpaceOnly?: boolean;
}

interface GoogleChatMessage {
  name?: string;
  sender: {
    displayName: string;
    email?: string;
  };
  text: string;
  createTime: string;
}

export default function GoogleChatHub() {
  const { currentUser } = useApp();
  const { success, error: toastError, info } = useToast();

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // API Data States
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [activeSpace, setActiveSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Input & Modal States
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Create Space States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState("SPACE");
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Safety Confirmation Dialogs (Mandatory for mutating user data)
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(true); // Default to prompt user for safety

  // Google Meet States
  const [meetSpaces, setMeetSpaces] = useState<any[]>([
    {
      name: "spaces/sim_meet_vercel",
      meetingUri: "https://meet.google.com/qwe-asdf-zxc",
      displayName: "Vercel Design Sync with Alex",
      createTime: new Date(Date.now() - 1800000).toISOString()
    }
  ]);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [showMeetConfirm, setShowMeetConfirm] = useState(false);

  // Fallback Simulation State
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated Channels (Premium Fallback)
  const SIMULATED_SPACES: GoogleChatSpace[] = [
    { name: "spaces/sim_sponsors", displayName: "#sponsors-executive-lounge", spaceType: "SPACE" },
    { name: "spaces/sim_vercel", displayName: "#vercel-edge-performance", spaceType: "SPACE" },
    { name: "spaces/sim_horizon", displayName: "#horizon-labs-interns", spaceType: "SPACE" },
    { name: "spaces/sim_feedback", displayName: "#konexa-general-feedback", spaceType: "SPACE" }
  ];

  const SIMULATED_MESSAGES: Record<string, GoogleChatMessage[]> = {
    "spaces/sim_sponsors": [
      { sender: { displayName: "Sarah Jenkins (Vercel Partner)" }, text: "Hey Alex! Your performance profiler solution looks incredible. We are reviewing the SVG visualization tree code now.", createTime: new Date(Date.now() - 3600000 * 2).toISOString() },
      { sender: { displayName: "Konexa Autonomous Agent" }, text: "Verified Matchmaking Telemetry: Student Alex Rivera has been prioritized in Vercel's active talent pool.", createTime: new Date(Date.now() - 3600000).toISOString() },
      { sender: { displayName: "Sarah Jenkins (Vercel Partner)" }, text: "Let's schedule a call this Wednesday to talk about fast-track contractor roles.", createTime: new Date(Date.now() - 1800000).toISOString() }
    ],
    "spaces/sim_vercel": [
      { sender: { displayName: "System Monitor" }, text: "Sandbox Node #12 connected. Live build telemetry active.", createTime: new Date(Date.now() - 7200000).toISOString() },
      { sender: { displayName: "Sarah Jenkins (Vercel Partner)" }, text: "Ensure your usePerformanceProfiler hook has clean garbage collection. We're testing memory leaks.", createTime: new Date(Date.now() - 3600000).toISOString() }
    ],
    "spaces/sim_horizon": [
      { sender: { displayName: "VP of Engineering (Horizon Labs)" }, text: "Welcome to Horizon's Google Chat workspace channel! Use this space to coordinate challenge specs directly with our team.", createTime: new Date(Date.now() - 86400000).toISOString() }
    ],
    "spaces/sim_feedback": [
      { sender: { displayName: "Alex Rivera" }, text: "Super excited to solve the SaaS integration challenges on KONEXA!", createTime: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  // Initialize Auth State Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
        setIsAuthenticated(true);
        setIsSimulationMode(false);
        success("Google Auth Connected", "Google Chat workspace integrated successfully!");
        fetchSpaces(cachedToken);
      },
      () => {
        // Fall back to simulation mode by default for robust experience
        setIsSimulationMode(true);
        setSpaces(SIMULATED_SPACES);
        setActiveSpace(SIMULATED_SPACES[0]);
        setMessages(SIMULATED_MESSAGES["spaces/sim_sponsors"]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spaces using the Google Chat API
  const fetchSpaces = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error(`Google Chat API returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.spaces && data.spaces.length > 0) {
        setSpaces(data.spaces);
        setActiveSpace(data.spaces[0]);
        fetchMessages(data.spaces[0].name, accessToken);
      } else {
        // Connected but no spaces found, fall back to offering space creation
        setSpaces([]);
        info("No active spaces found", "You can create a new space to begin collaborating.");
      }
    } catch (err: any) {
      console.warn("API list spaces failed. Falling back to simulated environment:", err.message);
      setIsSimulationMode(true);
      setSpaces(SIMULATED_SPACES);
      setActiveSpace(SIMULATED_SPACES[0]);
      setMessages(SIMULATED_MESSAGES["spaces/sim_sponsors"]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages in active space
  const fetchMessages = async (spaceName: string, accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      console.warn("Failed to fetch Google Chat messages:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle SignIn
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        setIsAuthenticated(true);
        setIsSimulationMode(false);
        success("Google Signed In", `Welcome ${result.user.displayName || "Developer"}!`);
        fetchSpaces(result.accessToken);
      }
    } catch (err: any) {
      toastError("Google Auth Failed", err.message || "Unable to authorize Google Chat.");
      // Keep simulation active
      setIsSimulationMode(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setIsAuthenticated(false);
    setGoogleUser(null);
    setToken(null);
    setIsSimulationMode(true);
    setSpaces(SIMULATED_SPACES);
    setActiveSpace(SIMULATED_SPACES[0]);
    setMessages(SIMULATED_MESSAGES["spaces/sim_sponsors"]);
    success("Google Disconnected", "Switched back to secure sandbox simulation.");
  };

  // Mutating Action 1: Create a Space (requires confirmation)
  const triggerCreateSpace = () => {
    if (!newSpaceName.trim()) {
      info("Validation Error", "Please provide a space display name.");
      return;
    }
    if (confirmToggle) {
      setShowCreateConfirm(true);
    } else {
      executeCreateSpace();
    }
  };

  const executeCreateSpace = async () => {
    setShowCreateConfirm(false);
    setIsCreatingSpace(true);
    
    if (isSimulationMode) {
      // Simulate creation
      setTimeout(() => {
        const simId = `spaces/sim_user_${Date.now()}`;
        const newSpace: GoogleChatSpace = {
          name: simId,
          displayName: `#${newSpaceName.toLowerCase().replace(/\s+/g, "-")}`,
          spaceType: newSpaceType
        };
        setSpaces(prev => [...prev, newSpace]);
        setActiveSpace(newSpace);
        setMessages([{
          sender: { displayName: currentUser?.displayName || "Alex Rivera" },
          text: `Workspace channel ${newSpace.displayName} successfully established. Sponsoring organizations can join now.`,
          createTime: new Date().toISOString()
        }]);
        setIsCreatingSpace(false);
        setIsCreateModalOpen(false);
        setNewSpaceName("");
        success("Simulated Space Created", `Channel "${newSpace.displayName}" is now ready!`);
      }, 800);
      return;
    }

    // Real API Call
    try {
      const accessToken = token || await getAccessToken();
      if (!accessToken) throw new Error("No Google access token found.");

      const response = await fetch("https://chat.googleapis.com/v1/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: newSpaceName,
          spaceType: newSpaceType
        })
      });

      if (!response.ok) {
        throw new Error(`Google Chat API rejected space creation: ${response.status}`);
      }

      const created = await response.json();
      success("Space Created!", `Google Chat space "${newSpaceName}" successfully created!`);
      
      // Refresh list
      fetchSpaces(accessToken);
      setIsCreateModalOpen(false);
      setNewSpaceName("");
    } catch (err: any) {
      toastError("API Space Creation Failed", err.message || "Verify your Workspace credentials.");
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Google Meet Spaces Creation & Actions (Mandatory safety patterns)
  const triggerCreateMeet = () => {
    if (!newMeetTitle.trim()) {
      toastError("Validation Error", "Please provide a title for the video conference.");
      return;
    }
    if (confirmToggle) {
      setShowMeetConfirm(true);
    } else {
      executeCreateMeet();
    }
  };

  const executeCreateMeet = async () => {
    setShowMeetConfirm(false);
    setIsCreatingMeet(true);

    const title = newMeetTitle.trim();

    if (isSimulationMode) {
      setTimeout(() => {
        const randomId = Math.random().toString(36).substring(2, 5) + "-" + 
                         Math.random().toString(36).substring(2, 6) + "-" + 
                         Math.random().toString(36).substring(2, 5);
        const meetingUri = `https://meet.google.com/${randomId}`;
        const newSpace = {
          name: `spaces/sim_${randomId}`,
          meetingUri,
          displayName: title,
          createTime: new Date().toISOString()
        };

        setMeetSpaces(prev => [newSpace, ...prev]);

        // Post a stylized meet card in the current active space if available
        if (activeSpace) {
          const meetMsg: GoogleChatMessage = {
            sender: { displayName: currentUser?.displayName || "Alex Rivera" },
            text: `🎥 [Google Meet Space Created] Room: "${title}". Click to join: ${meetingUri}`,
            createTime: new Date().toISOString()
          };
          setMessages(prev => [...prev, meetMsg]);

          // Trigger simulated reply from sponsor
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: { displayName: activeSpace.name === "spaces/sim_sponsors" ? "Sarah Jenkins (Vercel Partner)" : "Sponsor Copilot" },
              text: `Thanks for generating the Meet link! I will join the video conference "${title}" right away to sync.`,
              createTime: new Date().toISOString()
            }]);
          }, 2000);
        }

        setIsMeetModalOpen(false);
        setNewMeetTitle("");
        setIsCreatingMeet(false);
        success("Google Meet Configured", `Created meeting space: "${title}" successfully!`);
      }, 1000);
      return;
    }

    // Real API Call for Google Meet
    try {
      const accessToken = token || await getAccessToken();
      if (!accessToken) throw new Error("No Google OAuth credentials found.");

      const response = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Google Meet API rejected space creation: ${response.status}`);
      }

      const data = await response.json();
      const meetingUri = data.meetingUri || `https://meet.google.com/${data.name.split("/").pop()}`;

      const newSpace = {
        name: data.name,
        meetingUri,
        displayName: title,
        createTime: new Date().toISOString()
      };

      setMeetSpaces(prev => [newSpace, ...prev]);

      // If active space on Google Chat is selected, post a message there with the link
      if (activeSpace) {
        const msgText = `🎥 [Google Meet Space Created] Room: "${title}". Click to join: ${meetingUri}`;
        
        await fetch(`https://chat.googleapis.com/v1/${activeSpace.name}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: msgText })
        });

        // Refresh messages
        fetchMessages(activeSpace.name, accessToken);
      }

      setIsMeetModalOpen(false);
      setNewMeetTitle("");
      success("Google Meet Configured", `Meeting space created on Google servers: "${title}"`);
    } catch (err: any) {
      toastError("Google Meet Creation Failed", err.message);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Mutating Action 2: Send Message (requires confirmation)
  const triggerSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeSpace) return;
    
    if (confirmToggle) {
      setShowSendConfirm(true);
    } else {
      executeSendMessage();
    }
  };

  const executeSendMessage = async () => {
    setShowSendConfirm(false);
    if (!newMessageText.trim() || !activeSpace) return;

    setIsSending(true);

    if (isSimulationMode) {
      const spaceName = activeSpace.name;
      const myMsg: GoogleChatMessage = {
        sender: { displayName: currentUser?.displayName || "Alex Rivera" },
        text: newMessageText,
        createTime: new Date().toISOString()
      };

      // Add to local UI immediately
      setMessages(prev => [...prev, myMsg]);
      setNewMessageText("");
      setIsSending(false);

      // Trigger automatic Sponsor/AI agent response simulation!
      setTimeout(() => {
        let replyText = "Understood. The Sandbox telemetry agent is evaluating this context.";
        if (spaceName === "spaces/sim_sponsors") {
          replyText = `Excellent solution approach, Alex. We noticed you used a clean React Context pattern. Let's schedule our Google Calendar sync.`;
        } else if (spaceName === "spaces/sim_vercel") {
          replyText = "Vercel edge telemetry check complete. 0 memory leaks identified in your active sandbox hooks.";
        } else if (spaceName === "spaces/sim_horizon") {
          replyText = "Horizon Core: Challenge milestones verified. Let's sync on details.";
        }
        
        setMessages(prev => [...prev, {
          sender: { displayName: spaceName === "spaces/sim_sponsors" ? "Sarah Jenkins (Vercel Partner)" : "Sponsor Copilot" },
          text: replyText,
          createTime: new Date().toISOString()
        }]);
      }, 1500);
      return;
    }

    // Real API Call to send message to Google Chat Space
    try {
      const accessToken = token || await getAccessToken();
      if (!accessToken) throw new Error("No Google OAuth credentials found.");

      const response = await fetch(`https://chat.googleapis.com/v1/${activeSpace.name}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: newMessageText
        })
      });

      if (!response.ok) {
        throw new Error(`Google Chat API rejected message: ${response.status}`);
      }

      setNewMessageText("");
      // Refresh messages
      fetchMessages(activeSpace.name, accessToken);
    } catch (err: any) {
      toastError("Message Delivery Failed", err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSpaceChange = (space: GoogleChatSpace) => {
    setActiveSpace(space);
    if (isSimulationMode) {
      setMessages(SIMULATED_MESSAGES[space.name] || []);
    } else if (token) {
      fetchMessages(space.name, token);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-neutral-50 overflow-hidden">
      {/* 1. Header connection stripe */}
      <div className="px-6 py-4 bg-white border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 z-10 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            Google Workspace integration
          </span>
          <h2 className="font-display font-bold text-2xl text-neutral-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-black" />
            <span>Google Chat Hub</span>
          </h2>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Coordinate design specs, receive corporate interview offers, and interface with live sandbox team workspaces.
          </p>
        </div>

        {/* Connection Widget */}
        <div className="flex items-center gap-3">
          {isAuthenticated && googleUser ? (
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-2.5 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden border border-neutral-300">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName || ""} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-xs text-neutral-600">
                    {googleUser.displayName?.charAt(0) || "G"}
                  </div>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-neutral-800 block leading-none">
                  {googleUser.displayName}
                </span>
                <span className="text-[9px] text-teal-600 font-mono block mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> Real Google Chat Active
                </span>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="Disconnect Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 hidden md:inline">Using sandbox simulation</span>
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 rounded-xl font-sans text-xs font-bold text-neutral-700 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>{isAuthenticating ? "Connecting..." : "Connect Google Chat"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Spaces list */}
        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                Active Spaces ({spaces.length})
              </span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                title="Create Workspace Space"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2 pt-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <div className="p-6 text-center text-neutral-400 space-y-2">
                <Info className="w-6 h-6 text-neutral-300 mx-auto" />
                <p className="text-xs">No collaborative Google Chat spaces found in your workspace org.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold"
                >
                  Create Channel
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {spaces.map((space) => {
                  const isActive = activeSpace?.name === space.name;
                  return (
                    <button
                      key={space.name}
                      onClick={() => handleSpaceChange(space)}
                      className={`w-full px-3.5 py-3 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        isActive 
                          ? "bg-black text-white shadow-sm" 
                          : "hover:bg-neutral-50 text-neutral-600"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isActive ? "bg-white/10 border-white/10" : "bg-neutral-50 border-neutral-200"
                      }`}>
                        <Users className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate leading-tight">
                          {space.displayName || space.name.split("/").pop()}
                        </span>
                        <span className={`text-[9px] font-mono block mt-0.5 ${isActive ? "text-neutral-300" : "text-neutral-400"}`}>
                          {space.spaceType || "SPACE"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connection status sidebar footer */}
          <div className="p-4 bg-neutral-50/80 border-t border-neutral-100 space-y-3 shrink-0">
            {isSimulationMode && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl text-amber-800 text-[10px] leading-relaxed">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Sandbox Mode Active</span>
                </div>
                <p className="mt-1 font-light">Showing local interactive team channels. Click 'Connect Google Chat' to auth real Google Chat API.</p>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5 font-bold">
                <Database className="w-3.5 h-3.5 text-neutral-400" /> System Integration
              </span>
              <span className="text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Connected
              </span>
            </div>
          </div>
        </div>

        {/* Right pane: Active Messages Thread */}
        <div className="flex-1 flex flex-col justify-between bg-white relative overflow-hidden">
          
          {/* Active Space Banner */}
          {activeSpace ? (
            <div className="px-6 py-3 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <h4 className="font-display font-bold text-sm text-neutral-800 leading-tight">
                    {activeSpace.displayName || activeSpace.name.split("/").pop()}
                  </h4>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mt-0.5">
                    {isSimulationMode ? "Verified Sandbox Relay" : "Real Google Space"} • ID: {activeSpace.name}
                  </span>
                </div>
              </div>

              {/* Actions & Settings Row */}
              <div className="flex items-center gap-4">
                {/* Google Meet Launcher */}
                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(true)}
                  className="h-9 px-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                  title="Establish live Google Meet sync room"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Launch Meet Sync</span>
                </button>

                {/* Safety Toggler (Aesthetic + functional) */}
                <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-neutral-400 cursor-pointer select-none flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={confirmToggle}
                    onChange={(e) => setConfirmToggle(e.target.checked)}
                    className="rounded border-neutral-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Require Safety Dialogs</span>
                </label>
              </div>
            </div>
          </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-400">
              <div>
                <MessageSquare className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-semibold">Select a workspace space to begin communication</p>
              </div>
            </div>
          )}

          {/* Message log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-neutral-400">
                <div className="space-y-1">
                  <MessageSquare className="w-8 h-8 text-neutral-200 mx-auto" />
                  <p className="text-xs">No communications posted yet. Write a message below!</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender.displayName === (currentUser?.displayName || "Alex Rivera");
                return (
                  <div key={i} className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-display font-bold ${
                      isMe 
                        ? "bg-black text-white border-neutral-800" 
                        : "bg-neutral-50 text-neutral-600 border-neutral-200"
                    }`}>
                      {msg.sender.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "justify-end" : ""}`}>
                        <span className="text-xs font-bold text-neutral-700">{msg.sender.displayName}</span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {new Date(msg.createTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
                        </span>
                      </div>
                      {msg.text.includes("🎥 [Google Meet Space Created]") ? (() => {
                        // Extract meeting title and URI
                        const titleMatch = msg.text.match(/Room: "([^"]+)"/);
                        const uriMatch = msg.text.match(/join: (https:\/\/meet\.google\.com\/[a-z0-9-]+)/);
                        const roomTitle = titleMatch ? titleMatch[1] : "Live Video Interview";
                        const meetingUri = uriMatch ? uriMatch[1] : "https://meet.google.com";

                        return (
                          <div className="bg-neutral-950 text-white rounded-3xl border border-neutral-800 p-5 space-y-4 max-w-sm shadow-xl font-sans mt-1">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                Google Meet Live Room
                              </span>
                              <Calendar className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div>
                              <h5 className="font-display font-bold text-xs text-neutral-100">{roomTitle}</h5>
                              <p className="text-[10px] text-neutral-400 mt-1 font-light leading-relaxed">
                                Sponsoring partners and student developers can synchronize on requirements and codebase walkthroughs in this room.
                              </p>
                            </div>
                            <a
                              href={meetingUri}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meet Conference</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      })() : (
                        <div className={`p-4 rounded-2xl text-xs font-sans leading-relaxed ${
                          isMe 
                            ? "bg-black text-white rounded-tr-none" 
                            : "bg-neutral-50 border border-neutral-200/50 text-neutral-700 rounded-tl-none font-light"
                        }`}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form container */}
          {activeSpace && (
            <form onSubmit={triggerSendMessage} className="p-4 border-t border-neutral-100 bg-white flex gap-3 items-center shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={`Type message to ${activeSpace.displayName || "Google Chat"}...`}
                className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-sans focus:outline-hidden focus:border-black/60 focus:bg-white transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={isSending || !newMessageText.trim()}
                className="w-11 h-11 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Mutating Action Confirmation 1: Send Message (Safety Requirement) */}
          <AnimatePresence>
            {showSendConfirm && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-neutral-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-center"
                >
                  <div className="w-12 h-12 bg-teal-50 border border-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base text-neutral-900">Confirm Message Transmission</h4>
                    <p className="font-sans text-xs text-neutral-400 mt-2 leading-relaxed">
                      You are about to transmit a message to the verified Google Chat space <strong>{activeSpace?.displayName}</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl text-left border border-neutral-100 text-xs font-mono text-neutral-600 italic">
                    "{newMessageText}"
                  </div>

                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => setShowSendConfirm(false)}
                      className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeSendMessage}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/10"
                    >
                      Verify & Send
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Mutating Action Confirmation 2: Create Space (Safety Requirement) */}
          <AnimatePresence>
            {isCreateModalOpen && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-neutral-200 p-6 max-w-md w-full shadow-2xl space-y-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-black text-lg text-neutral-900">Establish Workspace Channel</h4>
                      <p className="font-sans text-xs text-neutral-400 mt-0.5">Define metadata for the collaborative space.</p>
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Space Display Name</label>
                      <input
                        type="text"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder="e.g. vercel-edge-performance"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-black/60 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Space Type</label>
                      <select
                        value={newSpaceType}
                        onChange={(e) => setNewSpaceType(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-600 focus:outline-hidden focus:border-black/60"
                      >
                        <option value="SPACE">Collaborative Team Space (SPACE)</option>
                        <option value="GROUP_CHAT">Ad-hoc Group Chat (GROUP_CHAT)</option>
                      </select>
                    </div>
                  </div>

                  {/* Explicit Confirmation check inside modal */}
                  {showCreateConfirm ? (
                    <div className="p-3 bg-teal-50 border border-teal-100 text-teal-800 text-xs rounded-xl flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-150">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Security Consent Required:</span>
                        <p className="mt-0.5 font-light">Confirming that you authorize establishing a workspace space named <strong>#{newSpaceName}</strong> on Google Chat on behalf of your profile credentials.</p>
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => setShowCreateConfirm(false)}
                            className="px-2.5 py-1 bg-white text-teal-800 border border-teal-200 rounded-lg text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={executeCreateSpace}
                            className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            Yes, Create Space
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={triggerCreateSpace}
                        disabled={isCreatingSpace || !newSpaceName.trim()}
                        className="px-5 py-2 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                      >
                        {isCreatingSpace ? "Creating..." : "Establish Channel"}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Google Meet Space Setup Modal (Mandatory safety patterns) */}
          <AnimatePresence>
            {isMeetModalOpen && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-neutral-200 p-6 max-w-md w-full shadow-2xl space-y-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-black text-lg text-neutral-900">Configure Google Meet</h4>
                      <p className="font-sans text-xs text-neutral-400 mt-0.5">Initialize a secure, encrypted video conference.</p>
                    </div>
                    <button
                      onClick={() => setIsMeetModalOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Meeting Room Title</label>
                      <input
                        type="text"
                        value={newMeetTitle}
                        onChange={(e) => setNewMeetTitle(e.target.value)}
                        placeholder="e.g. Vercel Contract fast-track Review"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-black/60 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Safety & Consent checklist block */}
                  {showMeetConfirm ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-150">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Security Consent Required:</span>
                        <p className="mt-0.5 font-light">Confirming that you authorize establishing a Google Meet conference space named <strong>"{newMeetTitle}"</strong>. Sponsoring team members will be allowed to join immediately.</p>
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => setShowMeetConfirm(false)}
                            className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-200 rounded-lg text-[10px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={executeCreateMeet}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            Yes, Create Room
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setIsMeetModalOpen(false)}
                        className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={triggerCreateMeet}
                        disabled={isCreatingMeet || !newMeetTitle.trim()}
                        className="px-5 py-2 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                      >
                        {isCreatingMeet ? "Creating Room..." : "Initialize Room"}
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
