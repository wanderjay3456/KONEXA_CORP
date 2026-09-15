import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { staticUiCopy } from '../src/i18n/staticUiCopy';
const targets=process.argv.slice(2), missing=new Map<string,string[]>();
function walk(file:string){if(fs.statSync(file).isDirectory()){for(const n of fs.readdirSync(file))walk(path.join(file,n));return;}if(!file.endsWith('.tsx'))return;
 const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n:ts.Node){
   if(ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)==='data-no-translate'))return;
   if(ts.isJsxText(n)||(ts.isStringLiteral(n)&&ts.isJsxAttribute(n.parent))){const text=n.getText(sf).replace(/^['"]|['"]$/g,'').replace(/\s+/g,' ').trim();
    if(/[가-힣]/.test(text)&&staticUiCopy(text,'en')===text)missing.set(text,[...(missing.get(text)||[]),file]);}
   ts.forEachChild(n,visit);
 }visit(sf);
}
(targets.length?targets:['src/components']).forEach(walk);
console.log(JSON.stringify([...missing].map(([text,files])=>({text,files:[...new Set(files)]})),null,2));
