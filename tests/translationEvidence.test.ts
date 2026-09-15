import test from 'node:test';
import assert from 'node:assert/strict';
import { canApplyUiTranslation, preservesTranslationNumbers } from '../src/i18n/translationSafety';
import { normalizePdfEvidence } from '../src/server/pdfEvidence';
import { needsUiTranslation, validateUiTranslations, localizationFailureFields, LOCALIZATION_BATCH_SIZE, LOCALIZATION_CLIENT_TIMEOUT_MS, LOCALIZATION_PROVIDER_TIMEOUT_MS, LOCALIZATION_MAX_MODELS } from '../src/i18n/localizationPolicy';
test('localization diagnostics include only allowlisted configuration field names', () => {
    assert.deepEqual(localizationFailureFields({ message: 'Invalid temperature. Private account user@example.invalid api-key=secret' }), ['temperature']);
    assert.deepEqual(localizationFailureFields({ message: 'Private contents and credential values' }), []);
    assert.deepEqual(localizationFailureFields(null), []);
});
test('product names and qualification labels are preserved without an AI rewrite', () => {
    for (const locale of ['ko', 'en'] as const) {
        for (const label of ['KONEXA', 'Work Passport', 'Early Pioneer', 'E-7', 'RMIT', 'PG', 'SaaS']) {
            assert.equal(needsUiTranslation(label, locale), false);
        }
    }
});
test('native UI copy stays stable and localization server budget fits the client deadline', () => {
    assert.equal(needsUiTranslation('결과물 및 종료 검토', 'ko'), false);
    assert.equal(needsUiTranslation('KONEXA 프로젝트 확인', 'ko'), false);
    assert.equal(needsUiTranslation('Submission history', 'ko'), true);
    assert.equal(needsUiTranslation('Submission history', 'en'), false);
    assert.equal(needsUiTranslation('제출 이력', 'en'), true);
    assert.ok(LOCALIZATION_PROVIDER_TIMEOUT_MS * LOCALIZATION_MAX_MODELS + 3000 < LOCALIZATION_CLIENT_TIMEOUT_MS);
    assert.ok(LOCALIZATION_PROVIDER_TIMEOUT_MS >= 12000, 'Keep the deadline accepted by the verified provider request');
    assert.ok(LOCALIZATION_BATCH_SIZE <= 20);
});
test('localization rejects missing, fabricated numeric and non-text values before caching', () => {
    assert.deepEqual(validateUiTranslations([' 알림 2개 '], ['2 notifications']), ['알림 2개']);
    for (const value of [[], [{}], [null], [''], ['알림 0개']])
        assert.throws(() => validateUiTranslations(value, ['2 notifications']));
});
test('late translations cannot overwrite refreshed React values or newly private chat nodes', () => {
    const input = { connected: true, excluded: false, current: 'Hello', source: 'Hello', original: 'Hello', lastApplied: 'Hello', translated: '안녕하세요' };
    assert.equal(canApplyUiTranslation(input), true);
    assert.equal(canApplyUiTranslation({ ...input, current: 'The actual saved question' }), false);
    assert.equal(canApplyUiTranslation({ ...input, excluded: true }), false);
    assert.equal(canApplyUiTranslation({ ...input, connected: false }), false);
    assert.equal(canApplyUiTranslation({ ...input, original: 'New question' }), false);
    assert.equal(canApplyUiTranslation({ ...input, current: 'Bonjour', lastApplied: 'Bonjour' }), true);
});
test('translations must preserve notification counts, fees and percentages', () => {
    assert.equal(preservesTranslationNumbers('2 unread notifications', '읽지 않은 알림 0개'), false);
    assert.equal(preservesTranslationNumbers('30% for 5 months', '5개월 동안 30%'), true);
    assert.equal(preservesTranslationNumbers('Fee 10%', '수수료 20%'), false);
    assert.equal(preservesTranslationNumbers('2 unread notifications', '2 thông báo chưa đọc'), true);
});
test('empty or placeholder PDF extraction is not successful resume evidence', () => {
    for (const empty of [null, {}, { extractedSkills: ['null', 'n/a'], experienceSummary: 'null', education: 'undefined', recommendation: 'null' }]) {
        assert.throws(() => normalizePdfEvidence(empty), /NO_RESUME_EVIDENCE/);
    }
    assert.throws(() => normalizePdfEvidence({ extractedSkills: ['Research'], recommendation: 'null' }), /INVALID_PDF_ANALYSIS/);
});
test('PDF extraction preserves real non-software evidence and does not stringify objects', () => {
    const result = normalizePdfEvidence({ extractedSkills: [' Research ', {}, 'null'], experienceSummary: {}, education: 'Business studies', portfolioLinks: ['javascript:alert(1)', 'https://example.com/portfolio'], recommendation: 'Add a concrete research outcome.' });
    assert.deepEqual(result.extractedSkills, ['Research']);
    assert.equal(result.experienceSummary, '');
    assert.equal(result.education, 'Business studies');
    assert.deepEqual(result.portfolioLinks, ['https://example.com/portfolio']);
});
