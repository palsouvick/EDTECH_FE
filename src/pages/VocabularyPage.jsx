import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOptionalAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import PageShell from '../components/navigation/PageShell';
import BengaliReviewNote, { CMU_CREDIT } from '../components/vocabulary/BengaliReviewNote';

const MODES = [
  ['meaning', 'Meaning'],
  ['synonym', 'Synonym'],
  ['antonym', 'Antonym'],
  ['fill_blank', 'Fill in the blank'],
  ['context', 'Context'],
  ['match', 'Match meaning'],
  ['identify', 'Identify the word'],
];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const panel = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const field = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';
const button = 'inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${button} bg-indigo-600 text-white hover:bg-indigo-500`;
const secondary = `${button} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700`;

const titleCase = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const messageOf = (error) => error?.message || 'Something went wrong. Please try again.';

function WordCard({ word, onState, busy, signedIn }) {
  const progress = word.progress || {};
  return (
    <article className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{word.word}</h2>
          <p className="mt-1 text-lg font-semibold text-indigo-700 dark:text-indigo-300">{word.meaningBn}</p>
          <BengaliReviewNote review={word.bengaliReview} className="mt-1" />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{word.partOfSpeech} · {titleCase(word.difficulty)}</p>
        </div>
        {word.pronunciation && <span title={word.pronunciationSource === 'CMUDICT' ? CMU_CREDIT : undefined} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{word.pronunciation}</span>}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{word.definitionEn}</p>
      {word.explanationBn && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{word.explanationBn}</p>}
      <div className="mt-4 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/40">
        <p className="text-sm italic text-slate-800 dark:text-slate-100">{word.exampleEn}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{word.exampleBn}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="text-sm"><strong className="text-slate-900 dark:text-white">Synonyms: </strong><span className="text-slate-600 dark:text-slate-300">{word.synonyms.join(', ') || '—'}</span></p>
        <p className="text-sm"><strong className="text-slate-900 dark:text-white">Antonyms: </strong><span className="text-slate-600 dark:text-slate-300">{word.antonyms.join(', ') || '—'}</span></p>
      </div>
      {word.nearSynonyms?.length > 0 && (
        <p className="mt-2 text-sm"><strong className="text-slate-900 dark:text-white">Similar meaning (not always interchangeable): </strong><span className="text-slate-600 dark:text-slate-300">{word.nearSynonyms.join(', ')}</span></p>
      )}
      {word.confusables?.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {word.confusables.map((c) => (
            <li key={c.word}><strong className="text-slate-900 dark:text-white">Often confused with {c.word}: </strong><span className="text-slate-600 dark:text-slate-300">{c.noteEn}</span> <span lang="bn" className="text-slate-500 dark:text-slate-400">{c.noteBn}</span></li>
          ))}
        </ul>
      )}
      {word.collocations?.length > 0 && (
        <p className="mt-2 text-sm"><strong className="text-slate-900 dark:text-white">Common usage: </strong><span className="text-slate-600 dark:text-slate-300">{word.collocations.join(' · ')}</span></p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {word.categories.map((category) => <span key={category} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{titleCase(category)}</span>)}
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {word.examRelevance?.some((item) => item.basis === 'PYQ_VERIFIED') ? 'PYQ source linked' : 'General practice · not PYQ verified'}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Source: {titleCase(word.sourceStatus || 'UNVERIFIED')}</span>
      </div>
      {word.sources?.length > 0 && <ul className="mt-3 space-y-1 text-xs">{word.sources.map((source, index) => (
        <li key={`${source.url}-${index}`}>
          {source.url?.startsWith('https://')
        ? <a className="text-indigo-700 underline dark:text-indigo-300" href={source.url} target="_blank" rel="noreferrer">{source.title || source.type} {source.examName ? `· ${source.examName}` : ''} {source.year ? `(${source.year})` : ''} {source.questionCode ? `· ${source.questionCode}` : ''}</a>
            : <span className="text-slate-500">{source.title || source.type}</span>}
        </li>
      ))}</ul>}
      {signedIn ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" className={progress.learned ? primary : secondary} disabled={busy} onClick={() => onState(word, 'learned', !progress.learned)}>
            {progress.learned ? 'Learned ✓' : 'Mark learned'}
          </button>
          <button type="button" className={progress.difficult ? primary : secondary} disabled={busy} onClick={() => onState(word, 'difficult', !progress.difficult)}>
            {progress.difficult ? 'Difficult ✓' : 'Mark difficult'}
          </button>
          <button type="button" className={progress.favourite ? primary : secondary} disabled={busy} onClick={() => onState(word, 'favourite', !progress.favourite)}>
            {progress.favourite ? '★ Favourite' : '☆ Favourite'}
          </button>
        </div>
      ) : (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">Sign in to save learned, difficult, and favourite words.</p>
      )}
    </article>
  );
}

