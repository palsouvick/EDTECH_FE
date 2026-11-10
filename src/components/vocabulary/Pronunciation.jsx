import { useState } from 'react';
import { canSpeak, respell, speak } from '../../lib/pronounce';
import { Localized } from '../topic-hub/Localized';
import { CMU_CREDIT } from './BengaliReviewNote';

const SAY_IT = { en: 'Say it', bn: 'উচ্চারণ' };

/**
 * How to say a word: a Listen button (the device's own voice) and a plain respelling
 * ("uh-KYOO-myuh-layt", main stress in capitals) instead of IPA symbols most students cannot read.
 * The IPA and the CMU dictionary credit stay in the tooltip.
 */
export default function Pronunciation({ word, ipa, source }) {
  const [playing, setPlaying] = useState(false);
  const plain = respell(ipa);
  const speakable = canSpeak();
  if (!plain && !speakable) return null;
  const title = [ipa && `IPA ${ipa}`, source === 'CMUDICT' && CMU_CREDIT].filter(Boolean).join(' · ') || undefined;

  const listen = () => {
    if (!speak(word)) return;
    setPlaying(true);
    setTimeout(() => setPlaying(false), 1200);
  };

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-slate-50 py-1 pl-1 pr-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      {speakable && (
        <button
          type="button"
          onClick={listen}
          aria-label={`Listen: ${word}`}
          className={`grid size-9 place-items-center rounded-xl text-white shadow-sm transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-95 ${playing ? 'bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            {playing && <path d="M19 5a10 10 0 0 1 0 14" />}
          </svg>
        </button>
      )}
      {plain && (
        <span title={title} className="leading-tight">
          <Localized value={SAY_IT} as="span" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" />
          <span className="block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">{plain}</span>
        </span>
      )}
    </div>
  );
}
