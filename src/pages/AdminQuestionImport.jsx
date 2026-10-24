import { useCallback, useEffect, useState } from 'react';
import { request } from '../lib/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const button = 'inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold';
const countLabels = [
  ['totalRows', 'Total rows'],
  ['validRows', 'Valid rows'],
  ['invalidRows', 'Invalid rows'],
  ['exactDuplicates', 'Exact duplicates'],
  ['possibleDuplicates', 'Possible duplicates'],
  ['answerConflicts', 'Answer conflicts'],
  ['questionsAlreadyPresent', 'Already in question bank'],
  ['newQuestionsReady', 'New questions ready'],
  ['successfullyImported', 'Successfully imported'],
  ['failedRows', 'Failed rows'],
];

function english(value) {
  return value?.en || value?.bn || value?.hi || '';
}

async function download(path, fallbackName) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || `Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fallbackName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function CountCards({ summary }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {countLabels.map(([key, label]) => (
        <div key={key} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <dd className="text-xl font-bold text-slate-900 dark:text-white">{summary?.[key] ?? 0}</dd>
          <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function PreviewRow({ row, decision, onDecision }) {
  const title = english(row.question?.question);
  const bengali = row.question?.question?.bn;
  const statusText = row.status.replaceAll('_', ' ').toLowerCase();
  const needsDecision = ['POSSIBLE_DUPLICATE', 'ANSWER_CONFLICT'].includes(row.status);
  return (
    <tr className="border-t border-slate-200 align-top dark:border-slate-800">
      <td className="p-3 text-sm font-semibold">Row {row.rowNumber}</td>
      <td className="max-w-md p-3 text-sm text-slate-800 dark:text-slate-100">
        {title}
        {bengali && bengali !== title && <p className="mt-1 text-slate-600 dark:text-slate-300">{bengali}</p>}
      </td>
      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
        {row.question ? `${row.question.subject} / ${row.question.topic}` : '—'}
      </td>
      <td className="p-3 text-sm">
        {row.duplicateId ? (
          <span className="font-mono" title={row.duplicateCode || ''}>{row.duplicateId}</span>
        ) : row.duplicateReference || '—'}
        {row.duplicateQuestion && (
          <p className="mt-1 text-xs text-slate-500">
            {row.duplicateQuestion.code} · {row.duplicateQuestion.subject}/{row.duplicateQuestion.topic}
            {row.duplicateQuestion.categories?.length ? ` · ${row.duplicateQuestion.categories.join(', ')}` : ''}
          </p>
        )}
      </td>
      <td className="p-3">
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${
          row.status === 'NEW' ? 'bg-emerald-100 text-emerald-800'
            : row.status === 'INVALID' ? 'bg-rose-100 text-rose-800'
              : row.status === 'ANSWER_CONFLICT' ? 'bg-orange-100 text-orange-900'
                : 'bg-amber-100 text-amber-900'
        }`}>{statusText}</span>
        {row.errors?.map((error, index) => (
          <p key={`${error.code}-${index}`} className="mt-1 text-xs text-rose-700">{error.code}: {error.message}</p>
        ))}
      </td>
      <td className="min-w-48 p-3">
        {row.duplicateReason && (
          <p className="mb-2 text-xs text-amber-900 dark:text-amber-200">{row.duplicateReason}</p>
        )}
        {needsDecision ? (
          <>
            <select
              aria-label={`Action for row ${row.rowNumber}`}
              className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={decision || ''}
              onChange={(event) => onDecision(row.rowNumber, event.target.value)}
            >
              <option value="">Choose an action</option>
              <option value="IMPORT_AS_NEW">Import as a separate draft</option>
              <option value="SKIP">Skip this row</option>
            </select>
          </>
        ) : row.status === 'EXACT_DUPLICATE' ? (
          <span className="text-xs font-semibold text-slate-500">Skipped; exact match</span>
        ) : row.status === 'NEW' ? (
          <span className="text-xs font-semibold text-emerald-700">Import as draft</span>
        ) : '—'}
      </td>
    </tr>
  );
}

