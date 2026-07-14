const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace('@layer utilities {\n  @utility text-balance { text-wrap: balance; }\n  @utility text-pretty { text-wrap: pretty; }\n  @utility glass-panel {\n    @apply bg-white/70 backdrop-blur-md border border-neutral-200/50 shadow-premium;\n  }\n  @utility glass-panel-dark {\n    @apply bg-neutral-900/80 backdrop-blur-md border border-neutral-800 shadow-premium;\n  }\n}', 
`@utility glass-panel {
  @apply bg-white/70 backdrop-blur-md border border-neutral-200/50 shadow-premium;
}
@utility glass-panel-dark {
  @apply bg-neutral-900/80 backdrop-blur-md border border-neutral-800 shadow-premium;
}`);

fs.writeFileSync('src/index.css', content);
