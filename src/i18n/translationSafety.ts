export function preservesTranslationNumbers(source: string, translated: string) {
  const numbers = (value: string) => (value.match(/\d+(?:[.,]\d+)*/g) || []).sort().join('|');
  return numbers(source) === numbers(translated);
}

export function canApplyUiTranslation(input: {
  connected: boolean; excluded: boolean; current: string; source: string;
  original: string; lastApplied: string; translated: string;
}) {
  return input.connected && !input.excluded && Boolean(input.translated)
    && input.original === input.source
    && (input.current === input.source || input.current === input.lastApplied)
    && preservesTranslationNumbers(input.source, input.translated);
}
