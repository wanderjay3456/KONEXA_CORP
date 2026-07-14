const fs = require('fs');
let content = fs.readFileSync('src/components/company/CompanySettingsView.tsx', 'utf8');

// Ensure Sparkles is imported since the previous script might have missed it if Building was Building2
if (!content.includes('Sparkles')) {
  content = content.replace('import { \n  Building2', 'import { \n  Building2,\n  Sparkles');
  content = content.replace('import { \n  Building2, Sliders, MapPin, Key, CreditCard, ShieldCheck, \n  RefreshCw, Check, Plus, Trash2, Globe, FileText\n} from "lucide-react";', 
  'import { Building2, Sliders, MapPin, Key, CreditCard, ShieldCheck, RefreshCw, Check, Plus, Trash2, Globe, FileText, Sparkles } from "lucide-react";');
}

fs.writeFileSync('src/components/company/CompanySettingsView.tsx', content);
