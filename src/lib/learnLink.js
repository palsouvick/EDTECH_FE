/**
 * "📖 Learn this topic" (F6). The API attaches a `learn` target to a revealed answer (practice feedback,
 * mistake notebook, mock and custom-test review, revision) when the question has a reliable learning
 * source, and null otherwise:
 *
 *   { kind: 'book',   card, chapter, section|null, crumbs }   study-book chapter (section)
 *   { kind: 'fact',   code, crumbs }                          GK fact / topic page
 *   { kind: 'lesson', subject, topic, crumbs }                Math / English lesson
 *   { kind: 'sheet',  category, subject, topic, crumbs }      concept sheet on the study page (Reasoning)
 *
 * crumbs are localized labels, Subject → Chapter → Topic. This file turns a target into an app path.
 */
import { bookChapterPath } from './bookCopy';
import { learnPaths, paths } from './routes';

const LESSON_SUBJECTS = ['quant', 'english'];

export const LEARN_LINK = {
  cta: { en: 'Learn this topic', bn: 'এই বিষয়টি শেখো' },
  label: { en: 'Where to learn this', bn: 'কোথায় শিখবে' },
};

/** App path for a learn target, or null when it cannot be opened. */
export function learnLinkPath(learn) {
  if (!learn) return null;
  switch (learn.kind) {
    case 'book':
      return learn.card && learn.chapter ? bookChapterPath(learn.card, learn.chapter, learn.section || undefined) : null;
    case 'fact':
      return learn.code ? `/learn/gk/topic/${learn.code}` : null;
    case 'lesson':
      // Lessons exist for Math and English only (/learn/gk is the GK card dashboard, not a lesson).
      return LESSON_SUBJECTS.includes(learn.subject) && learn.topic ? learnPaths.chapter(learn.subject, learn.topic) : null;
    case 'sheet':
      return learn.category && learn.subject && learn.topic ? paths.topic(learn.category, learn.subject, learn.topic) : null;
    default:
      return null;
  }
}
