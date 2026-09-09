import { downloadWebsiteFile } from './editor.js';

const STORAGE_KEY = 'alison-resume-photo-v1';
const DEFAULT_PHOTO = './assets/alison-shu.jpg';
const isPhoto = (value) => typeof value === 'string' && value.length < 2500000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value);

export function initPhotoEditor({ resume, published }) {
  const $ = (id) => document.getElementById(id);
  const original = isPhoto(published) ? published : undefined;
  resume.photo = original;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isPhoto(saved)) resume.photo = saved;
  } catch { /* The editor also works without browser storage. */ }

  const dialog = $('photo-editor');
  const input = $('photo-file');
  const preview = $('photo-preview');
  const position = $('photo-position');
  let draft = resume.photo;
  let source;
  let request = 0;
  let loading = false;
  const status = (message) => { $('photo-status').textContent = message; };
  const renderPhoto = () => {
    $('portrait').src = resume.photo || DEFAULT_PHOTO;
    $('local-photo-note').hidden = resume.photo === original;
  };
  renderPhoto();

  function setLoading(value) {
    loading = value;
    $('save-photo').disabled = value;
    $('download-photo-file').disabled = value;
    position.disabled = value;
    dialog.setAttribute('aria-busy', String(value));
  }

  function crop() {
    if (!source) return;
    const size = Math.min(source.naturalWidth, source.naturalHeight);
    const fraction = Number(position.value) / 100;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(800, size);
    const context = canvas.getContext('2d');
    // Flatten transparency onto white and export one square image for page and PDF.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, (source.naturalWidth - size) * fraction, (source.naturalHeight - size) * fraction, size, size, 0, 0, canvas.width, canvas.height);
    draft = canvas.toDataURL('image/jpeg', 0.9);
    preview.src = draft;
    status('Preview ready. Select Save photo to use it.');
  }

  $('replace-photo').addEventListener('click', () => {
    draft = resume.photo;
    source = undefined;
    preview.src = draft || DEFAULT_PHOTO;
    input.value = '';
    $('photo-position-label').hidden = true;
    status('Preview your photo before saving. Closing without saving keeps your current photo.');
    dialog.showModal();
    document.body.classList.add('editor-open');
  });
  $('photo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    request++;
    source = undefined;
    setLoading(false);
    document.body.classList.remove('editor-open');
    $('replace-photo').focus({ preventScroll: true });
  });
  $('choose-photo').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    const current = ++request;
    setLoading(false);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      status('Please choose a JPG, PNG, or WebP picture.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      status('This picture is too large. Choose one under 10 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setLoading(true);
    status('Preparing your photo…');
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (current !== request) return;
      if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Image too large');
      source = image;
      position.value = '50';
      $('photo-position-label').hidden = image.naturalWidth === image.naturalHeight;
      $('photo-position-text').textContent = image.naturalWidth > image.naturalHeight ? 'Move crop left or right' : 'Move crop up or down';
      crop();
    } catch {
      if (current === request) status('Couldn’t open this picture. Try another JPG, PNG, or WebP, up to 40 megapixels.');
    } finally {
      URL.revokeObjectURL(url);
      if (current === request) setLoading(false);
    }
  });
  position.addEventListener('input', crop);
  $('reset-photo').addEventListener('click', () => {
    request++;
    setLoading(false);
    source = undefined;
    draft = original;
    preview.src = draft || DEFAULT_PHOTO;
    $('photo-position-label').hidden = true;
    status('Published photo loaded. Select Save photo to apply it.');
  });

  function save() {
    if (loading) return false;
    let persisted = true;
    try {
      if (draft === original) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, draft);
    } catch { persisted = false; }
    resume.photo = draft;
    renderPhoto();
    status(persisted ? 'Photo saved. Your page and next PDF use this picture.' : 'Updated for this visit. Download the website file to keep your photo; browser storage is unavailable.');
    return true;
  }
  $('save-photo').addEventListener('click', save);
  $('download-photo-file').addEventListener('click', () => {
    if (!save()) return;
    downloadWebsiteFile(resume);
    status('File downloaded with your photo and saved resume edits. Replace resume.js on GitHub to publish them.');
  });
}
