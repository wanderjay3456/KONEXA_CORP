import { preservesTranslationNumbers } from './translationSafety';

export const LOCALIZATION_BATCH_SIZE = 20;
export const LOCALIZATION_PROVIDER_TIMEOUT_MS = 8_000;
export const LOCALIZATION_MAX_MODELS = 2;
export const LOCALIZATION_CLIENT_TIMEOUT_MS = 25_000;
export const LOCALIZATION_RETRY_DELAY_MS = 30_000;

const hangul = /[가-힣]/;
const vietnamese = /[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

// Native source copy is reviewed during development, not rewritten by AI on
// every navigation. Mixed Korean sentences keep product names/acronyms intact.
export function needsUiTranslation(value:string, locale:'ko'|'en'|'vi') {
  if(locale==='ko')return !hangul.test(value);
  if(locale==='en')return hangul.test(value)||vietnamese.test(value);
  return hangul.test(value)||!vietnamese.test(value);
}

export function validateUiTranslations(values:unknown, sources:string[]): string[] {
  if(!Array.isArray(values)||values.length!==sources.length||values.some((value,index)=>
    typeof value!=='string'||!value.trim()||value.length>1800||!preservesTranslationNumbers(sources[index],value))) {
    throw new Error('Invalid localization response shape or values');
  }
  return values.map(value=>value.trim());
}
