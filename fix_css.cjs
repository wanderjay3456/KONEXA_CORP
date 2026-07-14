const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// Replace standard custom classes with @utility in Tailwind v4
content = content.replace(/\.shadow-premium \{/g, '@utility shadow-premium {\n');
content = content.replace(/\.shadow-card-hover \{/g, '@utility shadow-card-hover {\n');
content = content.replace(/\.glow-teal \{/g, '@utility glow-teal {\n');
content = content.replace(/\.text-balance \{/g, '@utility text-balance {\n');
content = content.replace(/\.text-pretty \{/g, '@utility text-pretty {\n');
content = content.replace(/\.readable-prose \{/g, '@utility readable-prose {\n');
content = content.replace(/\.focus-ring \{/g, '@utility focus-ring {\n');
content = content.replace(/\.glass-panel \{/g, '@utility glass-panel {\n');
content = content.replace(/\.glass-panel-dark \{/g, '@utility glass-panel-dark {\n');

fs.writeFileSync('src/index.css', content);
console.log('Fixed CSS utilities.');
