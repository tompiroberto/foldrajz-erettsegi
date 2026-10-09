import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// pdf.js is loaded only when an original exam page is shown.
let pdfjs: Promise<typeof import('pdfjs-dist')> | null = null;
function loadPdfjs() {
  pdfjs ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
    ([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    },
  );
  return pdfjs;
}

const docs = new Map<string, Promise<PDFDocumentProxy>>();
function loadDoc(url: string) {
  let d = docs.get(url);
  if (!d) {
    d = loadPdfjs().then((lib) => lib.getDocument({ url }).promise);
    docs.set(url, d);
  }
  return d;
}

interface Props {
  url: string;
  page: number;
  /** Accessible description of what is on the page. */
  alt: string;
}

/** Renders one page of an original PDF to a canvas, at the container's width. */
export function PdfPage({ url, page, alt }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    setState('loading');
    loadDoc(url)
      .then(async (doc) => {
        if (cancelled || !canvas.current || !wrap.current) return;
        const p = await doc.getPage(page);
        const base = p.getViewport({ scale: 1 });
        const width = wrap.current.clientWidth || 700;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = p.getViewport({ scale: (width / base.width) * dpr });
        const c = canvas.current;
        c.width = vp.width;
        c.height = vp.height;
        c.style.width = '100%';
        c.style.aspectRatio = `${vp.width} / ${vp.height}`;
        const r = p.render({ canvas: c, viewport: vp });
        task = r;
        await r.promise;
        if (!cancelled) setState('ready');
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [url, page]);

  return (
    <div ref={wrap} className="pdf-page">
      {state === 'loading' && <div className="skeleton pdf-skeleton" aria-hidden />}
      {state === 'error' && (
        <p className="placeholder">
          Az eredeti oldal most nem tölthető be (offline vagy?).{' '}
          <a href={`${url}#page=${page}`} target="_blank" rel="noreferrer">
            Megnyitás PDF-ben
          </a>
        </p>
      )}
      <canvas ref={canvas} role="img" aria-label={alt} hidden={state === 'error'} />
    </div>
  );
}
