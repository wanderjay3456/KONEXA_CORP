const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// Update to slightly cooler/premium greys
content = content.replace('--color-neutral-50: #f8f9fa;', '--color-neutral-50: #fafafa;');
content = content.replace('--color-neutral-100: #f1f3f5;', '--color-neutral-100: #f4f4f5;');
content = content.replace('--color-neutral-200: #e9ecef;', '--color-neutral-200: #e4e4e7;');
content = content.replace('--color-neutral-800: #343a40;', '--color-neutral-800: #27272a;');
content = content.replace('--color-neutral-900: #212529;', '--color-neutral-900: #18181b;');
content = content.replace('--color-neutral-950: #111827;', '--color-neutral-950: #09090b;');

// Add specific classes to layer utilities
const baseAdditions = `
@layer utilities {
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }
  .glass-panel {
    @apply bg-white/70 backdrop-blur-md border border-neutral-200/50 shadow-premium;
  }
  .glass-panel-dark {
    @apply bg-neutral-900/80 backdrop-blur-md border border-neutral-800 shadow-premium;
  }
}
`;

if (!content.includes('.glass-panel')) {
  content += baseAdditions;
}

fs.writeFileSync('src/index.css', content);
console.log('Styles updated.');
