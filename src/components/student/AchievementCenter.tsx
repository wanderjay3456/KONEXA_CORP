import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Award, Star, Zap, Shield, Flame, Target, Trophy, ChevronRight, 
  CheckCircle, Plus, Sparkles, TrendingUp, HelpCircle, Gift
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function AchievementCenter() {
  const { studentProfile } = useApp();
  const { success, info } = useToast();

  const [level, setLevel] = useState(4);
  const [exp, setExp] = useState(2400);
  const [maxExp, setMaxExp] = useState(3000);

  // Leaderboard lists
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "Alexander K.", score: 98, trust: 99, level: 8, isCurrentUser: false },
    { rank: 2, name: "Minjun Kim", score: 95, trust: 94, level: 6, isCurrentUser: false },
    { rank: 3, name: "Sarah Jenkins", score: 92, trust: 92, level: 5, isCurrentUser: false },
    { rank: 4, name: "You", score: 92, trust: studentProfile?.trustScore ?? 85, level: 4, isCurrentUser: true },
    { rank: 5, name: "Ravi Patel", score: 88, trust: 81, level: 3, isCurrentUser: false }
  ]);

  const [achievements, setAchievements] = useState([
    { id: "a1", title: "Alpha Architect", desc: "Successfully resolved all generic type declarations in a single pass.", xp: "+250 EXP", unlocked: true },
    { id: "a2", title: "WebSocket Mastery", desc: "Maintained concurrency matrices without thread leakage.", xp: "+400 EXP", unlocked: true },
    { id: "a3", title: "Triple Streak Check", desc: "Checked in for 14 continuous days to activate search boosting.", xp: "+500 EXP", unlocked: false }
  ]);

  const handleClaimReward = (name: string) => {
    success("Reward Claimed!", `Successfully redeemed: "${name}". Check your student profile options for details.`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            GAMIFIED TALENT PERFORMANCE GRID
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Gamification & Badges
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Build your professional builder level. Complete code challenge sandbox reviews to accumulate EXP and unlock high-trust sponsor rewards.
          </p>
        </div>
      </div>

      {/* BODY COLUMN SPLIT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Ranks and leaderboards (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* LEVEL / EXP progress sheet */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-400 block uppercase">CURRENT PROGRESS</span>
                <span className="text-sm font-display font-black text-neutral-800">LEVEL {level} BUILDER STATUS</span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-500">{exp} / {maxExp} EXP</span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-black h-full transition-all duration-500" style={{ width: `${(exp/maxExp)*100}%` }}></div>
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal">
                Collect <strong>{maxExp - exp} more EXP</strong> to upgrade to Level 5 and increase matching weights with elite partners.
              </p>
            </div>
          </div>

          {/* Leaderboard panel */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Global Talent Leaderboard</span>
              </h3>
              <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase">RANKINGS GRID</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {leaderboard.map((usr) => (
                <div 
                  key={usr.rank} 
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    usr.isCurrentUser 
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-md shadow-neutral-950/10" 
                      : "bg-neutral-50 border-neutral-200/40 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank indicator */}
                    <span className={`w-6 text-center font-display font-black text-sm ${usr.isCurrentUser ? "text-amber-400" : "text-neutral-400"}`}>
                      #{usr.rank}
                    </span>
                    <div>
                      <span className="text-xs font-bold block">{usr.name} {usr.isCurrentUser && " (You)"}</span>
                      <span className={`text-[9px] font-mono block ${usr.isCurrentUser ? "text-neutral-400" : "text-neutral-400"}`}>
                        Level {usr.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-mono font-bold">
                    <div>
                      <span className={`text-[9px] font-mono block text-right ${usr.isCurrentUser ? "text-neutral-400" : "text-neutral-400"}`}>TRUST SCORE</span>
                      <span>{usr.trust}</span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono block text-right ${usr.isCurrentUser ? "text-neutral-400" : "text-neutral-400"}`}>PERFORMANCE</span>
                      <span className={usr.isCurrentUser ? "text-amber-400" : "text-teal-600"}>{usr.score}%</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Achievements list, rewards (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Unlocked Achievements */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Career achievements</h3>
            
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div 
                  key={ach.id} 
                  className={`p-3.5 rounded-2xl border flex gap-3 items-start transition-all ${
                    ach.unlocked 
                      ? "bg-neutral-50/50 border-neutral-200/50 text-neutral-700" 
                      : "bg-white border-neutral-200 text-neutral-400 opacity-60"
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${ach.unlocked ? "bg-teal-50 text-teal-600 border border-teal-100" : "bg-neutral-50 text-neutral-300"}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-800">{ach.title}</span>
                      <span className="text-[9px] font-mono text-neutral-400">{ach.xp}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal font-light">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamified Rewards Redeem Grid */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex gap-2 items-center text-xs font-bold text-neutral-900">
              <Gift className="w-4 h-4 text-neutral-400" />
              <span>Redeem Payout Rewards</span>
            </div>

            <div className="space-y-3">
              {[
                { name: "Verified sponsor check-in boosting", cost: "500 EXP", available: true },
                { name: "Skip algorithms round pre-audit", cost: "1,200 EXP", available: true },
                { name: "1-on-1 Senior Architect consultation", cost: "2,000 EXP", available: false }
              ].map((reward, i) => (
                <div key={i} className="p-3 bg-neutral-50 border border-neutral-200/40 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block leading-normal">{reward.name}</span>
                      <span className="text-[9px] text-neutral-400 font-mono mt-0.5 block">COST: {reward.cost}</span>
                    </div>
                  </div>
                  <button 
                    disabled={!reward.available}
                    onClick={() => handleClaimReward(reward.name)}
                    className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold text-center cursor-pointer ${
                      reward.available 
                        ? "bg-neutral-900 hover:bg-black text-white" 
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    <span>{reward.available ? "Redeem reward" : "Locked"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
