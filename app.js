import { resume as publishedResume } from './resume.js';
import { initExperienceEditor, readSavedExperience } from './editor.js';
import { initPhotoEditor } from './photo-editor.js';
import { initPdfPreview } from './pdf-preview.js';

const resume = structuredClone(publishedResume);
resume.experience = readSavedExperience(publishedResume.experience);
initPhotoEditor({ resume, published: publishedResume.photo });

const $ = (id) => document.getElementById(id);
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const list = (items) => {
  const ul = element('ul');
  items.forEach((item) => ul.append(element('li', '', item)));
  return ul;
};
const moreDetails = (label, items) => {
  const details = element('details');
  details.append(element('summary', '', label), list(items));
  return details;
};
const arrow = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M5 19 19 5M5 5h14v14');
  svg.append(path);
  return svg;
};

document.title = `${resume.shortName} — ${resume.role}`;
$('hero-title').replaceChildren(document.createTextNode(resume.headline[0]), document.createElement('br'), element('em', '', resume.headline[1]));
$('intro').textContent = resume.intro;
$('summary').textContent = resume.summary;
$('full-name').textContent = resume.name;
$('role-location').replaceChildren(document.createTextNode(`${resume.role} · `), element('span', 'location', resume.location));
resume.focus.forEach((focus, i) => {
  const li = element('li');
  li.append(element('small', '', String(i + 1).padStart(2, '0')), element('span', '', focus));
  $('focus-list').append(li);
});

function renderExperience() {
  $('experience-list').replaceChildren();
  resume.experience.forEach((job) => {
  const article = element('article', 'job');
  const meta = element('div', 'job-meta');
  meta.append(element('p', '', job.dates), element('p', '', job.location));
  const content = element('div', 'job-content');
  content.append(element('h3', '', job.company), element('p', 'job-role', [job.role, job.division].filter(Boolean).join(' · ')), list(job.bullets));
  if (job.stack?.length) content.append(element('p', 'job-stack', job.stack.join(' · ')));
  if (job.details?.length || job.technologies) {
    const details = moreDetails('More about this role', job.details || []);
    details.querySelector('summary').setAttribute('aria-label', `More about this role at ${job.company}`);
    if (job.technologies) details.append(element('p', 'technical-note', `Tools: ${job.technologies}`));
    content.append(details);
  }
  article.append(meta, content);
  $('experience-list').append(article);
  });
}
renderExperience();
initExperienceEditor({ resume, published: publishedResume.experience, onSave: renderExperience });

resume.skills.forEach(({ label, items }) => $('skill-list').append(element('dt', '', label), element('dd', '', items.join(', '))));
resume.education.forEach((degree, i) => {
  if (!i || degree.school !== resume.education[i - 1].school) $('education').append(element('h3', '', degree.school));
  $('education').append(element('p', '', `${degree.shortDegree} · ${degree.years}${degree.note.startsWith('GPA') ? ` · ${degree.note}` : ''}`));
});
resume.internships.forEach((internship) => {
  const block = element('div', 'internship');
  block.append(element('p', '', `${internship.company} · ${internship.shortRole} · ${internship.years}`));
  const details = moreDetails('Read more', internship.bullets);
  details.querySelector('summary').setAttribute('aria-label', `Read more about ${internship.company}`);
  block.append(details);
  $('internships').append(block);
});
$('interests').textContent = resume.interests;
const spoken = [...resume.languages];
const lastLanguage = spoken.pop();
$('languages').textContent = `I speak ${spoken.join(', ')}${spoken.length > 1 ? ',' : ''} and ${lastLanguage}.`;
[
  { label: resume.email, href: `mailto:${resume.email}`, icon: true },
  { label: 'LinkedIn', href: resume.linkedin, icon: true, external: true },
  { label: resume.phone, href: `tel:${resume.phone.replace(/\s/g, '')}` },
].forEach(({ label, href, icon, external }) => {
  const link = element('a', '', label);
  link.href = href;
  if (external) { link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', 'LinkedIn (opens in a new tab)'); }
  if (icon) link.append(arrow());
  $('contact-links').append(link);
});
$('footer-name').textContent = `${resume.shortName} · ${resume.location}`;

// Load the PDF library only when needed, from this website, without a CDN.
let pdfLibrary;
function loadPdfLibrary() {
  if (window.jspdf) return Promise.resolve();
  if (!pdfLibrary) pdfLibrary = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('./assets/vendor/jspdf.umd.min.js', import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => { script.remove(); pdfLibrary = null; reject(new Error('PDF library failed to load')); };
    document.head.append(script);
  });
  return pdfLibrary;
}
initPdfPreview({
  async createPdf() {
    const snapshot = structuredClone(resume);
    const portrait = new Image();
    portrait.src = $('portrait').src;
    const [, { createResumePdf }] = await Promise.all([loadPdfLibrary(), import('./pdf.js'), portrait.decode()]);
    return createResumePdf(snapshot, window.jspdf.jsPDF, portrait);
  },
});