export default function AdminQuestionImport() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [examCode, setExamCode] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState({});
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishingBatchId, setPublishingBatchId] = useState('');
  const [publishConfirmation, setPublishConfirmation] = useState(null);
  const [historyBusy, setHistoryBusy] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryBusy(true);
    try {
      const result = await request('/admin/import/batches?limit=10');
      setHistory(result.batches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    request('/catalog/categories?language=en')
      .then((data) => {
        if (!active) return;
        setCategories(data.categories || []);
        setCategory(data.categories?.find((item) => item.code === 'WBPSC')?.code || data.categories?.[0]?.code || '');
      })
      .catch((err) => active && setError(err.message));
    loadHistory();
    return () => { active = false; };
  }, [loadHistory]);

  useEffect(() => {
    if (!category) {
      setCategoryInfo(null);
      setSubjects([]);
      setExamCode('');
      return undefined;
    }
    let active = true;
    request(`/catalog/categories/${category}?language=en`)
      .then((data) => {
        if (!active) return;
        const info = data.category;
        setCategoryInfo(info);
        setSubjects(data.subjects || []);
        setExamCode(info.exams?.[0]?.code || '');
        setSubject('');
        setTopic('');
        setTopics([]);
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [category]);

  useEffect(() => {
    if (!category || !subject) {
      setTopics([]);
      setTopic('');
      return undefined;
    }
    let active = true;
    request(`/catalog/categories/${category}/subjects/${subject}?language=en`)
      .then((data) => {
        if (!active) return;
        setTopics(data.topics || []);
        setTopic('');
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [category, subject]);

  const setDuplicateDecision = (rowNumber, decision) => {
    setDuplicateDecisions((current) => ({ ...current, [rowNumber]: decision }));
  };

  const downloadTemplate = async (format) => {
    setError('');
    try {
      await download(`/admin/import/template.${format}`, `question-import-template.${format}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadCatalog = async () => {
    setError('');
    try {
      await download('/admin/import/catalog.csv', 'question-import-catalog.csv');
    } catch (err) {
      setError(err.message);
    }
  };

  const publishImportedDrafts = async () => {
    const batch = publishConfirmation;
    if (!batch) return;
    setPublishConfirmation(null);
    setPublishingBatchId(batch.id);
    setError('');
    setNotice('');
    try {
      const result = await request(`/admin/import/batches/${batch.id}/publish`, {
        method: 'POST',
        body: {},
      });
      setNotice(
        result.publishedCount
          ? `Published ${result.publishedCount} questions. ${result.remainingDraftCount} drafts remain in this batch.`
          : `No new questions were published. ${result.totalPublishedCount} from this batch are already published.`,
      );
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishingBatchId('');
    }
  };

  const uploadForPreview = async (event) => {
    event.preventDefault();
    if (!file || !category || !examCode) {
      setError('Choose an .xlsx or .csv file, an exam family and an examination.');
      return;
    }
    setBusy(true);
    setError('');
    setPreview(null);
    setDuplicateDecisions({});
    try {
      const body = new FormData();
      body.append('category', category);
      body.append('examCode', examCode);
      if (subject) body.append('defaultSubject', subject);
      if (topic) body.append('defaultTopic', topic);
      body.append('file', file);
      const result = await request('/admin/import/preview', { method: 'POST', body });
      setPreview(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview?.batchId) return;
    setBusy(true);
    setError('');
    try {
      const result = await request(`/admin/import/batches/${preview.batchId}/confirm`, {
        method: 'POST',
        body: {
          duplicateDecisions: Object.entries(duplicateDecisions).map(([rowNumber, decision]) => ({
            rowNumber: Number(rowNumber),
            decision,
          })),
        },
      });
      setPreview(result);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadErrors = async (batchId, fileName) => {
    setError('');
    try {
      await download(`/admin/import/batches/${batchId}/errors.csv`, `${fileName}-import-report.csv`);
    } catch (err) {
      setError(err.message);
    }
  };

  const completed = ['COMPLETED', 'PARTIAL'].includes(preview?.status);
  const pendingDuplicateDecisions = (preview?.rows || []).filter((row) => (
    ['POSSIBLE_DUPLICATE', 'ANSWER_CONFLICT'].includes(row.status) && !duplicateDecisions[row.rowNumber]
  )).length;
  const field = 'mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk upload questions</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Upload .xlsx or UTF-8 .csv. Preview and resolve warnings before importing; all accepted questions are saved as drafts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${button} bg-indigo-600 text-white`} onClick={() => downloadTemplate('xlsx')}>Excel template + catalog</button>
            <button type="button" className={`${button} bg-slate-100 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700`} onClick={() => downloadTemplate('csv')}>CSV template</button>
            <button type="button" className={`${button} bg-slate-100 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700`} onClick={downloadCatalog}>Download full catalog</button>
          </div>
        </div>

        <form onSubmit={uploadForPreview} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Exam family
            <select className={field} value={category} onChange={(event) => setCategory(event.target.value)} required>
              <option value="">Choose family</option>
              {categories.map((item) => <option key={item.code} value={item.code}>{english(item.name)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Examination
            <select className={field} value={examCode} onChange={(event) => setExamCode(event.target.value)} required>
              <option value="">Choose examination</option>
              {(categoryInfo?.exams || []).map((item) => <option key={item.code} value={item.code}>{english(item.name)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Default subject <span className="font-normal text-slate-500">(spreadsheet values override this)</span>
            <select className={field} value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="">Use subject column</option>
              {subjects.map((item) => <option key={item.code} value={item.code}>{english(item.name)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Default topic <span className="font-normal text-slate-500">(spreadsheet values override this)</span>
            <select className={field} value={topic} onChange={(event) => setTopic(event.target.value)} disabled={!subject}>
              <option value="">Use topic column</option>
              {topics.map((item) => <option key={item.code} value={item.code}>{english(item.name)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
            Question file
            <input className={field} type="file" accept=".xlsx,.csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); }} />
            <span className="mt-1 block font-normal text-slate-500">Maximum 2 MB and 500 data rows. Only plain-text MCQs are currently supported.</span>
          </label>
          <div className="sm:col-span-2">
            <button className={`${button} bg-emerald-700 text-white disabled:cursor-not-allowed disabled:opacity-60`} type="submit" disabled={busy || !file || !examCode}>
              {busy && !preview ? 'Validating…' : 'Validate and preview'}
            </button>
          </div>
        </form>
      </section>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900">{notice}</p>}

      {preview && (
        <section className="space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{completed ? 'Import result' : 'Review import preview'}</h2>
              <p className="text-sm text-slate-500">Batch {preview.batchId} · {preview.status}</p>
            </div>
            {!completed && (
              <button type="button" className={`${button} bg-emerald-700 text-white disabled:opacity-50`} disabled={busy || pendingDuplicateDecisions > 0} onClick={confirm}>
                {busy ? 'Importing…' : 'Confirm import as drafts'}
              </button>
            )}
          </div>
          <CountCards summary={preview.summary} />
          {pendingDuplicateDecisions > 0 && !completed && (
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Choose an action for each possible duplicate and answer conflict before confirming.
            </p>
          )}
          <div className="max-h-136 overflow-auto rounded-xl bg-white dark:bg-slate-900">
            <table className="w-full min-w-250 border-collapse text-left">
              <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3">Excel row</th>
                  <th className="p-3">Question text</th>
                  <th className="p-3">Subject / topic</th>
                  <th className="p-3">Existing match ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Similarity reason / action</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows?.map((row) => (
                  <PreviewRow
                    key={row.rowNumber}
                    row={row}
                    decision={duplicateDecisions[row.rowNumber]}
                    onDecision={setDuplicateDecision}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import history</h2>
          <button type="button" className={`${button} bg-slate-100 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700`} onClick={loadHistory} disabled={historyBusy}>
            {historyBusy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{historyBusy ? 'Loading import history…' : 'No import batches yet.'}</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {history.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{batch.fileName} · {batch.status}</p>
                  <p className="text-xs text-slate-500">
                    {batch.examCode} · {new Date(batch.uploadedAt).toLocaleString()} · {batch.summary?.successfullyImported || 0} imported, {batch.draftCount || 0} drafts, {batch.publishedCount || 0} published, {batch.summary?.invalidRows || 0} invalid, {batch.summary?.exactDuplicates || 0} duplicates
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {batch.draftCount > 0 && ['COMPLETED', 'PARTIAL'].includes(batch.status) && (
                    <button
                      type="button"
                      className={`${button} bg-emerald-700 text-white disabled:opacity-60`}
                      disabled={Boolean(publishingBatchId)}
                      onClick={() => setPublishConfirmation(batch)}
                    >
                      {publishingBatchId === batch.id ? 'Publishing…' : `Review & publish ${batch.draftCount} drafts`}
                    </button>
                  )}
                  <button type="button" className={`${button} bg-slate-100 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700`} onClick={() => downloadErrors(batch.id, batch.fileName.replace(/\.[^.]+$/, ''))}>
                    Download report
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {publishConfirmation && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setPublishConfirmation(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-confirmation-title"
            aria-describedby="publish-confirmation-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 grid size-12 place-items-center rounded-full bg-amber-100 text-xl text-amber-700 dark:bg-amber-950 dark:text-amber-300" aria-hidden="true">
              !
            </div>
            <h2 id="publish-confirmation-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Publish this question batch?
            </h2>
            <p id="publish-confirmation-description" className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
              You are about to publish <strong className="text-slate-900 dark:text-white">{publishConfirmation.draftCount} draft questions</strong> from <strong className="text-slate-900 dark:text-white">{publishConfirmation.fileName}</strong>.
            </p>
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              Published questions become visible in exam question counts and practice. This action publishes the batch’s drafts; it does not overwrite existing questions.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                className={`${button} bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700`}
                onClick={() => setPublishConfirmation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${button} bg-emerald-700 text-white hover:bg-emerald-800`}
                onClick={publishImportedDrafts}
              >
                Publish {publishConfirmation.draftCount} questions
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