export default function VocabularyPage() {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const user = auth?.user;
  const location = useLocation();
  const [tab, setTab] = useState('browse');
  const [words, setWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [wordOfDay, setWordOfDay] = useState(null);
  const [wordOfDayLoaded, setWordOfDayLoaded] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyWord, setBusyWord] = useState('');
  const [error, setError] = useState('');
  const [targetBusy, setTargetBusy] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);
  const [practiceMode, setPracticeMode] = useState('meaning');
  const [practice, setPractice] = useState(null);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [answer, setAnswer] = useState(null);
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [reviewType, setReviewType] = useState('due');
  const [reviewWords, setReviewWords] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewResult, setReviewResult] = useState(null);

  const categories = useMemo(
    () => availableCategories.length ? availableCategories : [...new Set(words.flatMap((word) => word.categories))].sort(),
    [availableCategories, words],
  );
  const currentQuestion = practice?.questions?.[practiceIndex];
  const reviewWord = reviewWords[reviewIndex];
  const signedIn = Boolean(user);
  const loginHref = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      source.listVocabularyWords({
        q: query,
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        offset: 0,
        limit: 50,
      }).then((result) => {
        if (!live) return;
        setWords(result.words);
        setTotal(result.total);
        setOffset(result.words.length);
        setAvailableCategories(result.categories || []);
      }).catch((loadError) => {
        if (live) setError(messageOf(loadError));
      }).finally(() => live && setLoading(false));
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [source, query, category, difficulty, status, user]);

  useEffect(() => {
    let live = true;
    source.getVocabularyWordOfDay()
      .then((result) => {
        if (!live) return;
        setWordOfDay(result.word);
        setWordOfDayLoaded(true);
      })
      .catch((loadError) => live && setError(messageOf(loadError)));
    return () => { live = false; };
  }, [source]);

  useEffect(() => {
    let live = true;
    if (!signedIn) {
      setSummary(null);
      return () => { live = false; };
    }
    source.getVocabularyProgressSummary().then((result) => live && setSummary(result)).catch((loadError) => live && setError(messageOf(loadError)));
    return () => { live = false; };
  }, [source, signedIn]);

  useEffect(() => {
    let live = true;
    if (tab !== 'review' || !signedIn) return () => { live = false; };
    setReviewWords([]);
    setReviewIndex(0);
    setReviewResult(null);
    source.getVocabularyReview(reviewType).then((result) => live && setReviewWords(result.words)).catch((loadError) => live && setError(messageOf(loadError)));
    return () => { live = false; };
  }, [source, tab, reviewType, signedIn]);

  async function refreshProgress() {
    if (!signedIn) return;
    const result = await source.getVocabularyProgressSummary();
    setSummary(result);
  }

  async function updateWord(word, state, value) {
    if (!signedIn) return;
    setBusyWord(word.id);
    setError('');
    try {
      await source.setVocabularyWordState(word.id, state, value);
      setWords((current) => current.map((entry) => entry.id === word.id
        ? { ...entry, progress: { ...(entry.progress || {}), [state]: value } }
        : entry));
      if (wordOfDay?.id === word.id) setWordOfDay((current) => ({ ...current, progress: { ...(current.progress || {}), [state]: value } }));
      await refreshProgress();
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setBusyWord('');
    }
  }

  async function loadMore() {
    setLoading(true);
    setError('');
    try {
      const result = await source.listVocabularyWords({
        q: query,
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        offset,
        limit: 50,
      });
      setWords((current) => [...current, ...result.words]);
      setOffset(offset + result.words.length);
      setTotal(result.total);
    } catch (loadError) {
      setError(messageOf(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function saveTarget(value) {
    setTargetBusy(true);
    setError('');
    try {
      await source.setVocabularyTarget(value);
      await refreshProgress();
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setTargetBusy(false);
    }
  }

  async function startPractice(mode = practiceMode) {
    setPracticeBusy(true);
    setError('');
    setSelected('');
    setAnswer(null);
    setPracticeIndex(0);
    try {
      const session = await source.createVocabularyPracticeSession({ mode, count: 10 });
      setPractice(session);
      setPracticeMode(mode);
      setTab('practice');
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setPracticeBusy(false);
    }
  }

  async function submitPractice() {
    if (!currentQuestion || !selected || !practice) return;
    setPracticeBusy(true);
    setError('');
    try {
      const result = await source.answerVocabularyPractice(practice.sessionToken, {
        questionId: currentQuestion.questionId,
        selectedOptionId: selected,
      });
      setAnswer(result);
      await refreshProgress();
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setPracticeBusy(false);
    }
  }

  async function submitReview(known) {
    if (!reviewWord) return;
    setPracticeBusy(true);
    setError('');
    try {
      const result = await source.answerVocabularyReview({ wordId: reviewWord.id, known });
      setReviewResult(result);
      await refreshProgress();
    } catch (actionError) {
      setError(messageOf(actionError));
    } finally {
      setPracticeBusy(false);
    }
  }

  async function loadMoreReview() {
    setReviewIndex((index) => index + 1);
    setReviewResult(null);
  }

  const answered = practice?.questions?.filter((question) => question.index < practiceIndex).length || 0;

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-10">
      <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-indigo-100">English learning library</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Vocabulary Mastery</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-indigo-100 sm:text-base">Learn the meaning, usage, and Bengali translation of each word. Practise, mark difficult words, and revisit them on schedule.</p>
      </header>

      {error && <p role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className={`${panel} bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900`} aria-labelledby="word-of-day-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Word of the Day · {wordOfDay?.word ? 'Daily rotation' : 'Loading'}</p>
              <h2 id="word-of-day-title" className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{wordOfDay?.word || (wordOfDayLoaded ? 'No published words yet' : 'Preparing your word…')}</h2>
              {wordOfDay && <p className="mt-1 text-lg font-semibold text-indigo-700 dark:text-indigo-300">{wordOfDay.meaningBn}</p>}
              {wordOfDay && <BengaliReviewNote review={wordOfDay.bengaliReview} />}
            </div>
            {wordOfDay && signedIn && <button type="button" className={secondary} onClick={() => updateWord(wordOfDay, 'learned', !wordOfDay.progress?.learned)}>{wordOfDay.progress?.learned ? 'Learned ✓' : 'Mark learned'}</button>}
          </div>
          {wordOfDay && <><p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{wordOfDay.definitionEn}</p><p className="mt-3 text-sm italic text-slate-600 dark:text-slate-300">{wordOfDay.exampleEn}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{wordOfDay.exampleBn}</p></>}
        </section>

        <section className={panel} aria-label="Learning target and progress">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Daily learning target</p><p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{summary ? `${summary.learnedToday} / ${summary.dailyTarget}` : '10 · 15 · 20'}</p></div>
            {signedIn && <label className="text-xs font-semibold text-slate-500">Target
              <select aria-label="Daily word target" disabled={targetBusy} value={summary?.dailyTarget || 10} onChange={(event) => saveTarget(Number(event.target.value))} className={`${field} mt-1`}>
                {[10, 15, 20].map((value) => <option key={value} value={value}>{value} words</option>)}
              </select>
            </label>}
          </div>
          {signedIn ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, ((summary?.learnedToday || 0) / (summary?.dailyTarget || 10)) * 100)}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">{summary?.learned || 0} learned · {summary?.due || 0} due · {summary?.missed || 0} missed</p>
              <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Overall: {summary?.learned || 0} / {summary?.totalPublished || 0} words learned ({summary?.totalPublished ? Math.round((summary.learned / summary.totalPublished) * 100) : 0}%)</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${summary?.totalPublished ? Math.min(100, (summary.learned / summary.totalPublished) * 100) : 0}%` }} /></div>
            </>
          ) : <p className="mt-3 text-sm text-slate-600 dark:text-slate-300"><Link className="font-bold text-indigo-700 underline dark:text-indigo-300" to={loginHref}>Sign in</Link> to save your daily goal and learning progress.</p>}
        </section>
      </div>

      <nav aria-label="Vocabulary activities" className="my-6 flex gap-2 overflow-x-auto pb-1">
        {[['browse', 'Browse words'], ['flashcards', 'Flashcards'], ['practice', 'Practice'], ['review', 'Due & missed review']].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? primary : secondary} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === 'browse' && (
        <>
          <section className={`${panel} mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4`} aria-label="Vocabulary filters">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search word or Bengali meaning
              <input className={`${field} mt-1`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. abundant, প্রচুর" />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category
              <select className={`${field} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((entry) => <option key={entry} value={entry}>{titleCase(entry)}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Difficulty
              <select className={`${field} mt-1`} value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">All levels</option>{DIFFICULTIES.map((entry) => <option key={entry} value={entry}>{titleCase(entry)}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">My words
              <select className={`${field} mt-1`} value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All words</option><option value="new">New</option><option value="learned">Learned</option><option value="difficult">Difficult</option><option value="favourite">Favourite</option>
              </select>
            </label>
          </section>
          {status && !signedIn && <p className="mb-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">Sign in to use personal word filters.</p>}
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Word library</h2><p className="text-sm text-slate-500">{total} words</p></div>
          {loading && !words.length ? <p className="rounded-2xl bg-white p-6 text-slate-500 dark:bg-slate-900">Loading vocabulary…</p>
            : words.length ? <div className="grid gap-4 lg:grid-cols-2">{words.map((word) => <WordCard key={word.id} word={word} onState={updateWord} busy={busyWord === word.id} signedIn={signedIn} />)}</div>
              : <p className={panel}>No words match these filters yet.</p>}
          {offset < total && <div className="mt-5 text-center"><button type="button" className={secondary} disabled={loading} onClick={loadMore}>Load more words</button></div>}
        </>
      )}

      {tab === 'flashcards' && (
        <section className={`${panel} mx-auto max-w-2xl`}>
          <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Flashcards</h2><span className="text-sm text-slate-500">{words.length ? `${flashIndex + 1} / ${words.length}` : 'No cards'}</span></div>
          {words.length > 0 && <div className="mt-4 min-h-64 rounded-3xl bg-indigo-50 p-6 dark:bg-indigo-950/40">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Tap to {flashVisible ? 'hide' : 'reveal'}</p>
            <button type="button" className="mt-3 min-h-40 w-full rounded-2xl text-left" onClick={() => setFlashVisible((visible) => !visible)} aria-label={flashVisible ? 'Hide flashcard answer' : 'Reveal flashcard answer'}>
              <span className="block text-3xl font-extrabold text-slate-900 dark:text-white">{words[flashIndex % words.length].word}</span>
              {flashVisible ? <span className="mt-4 block space-y-2 text-slate-700 dark:text-slate-200"><span className="block text-lg font-semibold">{words[flashIndex % words.length].meaningBn}</span><BengaliReviewNote review={words[flashIndex % words.length].bengaliReview} /><span className="block">{words[flashIndex % words.length].definitionEn}</span><span className="block italic">{words[flashIndex % words.length].exampleEn}</span></span> : <span className="mt-4 block text-sm text-slate-500">Think of the meaning, then reveal the answer.</span>}
            </button>
          </div>}
          <div className="mt-4 flex justify-between"><button type="button" className={secondary} onClick={() => { setFlashIndex((i) => Math.max(0, i - 1)); setFlashVisible(false); }}>Previous</button><button type="button" className={primary} onClick={() => { setFlashIndex((i) => (i + 1) % Math.max(1, words.length)); setFlashVisible(false); }}>Next card</button></div>
        </section>
      )}

      {tab === 'practice' && (
        <section className={`${panel} mx-auto max-w-3xl`}>
          {!practice ? <>
            <h2 className="text-xl font-extrabold">Choose a practice mode</h2>
            <p className="mt-1 text-sm text-slate-500">Questions are created from published learning cards. The answer is checked by the server and revealed after your response.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{MODES.map(([mode, label]) => <button key={mode} type="button" className={primary} disabled={practiceBusy} onClick={() => startPractice(mode)}>{label}</button>)}</div>
          </> : currentQuestion ? <>
            <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">{titleCase(practiceMode)} practice</h2><span className="text-sm text-slate-500">{answered + (answer ? 1 : 0)} / {practice.questions.length}</span></div>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">{currentQuestion.prompt}</p>
            <div className="mt-4 grid gap-2">{currentQuestion.options.map((option) => {
              const picked = selected === option.optionId;
              const correct = answer?.correctOptionId === option.optionId;
              const wrong = answer?.selectedOptionId === option.optionId && !answer.isCorrect;
              return <button key={option.optionId} type="button" disabled={Boolean(answer) || practiceBusy} className={`${button} min-h-12 justify-start text-left ${correct ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-100' : wrong ? 'bg-rose-100 text-rose-900 ring-2 ring-rose-500 dark:bg-rose-950 dark:text-rose-100' : picked ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500 dark:bg-indigo-950 dark:text-indigo-100' : 'bg-slate-50 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`} onClick={() => setSelected(option.optionId)}>{option.text}</button>;
            })}</div>
            {answer && <div role="status" className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-slate-800 dark:bg-emerald-950/40 dark:text-slate-100">
              <p className="font-bold">{answer.isCorrect ? 'Correct!' : 'Review this word'}</p>
              <p className="mt-1">{answer.explanation.definitionEn}</p><p className="mt-1">{answer.explanation.meaningBn}</p><BengaliReviewNote review={answer.explanation.bengaliReview} /><p className="mt-2 italic">{answer.explanation.exampleEn}</p><p className="mt-1">{answer.explanation.exampleBn}</p>
              <p className="mt-2"><strong>Synonyms:</strong> {answer.explanation.synonyms.join(', ')} · <strong>Antonyms:</strong> {answer.explanation.antonyms.join(', ')}</p>
            </div>}
            <div className="mt-5 flex justify-end">{answer
              ? <button type="button" className={primary} onClick={() => { setPracticeIndex((i) => i + 1); setSelected(''); setAnswer(null); }}>Next question</button>
              : <button type="button" className={primary} disabled={!selected || practiceBusy} onClick={submitPractice}>Check answer</button>}</div>
          </> : <div><h2 className="text-xl font-extrabold">Practice complete</h2><p className="mt-2 text-slate-600 dark:text-slate-300">You finished this set. Review difficult words or start another mode.</p><button type="button" className={`${primary} mt-4`} onClick={() => setPractice(null)}>Choose another mode</button></div>}
        </section>
      )}

      {tab === 'review' && (
        <section className={`${panel} mx-auto max-w-3xl`}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold">Spaced revision</h2><p className="text-sm text-slate-500">Correct reviews extend the interval; missed words return tomorrow.</p></div>
            <select className={`${field} w-auto`} aria-label="Review queue" value={reviewType} onChange={(event) => setReviewType(event.target.value)}><option value="due">Due for review</option><option value="missed">Previously missed</option></select>
          </div>
          {!signedIn ? <p className="mt-4 text-sm">Sign in to save and review words. <Link className="font-bold text-indigo-700 underline dark:text-indigo-300" to={loginHref}>Sign in</Link></p>
            : reviewWord ? <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
              <p className="text-2xl font-extrabold">{reviewWord.word}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{reviewWord.definitionEn}</p>
              {reviewResult ? <div role="status" className="mt-4"><p>{reviewResult.known ? 'Good recall!' : `Keep revising · next review in ${reviewResult.intervalDays} day`}</p><button type="button" className={`${primary} mt-3`} onClick={loadMoreReview}>Next word</button></div>
                : <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={primary} disabled={practiceBusy} onClick={() => submitReview(true)}>I remembered</button><button type="button" className={secondary} disabled={practiceBusy} onClick={() => submitReview(false)}>I missed it</button></div>}
            </div> : <p className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">{reviewType === 'due' ? 'No words are due right now.' : 'No missed words to revise.'}</p>}
        </section>
      )}

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">Exam-relevance labels are evidence-based. Unsourced entries are shown as general practice, not verified PYQs.</p>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">{CMU_CREDIT}</p>
    </PageShell>
  );
}
