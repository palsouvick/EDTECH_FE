/**
 * Funnel URLs. Codes stay as the API knows them (WB_POST, profit_loss); URLs
 * use lowercase hyphenated slugs:
 *
 *   /exams                                   Step 1  category
 *   /exams/wb-post                           Step 2  subject + language
 *   /exams/wb-post/quant                     Step 3  topic
 *   /exams/wb-post/quant/profit-loss         Step 4  study & practice
 */

export const CATEGORY_CODES = Object.freeze(['SSC', 'BANK', 'WBPSC', 'WB_POST']);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toSlug = (code) => code.toLowerCase().replace(/_/g, '-');

/** "wb-post" -> "WB_POST", or null when it is not a known category. */
export function categoryFromSlug(slug) {
  if (!slug || !SLUG_RE.test(slug)) return null;
  const code = slug.toUpperCase().replace(/-/g, '_');
  return CATEGORY_CODES.includes(code) ? code : null;
}

/** "profit-loss" -> "profit_loss", or null when malformed. */
export function codeFromSlug(slug) {
  if (!slug || !SLUG_RE.test(slug)) return null;
  return slug.replace(/-/g, '_');
}

export const paths = {
  exams: () => '/exams',
  category: (category) => `/exams/${toSlug(category)}`,
  subject: (category, subject) => `/exams/${toSlug(category)}/${toSlug(subject)}`,
  topic: (category, subject, topic) => `/exams/${toSlug(category)}/${toSlug(subject)}/${toSlug(topic)}`,
};

/**
 * Learn section. URL subject slugs are friendlier than API codes:
 *
 *   /learn/math                               chapters of a subject
 *   /learn/math/percentage                    lesson + level quizzes
 *   /learn/math/percentage/quiz/beginner      quiz, then the answer review
 */
export const LEARN_SUBJECTS = Object.freeze([
  { slug: 'math', code: 'quant' },
  { slug: 'english', code: 'english' },
]);
export const QUIZ_LEVEL_CODES = Object.freeze(['beginner', 'intermediate', 'advanced']);

export const subjectCodeFromSlug = (slug) => LEARN_SUBJECTS.find((s) => s.slug === slug)?.code ?? null;
export const subjectSlugFromCode = (code) => LEARN_SUBJECTS.find((s) => s.code === code)?.slug ?? null;

export const learnPaths = {
  subject: (code) => `/learn/${subjectSlugFromCode(code)}`,
  chapter: (code, topic) => `/learn/${subjectSlugFromCode(code)}/${toSlug(topic)}`,
  quiz: (code, topic, level) => `/learn/${subjectSlugFromCode(code)}/${toSlug(topic)}/quiz/${level}`,
};
