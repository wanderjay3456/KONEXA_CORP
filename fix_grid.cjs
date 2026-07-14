const fs = require('fs');
let content = fs.readFileSync('src/components/company/CompanyMessaging.tsx', 'utf8');
content = content.replace('{/* Right System Notifications Drawer (4/12) */}', '</div>\n        {/* Right System Notifications Drawer (4/12) */}');
fs.writeFileSync('src/components/company/CompanyMessaging.tsx', content);
