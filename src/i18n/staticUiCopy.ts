import { sourceUiDictionary } from './uiDictionary';
import { legacyUiPairs } from './legacyCopy';
import type { Locale } from './LocaleContext';
const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();
const en = new Map(Object.entries(sourceUiDictionary));
for(const [ko,english] of legacyUiPairs)en.set(normalize(ko),normalize(english));
const ko = new Map([...en].map(([k,e])=>[e,k]));
export function staticUiCopy(source:string,locale:Locale):string {
  const normalized=normalize(source), translated=(locale==='ko'?ko:en).get(normalized);
  if(translated)return source.replace(source.trim(),translated);
  // Only known UI counter grammars; never rewrite arbitrary user sentences.
  if(locale==='en') {
    if(/^\d+분 전$/.test(normalized))return normalized.replace(/(\d+)분 전/,'$1 min ago');
    if(/^\d+시간 전$/.test(normalized))return normalized.replace(/(\d+)시간 전/,'$1 hr ago');
  }
  return source;
}
