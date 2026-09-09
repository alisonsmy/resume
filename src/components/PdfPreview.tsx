import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFDocumentLoadingTask,
  type RenderTask,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { jsPDF } from "jspdf";
import type { Resume } from "../types";
import { defaultPhoto } from "../lib/storage";
import { createResumePdf } from "../lib/pdf";
import { Modal } from "./Modal";

GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPreview({
  resume,
  onClose,
}: {
  resume: Resume;
  onClose: () => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [download, setDownload] = useState<jsPDF | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState("fit");
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Preparing your A4 resume…");
  const [pageText, setPageText] = useState("");
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    setPdf(null);
    setDownload(null);
    setFailed(false);
    setBusy(true);
    setPageNumber(1);
    setZoom("fit");
    setPageText("");
    setStatus("Preparing your A4 resume…");
    const portrait = new Image();
    portrait.src = resume.photo || defaultPhoto;
    async function prepare() {
      try {
        const [{ jsPDF: Pdf }] = await Promise.all([
          import("jspdf"),
          portrait.decode(),
        ]);
        if (cancelled) return;
        const document = createResumePdf(resume, Pdf, portrait);
        setDownload(document);
        setStatus("Loading your preview…");
        task = getDocument({
          data: new Uint8Array(document.output("arraybuffer")),
          standardFontDataUrl: new URL(
            `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
            window.location.href,
          ).href,
        });
        const loaded = await task.promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) {
          setBusy(false);
          setFailed(true);
          setStatus(
            "Couldn’t display the preview. Try again, or download the A4 PDF if it is ready.",
          );
        }
      }
    }
    void prepare();
    return () => {
      cancelled = true;
      void task?.destroy().catch(() => {});
    };
  }, [resume, retry]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(([entry]) => {
      clearTimeout(timer);
      const width = Math.round(entry.contentRect.width);
      timer = setTimeout(() => setStageWidth(width), 100);
    });
    setStageWidth(stage.clientWidth);
    observer.observe(stage);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!pdf || !stageWidth) return;
    let cancelled = false;
    let task: RenderTask | undefined;
    const sheet = sheetRef.current;
    setBusy(true);
    setPageText("");
    setStatus(`Preparing page ${pageNumber}…`);
    async function render() {
      try {
        const page = await pdf!.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const available = stageRef.current?.clientWidth ?? stageWidth;
        const scale =
          zoom === "fit"
            ? Math.min(794, Math.max(160, available - 48)) / base.width
            : (Number(zoom) * 4) / 3;
        const viewport = page.getViewport({ scale });
        const density = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width * density);
        canvas.height = Math.ceil(viewport.height * density);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
          "aria-label",
          `Resume, A4 page ${pageNumber} of ${pdf!.numPages}. Use Read page text for a text version.`,
        );
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Preview unavailable");
        task = page.render({
          canvasContext: context,
          canvas,
          viewport,
          transform: [density, 0, 0, density, 0, 0],
        });
        await task.promise;
        if (cancelled) return;
        sheet?.replaceChildren(canvas);
        stageRef.current?.scrollTo(0, 0);
        const text = await page.getTextContent();
        if (cancelled) return;
        setPageText(
          text.items
            .map((item) =>
              "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
            )
            .join(""),
        );
        setStatus(
          "This is the PDF you’ll download. A4 portrait, ready to save.",
        );
      } catch {
        if (!cancelled) {
          sheet?.replaceChildren();
          setFailed(true);
          setStatus(
            "Couldn’t display this page. Try again, or download the A4 PDF to review it.",
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void render();
    return () => {
      cancelled = true;
      task?.cancel();
      sheet?.replaceChildren();
    };
  }, [pdf, pageNumber, zoom, stageWidth]);
  async function save() {
    if (!download) return;
    setSaving(true);
    try {
      await download.save("Alison_Shu_Resume.pdf", { returnPromise: true });
      setStatus(
        "Choose a folder and Save if asked. Otherwise, check your downloads or your browser’s PDF viewer.",
      );
    } catch {
      setStatus("Couldn’t download the PDF. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      id="pdf-preview"
      title="Resume preview"
      description="A4 portrait · 210 × 297 mm · Uses your saved edits and photo."
      className="pdf-preview"
      closeLabel="Close PDF preview"
    >
      <div className="pdf-toolbar" aria-label="PDF preview controls">
        <div className="pdf-paging">
          <button
            className="editor-button"
            aria-label="Previous PDF page"
            disabled={!pdf || pageNumber <= 1}
            onClick={() => setPageNumber((page) => page - 1)}
          >
            Previous
          </button>
          <span id="pdf-page-count" aria-live="polite">
            {pdf
              ? `Page ${pageNumber} of ${pdf.numPages}`
              : failed
                ? "Preview unavailable"
                : "Preparing…"}
          </span>
          <button
            className="editor-button"
            aria-label="Next PDF page"
            disabled={!pdf || pageNumber >= pdf.numPages}
            onClick={() => setPageNumber((page) => page + 1)}
          >
            Next
          </button>
        </div>
        <label className="pdf-zoom">
          Zoom
          <select
            value={zoom}
            disabled={!pdf}
            onChange={(event) => setZoom(event.target.value)}
          >
            <option value="fit">Fit width</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
        </label>
      </div>
      <div
        className="pdf-stage"
        ref={stageRef}
        tabIndex={0}
        aria-label="PDF page preview, scroll to read"
      >
        <div className="pdf-sheet" ref={sheetRef} aria-busy={busy} />
      </div>
      {pageText && (
        <details className="pdf-text">
          <summary>Read page text</summary>
          <p>{pageText}</p>
        </details>
      )}
      <div className="editor-footer">
        <p role="status">{status}</p>
        <div>
          {failed && (
            <button
              className="editor-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try preview again
            </button>
          )}
          {download && (
            <button
              className="button"
              disabled={saving}
              onClick={() => void save()}
            >
              Download A4 PDF
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
