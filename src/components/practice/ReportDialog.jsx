import { useState } from 'react';
import { ARENA, REPORT_REASON_LABELS } from '../../lib/i18n';
import { Localized } from '../topic-hub/Localized';
import Dialog from './Dialog';

/** Reason picker + optional note. Reports go to the editors' triage queue. */
export default function ReportDialog({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState('WRONG_ANSWER');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  function close() {
    onClose();
    setStatus('idle');
    setMessage('');
  }

  async function submit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      await onSubmit({ reason, message: message.trim() || undefined });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="report-title">
      <h2 id="report-title" className="text-lg font-bold text-slate-900 dark:text-white">
        <Localized value={ARENA.reportTitle} />
      </h2>

      {status === 'sent' ? (
        <>
          <Localized value={ARENA.reportThanks} as="p" className="mt-3 text-[15px] text-slate-600 dark:text-slate-300" />
          <button
            type="button"
            onClick={close}
            autoFocus
            className="mt-5 min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Localized value={ARENA.close} />
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-4">
          <fieldset>
            <legend className="sr-only">Reason</legend>
            <div className="space-y-1.5">
              {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 ring-1 ring-slate-200 has-[:checked]:bg-indigo-50 has-[:checked]:ring-indigo-400 dark:ring-slate-700 dark:has-[:checked]:bg-indigo-500/10"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={reason === key}
                    onChange={() => setReason(key)}
                    className="size-4 accent-indigo-600"
                  />
                  <Localized value={label} className="text-sm" />
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
            <Localized value={ARENA.reportDetails} />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950"
            />
          </label>

          {status === 'error' && (
            <Localized value={ARENA.reportFailed} as="p" className="mt-2 text-sm text-rose-600 dark:text-rose-400" />
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={close}
              className="min-h-11 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Localized value={ARENA.cancel} />
            </button>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="min-h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <Localized value={ARENA.send} />
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
