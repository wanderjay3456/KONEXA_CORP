const fs = require('fs');
let content = fs.readFileSync('src/components/company/CompanySettingsView.tsx', 'utf8');

if (!content.includes('Sparkles,')) {
  content = content.replace('Trash2, Globe, FileText', 'Trash2, Globe, FileText, Sparkles');
}

// Ensure the handleUpgradePlan has access to companyProfile and info. 
// Wait, the previous insert index might have put it outside the component function?
// Let's check where it got inserted.
