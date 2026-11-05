import { PASS_RATIO, lessonProgress, levelCleared, levelProgress } from './learnProgress';

/**
 * The Learn ladder: six levels per chapter, built only from progress the app already keeps.
 *
 *   1 Beginner     read the Basic lesson (moved past it, or tried the Beginner quiz)
 *   2 Easy         Beginner quiz ≥ 60% (the existing pass mark)
 *   3 Competitive  Intermediate quiz ≥ 60%
 *   4 Advanced     Advanced quiz ≥ 60%
 *   5 Exam level   chapter mastery "strong" on the server (recent answers incl. timed mocks)
 *   6 PYQ          ≥ 10 real past-paper questions answered (or all, if fewer), ≥ 60% solved
 *
 * A level is "open" once the one before it is done; later levels are "locked" but can still
 * be opened (nothing that exists today is blocked). A chapter with no past-paper questions
 * has no PYQ level to do ("none").
 */
export const LADDER = ['beginner', 'easy', 'competitive', 'advanced', 'exam', 'pyq'];
export const PYQ_MIN = 10;

export function pyqDone(p) {
  if (!p?.total) return false;
  return p.attempted >= Math.min(PYQ_MIN, p.total) && p.solved / p.attempted >= PASS_RATIO;
}

/** Facts for one chapter from local progress plus optional server data. */
export function chapterFacts(subject, topic, { mastery = null, pyq = null } = {}) {
  const best = (level) => levelProgress(subject, topic, level).best;
  const lesson = lessonProgress(subject, topic);
  return {
    lessonStarted: lesson.completed || lesson.section !== 'basic' || Boolean(best('beginner')),
    cleared: { beginner: levelCleared(best('beginner')), intermediate: levelCleared(best('intermediate')), advanced: levelCleared(best('advanced')) },
    best: { beginner: best('beginner'), intermediate: best('intermediate'), advanced: best('advanced') },
    masteryStatus: mastery?.status ?? null,
    pyq,
  };
}

/** [{ key, status: 'done' | 'open' | 'locked' | 'none' }], and the first level not done. */
export function ladderFor(facts) {
  const done = {
    beginner: facts.lessonStarted,
    easy: facts.cleared.beginner,
    competitive: facts.cleared.intermediate,
    advanced: facts.cleared.advanced,
    exam: facts.masteryStatus === 'strong',
    pyq: pyqDone(facts.pyq),
  };
  const noPyq = facts.pyq && facts.pyq.total === 0;
  let blocked = false;
  const steps = LADDER.map((key) => {
    if (key === 'pyq' && noPyq) return { key, status: 'none' };
    if (done[key]) return { key, status: 'done' };
    const status = blocked ? 'locked' : 'open';
    blocked = true;
    return { key, status };
  });
  const current = steps.find((s) => s.status === 'open')?.key ?? null;
  return { steps, current, level: current ? LADDER.indexOf(current) + 1 : LADDER.length + 1 };
}

/** Highest level reached in order: 0 = nothing yet, 6 = every level done. */
export const levelReached = (ladder) => ladder.level - 1;

/**
 * Zero → Exam ready, for a whole subject. Stages need most chapters at a level, so one easy
 * chapter does not make a student "competitive".
 */
export const JOURNEY = ['beginner', 'foundation', 'concepts', 'practice', 'competitive', 'pyqMastery', 'examReady'];

export function journeyStage(ladders) {
  const n = ladders.length;
  if (!n) return { stage: 'beginner', index: 0 };
  const share = (key) => ladders.filter((l) => l.steps.find((s) => s.key === key).status === 'done').length / n;
  const withPyq = ladders.filter((l) => l.steps.find((s) => s.key === 'pyq').status !== 'none');
  const pyqShare = withPyq.length ? withPyq.filter((l) => l.steps.find((s) => s.key === 'pyq').status === 'done').length / withPyq.length : 0;
  let stage = 'beginner';
  if (share('beginner') > 0) stage = 'foundation';
  if (share('easy') >= 0.5) stage = 'concepts';
  if (share('competitive') >= 0.5) stage = 'practice';
  if (share('advanced') >= 0.5) stage = 'competitive';
  if (stage === 'competitive' && pyqShare >= 0.5) stage = 'pyqMastery';
  if (share('exam') >= 0.8 && pyqShare >= 0.8) stage = 'examReady';
  return { stage, index: JOURNEY.indexOf(stage) };
}

/** Accuracy band for the weakness coach: ✅ ≥ 75%, 🟡 50–74%, 🔴 below 50%; null without enough answers. */
export const MIN_ANSWERS = 5;
export function band(m) {
  if (!m || m.recentAnswers < MIN_ANSWERS || m.accuracyPct == null) return null;
  return m.accuracyPct >= 75 ? 'good' : m.accuracyPct >= 50 ? 'fair' : 'weak';
}

/** Chapters with at least `min` mistakes in the last `days` days, from the student's latest mistakes. */
export function repairTopics(items, { min = 3, days = 7, now = Date.now() } = {}) {
  const since = now - days * 86_400_000;
  const counts = new Map();
  for (const it of items) {
    if (!it.lastWrongAt || new Date(it.lastWrongAt).getTime() < since) continue;
    const key = it.question?.topic;
    if (key) counts.set(key, { topic: key, name: it.topicName, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  return [...counts.values()].filter((c) => c.count >= min).sort((a, b) => b.count - a.count);
}
