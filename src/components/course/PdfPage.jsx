import { useEffect, useRef, useState } from 'react';
import { Localized } from '../topic-hub/Localized';
import { COURSE } from '../../lib/course';

// One pdf.js document per URL, kept while the reader is open (books are hundreds of MB;
// range requests mean only the pages being viewed are downloaded).
const docs = new Map();

async function openDoc(url, headers) {
  if (!docs.has(url)) {
    docs.set(url, (async () => {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs.getDocument({ url, httpHeaders: headers, withCredentials: true, disableAutoFetch: true, disableStream: true, rangeChunkSize: 1 << 20 }).promise;
    })());
  }
  return docs.get(url);
}

/** Renders one page of a PDF at the width of its container (sharp on high-DPI screens). */
export default function PdfPage({ url, headers, page, onPages }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let task = null;
    setState('loading');
    (async () => {
      try {
        const doc = await openDoc(url, headers);
        if (cancelled) return;
        onPages?.(doc.numPages);
        const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
        const base = p.getViewport({ scale: 1 });
        const width = wrap.current?.clientWidth || 800;
        const ratio = window.devicePixelRatio || 1;
        const vp = p.getViewport({ scale: (width / base.width) * ratio });
        const c = canvas.current;
        if (!c || cancelled) return;
        c.width = vp.width;
        c.height = vp.height;
        c.style.width = `${width}px`;
        c.style.height = `${vp.height / ratio}px`;
        task = p.render({ canvasContext: c.getContext('2d'), viewport: vp });
        await task.promise;
        if (!cancelled) setState('ready');
      } catch (e) {
        if (!cancelled && e?.name !== 'RenderingCancelledException') setState('error');
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [url, headers, page, onPages]);

  return (
    <div ref={wrap} className="relative w-full">
      {state === 'loading' && <Localized value={COURSE.loadingPdf} as="p" className="absolute inset-x-0 top-6 text-center text-sm text-slate-500" />}
      {state === 'error' && <p role="alert" className="p-6 text-center text-sm text-rose-700">Could not show this page.</p>}
      <canvas ref={canvas} className="mx-auto block rounded-lg bg-white shadow ring-1 ring-slate-200 dark:ring-slate-700" />
    </div>
  );
}
