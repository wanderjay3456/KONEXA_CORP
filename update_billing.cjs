const fs = require('fs');

let content = fs.readFileSync('src/components/company/CompanySettingsView.tsx', 'utf8');

// Insert new state for Stripe checkout
const stateInsert = `
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
`;

content = content.replace('const handleSaveChanges = () => {', stateInsert + '\n  const handleSaveChanges = () => {');

// Update Tab 5
const billingTabOld = `{/* Tab 5: Plan & Billing */}
        {activeTab === "billing" && (
          <div className="space-y-6 text-xs font-sans">
            <div className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold bg-teal-50 border border-teal-100 text-teal-600 px-2 py-0.5 rounded uppercase">Scale-Up Partner Plan</span>
                <h4 className="text-sm font-bold text-neutral-900 pt-1">Enterprise Talent Operating Node</h4>
                <p className="text-[10px] text-neutral-400 font-light leading-normal">Allows up to 10 active teammate seats and unlimited sandbox compiler cycles.</p>
              </div>
              <div className="text-right">
                <strong className="text-lg font-display font-black text-neutral-900">$299/month</strong>
                <p className="text-[9px] text-neutral-400 mt-0.5">Renews automatically August 2026</p>
              </div>
            </div>
          </div>
        )}`;

const billingTabNew = `{/* Tab 5: Plan & Billing */}
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
        )}`;

content = content.replace(billingTabOld, billingTabNew);

fs.writeFileSync('src/components/company/CompanySettingsView.tsx', content);
console.log('CompanySettingsView.tsx updated for billing');
