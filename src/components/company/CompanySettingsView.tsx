import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Building2, Sliders, MapPin, Key, CreditCard, ShieldCheck, 
  RefreshCw, Check, Plus, Trash2, Globe, FileText, Sparkles
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function CompanySettingsView() {
  const { companyProfile, updateCompanyProfile } = useApp();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<"general" | "preferences" | "offices" | "security" | "billing">("general");

  // General Settings
  const [name, setName] = useState(companyProfile?.companyName || "Horizon Labs");
  const [description, setDescription] = useState("Pioneering low-latency full-stack layouts and web vital optimizations.");
  const [size, setSize] = useState("50-200 Employees");
  const [industry, setIndustry] = useState("SaaS Technology");
  const [website, setWebsite] = useState("https://horizonlabs.io");

  // Hiring Preferences Defaults
  const [defaultCompensation, setDefaultCompensation] = useState("$2,500");
  const [minTrustScore, setMinTrustScore] = useState(75);
  const [allowRemote, setAllowRemote] = useState(true);

  // Offices state
  const [offices, setOffices] = useState([
    { id: "o1", city: "Seoul", address: "Gangnam-daero 465, Seocho-gu", role: "HQ" },
    { id: "o2", city: "San Francisco", address: "548 Market St, SF, CA", role: "R&D Lab" }
  ]);
  const [newCity, setNewCity] = useState("");
  const [newAddr, setNewAddr] = useState("");

  // Security tokens state
  const [apiKey, setApiKey] = useState("konexa_live_sandbox_key_a88b90c1f2e3");

  
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpgradePlan = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium", companyId: companyProfile?.uid || "mock" })
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to checkout
      }
    } catch (err: any) {
      info("Billing Error", err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSaveGeneral = () => {
    updateCompanyProfile({
      companyName: name
    });
    success("Profile Updated", "Horizon corporate profile changes synced to active directories.");
  };

  const handleSavePreferences = () => {
    success("Vetting Preference Locked", "Standard evaluation parameters updated.");
  };

  const handleAddOffice = () => {
    if (!newCity.trim() || !newAddr.trim()) return;
    setOffices(prev => [
      ...prev,
      { id: Date.now().toString(), city: newCity, address: newAddr, role: "Branch office" }
    ]);
    setNewCity("");
    setNewAddr("");
    success("Office Coordinates Logged", "New regional division saved successfully.");
  };

  const handleRemoveOffice = (id: string, city: string) => {
    setOffices(prev => prev.filter(o => o.id !== id));
    success("Office Removed", `Archived office records for: ${city}`);
  };

  const handleRotateKey = () => {
    const randomizedKey = `konexa_live_sandbox_key_${Math.random().toString(16).substring(2, 14)}`;
    setApiKey(randomizedKey);
    success("Sandbox API Token Rotated", "Dispatched updated token. Re-configure local compilers immediately.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            System Registry
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Enterprise Settings Panel
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Configure partner profile parameters, lock default evaluation preferences, add office divisions, and manage keys.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-px">
        {[
          { id: "general", label: "General Profile", icon: Building2 },
          { id: "preferences", label: "Vetting Standards", icon: Sliders },
          { id: "offices", label: "Offices & Regions", icon: MapPin },
          { id: "security", label: "Security & Keys", icon: Key },
          { id: "billing", label: "Plan & Billing", icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Sheets */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs">
        
        {/* Tab 1: General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Company Legal Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Corporate URL Website</label>
                <input 
                  type="text" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Industry Sector</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Staff Organization Size</label>
                <input 
                  type="text" 
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-neutral-700 block">Short Mission / Bio Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button 
                onClick={handleSaveGeneral}
                className="h-10 px-6 bg-black text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors hover:bg-neutral-800"
              >
                Save Profile Coordinates
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Hiring preferences */}
        {activeTab === "preferences" && (
          <div className="space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Default Challenge Reward</label>
                <input 
                  type="text" 
                  value={defaultCompensation}
                  onChange={(e) => setDefaultCompensation(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Minimum Sandbox Trust Benchmark</label>
                <input 
                  type="number" 
                  value={minTrustScore}
                  onChange={(e) => setMinTrustScore(Number(e.target.value))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-neutral-800 block">Allow Global Remote Applicants</span>
                    <p className="text-[10px] text-neutral-400 font-light">Directly exposes challenges to verified students across SNU, KAIST, and NUS.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={allowRemote}
                    onChange={(e) => setAllowRemote(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button 
                onClick={handleSavePreferences}
                className="h-10 px-6 bg-black text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Offices */}
        {activeTab === "offices" && (
          <div className="space-y-6 text-xs font-sans">
            <span className="font-bold text-neutral-800 block">Corporate Office Locations</span>
            <div className="space-y-3">
              {offices.map(o => (
                <div key={o.id} className="p-4 border border-neutral-200 rounded-2xl bg-neutral-50/50 flex justify-between items-center">
                  <div className="space-y-1">
                    <strong className="text-xs font-bold text-neutral-800">{o.city} ({o.role})</strong>
                    <p className="text-[10px] text-neutral-400 font-mono">{o.address}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveOffice(o.id, o.city)}
                    className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Office Form */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              <span className="font-bold text-neutral-800 block">Add New Office Branch</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 focus:outline-hidden"
                />
                <input 
                  type="text" 
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  placeholder="e.g. 548 Market St, SF, CA"
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 focus:outline-hidden"
                />
              </div>
              <button 
                onClick={handleAddOffice}
                className="h-10 px-4 bg-neutral-950 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Office branch</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === "security" && (
          <div className="space-y-6 text-xs font-sans leading-relaxed">
            <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl text-amber-800 flex gap-3 items-start">
              <Key className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="font-light text-[11px] leading-relaxed">
                <strong>Sandbox Integration Keys</strong>. These tokens are used to authorize local IDE compiler agents when compiling and stress-testing candidates code packages. Rotate tokens periodically.
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-neutral-700 block">Sandbox Developer API Key</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={apiKey}
                  className="flex-1 h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-mono select-all focus:outline-hidden text-neutral-500"
                />
                <button 
                  onClick={handleRotateKey}
                  className="h-11 px-4 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Rotate key</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Plan & Billing */}
        {activeTab === "billing" && (
          <div className="space-y-6 text-xs font-sans">
            <div className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold bg-teal-50 border border-teal-100 text-teal-600 px-2 py-0.5 rounded uppercase">Basic Plan</span>
                <h4 className="text-sm font-bold text-neutral-900 pt-1">Free Tier</h4>
                <p className="text-[10px] text-neutral-400 font-light leading-normal">Limited candidate profiles and basic matching algorithms.</p>
              </div>
              <div className="text-right">
                <strong className="text-lg font-display font-black text-neutral-900">Free</strong>
              </div>
            </div>

            <div className="p-6 border border-emerald-200 rounded-2xl bg-emerald-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
              <div className="space-y-2 z-10 relative">
                <span className="text-[9px] font-mono font-bold bg-amber-100 border border-amber-200 text-amber-700 px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit">
                  <Sparkles className="w-3 h-3" />
                  Premium Upgrade
                </span>
                <h4 className="text-base font-bold text-emerald-900 pt-1">Pro AI Matchmaker Plan</h4>
                <p className="text-xs text-emerald-700 font-light leading-relaxed max-w-md">Unlock full access to unlimited candidate contacts, premium AI-driven matching reports, and verified sandbox evaluation grids.</p>
              </div>
              <div className="text-right z-10 relative flex flex-col items-end">
                <strong className="text-xl font-display font-black text-emerald-900">$299<span className="text-sm font-sans text-emerald-700 font-normal">/month</span></strong>
                <button 
                  onClick={handleUpgradePlan}
                  disabled={isCheckingOut}
                  className="mt-3 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isCheckingOut ? "Connecting Stripe..." : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
