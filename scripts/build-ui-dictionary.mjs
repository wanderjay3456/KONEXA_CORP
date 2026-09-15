// Extract reviewed Korean/English source copy. No provider, credentials or user data.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const pairs=new Map(),files=[];
function walk(p){for(const item of fs.readdirSync(p,{withFileTypes:true})){const name=path.join(p,item.name);if(item.isDirectory())walk(name);else if(/\.tsx?$/.test(name)&&!/(uiDictionary|legacyCopy)\.ts$/.test(name))files.push(name);}}
walk('src');
const literal=n=>n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))?n.text:null;
const key=n=>n&&(ts.isIdentifier(n)||ts.isStringLiteral(n))?n.text:null;
const clean=s=>s.replace(/\s+/g,' ').trim();
function add(a,b){if(!a||!b)return;a=clean(a);b=clean(b);if(a!==b&&/[가-힣]/.test(a)&&!/[가-힣]/.test(b)&&a.length>1)pairs.set(a,b);}
for(const file of files){
 const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const vars=new Map();function varsVisit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer)vars.set(n.name.text,n.initializer);ts.forEachChild(n,varsVisit);}varsVisit(sf);
 const resolve=n=>n&&ts.isIdentifier(n)?vars.get(n.text)||n:n;
 function obj(n){n=resolve(n);if(!n||!ts.isObjectLiteralExpression(n))return null;return new Map(n.properties.filter(p=>p.name).map(p=>[key(p.name),ts.isShorthandPropertyAssignment(p)?resolve(p.name):p.initializer]));}
 function merge(a,b,depth=0){if(depth>8)return;a=resolve(a);b=resolve(b);add(literal(a),literal(b));const x=obj(a),y=obj(b);if(x&&y)for(const [k,v]of x)if(y.has(k))merge(v,y.get(k),depth+1);}
 function visit(n){
  if(ts.isObjectLiteralExpression(n)){const values=obj(n);if(values?.has('ko')&&values.has('en'))merge(values.get('ko'),values.get('en'));}
  if(ts.isCallExpression(n)&&n.arguments.length>=2)add(literal(n.arguments[0]),literal(n.arguments[1]));
  if(ts.isArrayLiteralExpression(n)&&n.elements.length>=2)add(literal(n.elements[0]),literal(n.elements[1]));
  if(ts.isConditionalExpression(n)){const a=literal(n.whenTrue),b=literal(n.whenFalse);add(a,b);add(b,a);}
  ts.forEachChild(n,visit);
 }visit(sf);
}
fs.writeFileSync('src/i18n/uiDictionary.ts','// Generated from reviewed source copy by scripts/build-ui-dictionary.mjs.\nexport const sourceUiDictionary: Record<string,string> = '+JSON.stringify(Object.fromEntries([...pairs].sort((a,b)=>a[0].localeCompare(b[0]))),null,2)+';\n');
console.log(`Built ${pairs.size} reviewed UI translation pairs.`);
