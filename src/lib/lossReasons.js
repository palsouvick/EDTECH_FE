/**
 * "Why did I lose marks?" — sorts every question that lost marks in a mock into a reason.
 *
 * The student's own tag always wins. Until they tag a question, a LIKELY reason is
 * inferred only from facts the result already holds, and shown as "likely", never as fact:
 *   - wrong, and the chosen option has a trap note        -> concept (a known common mistake)
 *   - wrong in under a third of the question's usual time -> guess (rushed or guessed)
 *   - wrong after more than twice the usual time          -> concept (stuck on the method)
 *   - not answered and never opened (0 s)                 -> time (not reached)
 *   - opened but left unanswered                          -> skipped
 *   - any other wrong answer                              -> untagged (only the student knows:
 *                                                            concept, calculation or misread)
 * Calculation and misreading cannot be told apart from the data, so they are never guessed.
 */

export const REASONS = Object.freeze(['concept', 'calculation', 'guess', 'misread', 'time']);
// Display order of the buckets: the student's five reasons, then the two non-tagged ones.
export const BUCKETS = Object.freeze([...REASONS, 'skipped', 'untagged']);

export const RUSHED_SHARE = 1 / 3;
export const STUCK_FACTOR = 2;
const MIN_RUSHED_SEC = 5;

const lost = (q) => q.outcome !== 'CORRECT';
const round2 = (n) => Math.round(n * 100) / 100;

/** The signal behind one lost question, from its time and the option chosen. */
export function signalFor(q) {
  if (q.outcome === 'INCORRECT') {
    const trap = (q.explanation?.traps || []).find((t) => t.optionId && t.optionId === q.selectedOptionId && t.note);
    if (trap) return { signal: 'trap', likely: 'concept', trap: trap.note };
    const exp = q.expectedTimeSec;
    if (exp && q.timeSpentSec < Math.max(MIN_RUSHED_SEC, exp * RUSHED_SHARE)) return { signal: 'rushed', likely: 'guess' };
    if (exp && q.timeSpentSec > exp * STUCK_FACTOR) return { signal: 'stuck', likely: 'concept' };
    return { signal: 'wrong', likely: null };
  }
  // UNATTEMPTED or TIMED_OUT
  if (!q.timeSpentSec) return { signal: 'notReached', likely: 'time' };
  return { signal: 'skipped', likely: 'skipped' };
}

/**
 * @param {Array} review   GET /mock/session/:id/analytics `review` (per question)
 * @param {Record<string,string>} tags  the student's tags by seq (`lossReasons`)
 * @param {{ positive: number, negative: number }} marking
 */
export function analyseLosses(review, tags = {}, marking = { positive: 1, negative: 0 }) {
  const items = review.filter(lost).map((q) => {
    const s = signalFor(q);
    const mine = tags[q.seq] ?? tags[String(q.seq)];
    const reason = mine ?? s.likely ?? 'untagged';
    const negative = q.outcome === 'INCORRECT' ? marking.negative : 0;
    return {
      seq: q.seq,
      topic: q.topic,
      outcome: q.outcome,
      timeSpentSec: q.timeSpentSec || 0,
      expectedTimeSec: q.expectedTimeSec ?? null,
      marksLost: q.marksLost ?? marking.positive + negative,
      negative,
      signal: s.signal,
      trap: s.trap ?? null,
      likely: s.likely,
      reason,
      source: mine ? 'you' : s.likely ? 'likely' : 'none',
    };
  });

  const buckets = BUCKETS.map((key) => {
    const its = items.filter((i) => i.reason === key);
    return { key, count: its.length, marksLost: round2(its.reduce((a, i) => a + i.marksLost, 0)), seqs: its.map((i) => i.seq) };
  }).filter((b) => b.count);

  const totalLost = round2(items.reduce((a, i) => a + i.marksLost, 0));
  return {
    items,
    buckets,
    totalLost,
    negativeLost: round2(items.reduce((a, i) => a + i.negative, 0)),
    timeOnLostSec: Math.round(items.reduce((a, i) => a + i.timeSpentSec, 0)),
    notReached: items.filter((i) => i.signal === 'notReached').length,
    tagged: items.filter((i) => i.source === 'you').length,
    needsTag: items.filter((i) => i.source === 'none').length,
    // Up to three next steps, for the reasons that cost the most marks.
    tips: buckets
      .slice()
      .sort((a, b) => b.marksLost - a.marksLost || BUCKETS.indexOf(a.key) - BUCKETS.indexOf(b.key))
      .slice(0, 3)
      .map((b) => ({ key: b.key, count: b.count, marksLost: b.marksLost })),
  };
}
