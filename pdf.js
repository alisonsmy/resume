// A text-based PDF: searchable, selectable, and readable by resume software.
// Layout grows to additional pages when the source content grows.
export function createResumePdf(resume, JsPDF, portrait) {
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const left = 18;
  const right = 192;
  const width = right - left;
  const bottom = 276;
  const blue = [21, 62, 112];
  const muted = [80, 104, 136];
  let y = 22;
  const clean = (text) => String(text).replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...');
  const setText = (size = 10, weight = 'normal', color = blue) => {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  function newPage() {
    doc.addPage('a4', 'portrait');
    y = 18;
    setText(9, 'bold', muted);
    doc.text(clean(`${resume.shortName} / ${resume.role}`), left, y);
    doc.setDrawColor(181, 197, 217);
    doc.line(left, y + 4, right, y + 4);
    y += 14;
  }
  function ensureSpace(height) { if (y + height > bottom) newPage(); }
  function text(text, { size = 10, weight = 'normal', color = blue, indent = 0, after = 2, lineHeight = 4.8 } = {}) {
    setText(size, weight, color);
    const lines = doc.splitTextToSize(clean(text), width - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      setText(size, weight, color);
      doc.text(line, left + indent, y);
      y += lineHeight;
    }
    y += after;
  }
  function heading(label) {
    ensureSpace(24);
    y += 4;
    setText(10, 'bold');
    doc.text(label.toUpperCase(), left, y);
    doc.setDrawColor(181, 197, 217);
    doc.line(left, y + 3, right, y + 3);
    y += 10;
  }
  function bullet(value) {
    setText(9.5);
    const lines = doc.splitTextToSize(clean(value), width - 5);
    ensureSpace(lines.length * 4.5 + 2);
    setText(9.5);
    doc.text('•', left, y);
    text(value, { size: 9.5, indent: 5, lineHeight: 4.5, after: 1.8 });
  }
  function role(job, includeDetails = true) {
    ensureSpace(35);
    text(job.company, { size: 13, weight: 'bold', lineHeight: 5.5, after: 0.7 });
    text([job.role, job.division].filter(Boolean).join(' | '), { size: 10, lineHeight: 4.8, after: 0.5 });
    text(`${job.dates} | ${job.location}`, { size: 9, color: muted, lineHeight: 4.4, after: 3 });
    job.bullets.forEach(bullet);
    if (includeDetails) (job.details || []).forEach(bullet);
    if (job.technologies) text(`Tools: ${job.technologies}`, { size: 8.5, color: muted, lineHeight: 4, after: 1 });
    y += 4;
  }

  doc.setProperties({ title: `${resume.shortName} - Resume`, author: resume.name, subject: resume.role, keywords: 'resume, software engineer, trading systems, backend, Web3', creator: 'Alison Shu Resume Website' });
  doc.setLanguage('en');
  if (portrait) doc.addImage(portrait, 'JPEG', 170, 17, 22, 22);
  setText(25, 'bold');
  doc.text(clean(resume.name), left, y);
  y += 9;
  text(`${resume.role} | ${resume.location}`, { size: 12, lineHeight: 5.5, after: 2 });
  setText(9, 'normal', muted);
  doc.textWithLink(resume.email, left, y, { url: `mailto:${resume.email}` });
  doc.textWithLink(resume.phone, left + 60, y, { url: `tel:${resume.phone.replace(/\s/g, '')}` });
  doc.textWithLink('LinkedIn / alisonsmy', left + 112, y, { url: resume.linkedin });
  y += 10;
  text(resume.summary, { size: 10.5, lineHeight: 5.2, after: 2 });
  heading('Experience');
  // Let added jobs and longer descriptions flow onto as many pages as needed.
  resume.experience.forEach((job) => role(job));
  heading('Skills');
  resume.skills.forEach(({ label, items }) => text(`${label}: ${items.join(', ')}`, { size: 9.5, lineHeight: 4.5, after: 1.2 }));
  heading('Education');
  resume.education.forEach((degree) => {
    ensureSpace(21);
    text(degree.degree, { size: 10, weight: 'bold', after: 0.5, lineHeight: 4.5 });
    text(`${degree.school}, ${degree.location} | ${degree.dates}`, { size: 9, color: muted, lineHeight: 4.2, after: 0.5 });
    text(degree.note, { size: 9, lineHeight: 4.2, after: 2 });
  });
  heading('Internships');
  resume.internships.forEach((job) => {
    ensureSpace(24);
    text(`${job.company} | ${job.role}`, { size: 10, weight: 'bold', lineHeight: 4.5, after: 0.5 });
    text(`${job.dates} | ${job.location}`, { size: 8.5, color: muted, lineHeight: 4, after: 1.5 });
    job.bullets.forEach(bullet);
    y += 1;
  });
  heading('Outside work');
  text(`Languages: ${resume.languages.join(', ')}.`, { size: 9.5, after: 1, lineHeight: 4.5 });
  text(resume.interests, { size: 9.5, after: 0, lineHeight: 4.5 });

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(181, 197, 217);
    doc.line(left, 282, right, 282);
    setText(8, 'normal', muted);
    doc.text(clean(resume.shortName), left, 287);
    doc.text(`${page} / ${count}`, right, 287, { align: 'right' });
  }
  return doc;
}
