const fs = require('fs');
let content = fs.readFileSync('src/components/company/CompanySettingsView.tsx', 'utf8');

// Ensure Sparkles is imported
if (!content.includes('Sparkles')) {
  content = content.replace('import { \n  Building,\n  Settings,', 'import { \n  Building,\n  Settings,\n  Sparkles,');
}

// Ensure the state for checkout and the handleUpgradePlan exists, but inside the component function
if (!content.includes('const [isCheckingOut, setIsCheckingOut]')) {
  const insertIndex = content.indexOf('const handleSaveProfile = () => {');
  
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
  
  content = content.slice(0, insertIndex) + stateLogic + content.slice(insertIndex);
}

fs.writeFileSync('src/components/company/CompanySettingsView.tsx', content);
