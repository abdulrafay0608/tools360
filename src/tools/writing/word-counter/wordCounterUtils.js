const ENGLISH_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was",
  "were", "with",
]);

function getSegmenter(granularity) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    return new Intl.Segmenter(undefined, { granularity });
  }
  return null;
}

function countWords(text) {
  const segmenter = getSegmenter("word");
  if (segmenter) {
    let count = 0;
    for (const segment of segmenter.segment(text)) {
      if (segment.isWordLike) count += 1;
    }
    return count;
  }
  const matches = text.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}\p{M}]+/gu
  );
  return matches?.length ?? 0;
}

function getKeywordTokens(text) {
  const segmenter = getSegmenter("word");
  const tokens = segmenter
    ? [...segmenter.segment(text)]
        .filter((segment) => segment.isWordLike)
        .map((segment) => segment.segment)
    : text.match(
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}\p{M}]+/gu
      ) || [];
  return tokens.map((token) => token.toLocaleLowerCase());
}

function countCharacters(text) {
  const segmenter = getSegmenter("grapheme");
  if (!segmenter) return Array.from(text).length;
  let count = 0;
  for (const _ of segmenter.segment(text)) count += 1;
  return count;
}

export function analyzeText(text) {
  if (typeof text !== "string" || text.length === 0) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingMinutes: 0,
      speakingMinutes: 0,
      keywords: [],
    };
  }

  const words = countWords(text);
  const trimmed = text.trim();
  const sentenceMatches = trimmed.match(/[.!?؟۔]+(?=\s|$)/gu);
  const sentences = trimmed ? Math.max(1, sentenceMatches?.length ?? 0) : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\r?\n\s*\r?\n/u).filter((paragraph) => paragraph.trim()).length
    : 0;
  const lines = trimmed ? trimmed.split(/\r\n|\r|\n/u).length : 0;
  const frequency = new Map();
  for (const token of getKeywordTokens(text)) {
    if (ENGLISH_STOP_WORDS.has(token)) continue;
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  return {
    words,
    characters: countCharacters(text),
    charactersNoSpaces: countCharacters(text.replace(/\s/gu, "")),
    sentences,
    paragraphs,
    lines,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
    speakingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 130)),
    keywords: [...frequency]
      .map(([word, count]) => ({ word, count }))
      .sort((first, second) => second.count - first.count || first.word.localeCompare(second.word))
      .slice(0, 10),
  };
}

export const WORD_COUNTER_DEBOUNCE_MS = 180;
