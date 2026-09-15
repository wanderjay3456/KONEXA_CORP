// Mechanical AST migration of supported interface locales. Domain data such as
// Vietnamese language skills, names and country eligibility is not removed.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const roots=['src','server.ts','tests'];
const files=[];
function walk(p){if(fs.statSync(p).isDirectory()){for(const n of fs.readdirSync(p))walk(path.join(p,n));}else if(/\.(tsx?|mts)$/.test(p))files.push(p);}
roots.forEach(walk);
const nameOf=n=>n && (ts.isIdentifier(n)||ts.isStringLiteral(n))?n.text:'';
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
let changed=0;
for(const file of files){
 const source=fs.readFileSync(file,'utf8');
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const helpers=new Set();
 function scan(n){if((ts.isArrowFunction(n)||ts.isFunctionDeclaration(n))&&n.parameters.length===3&&n.parameters.map(p=>nameOf(p.name)).join(',')==='ko,en,vi'){
  if(ts.isFunctionDeclaration(n))helpers.add(nameOf(n.name)); else if(ts.isVariableDeclaration(n.parent))helpers.add(nameOf(n.parent.name));
 }ts.forEachChild(n,scan);}scan(sf);
 let touched=false;
 const result=ts.transform(sf,[ctx=>{
  const f=ctx.factory;
  const isVi=n=>ts.isBinaryExpression(n)&&['===','=='].includes(n.operatorToken.getText(sf))&&((ts.isStringLiteral(n.right)&&n.right.text==='vi'&&/locale/i.test(n.left.getText(sf)))||(ts.isStringLiteral(n.left)&&n.left.text==='vi'&&/locale/i.test(n.right.getText(sf))));
  const visit=n=>{
   if(ts.isConditionalExpression(n)&&isVi(n.condition)){touched=true;return ts.visitNode(n.whenFalse,visit);}
   if(ts.isIfStatement(n)&&isVi(n.expression)){touched=true;return n.elseStatement?ts.visitNode(n.elseStatement,visit):f.createEmptyStatement();}
   if(ts.isUnionTypeNode(n)){const has=x=>n.types.some(t=>ts.isLiteralTypeNode(t)&&ts.isStringLiteral(t.literal)&&t.literal.text===x);if(has('ko')&&has('en')&&has('vi')){touched=true;return f.updateUnionTypeNode(n,n.types.filter(t=>!(ts.isLiteralTypeNode(t)&&ts.isStringLiteral(t.literal)&&t.literal.text==='vi')));}}
   if(ts.isArrayLiteralExpression(n)){const values=n.elements.map(v=>ts.isStringLiteral(v)?v.text:null);if(values.includes('ko')&&values.includes('en')&&values.includes('vi')){touched=true;return f.updateArrayLiteralExpression(n,n.elements.filter(v=>!(ts.isStringLiteral(v)&&v.text==='vi')));}}
   if(ts.isObjectLiteralExpression(n)){const names=n.properties.map(p=>nameOf(p.name));if(names.includes('ko')&&names.includes('en')&&names.includes('vi')){touched=true;return ts.visitEachChild(f.updateObjectLiteralExpression(n,n.properties.filter(p=>nameOf(p.name)!=='vi')),visit,ctx);}}
   if(ts.isArrowFunction(n)&&n.parameters.length===3&&n.parameters.map(p=>nameOf(p.name)).join(',')==='ko,en,vi'){touched=true;return ts.visitEachChild(f.updateArrowFunction(n,n.modifiers,n.typeParameters,n.parameters.slice(0,2),n.type,n.equalsGreaterThanToken,n.body),visit,ctx);}
   if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&helpers.has(n.expression.text)&&n.arguments.length===3){touched=true;return ts.visitEachChild(f.updateCallExpression(n,n.expression,n.typeArguments,n.arguments.slice(0,2)),visit,ctx);}
   return ts.visitEachChild(n,visit,ctx);
  };return node=>ts.visitNode(node,visit);
 }]);
 if(touched){fs.writeFileSync(file,printer.printFile(result.transformed[0]));changed++;}
 result.dispose();
}
console.log(`Updated ${changed} source files to Korean/English interface locales.`);
