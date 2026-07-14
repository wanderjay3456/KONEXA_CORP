const fs = require('fs');
let content = fs.readFileSync('src/components/landing/LandingHero.tsx', 'utf8');

// Apply text-balance to main headlines
content = content.replace('className="font-display font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter text-neutral-900 leading-[1.1] mb-6"', 
                          'className="font-display font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter text-neutral-900 leading-[1.1] mb-6 text-balance"');

content = content.replace('className="text-lg md:text-xl text-neutral-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light"',
                          'className="text-lg md:text-xl text-neutral-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light text-pretty"');

content = content.replace('className="font-display font-black text-3xl md:text-4xl tracking-tight text-neutral-900 mb-6"',
                          'className="font-display font-black text-3xl md:text-4xl tracking-tight text-neutral-900 mb-6 text-balance"');

content = content.replace('className="font-display font-black text-3xl md:text-4xl tracking-tight mt-4"',
                          'className="font-display font-black text-3xl md:text-4xl tracking-tight mt-4 text-balance"');

// Update Bento grid layout for more variance
content = content.replace('className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"',
                          'className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto"');

content = content.replace('className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between"',
                          'className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between md:col-span-4 hover:-translate-y-1 transition-transform duration-300"');
content = content.replace('className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between"',
                          'className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-sm flex flex-col justify-between md:col-span-4 text-white hover:-translate-y-1 transition-transform duration-300"');
content = content.replace('className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between md:col-span-2"',
                          'className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between md:col-span-8 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"');

fs.writeFileSync('src/components/landing/LandingHero.tsx', content);
console.log('LandingHero.tsx updated.');
