/**
 * Regenerates src/fixtures/catalog.js from the backend's seed catalogue, so the
 * offline funnel shows exactly the categories, subjects and topics the API serves.
 *
 *   npm run fixtures:catalog
 *
 * Dev-only tool; the app bundle never imports anything from ../backend.
 */
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../../backend/db/seed/catalog.js');
const target = path.resolve(__dirname, '../src/fixtures/catalog.js');

const catalog = require(source);
// Offline mocks follow the server's marking rules (backend/src/services/markingScheme.js).
const { resolveMarking } = require(path.resolve(__dirname, '../../backend/src/services/markingScheme.js'));
const marking = Object.fromEntries(catalog.map((c) => [
  c.code,
  Object.fromEntries(c.subjects.map((s) => {
    const m = resolveMarking({ category: c.code, subject: s.code });
    return [s.code, { positive: m.positive, negative: m.negative, basis: m.basis, examCode: m.examCode, sourceUrl: m.sourceUrl }];
  })),
]));
const slim = catalog.map((c) => ({
  code: c.code,
  name: c.name,
  conductingBody: c.conducting_body,
  exams: c.exams.map((e) => ({ code: e.code, name: e.name })),
  subjects: c.subjects.map((s) => ({
    code: s.code,
    name: s.name,
    topics: s.topics.map((t) => ({
      code: t.code,
      name: t.name,
      syllabusStatus: t.syllabus_status || 'UNVERIFIED',
      subtopics: (t.subtopics || []).map((subtopic) => ({
        code: subtopic.code,
        name: subtopic.name,
        syllabusStatus: subtopic.syllabus_status || 'UNVERIFIED',
      })),
    })),
  })),
}));

const header = `/**
 * Offline catalogue (VITE_USE_FIXTURES=true). GENERATED from backend/db/seed/catalog.js
 * by \`npm run fixtures:catalog\`; edit the backend file, then regenerate.
 */
`;
fs.writeFileSync(
  target,
  `${header}export const catalogFixture = ${JSON.stringify(slim, null, 2)};\n\n`
    + `// Default mock marking per category and subject, exactly as the server resolves it.\n`
    + `export const markingFixture = ${JSON.stringify(marking, null, 2)};\n`,
);
console.log(`wrote ${path.relative(process.cwd(), target)}: ${slim.length} categories`);
