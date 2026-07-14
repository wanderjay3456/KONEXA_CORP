const fs = require('fs');

let content = fs.readFileSync('src/components/student/MessagingCenter.tsx', 'utf8');

const importChatModule = `import ChatModule from "../dashboard/ChatModule";\n`;

content = content.replace('import { useToast } from "../ui/Toast";', 'import { useToast } from "../ui/Toast";\n' + importChatModule);

// Replace the chat frame part (RIGHT COLUMN)
const chatSectionStart = '{/* RIGHT COLUMN: Active Chat Frame with actions (8/12) */}';
const chatSectionEnd = '      </div>\n    </div>\n  );\n}';

const newChatSection = `
        {/* RIGHT COLUMN: Active Chat Frame with actions (8/12) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[550px]">
          <ChatModule 
             matchId={activeThread.id} 
             counterpartName={activeThread.name} 
             counterpartRole="company" 
           />
        </div>
`;

const startIndex = content.indexOf(chatSectionStart);
const endIndex = content.indexOf(chatSectionEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newChatSection + content.slice(endIndex);
  fs.writeFileSync('src/components/student/MessagingCenter.tsx', content);
  console.log('MessagingCenter.tsx updated');
} else {
  console.log('Could not find chat section in student messaging center');
}
