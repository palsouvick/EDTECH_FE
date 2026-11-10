/**
 * Turns the dictionary pronunciation (IPA, e.g. "/əˈkjumjəˌleɪt/") into a plain respelling a
 * student can read aloud ("uh-KYOO-myuh-layt"), in the style of learner dictionaries: syllables
 * split with hyphens, the main stress in capitals.
 *
 * The vocabulary bank's pronunciations are all generated from the CMU Pronouncing Dictionary
 * (backend/scripts/vocabulary/lexicon.mjs, arpabetToIpa), so the symbol set is closed and the
 * conversion is exact. Anything outside it returns null and the page shows only the Listen button.
 */

// IPA vowel (as lexicon.mjs writes it) -> respelling.
const VOWELS = {
  aʊ: 'ow', aɪ: 'eye', eɪ: 'ay', oʊ: 'oh', ɔɪ: 'oy', ɜr: 'ur', ər: 'er',
  ɑ: 'ah', æ: 'a', ʌ: 'u', ɔ: 'aw', ɛ: 'e', ɪ: 'i', i: 'ee', ʊ: 'uu', u: 'oo', ə: 'uh',
};
const CONSONANTS = {
  tʃ: 'ch', dʒ: 'j', ð: 'th', θ: 'th', ŋ: 'ng', ʃ: 'sh', ʒ: 'zh', j: 'y', ɡ: 'g',
  b: 'b', d: 'd', f: 'f', h: 'h', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', r: 'r', s: 's', t: 't', v: 'v', w: 'w', z: 'z',
};
// Syllable onsets English allows (the same list lexicon.mjs uses, in IPA), for the maximal-onset rule.
const ONSETS = new Set([
  ...Object.keys(CONSONANTS).filter((c) => c !== 'ŋ'),
  'pr', 'pl', 'br', 'bl', 'tr', 'dr', 'kr', 'kl', 'ɡr', 'ɡl', 'fr', 'fl', 'θr', 'ʃr',
  'sp', 'st', 'sk', 'sm', 'sn', 'sl', 'sw', 'sf', 'kw', 'tw', 'dw', 'ɡw', 'θw',
  'spr', 'spl', 'str', 'skr', 'skw', 'pj', 'bj', 'fj', 'mj', 'kj', 'vj', 'hj', 'skj', 'spj',
]);
const MULTI = ['aʊ', 'aɪ', 'eɪ', 'oʊ', 'ɔɪ', 'ɜr', 'ər', 'tʃ', 'dʒ'];

function tokenize(ipa) {
  const out = [];
  for (let i = 0; i < ipa.length; ) {
    const two = ipa.slice(i, i + 2);
    if (MULTI.includes(two)) {
      out.push(two);
      i += 2;
    } else {
      out.push(ipa[i]);
      i += 1;
    }
  }
  return out;
}

/** One word (no spaces) -> ["uh", "KYOO", "myuh", "layt"], or null if a symbol is unknown. */
function syllables(word) {
  const tokens = tokenize(word);
  const items = []; // { t, kind: 'v' | 'c', stress }
  let pending = null;
  for (const t of tokens) {
    if (t === 'ˈ' || t === 'ˌ') {
      pending = t === 'ˈ' ? 1 : 2;
      continue;
    }
    if (VOWELS[t]) items.push({ t, kind: 'v', stress: 0, markBefore: pending });
    else if (CONSONANTS[t]) items.push({ t, kind: 'c', markBefore: pending });
    else return null;
    pending = null;
  }
  const vowelIdx = items.map((x, i) => (x.kind === 'v' ? i : -1)).filter((i) => i >= 0);
  if (!vowelIdx.length) return null;

  // Where each syllable starts: a stress mark wins; otherwise the longest legal onset.
  const starts = [0];
  for (let k = 1; k < vowelIdx.length; k++) {
    const from = vowelIdx[k - 1] + 1;
    const to = vowelIdx[k]; // consonants items[from..to-1]
    let start = to;
    const marked = items.slice(from, to + 1).findIndex((x) => x.markBefore);
    if (marked >= 0) start = from + marked;
    else {
      for (let s = from; s < to; s++) {
        if (ONSETS.has(items.slice(s, to).map((x) => x.t).join(''))) {
          start = s;
          break;
        }
      }
    }
    starts.push(start);
  }
  return starts.map((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : items.length;
    const part = items.slice(s, end);
    const stress = part.find((x) => x.markBefore)?.markBefore ?? 0;
    const hasOnset = part[0].kind === 'c';
    const text = part
      .map((x) => (x.kind === 'v' ? (x.t === 'aɪ' && hasOnset ? 'y' : VOWELS[x.t]) : CONSONANTS[x.t]))
      .join('');
    return stress === 1 ? text.toUpperCase() : text;
  });
}

/** "/əˈkjumjəˌleɪt/" -> "uh-KYOO-myuh-layt"; null when it cannot be read. */
export function respell(ipa) {
  if (!ipa) return null;
  const words = ipa.replace(/^\/|\/$/g, '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of words) {
    const s = syllables(w);
    if (!s) return null;
    out.push(s.join('-'));
  }
  return out.join(' ') || null;
}

/** Reads the word aloud with the device's own English voice. Returns false when unavailable. */
export function speak(text) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return false;
  synth.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  // The respelling follows US English (CMU dictionary), so prefer a US voice, then any English one.
  const voices = synth.getVoices?.() || [];
  const voice = voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang?.startsWith('en'));
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'en-US';
  u.rate = 0.85; // a little slower than normal speech, for learners
  synth.speak(u);
  return true;
}

export const canSpeak = () => typeof window !== 'undefined' && Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === 'function';
