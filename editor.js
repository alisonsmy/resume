const STORAGE_KEY = 'alison-resume-experience-v1';
const fields = ['company', 'role', 'dates', 'location', 'division', 'bullets', 'details', 'stack', 'technologies'];
const clone = (value) => structuredClone(value);
const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);

// Treat saved browser data as text, and accept only the shape the page supports.
export function normalizeExperience(value) {
  if (!Array.isArray(value)) throw new Error('Expected a list of jobs');
  return value.map((job) => {
    if (!job || typeof job !== 'object') throw new Error('Invalid job');
    const result = {};
    for (const field of fields) {
      if (['bullets', 'details', 'stack'].includes(field)) {
        const values = job[field] ?? [];
        if (!Array.isArray(values) || values.some((item) => typeof item !== 'string')) throw new Error('Invalid job descriptions');
        result[field] = values.map((item) => item.trim()).filter(Boolean);
      } else {
        const text = job[field] ?? '';
        if (typeof text !== 'string') throw new Error('Invalid job field');
        result[field] = text.trim();
      }
    }
    return result;
  });
}

export function readSavedExperience(published) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? clone(published) : normalizeExperience(JSON.parse(raw));
  } catch {
    return clone(published);
  }
}

export function websiteFile(resume) {
  return `// Resume content. Use Edit experience or Replace photo on the website.\nexport const resume = ${JSON.stringify(resume, null, 2)};\n`;
}

export function downloadWebsiteFile(resume) {
  const blob = new Blob([websiteFile(resume)], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resume.js';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function initExperienceEditor({ resume, published, onSave }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('experience-editor');
  const form = $('job-form');
  const jobList = $('editor-job-list');
  const original = normalizeExperience(published);
  let draft = normalizeExperience(resume.experience);
  let selected = 0;
  let undo = [];
  let dirty = false;
  const status = (message) => { $('editor-status').textContent = message; };
  const isDifferent = (a, b) => JSON.stringify(normalizeExperience(a)) !== JSON.stringify(normalizeExperience(b));
  const markChanged = () => {
    dirty = isDifferent(draft, resume.experience);
    status(dirty ? 'Changes not saved yet.' : 'No unsaved changes.');
  };
  const updateNote = () => { $('local-edit-note').hidden = !isDifferent(resume.experience, original); };
  updateNote();

  function readForm() {
    if (!draft[selected]) return;
    for (const field of fields) {
      const value = form.elements.namedItem(field).value;
      draft[selected][field] = ['bullets', 'details'].includes(field) ? lines(value)
        : field === 'stack' ? value.split(',').map((item) => item.trim()).filter(Boolean) : value.trim();
    }
  }

  function renderJobs() {
    jobList.replaceChildren();
    draft.forEach((job, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'editor-job';
      button.setAttribute('aria-pressed', String(index === selected));
      const name = document.createElement('strong');
      name.textContent = job.company || 'New job';
      const role = document.createElement('span');
      role.textContent = job.role || 'Add a job title';
      button.append(name, role);
      button.addEventListener('click', () => { readForm(); selected = index; render(); });
      jobList.append(button);
    });
  }

  function render() {
    renderJobs();
    const job = draft[selected];
    form.hidden = !job;
    $('editor-empty').hidden = Boolean(job);
    $('move-job-up').disabled = !job || selected === 0;
    $('move-job-down').disabled = !job || selected === draft.length - 1;
    $('remove-job').disabled = !job;
    $('undo-job').hidden = undo.length === 0;
    if (job) for (const field of fields) {
      const value = job[field];
      const input = form.elements.namedItem(field);
      input.value = Array.isArray(value) ? value.join(field === 'stack' ? ', ' : '\n') : value || '';
      input.setCustomValidity('');
    }
  }

  function remember() {
    readForm();
    undo.push({ jobs: clone(draft), selected });
  }

  function save() {
    readForm();
    const invalid = draft.findIndex((job) => !job.company || !job.role || !job.dates || !job.bullets.length);
    if (invalid >= 0) {
      selected = invalid;
      render();
      const job = draft[selected];
      const missing = !job.company ? 'company' : !job.role ? 'role' : !job.dates ? 'dates' : 'bullets';
      const input = form.elements.namedItem(missing);
      input.setCustomValidity(missing === 'bullets' ? 'Add at least one description point.' : 'Please fill in this field.');
      input.reportValidity();
      status('Please add a company, job title, dates, and description for each job.');
      return false;
    }
    let persisted = true;
    try {
      if (isDifferent(draft, original)) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { persisted = false; }
    resume.experience = clone(draft);
    onSave();
    updateNote();
    dirty = false;
    status(persisted ? 'Saved. Your page and PDF are up to date.' : 'Updated for this visit. Browser storage is unavailable; download the file to keep your edits.');
    return true;
  }

  $('edit-experience').addEventListener('click', () => {
    render();
    dialog.showModal();
    document.body.classList.add('editor-open');
  });
  $('editor-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('editor-open');
    // Keep unfinished form changes in memory when closing and reopening.
    readForm();
    $('edit-experience').focus({ preventScroll: true });
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); save(); });
  form.addEventListener('input', (event) => {
    event.target.setCustomValidity('');
    readForm();
    if (['company', 'role'].includes(event.target.name)) renderJobs();
    markChanged();
  });
  $('add-job').addEventListener('click', () => {
    remember();
    draft.unshift({ company: '', role: '', dates: '', location: resume.location, division: '', bullets: [], details: [], stack: [], technologies: '' });
    selected = 0;
    render();
    markChanged();
    form.elements.namedItem('company').focus();
  });
  for (const [id, change] of [['move-job-up', -1], ['move-job-down', 1]]) {
    $(id).addEventListener('click', () => {
      const next = selected + change;
      if (next < 0 || next >= draft.length) return;
      remember();
      [draft[selected], draft[next]] = [draft[next], draft[selected]];
      selected = next;
      render();
      markChanged();
    });
  }
  $('remove-job').addEventListener('click', () => {
    if (!draft[selected]) return;
    remember();
    draft.splice(selected, 1);
    selected = Math.max(0, Math.min(selected, draft.length - 1));
    render();
    markChanged();
    status('Job removed from your draft. Select Undo to bring it back.');
    $('undo-job').focus();
  });
  $('undo-job').addEventListener('click', () => {
    const previous = undo.pop();
    if (!previous) return;
    draft = previous.jobs;
    selected = previous.selected;
    render();
    markChanged();
  });
  $('reset-experience').addEventListener('click', () => {
    remember();
    draft = clone(original);
    selected = 0;
    render();
    markChanged();
    status('Published version loaded. Select Save changes to apply it, or Undo to go back.');
  });
  $('save-experience').addEventListener('click', save);
  $('download-resume-file').addEventListener('click', () => {
    if (!save()) return;
    downloadWebsiteFile(resume);
    status('File downloaded. Replace resume.js in your GitHub repository to publish these changes.');
  });
  window.addEventListener('beforeunload', (event) => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
}
