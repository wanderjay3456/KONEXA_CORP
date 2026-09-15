import { preservesTranslationNumbers } from './translationSafety';
export const LOCALIZATION_BATCH_SIZE = 20;
export const LOCALIZATION_PROVIDER_TIMEOUT_MS = 12000;
export const LOCALIZATION_MAX_MODELS = 2;
export const LOCALIZATION_CLIENT_TIMEOUT_MS = 30000;
export const LOCALIZATION_RETRY_DELAY_MS = 30000;
const hangul = /[가-힣]/;
const vietnamese = /[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;
const invariantLabel = /^(?:KONEXA|Work Passport|Early Pioneer|E-7|RMIT|PG|SaaS|KO|EN|VI)$/i;
// Native source copy is reviewed during development, not rewritten by AI on
// every navigation. Mixed Korean sentences keep product names/acronyms intact.
export function needsUiTranslation(value: string, locale: 'ko' | 'en') {
    if (invariantLabel.test(value.trim()))
        return false;
    if (locale === 'ko')
        return !hangul.test(value);
    if (locale === 'en')
        return hangul.test(value) || vietnamese.test(value);
    return hangul.test(value) || !vietnamese.test(value);
}
export function validateUiTranslations(values: unknown, sources: string[]): string[] {
    if (!Array.isArray(values) || values.length !== sources.length || values.some((value, index) => typeof value !== 'string' || !value.trim() || value.length > 1800 || !preservesTranslationNumbers(sources[index], value))) {
        throw new Error('Invalid localization response shape or values');
    }
    return values.map(value => value.trim());
}
// Only configuration field names may enter diagnostics; never provider text,
// submitted UI content, credential values or the full request/response.
export function localizationFailureFields(error: unknown) {
    const message = String((error as {
        message?: unknown;
    })?.message || '');
    return ['temperature', 'responseJsonSchema', 'response_schema', 'schema', 'minItems', 'min_items', 'maxItems', 'max_items', 'thinkingLevel', 'thinking_level', 'maxOutputTokens', 'max_output_tokens']
        .filter(field => new RegExp(`\\b${field}\\b`, 'i').test(message));
}
