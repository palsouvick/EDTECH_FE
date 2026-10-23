import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AUTH, MOCK, markingLabel, minutesLabel, onlyAvailable, perQuestionLabel, startWith } from '../../lib/i18n';
import { languageStore } from '../../hooks/useLanguagePreference';
import Dialog from '../practice/Dialog';
import { Localized } from '../topic-hub/Localized';

export const QUESTION_COUNTS = [10, 25, 50, 100];
// Counts the API accepts, for the "start with fewer" fallback.
const API_COUNTS = [10, 20, 25, 50, 100];
const OVERALL_MINUTES = [10, 15, 20, 30, 45, 60, 90, 120];
const PER_QUESTION_SECONDS = [30, 45, 60, 90];
// Roughly SSC / Banking prelims pace.
const DEFAULT_MINUTES = { 10: 10, 25: 20, 50: 45, 100: 90 };
const MARKING = { positive: 1, negative: 0.25 };

function Chips({ label, value, options, onChange, render }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Localized value={label} />
      </legend>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o)}
              className={`min-h-11 min-w-12 rounded-xl px-3 text-sm font-semibold tabular-nums ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                active
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {render ? render(o) : o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ModeCard({ active, onClick, title, hint }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex-1 rounded-xl p-3 text-left ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
        active
          ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/10'
          : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <Localized value={title} className="block text-sm font-semibold text-slate-900 dark:text-white" />
      <Localized value={hint} className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400" />
    </button>
  );
}

/**
 * Pre-test configuration: question count, scope, timer mode, pause, language.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(cfg) => Promise<void>} props.onStart  rejects with ApiError on failure
 * @param {number} [props.initialCount]
 * @param {{ en?: string, bn?: string }} [props.topicName]  enables the "This topic" scope
 * @param {{ en?: string, bn?: string }} [props.subjectName]
 */
export default function MockSetupDialog({ open, onClose, onStart, initialCount = 25, topicName, subjectName, loginHref = null }) {
  const [count, setCount] = useState(initialCount);
  const [scope, setScope] = useState(topicName ? 'topic' : 'subject');
  const [timerMode, setTimerMode] = useState('overall');
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES[initialCount] ?? 20);
  const [seconds, setSeconds] = useState(45);
  const [allowPause, setAllowPause] = useState(false);
  const [language, setLanguage] = useState(() => (languageStore.get() === 'bn' ? 'bn' : 'en'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Re-opening (e.g. from the milestone's "10-question test") applies that count.
  useEffect(() => {
    if (!open) return;
    const c = QUESTION_COUNTS.includes(initialCount) ? initialCount : 25;
    setCount(c);
    setMinutes(DEFAULT_MINUTES[c]);
    setError(null);
    setBusy(false);
  }, [open, initialCount]);

  const pickCount = (c) => {
    setCount(c);
    setMinutes(DEFAULT_MINUTES[c]);
    setError(null);
  };

  async function start(questionCount = count) {
    setBusy(true);
    setError(null);
    try {
      await onStart({
        questionCount,
        scope,
        timerMode,
        timeLimitMinutes: timerMode === 'overall' ? minutes : undefined,
        perQuestionSeconds: timerMode === 'perQuestion' ? seconds : undefined,
        allowPause,
        language,
        markingScheme: MARKING,
      });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const available = error?.code === 'INSUFFICIENT_QUESTIONS' ? error.details?.available ?? 0 : null;
  const fallback = available != null ? [...API_COUNTS].reverse().find((n) => n <= available) : undefined;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} labelledBy="mock-setup-title" className="sm:w-[min(34rem,calc(100vw-2rem))]">
      <h2 id="mock-setup-title" className="text-lg font-bold text-slate-900 dark:text-white">
        <Localized value={MOCK.setupTitle} />
      </h2>
      {(topicName || subjectName) && (
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          <Localized value={scope === 'topic' && topicName ? topicName : subjectName} />
        </p>
      )}

      <div className="mt-5 space-y-5">
        <Chips label={MOCK.questionCount} value={count} options={QUESTION_COUNTS} onChange={pickCount} />

        {topicName && subjectName && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Localized value={MOCK.scope} />
            </legend>
            <div role="radiogroup" className="flex gap-2">
              <ModeCard active={scope === 'topic'} onClick={() => { setScope('topic'); setError(null); }} title={MOCK.scopeTopic} hint={topicName} />
              <ModeCard active={scope === 'subject'} onClick={() => { setScope('subject'); setError(null); }} title={MOCK.scopeSubject} hint={subjectName} />
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Localized value={MOCK.timerMode} />
          </legend>
          <div role="radiogroup" className="flex flex-col gap-2 sm:flex-row">
            <ModeCard active={timerMode === 'overall'} onClick={() => setTimerMode('overall')} title={MOCK.overallTimer} hint={MOCK.overallHint} />
            <ModeCard active={timerMode === 'perQuestion'} onClick={() => setTimerMode('perQuestion')} title={MOCK.perQuestionTimer} hint={MOCK.perQuestionHint} />
          </div>
          <div className="mt-3">
            {timerMode === 'overall' ? (
              <Chips label={MOCK.duration} value={minutes} options={OVERALL_MINUTES} onChange={setMinutes} render={(m) => <Localized value={minutesLabel(m)} />} />
            ) : (
              <Chips label={MOCK.questionTime} value={seconds} options={PER_QUESTION_SECONDS} onChange={setSeconds} render={(s) => `${s}s`} />
            )}
          </div>
          {timerMode === 'perQuestion' && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              <Localized value={perQuestionLabel(seconds)} /> · <Localized value={minutesLabel(Math.ceil((count * seconds) / 60))} />
            </p>
          )}
        </fieldset>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Localized value={MOCK.allowPause} as="p" className="text-sm font-semibold text-slate-800 dark:text-slate-100" />
            <Localized value={MOCK.allowPauseHint} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowPause}
            aria-label="Allow pausing"
            onClick={() => setAllowPause((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
              allowPause ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left] ${allowPause ? 'left-[1.375rem]' : 'left-0.5'}`} />
          </button>
        </div>

        <Chips
          label={MOCK.language}
          value={language}
          options={['en', 'bn']}
          onChange={setLanguage}
          render={(l) => <span lang={l}>{l === 'en' ? 'English' : 'বাংলা'}</span>}
        />

        <Localized value={markingLabel(MARKING.positive, MARKING.negative)} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
          {available != null ? <Localized value={onlyAvailable(available)} /> : error.message}
          <div className="mt-2 flex flex-wrap gap-2">
            {fallback && (
              <button type="button" onClick={() => start(fallback)} className="min-h-10 rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-500">
                <Localized value={startWith(fallback)} />
              </button>
            )}
            {available != null && scope === 'topic' && subjectName && (
              <button
                type="button"
                onClick={() => { setScope('subject'); setError(null); }}
                className="min-h-10 rounded-lg px-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:ring-amber-500/40"
              >
                <Localized value={MOCK.scopeSubject} />
              </button>
            )}
          </div>
        </div>
      )}

      {loginHref && (
        <Localized value={AUTH.mockNeedsLogin} as="p" className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100" />
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="min-h-12 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Localized value={MOCK.cancel} />
        </button>
        {loginHref ? (
          <Link
            to={loginHref}
            className="grid min-h-12 place-items-center rounded-xl bg-indigo-600 px-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Localized value={AUTH.loginToStartMock} />
          </Link>
        ) : (
        <button
          type="button"
          onClick={() => start()}
          disabled={busy}
          aria-busy={busy}
          className="min-h-12 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70"
        >
          <Localized value={busy ? MOCK.starting : MOCK.startTest} />
        </button>
        )}
      </div>
    </Dialog>
  );
}
