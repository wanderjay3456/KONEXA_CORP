const fs = require('fs');

const fixDashboard = (file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Add text-balance to common headers
  content = content.replace(/className="font-display font-black text-(?:3xl|2xl|4xl|xl)([^"]*)"/g, 'className="font-display font-black text-2xl$1 text-balance"');
  content = content.replace(/className="text-lg font-bold([^"]*)"/g, 'className="text-lg font-bold$1 text-balance"');
  
  // Make cards look a bit more premium with better shadows and hover effects
  content = content.replace(/className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm"/g, 'className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-premium hover:shadow-card-hover transition-all duration-300"');
  content = content.replace(/className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"/g, 'className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-premium hover:shadow-card-hover transition-all duration-300"');

  fs.writeFileSync(file, content);
  console.log(file + ' updated.');
};

try { fixDashboard('src/components/dashboard/StudentDashboard.tsx'); } catch(e){}
try { fixDashboard('src/components/dashboard/CompanyDashboard.tsx'); } catch(e){}
try { fixDashboard('src/components/dashboard/AdminDashboard.tsx'); } catch(e){}
