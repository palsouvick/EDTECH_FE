import { useEffect, useState } from 'react';
import { useDataSource } from '../../app/DataSourceContext';
import { Localized } from '../topic-hub/Localized';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { MP } from '../../lib/mockPapersCopy';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const SUBJECTS = ['quant', 'english', 'gs', 'reasoning', 'mixed'];
const WARNING_CODES = ['option_count', 'duplicate_stem', 'figure_reference', 'answer_out_of_range'];
const btn = 'min-h-9 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40';
const field = 'min-h-9 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function normStem(q) {
  return `${q.stemEn ?? ''} ${q.stemBn ?? ''}`.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?।]+$/u, '').trim();
}

/** Recompute the warnings the server recomputes on save (duplicate / figure), plus option count. */
function recomputeWarnings(questions) {
  const counts = new Map();
  for (const q of questions) {
    const key = normStem(q);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return questions.map((q) => {
    const warnings = new Set();
    if (q.options.length !== 4) warnings.add('option_count');
    if (normStem(q) && counts.get(normStem(q)) > 1) warnings.add('duplicate_stem');
    if (/figure|diagram|table|graph|picture|চিত্র|ছবি/i.test(`${q.stemEn ?? ''} ${q.stemBn ?? ''} ${q.options.join(' ')}`)) warnings.add('figure_reference');
    if (q.correctIndex != null && (q.correctIndex < 0 || q.correctIndex >= q.options.length)) warnings.add('answer_out_of_range');
    return [...warnings];
  });
}

/** The publish block, in the server's check order: empty, missing answers, unparsed. */
function publishBlock(paper, questions, unparsed) {
  if (questions.length === 0) return MP.blockedEmpty;
  const missing = questions.filter((q) => q.correctIndex == null).length;
  if (missing > 0) return MP.blockedMissingAnswers(missing);
  if (unparsed.length > 0) return MP.blockedUnparsed(unparsed.length);
  return null;
}

function QuestionEditor({ q, index, lang, onChange, onDelete }) {
  const set = (patch) => onChange(index, { ...q, ...patch });
  const setOption = (oi, value) => set({ options: q.options.map((o, i) => (i === oi ? value : o)) });
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900 dark:text-white">
          <Localized value={MP.questionHeading(q.n)} />
        </h3>
        <button type="button" onClick={() => onDelete(index)} className={`${btn} bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300`}>
          <Localized value={MP.deleteQuestion} />
        </button>
      </div>

      {(q.warnings ?? []).length > 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Localized value={MP.warningsLabel} />:{' '}
          {(q.warnings ?? []).filter((w) => WARNING_CODES.includes(w)).map((w) => <Localized key={w} value={MP.warnings[w]} />).reduce((acc, el, i) => (i === 0 ? [el] : [...acc, ', ', el]), [])}
        </p>
      )}
      {q.correctIndex == null && (
        <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300"><Localized value={MP.missingAnswer} /></p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor={`stem-en-${index}`}><Localized value={MP.stemEnLabel} /></label>
          <textarea id={`stem-en-${index}`} value={q.stemEn ?? ''} onChange={(e) => set({ stemEn: e.target.value })} rows={2} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`stem-bn-${index}`}><Localized value={MP.stemBnLabel} /></label>
          <textarea id={`stem-bn-${index}`} value={q.stemBn ?? ''} onChange={(e) => set({ stemBn: e.target.value })} rows={2} className={field} />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {q.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-sm font-bold text-slate-500">{LETTERS[oi]}.</span>
            <label className="sr-only" htmlFor={`opt-${index}-${oi}`}><Localized value={MP.optionLabel(LETTERS[oi])} /></label>
            <input id={`opt-${index}-${oi}`} value={opt} onChange={(e) => setOption(oi, e.target.value)} className={field} />
            {q.options.length > 2 && (
              <button type="button" aria-label={MP.removeOption[lang]} onClick={() => set({ options: q.options.filter((_, i) => i !== oi), correctIndex: q.correctIndex === oi ? null : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex })} className={`${btn} shrink-0 ring-1 ring-slate-300 dark:text-white`}>
                ✕
              </button>
            )}
          </div>
        ))}
        {q.options.length < 5 && (
          <button type="button" onClick={() => set({ options: [...q.options, ''] })} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>
            <Localized value={MP.addOption} />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor={`correct-${index}`}><Localized value={MP.correctAnswerLabel} /></label>
          <select
            id={`correct-${index}`}
            value={q.correctIndex == null ? '' : String(q.correctIndex)}
            onChange={(e) => set({ correctIndex: e.target.value === '' ? null : Number(e.target.value) })}
            className={field}
          >
            <option value="">{MP.noAnswer[lang]}</option>
            {q.options.map((_, oi) => (
              <option key={oi} value={String(oi)}>{LETTERS[oi]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor={`expl-en-${index}`}><Localized value={MP.explanationEnLabel} /></label>
          <input id={`expl-en-${index}`} value={q.explanationEn ?? ''} onChange={(e) => set({ explanationEn: e.target.value })} className={field} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`expl-bn-${index}`}><Localized value={MP.explanationBnLabel} /></label>
          <input id={`expl-bn-${index}`} value={q.explanationBn ?? ''} onChange={(e) => set({ explanationBn: e.target.value })} className={field} />
        </div>
      </div>
    </article>
  );
}

/** Admin Console → Mock Papers: paste, review, publish. Behind the existing isAdmin gate. */
export default function MockPapersAdmin() {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const [list, setList] = useState({ status: 'loading' });
  const [paper, setPaper] = useState(null);
  const [title, setTitle] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState([]);
  const [unparsed, setUnparsed] = useState([]);
  const [form, setForm] = useState({ title: '', sourceLabel: '', subject: '', text: '' });
  const [formError, setFormError] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [savedNote, setSavedNote] = useState(false);

  const loadList = () => {
    setList({ status: 'loading' });
    source.listAdminMockPapers().then(
      (data) => setList({ status: 'ready', data }),
      (err) => setList({ status: 'error', error: err }),
    );
  };
  useEffect(loadList, [source]);

  const openPaper = async (id) => {
    setError('');
    setBusy('open');
    try {
      const { paper: p } = await source.getAdminMockPaper(id);
      setPaper(p);
      setTitle(p.title);
      setSourceLabel(p.sourceLabel);
      setSubject(p.subject ?? '');
      setQuestions(p.questions ?? []);
      setUnparsed(p.unparsed ?? []);
      setSavedNote(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setFormError(null);
    setError('');
    if (!form.text.trim()) {
      setFormError(MP.createNeedsText);
      return;
    }
    if (!form.title.trim()) {
      setFormError(MP.createNeedsTitle);
      return;
    }
    if (!form.sourceLabel.trim()) {
      setFormError(MP.createNeedsSource);
      return;
    }
    setBusy('create');
    try {
      const { paper: p } = await source.createMockPaper({
        title: form.title.trim(),
        sourceLabel: form.sourceLabel.trim(),
        ...(form.subject ? { subject: form.subject } : {}),
        text: form.text,
      });
      setPaper(p);
      setTitle(p.title);
      setSourceLabel(p.sourceLabel);
      setSubject(p.subject ?? '');
      setQuestions(p.questions ?? []);
      setUnparsed(p.unparsed ?? []);
      setForm({ title: '', sourceLabel: '', subject: '', text: '' });
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!paper) return;
    setError('');
    setSavedNote(false);
    setBusy('save');
    try {
      const warnings = recomputeWarnings(questions);
      const body = {
        title: title.trim(),
        sourceLabel: sourceLabel.trim(),
        subject: subject || null,
        questions: questions.map((q, i) => ({
          n: q.n,
          stemEn: q.stemEn?.trim() ? q.stemEn : null,
          stemBn: q.stemBn?.trim() ? q.stemBn : null,
          options: q.options,
          correctIndex: q.correctIndex,
          explanationEn: q.explanationEn?.trim() ? q.explanationEn : null,
          explanationBn: q.explanationBn?.trim() ? q.explanationBn : null,
          warnings: warnings[i],
        })),
        unparsed,
      };
      const { paper: p } = await source.updateMockPaper(paper.id, body);
      setPaper(p);
      setQuestions(p.questions ?? []);
      setUnparsed(p.unparsed ?? []);
      setSavedNote(true);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!paper || !window.confirm(MP.publishConfirm[lang])) return;
    setError('');
    setBusy('publish');
    try {
      const { paper: p } = await source.publishMockPaper(paper.id);
      setPaper(p);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    if (!paper) return;
    setError('');
    setBusy('unpublish');
    try {
      const { paper: p } = await source.unpublishMockPaper(paper.id);
      setPaper(p);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!paper || !window.confirm(MP.deleteConfirm[lang])) return;
    setError('');
    setBusy('delete');
    try {
      await source.deleteMockPaper(paper.id);
      setPaper(null);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const block = paper ? publishBlock(paper, questions, unparsed) : null;
  const missingCount = questions.filter((q) => q.correctIndex == null).length;
  const papers = list.data?.papers ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={MP.adminTitle} /></h2>
        <Localized value={MP.adminSubtitle} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900">{error}</p>}

      {!paper && (
        <>
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
            <h3 className="font-bold text-slate-900 dark:text-white"><Localized value={MP.newPaper} /></h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor="mock-new-title"><Localized value={MP.paperTitleLabel} /></label>
                <input id="mock-new-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={MP.paperTitlePlaceholder[lang]} className={field} />
              </div>
              <div>
                <label className={labelCls} htmlFor="mock-new-source"><Localized value={MP.sourceLabelLabel} /></label>
                <input id="mock-new-source" value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} placeholder={MP.sourceLabelPlaceholder[lang]} className={field} />
              </div>
              <div>
                <label className={labelCls} htmlFor="mock-new-subject"><Localized value={MP.subjectLabel} /></label>
                <select id="mock-new-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field}>
                  <option value="">{MP.subjectNone[lang]}</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{MP.subjects[s][lang]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="mock-new-text"><Localized value={MP.pasteLabel} /></label>
              <textarea id="mock-new-text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={10} placeholder={MP.pastePlaceholder[lang]} className={field} />
              <Localized value={MP.pasteHint} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
            </div>
            {formError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300"><Localized value={formError} /></p>}
            <button type="button" disabled={busy === 'create'} onClick={create} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
              <Localized value={busy === 'create' ? MP.creating : MP.createDraft} />
            </button>
          </section>

          <section className="space-y-3">
            {list.status === 'loading' && <p className="text-sm text-slate-500">…</p>}
            {list.status === 'error' && <p role="alert" className="text-sm text-rose-600">{list.error.message}</p>}
            {list.status === 'ready' && papers.length === 0 && (
              <Localized value={MP.listEmpty} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
            )}
            {papers.map((p) => (
              <article key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <Localized value={MP.sourceLabel(p.sourceLabel)} /> · <Localized value={MP.questionsCount(p.questionCount)} /> ·{' '}
                    <Localized value={p.status === 'PUBLISHED' ? MP.published : MP.draft} />
                    {p.missingAnswerCount > 0 && <> · <Localized value={MP.missingAnswerBanner(p.missingAnswerCount)} /></>}
                    {p.unparsedCount > 0 && <> · <Localized value={MP.blockedUnparsed(p.unparsedCount)} /></>}
                  </p>
                  <p className="text-xs text-slate-400"><Localized value={MP.createdAt(new Date(p.createdAt).toLocaleDateString())} /></p>
                </div>
                <button type="button" disabled={busy === 'open'} onClick={() => openPaper(p.id)} className={`${btn} bg-indigo-600 text-white`}>
                  <Localized value={MP.openReview} />
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      {paper && (
        <>
          <button type="button" onClick={() => setPaper(null)} className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            <Localized value={MP.backToPapers} />
          </button>

          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor="mock-edit-title"><Localized value={MP.paperTitleLabel} /></label>
                <input id="mock-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
              </div>
              <div>
                <label className={labelCls} htmlFor="mock-edit-source"><Localized value={MP.sourceLabelLabel} /></label>
                <input id="mock-edit-source" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} className={field} />
              </div>
              <div>
                <label className={labelCls} htmlFor="mock-edit-subject"><Localized value={MP.subjectLabel} /></label>
                <select id="mock-edit-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={field}>
                  <option value="">{MP.subjectNone[lang]}</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{MP.subjects[s][lang]}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <Localized value={paper.status === 'PUBLISHED' ? MP.published : MP.draft} />
              {paper.status === 'PUBLISHED' && <> — <Localized value={MP.publishedNote} /></>}
            </p>

            {missingCount > 0 && (
              <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900">
                <Localized value={MP.missingAnswerBanner(missingCount)} />
              </p>
            )}
            {block && (
              <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                <Localized value={MP.publishBlocked} />: <Localized value={block} />
              </p>
            )}
            {savedNote && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300"><Localized value={MP.saved} /></p>}

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy === 'save' || paper.status !== 'DRAFT'} onClick={save} className={`${btn} bg-indigo-600 text-white`}>
                <Localized value={busy === 'save' ? MP.saving : MP.save} />
              </button>
              {paper.status === 'DRAFT' && (
                <button type="button" disabled={busy === 'publish' || Boolean(block)} onClick={publish} className={`${btn} bg-emerald-600 text-white`}>
                  <Localized value={busy === 'publish' ? MP.publishing : MP.publish} />
                </button>
              )}
              {paper.status === 'PUBLISHED' && (
                <button type="button" disabled={busy === 'unpublish'} onClick={unpublish} className={`${btn} bg-amber-600 text-white`}>
                  <Localized value={busy === 'unpublish' ? MP.unpublishing : MP.unpublish} />
                </button>
              )}
              {paper.status === 'DRAFT' && (
                <button type="button" disabled={busy === 'delete'} onClick={remove} className={`${btn} bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300`}>
                  <Localized value={busy === 'delete' ? MP.deleting : MP.deletePaper} />
                </button>
              )}
            </div>
          </section>

          {unparsed.length > 0 && (
            <section className="space-y-3" aria-labelledby="unparsed-title">
              <h3 id="unparsed-title" className="font-bold text-slate-900 dark:text-white">
                <Localized value={MP.unparsedHeading(unparsed.length)} />
              </h3>
              <Localized value={MP.unparsedHint} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
              {unparsed.map((block, i) => (
                <article key={i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{block.text}</pre>
                  <button type="button" onClick={() => setUnparsed(unparsed.filter((_, j) => j !== i))} className={`${btn} mt-3 ring-1 ring-slate-300 dark:text-white`}>
                    <Localized value={MP.discardBlock} />
                  </button>
                </article>
              ))}
            </section>
          )}

          <section className="space-y-3" aria-labelledby="questions-title">
            <h3 id="questions-title" className="font-bold text-slate-900 dark:text-white">
              <Localized value={MP.questionsHeading(questions.length)} />
            </h3>
            {questions.map((q, i) => (
              <QuestionEditor
                key={q.n ?? i}
                q={q}
                index={i}
                lang={lang}
                onChange={(idx, next) => setQuestions(questions.map((old, j) => (j === idx ? next : old)))}
                onDelete={(idx) => setQuestions(questions.filter((_, j) => j !== idx))}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
