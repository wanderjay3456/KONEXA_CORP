const fs = require('fs');

const fixOnboarding = (file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Add text-balance to common headers
  content = content.replace(/className="font-display font-black text-2xl([^"]*)"/g, 'className="font-display font-black text-2xl$1 text-balance"');
  content = content.replace(/className="text-lg font-bold([^"]*)"/g, 'className="text-lg font-bold$1 text-balance"');
  
  // Update card shadows
  content = content.replace(/className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm"/g, 'className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-premium hover:shadow-card-hover transition-all duration-300"');
  content = content.replace(/className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"/g, 'className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-premium hover:shadow-card-hover transition-all duration-300"');
  
  // Make inputs use focus-ring
  content = content.replace(/focus:border-black\/50/g, 'focus-ring');

  fs.writeFileSync(file, content);
  console.log(file + ' updated.');
};

try { fixOnboarding('src/components/onboarding/StudentOnboarding.tsx'); } catch(e){}
try { fixOnboarding('src/components/onboarding/CompanyOnboarding.tsx'); } catch(e){}
