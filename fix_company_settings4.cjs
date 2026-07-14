const fs = require('fs');
let content = fs.readFileSync('src/components/company/CompanySettingsView.tsx', 'utf8');

if (!content.includes('Sparkles,')) {
  content = content.replace('Trash2, Globe, FileText', 'Trash2, Globe, FileText, Sparkles');
}

// Remove the state logic from the end
const stateLogicStart = '  const [isCheckingOut, setIsCheckingOut] = useState(false);';
const endIdx = content.indexOf(stateLogicStart);
if (endIdx !== -1) {
  content = content.slice(0, endIdx);
}

const stateLogic = `
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

content = content.replace('const handleSaveGeneral = () => {', stateLogic + '\n  const handleSaveGeneral = () => {');

fs.writeFileSync('src/components/company/CompanySettingsView.tsx', content);
