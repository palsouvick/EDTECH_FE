/**
 * "Re-attempt incorrect questions": choose up to `size` failed questions from a
 * submitted test's review for a short retry session.
 *
 * Rules:
 *  1. Wrong answers first; unattempted / timed-out ones only top up the set.
 *  2. Round-robin across topics, weakest topic (most marks lost) first, so five
 *     retries cover several weak spots instead of five copies of one.
 *  3. Within a topic, the question the student spent longest on first: that is
 *     where they struggled most.
 *  4. Options are reshuffled, so a retry tests the method, not the remembered
 *     position of the answer.
 *
 * Pure apart from the shuffle's `random` (injectable for tests).
 */
export function buildRetrySet(review, topicBreakdown = [], { size = 5, random = Math.random } = {}) {
  const usable = review.filter((r) => !r.unavailable && r.options?.length);
  const weakness = new Map(topicBreakdown.map((t, i) => [t.topic, i])); // already sorted by marks lost
  const rankTopic = (t) => weakness.get(t) ?? Number.MAX_SAFE_INTEGER;

  const pickFrom = (pool) => {
    const byTopic = new Map();
    for (const r of [...pool].sort((a, b) => (b.timeSpentSec ?? 0) - (a.timeSpentSec ?? 0))) {
      if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
      byTopic.get(r.topic).push(r);
    }
    const queues = [...byTopic.entries()].sort((a, b) => rankTopic(a[0]) - rankTopic(b[0])).map(([, q]) => q);
    const out = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift());
    return out;
  };

  const incorrect = pickFrom(usable.filter((r) => r.outcome === 'INCORRECT'));
  const unattempted = pickFrom(usable.filter((r) => r.outcome === 'UNATTEMPTED' || r.outcome === 'TIMED_OUT'));
  const chosen = [...incorrect, ...unattempted].slice(0, size);

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  return {
    questions: chosen.map((r) => ({
      questionId: r.questionId,
      topic: r.topic,
      subtopic: r.subtopic ?? null,
      languages: r.languages ?? Object.keys(r.stem ?? {}),
      stem: r.stem,
      media: r.media ?? [],
      options: shuffle(r.options),
      pyq: r.pyq ?? [],
      bookmarked: false,
    })),
    incorrectTotal: incorrect.length,
    fromIncorrect: Math.min(incorrect.length, size),
    fromUnattempted: Math.max(0, chosen.length - Math.min(incorrect.length, size)),
  };
}

/** A practice source over a fixed question list; verification etc. delegate to `base`. */
export function createStaticPracticeSource(questions, base) {
  return {
    ...base,
    fetchPage: async () => ({ questions, nextCursor: null, hasMore: false }),
  };
}
