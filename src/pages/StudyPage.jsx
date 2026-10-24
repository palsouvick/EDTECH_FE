import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useOptionalAuth } from '../app/AuthContext';
import LoginNudge from '../components/auth/LoginNudge';
import { loginPath } from '../components/auth/AccountButton';
import { HAS_DEV_USER } from '../lib/api';
import { useDataSource } from '../app/DataSourceContext';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { useResource } from '../hooks/useResource';
import { FUNNEL, MOCK } from '../lib/i18n';
import { examStore } from '../lib/examStore';
import { createExamState } from '../features/mock/mockExamReducer';
import { lastVisitedStore } from '../lib/lastVisited';
import { categoryFromSlug, codeFromSlug, paths } from '../lib/routes';
import TopicSummaryHeader, { TopicSummaryHeaderSkeleton } from '../components/topic-hub/TopicSummaryHeader';
import PracticeArena from '../components/practice/PracticeArena';
import QuestionPatterns from '../components/topic-hub/QuestionPatterns';
import LearningPath from '../components/topic-hub/LearningPath';
import MockSetupDialog from '../components/mock/MockSetupDialog';
import { LoadError } from './funnel/FunnelLayout';
import SiteHeader from '../components/navigation/SiteHeader';
import Footer from '../components/navigation/Footer';

/**
 * Step 4: /exams/:category/:subject/:topicSlug. Learning path, concept hub,
 * question patterns (solved example + "your turn"), then the Practice Arena.
 * Everything comes from the URL, so a refreshed or shared link restores the
 * exact topic; anything unknown sends the student back to the nearest valid step.
 */
