// Preview the same generated PDF used by the download button, entirely on this device.
export function initPdfPreview({ createPdf }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('pdf-preview');
  const trigger = document.querySelector('[data-preview]');
  const stage = $('pdf-stage');
  const sheet = $('pdf-sheet');
  let pdf;
  let loadingTask;
  let renderTask;
  let downloadPdf;
  let pageNumber = 1;
  let session = 0;
  let renderVersion = 0;
  let resizeTimer;
  const status = (message) => { $('pdf-status').textContent = message; };
  const controls = () => {
    $('pdf-previous').disabled = !pdf || pageNumber <= 1;
    $('pdf-next').disabled = !pdf || pageNumber >= pdf.numPages;
    $('pdf-zoom').disabled = !pdf;
    $('pdf-page-count').textContent = pdf ? `Page ${pageNumber} of ${pdf.numPages}` : 'Preparing…';
  };

  function release() {
    renderVersion++;
    renderTask?.cancel();
    renderTask = undefined;
    loadingTask?.destroy().catch(() => {});
    loadingTask = undefined;
    pdf = undefined;
    downloadPdf = undefined;
    $('pdf-download').hidden = true;
    sheet.replaceChildren();
    $('pdf-text').hidden = true;
    $('pdf-text').open = false;
    $('pdf-page-text').textContent = '';
    clearTimeout(resizeTimer);
    controls();
  }

  async function renderPage() {
    if (!pdf || !dialog.open) return;
    const current = ++renderVersion;
    const number = pageNumber;
    renderTask?.cancel();
    controls();
    sheet.setAttribute('aria-busy', 'true');
    status(`Preparing page ${number}…`);
    try {
      const page = await pdf.getPage(number);
      if (current !== renderVersion) return;
      const base = page.getViewport({ scale: 1 });
      const zoom = $('pdf-zoom').value;
      const scale = zoom === 'fit' ? Math.min(794, Math.max(160, stage.clientWidth - 48)) / base.width : Number(zoom) * 4 / 3;
      const viewport = page.getViewport({ scale });
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width * density);
      canvas.height = Math.ceil(viewport.height * density);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Resume, A4 page ${number} of ${pdf.numPages}. Use Read page text for a text version.`);
      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: [density, 0, 0, density, 0, 0] });
      renderTask = task;
      await task.promise;
      if (current !== renderVersion) return;
      sheet.replaceChildren(canvas);
      stage.scrollTo(0, 0);
      const content = await page.getTextContent();
      if (current !== renderVersion) return;
      $('pdf-page-text').textContent = content.items.map((item) => item.str + (item.hasEOL ? '\n' : ' ')).join('');
      $('pdf-text').hidden = false;
      status('This is the PDF you’ll download. A4 portrait, ready to save.');
    } catch (error) {
      if (current !== renderVersion || error.name === 'RenderingCancelledException') return;
      sheet.replaceChildren();
      $('pdf-text').hidden = true;
      $('pdf-retry').hidden = false;
      status('Couldn’t display this page. Try again, or download the A4 PDF to review it.');
    } finally {
      if (current === renderVersion) sheet.setAttribute('aria-busy', 'false');
    }
  }

  async function prepare() {
    const current = ++session;
    release();
    pageNumber = 1;
    $('pdf-retry').hidden = true;
    $('pdf-zoom').value = 'fit';
    status('Preparing your A4 resume…');
    try {
      const document = await createPdf();
      if (current !== session) return;
      const bytes = document.output('arraybuffer');
      downloadPdf = document;
      $('pdf-download').hidden = false;
      status('Loading your preview…');
      const renderer = await import('./assets/vendor/pdfjs/pdf.min.mjs');
      if (current !== session) return;
      renderer.GlobalWorkerOptions.workerSrc = new URL('./assets/vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      const task = renderer.getDocument({
        data: new Uint8Array(bytes),
        standardFontDataUrl: new URL('./assets/vendor/pdfjs/standard_fonts/', import.meta.url).href,
        isEvalSupported: false,
      });
      loadingTask = task;
      const loaded = await task.promise;
      if (current !== session) return;
      pdf = loaded;
      await renderPage();
    } catch {
      if (current !== session) return;
      $('pdf-retry').hidden = false;
      $('pdf-page-count').textContent = 'Preview unavailable';
      status(downloadPdf ? 'Preview unavailable. You can still download your A4 PDF and open it on your device.' : 'Couldn’t prepare your PDF. Try again after the photo has loaded.');
    }
  }

  trigger.addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('editor-open');
    prepare();
  });
  $('pdf-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    session++;
    release();
    document.body.classList.remove('editor-open');
    trigger.focus({ preventScroll: true });
  });
  $('pdf-retry').addEventListener('click', prepare);
  $('pdf-previous').addEventListener('click', () => { if (pdf && pageNumber > 1) { pageNumber--; renderPage(); } });
  $('pdf-next').addEventListener('click', () => { if (pdf && pageNumber < pdf.numPages) { pageNumber++; renderPage(); } });
  $('pdf-zoom').addEventListener('change', renderPage);
  $('pdf-download').addEventListener('click', async () => {
    if (!downloadPdf) return;
    const current = session;
    const button = $('pdf-download');
    button.disabled = true;
    try {
      await downloadPdf.save('Alison_Shu_Resume.pdf', { returnPromise: true });
      if (current === session) status('Choose a folder and Save if asked. Otherwise, check your downloads or your browser’s PDF viewer.');
    } catch {
      if (current === session) status('Couldn’t download the PDF. Please try again.');
    } finally { button.disabled = false; }
  });
  let previousWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width === previousWidth) return;
    previousWidth = width;
    clearTimeout(resizeTimer);
    if (pdf && dialog.open && $('pdf-zoom').value === 'fit') resizeTimer = setTimeout(renderPage, 150);
  }).observe(stage);
}
