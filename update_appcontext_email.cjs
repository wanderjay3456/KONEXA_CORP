const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const applyFuncOld = `  const applyToProject = async (projectId: string, code: string) => {
    try {
      if (!currentUser || currentUser.role !== UserRole.STUDENT) return;`;

const applyFuncNew = `  const applyToProject = async (projectId: string, code: string) => {
    try {
      if (!currentUser || currentUser.role !== UserRole.STUDENT) return;

      // Email Notification to Company (Mock via backend)
      fetch("/api/email/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "recruitment@horizon.io",
          subject: \`New Application from \${currentUser.displayName}\`,
          body: \`A new verified sandbox application was submitted by \${currentUser.displayName}.\`
        })
      }).catch(console.error);
`;

content = content.replace(applyFuncOld, applyFuncNew);

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log('AppContext.tsx updated for email notifications on apply');