export default function StudyPage() {
  const params = useParams();
  const category = categoryFromSlug(params.category);
  const subject = codeFromSlug(params.subject);
  const topic = codeFromSlug(params.topicSlug);
  const [searchParams] = useSearchParams();
  // ?pattern=successive_change (from "My performance"): open that pattern, and with
  // ?practice=N also limit the practice questions to it.
  const pattern = /^[a-z0-9_]{1,60}$/.test(searchParams.get('pattern') || '') ? searchParams.get('pattern') : null;
  const route = useMemo(() => ({ category, subject, topic }), [category, subject, topic]);
  const valid = Boolean(category && subject && topic);

  const source = useDataSource();
  const { lang, setLang } = useLanguagePreference();
  const navigate = useNavigate();
  // ?practice=15 (from the result dashboard's weak-topic link): open at the arena with that goal.
  const practiceGoal = (() => {
    const n = Number(searchParams.get('practice'));
    return Number.isInteger(n) && n >= 1 && n <= 100 ? n : undefined;
  })();
  // Same key as TopicList: arriving from step 3 renders instantly from cache.
  const taxonomy = useResource(valid ? `subject:${category}:${subject}:${lang}` : null, () =>
    source.getSubject(category, subject, lang),
  );
  const tax = taxonomy.data ?? taxonomy.staleData;
  const topicEntry = tax?.topics.find((t) => t.code === topic);

  // The catalogue already says whether notes exist: only ask for them when they do,
  // and only once the topic is known to be real.
  const wantsSheet = Boolean(topicEntry?.hasSummary);
  const sheet = useResource(wantsSheet ? `summary:${category}:${subject}:${topic}` : null, () =>
    source.getTopicSummary(route),
  );

  // Question patterns are optional extras: a failed or empty load just hides the section.
  const patternsRes = useResource(valid && topicEntry ? `patterns:${subject}.${topic}` : null, () => source.getTopicPatterns({ subject, topic }));
  const patterns = patternsRes.data?.patterns ?? [];

  const drillPattern = practiceGoal && pattern ? pattern : null;
  const practiceSource = useMemo(
    () => (valid ? source.practiceSource(drillPattern ? { ...route, pattern: drillPattern } : route) : null),
    [source, route, valid, drillPattern],
  );
  const [arenaActive, setArenaActive] = useState(false);
  const [patternsActive, setPatternsActive] = useState(false);
  // null = closed; otherwise the question count to preselect.
  const [mockSetup, setMockSetup] = useState(null);

  const breadcrumb = useMemo(
    () =>
      tax &&
      topicEntry && {
        root: { name: FUNNEL.exams, href: paths.exams() },
        category: { code: category, name: tax.category.name, href: paths.category(category) },
        subject: { code: subject, name: tax.subject.name, href: paths.subject(category, subject) },
        topic: { code: topic, name: topicEntry.name },
      },
    [tax, topicEntry, category, subject, topic],
  );

  useEffect(() => {
    if (breadcrumb) {
      lastVisitedStore.set({
        category,
        subject,
        topic,
        names: { category: breadcrumb.category.name, subject: breadcrumb.subject.name, topic: breadcrumb.topic.name },
      });
    }
  }, [breadcrumb, category, subject, topic]);

  const scrolledToPractice = useRef(false);
  useEffect(() => {
    if (!practiceGoal || !breadcrumb || scrolledToPractice.current) return;
    scrolledToPractice.current = true;
    requestAnimationFrame(() => document.getElementById('practice-questions')?.scrollIntoView({ block: 'start' }));
  }, [practiceGoal, breadcrumb]);

  const jumpTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const startPractice = useCallback(() => jumpTo('practice-questions'), [jumpTo]);

  // Hub CTA, the practice milestone ("10-question timed test") and the arena's end screen all land here.
  const openMockSetup = useCallback((preset) => setMockSetup(preset?.questionCount ?? 25), []);

  // Mock sessions belong to an account on the server; offline fixtures and the dev test student need none.
  const auth = useOptionalAuth();
  const location = useLocation();
  const needsLogin = source.kind === 'http' && !HAS_DEV_USER && auth?.status === 'ready' && !auth.user;

  const startMock = useCallback(
    async (cfg) => {
      const session = await source.createMock({
        category,
        subject,
        topicIds: cfg.scope === 'topic' ? [topic] : [],
        questionCount: cfg.questionCount,
        timeLimitMinutes: cfg.timeLimitMinutes,
        perQuestionTimer: cfg.timerMode === 'perQuestion',
        perQuestionSeconds: cfg.perQuestionSeconds,
        allowPause: cfg.allowPause,
        markingScheme: cfg.markingScheme,
        language: cfg.language,
      });
      const scopeName = cfg.scope === 'topic' ? topicEntry.name : tax.subject.name;
      const pick = (v, l) => v?.[l] || v?.en || '';
      const exam = createExamState(session, {
        // "WBPSC · Profit, Loss & Discount · Mock Test", per language
        examName: Object.fromEntries(
          ['en', 'bn', 'hi'].map((l) => [l, `${pick(tax.category.name, l)} · ${pick(scopeName, l)} · ${MOCK.mockTest[l]}`]),
        ),
        category,
        subject,
        topic: cfg.scope === 'topic' ? topic : null,
        topicPath: paths.topic(category, subject, topic),
        topicNames: Object.fromEntries(tax.topics.map((t) => [t.code, t.name])),
      });
      await examStore.put(exam);
      setLang(cfg.language);
      // fresh: the test page should not greet this as a restored session.
      navigate(`/mock/${session.sessionId}`, { state: { fresh: true } });
    },
    [source, category, subject, topic, topicEntry, tax, setLang, navigate],
  );

  // ---- Guards: never fall back to a hard-coded topic ----------------------
  if (!category) return <Navigate to={paths.exams()} replace />;
  if (!subject || taxonomy.error?.status === 404) return <Navigate to={paths.category(category)} replace />;
  if (!topic || (tax && !topicEntry)) return <Navigate to={paths.subject(category, subject)} replace />;

  const failed = (taxonomy.status === 'error' && !tax) || (wantsSheet && sheet.status === 'error');
  const ready = breadcrumb && (!wantsSheet || sheet.status === 'ready');
  const summary = wantsSheet ? sheet.data : null;

  return (
    // Site header (scrolls away), then the page; the breadcrumb bar inside sticks.
    <div className="flex min-h-dvh flex-col">
      <SiteHeader sticky={false} showLanguage={false} />
      <main className="flex-1 pb-12">
        {failed ? (
          <div className="mx-auto mt-16 max-w-md px-4">
            <LoadError
              error={taxonomy.error ?? sheet.error}
              onRetry={() => {
                taxonomy.retry();
                sheet.retry();
              }}
            />
          </div>
        ) : !ready ? (
          <TopicSummaryHeaderSkeleton />
        ) : (
          <>
            <TopicSummaryHeader
              breadcrumb={breadcrumb}
              summary={summary}
              onStartPractice={startPractice}
              onLaunchMock={openMockSetup}
              ctaHidden={arenaActive || patternsActive}
              afterTitle={<LearningPath hasNotes={Boolean(summary?.formulas?.length)} hasPatterns={patterns.length > 0} onJump={jumpTo} onMock={() => openMockSetup()} />}
            />
            {patterns.length > 0 && <QuestionPatterns subject={subject} topic={topic} patterns={patterns} initialPattern={pattern} onPractice={startPractice} onActiveChange={setPatternsActive} />}
            {/* "Start practice" scrolls here. The hub's CTA bar steps aside while the arena is on screen. */}
            <div id="practice-questions" className="mx-auto max-w-3xl scroll-mt-28 px-4">
              {/* key: a new topic starts a fresh session (counters, cursor, milestones). */}
              <PracticeArena
                key={`${category}:${subject}:${topic}:${drillPattern ?? ''}`}
                source={practiceSource}
                topicName={topicEntry.name}
                onLaunchMock={openMockSetup}
                onActiveChange={setArenaActive}
                initialGoal={practiceGoal}
              />
            </div>
          </>
        )}

        <LoginNudge />

        {breadcrumb && (
          <MockSetupDialog
            open={mockSetup != null}
            initialCount={mockSetup ?? 25}
            onClose={() => setMockSetup(null)}
            onStart={startMock}
            topicName={topicEntry.name}
            subjectName={tax.subject.name}
            loginHref={needsLogin ? loginPath(location) : null}
          />
        )}
      </main>
      {/* Bottom padding keeps the footer clear of the fixed CTA bar. */}
      <Footer className="pb-28 sm:pb-24" />
    </div>
  );
}
