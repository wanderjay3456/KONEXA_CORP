const fs = require('fs');

let content = fs.readFileSync('src/components/company/CompanyMessaging.tsx', 'utf8');

const importChatModule = `import ChatModule from "../dashboard/ChatModule";\n`;

content = content.replace('import { useToast } from "../ui/Toast";', 'import { useToast } from "../ui/Toast";\n' + importChatModule);

// Find the section corresponding to the chat interface.
const chatSectionStart = '{/* Chat Interface (8/12) */}';
const chatSectionEnd = '{/* Right System Notifications Drawer (4/12) */}';

const newChatSection = `
          {/* Chat Interface (8/12) */}
          <div className="md:col-span-8 bg-neutral-50/50">
            {activeChannel === "announcements" ? (
               <div className="p-8 text-center text-neutral-400 font-sans text-sm h-full flex items-center justify-center">
                 Announcements channel is read-only.
               </div>
            ) : (
               <ChatModule 
                 matchId={activeChannel} 
                 counterpartName={activeChannel === "alex" ? (studentProfile?.name || "Alex Rivera") : "Min-jun Kim"} 
                 counterpartRole="student" 
               />
            )}
          </div>
          
`;

const startIndex = content.indexOf(chatSectionStart);
const endIndex = content.indexOf(chatSectionEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newChatSection + content.slice(endIndex);
  fs.writeFileSync('src/components/company/CompanyMessaging.tsx', content);
  console.log('CompanyMessaging.tsx updated');
} else {
  console.log('Could not find chat section');
}
