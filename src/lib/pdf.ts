import type { jsPDF } from "jspdf";
import type { Job, Resume } from "../types";
import { labelsFor } from "./content";

// A text-based PDF: searchable, selectable, and readable by resume software.
// Layout grows to additional pages when the source content grows.
export function createResumePdf(
  resume: Resume,
  JsPDF: typeof jsPDF,
  portrait?: HTMLImageElement | string,
) {
  const doc = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const copy = labelsFor(resume);
  const left = 18;
  const right = 192;
  const width = right - left;
  const bottom = 276;
  const blue: [number, number, number] = [21, 62, 112];
  const muted: [number, number, number] = [80, 104, 136];
  let y = 22;
  const clean = (text: string) =>
    String(text)
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/…/g, "...");
  const setText = (size = 10, weight = "normal", color = blue) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  function newPage() {
    doc.addPage("a4", "portrait");
    y = 18;
    setText(9, "bold", muted);
    const header = doc.splitTextToSize(
      clean(`${resume.shortName} / ${resume.role}`),
      width,
    );
    doc.text(header.slice(0, 2), left, y);
    y += (Math.min(header.length, 2) - 1) * 4;
    doc.setDrawColor(181, 197, 217);
    doc.line(left, y + 4, right, y + 4);
    y += 14;
  }
  function ensureSpace(height: number) {
    if (y + height > bottom) newPage();
  }
  function text(
    text: string,
    {
      size = 10,
      weight = "normal",
      color = blue,
      indent = 0,
      maxWidth = width,
      after = 2,
      lineHeight = 4.8,
    } = {},
  ) {
    if (!text.trim()) return;
    setText(size, weight, color);
    const lines = doc.splitTextToSize(clean(text), maxWidth - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      setText(size, weight, color);
      doc.text(line, left + indent, y);
      y += lineHeight;
    }
    y += after;
  }
  function heading(label: string) {
    if (!label.trim()) return;
    ensureSpace(24);
    y += 4;
    text(label.toUpperCase(), {
      size: 10,
      weight: "bold",
      after: 0,
      lineHeight: 4.5,
    });
    y -= 4.5;
    doc.setDrawColor(181, 197, 217);
    doc.line(left, y + 3, right, y + 3);
    y += 10;
  }
  function bullet(value: string) {
    setText(9.5);
    const lines = doc.splitTextToSize(clean(value), width - 5);
    ensureSpace(lines.length * 4.5 + 2);
    setText(9.5);
    doc.text("•", left, y);
    text(value, { size: 9.5, indent: 5, lineHeight: 4.5, after: 1.8 });
  }
  function role(job: Job, includeDetails = true) {
    ensureSpace(35);
    text(job.company, {
      size: 13,
      weight: "bold",
      lineHeight: 5.5,
      after: 0.7,
    });
    text([job.role, job.division].filter(Boolean).join(" | "), {
      size: 10,
      lineHeight: 4.8,
      after: 0.5,
    });
    text(`${job.dates} | ${job.location}`, {
      size: 9,
      color: muted,
      lineHeight: 4.4,
      after: 3,
    });
    job.bullets.forEach(bullet);
    if (includeDetails) (job.details || []).forEach(bullet);
    if (job.technologies)
      text(`${copy.tools}: ${job.technologies}`, {
        size: 8.5,
        color: muted,
        lineHeight: 4,
        after: 1,
      });
    y += 4;
  }

  doc.setProperties({
    title: `${resume.shortName} - Resume`,
    author: resume.name,
    subject: resume.role,
    keywords: `resume, ${resume.role}`,
    creator: "Resume Website",
  });
  doc.setLanguage("en");
  if (portrait) doc.addImage(portrait, "JPEG", 170, 17, 22, 22);
  setText(25, "bold");
  const nameLines = doc.splitTextToSize(
    clean(resume.name),
    portrait ? 145 : width,
  );
  doc.text(nameLines, left, y);
  y += nameLines.length * 10;
  text([resume.role, resume.location].filter(Boolean).join(" | "), {
    size: 12,
    lineHeight: 5.5,
    after: 2,
    maxWidth: portrait && y < 43 ? 145 : width,
  });
  if (portrait) y = Math.max(y, 43);
  setText(9, "normal", muted);
  const contacts = [
    { label: resume.email, url: `mailto:${resume.email}`, x: left, width: 57 },
    {
      label: resume.phone,
      url: `tel:${resume.phone.replace(/\s/g, "")}`,
      x: left + 62,
      width: 45,
    },
    {
      label: resume.linkedin ? copy.linkedin : "",
      url: resume.linkedin,
      x: left + 112,
      width: 62,
    },
  ];
  let contactHeight = 0;
  for (const contact of contacts) {
    const lines: string[] = doc.splitTextToSize(
      clean(contact.label),
      contact.width,
    );
    lines.forEach((line, index) =>
      doc.textWithLink(line, contact.x, y + index * 4.2, { url: contact.url }),
    );
    contactHeight = Math.max(contactHeight, lines.length * 4.2);
  }
  y += contactHeight + 5;
  text(resume.intro, { size: 10.5, lineHeight: 5.2, after: 2 });
  text(resume.summary, { size: 10.5, lineHeight: 5.2, after: 2 });
  heading(copy.pdfExperience);
  // Let added jobs and longer descriptions flow onto as many pages as needed.
  resume.experience.forEach((job) => role(job));
  heading(copy.pdfSkills);
  resume.skills.forEach(({ label, items }) =>
    text(`${label}: ${items.join(", ")}`, {
      size: 9.5,
      lineHeight: 4.5,
      after: 1.2,
    }),
  );
  heading(copy.pdfEducation);
  resume.education.forEach((degree) => {
    ensureSpace(21);
    text(degree.degree, {
      size: 10,
      weight: "bold",
      after: 0.5,
      lineHeight: 4.5,
    });
    text(`${degree.school}, ${degree.location} | ${degree.dates}`, {
      size: 9,
      color: muted,
      lineHeight: 4.2,
      after: 0.5,
    });
    text(degree.note, { size: 9, lineHeight: 4.2, after: 2 });
  });
  heading(copy.pdfInternships);
  resume.internships.forEach((job) => {
    ensureSpace(24);
    text(`${job.company} | ${job.role}`, {
      size: 10,
      weight: "bold",
      lineHeight: 4.5,
      after: 0.5,
    });
    text(`${job.dates} | ${job.location}`, {
      size: 8.5,
      color: muted,
      lineHeight: 4,
      after: 1.5,
    });
    job.bullets.forEach(bullet);
    (job.details || []).forEach(bullet);
    if (job.division) text(job.division, { size: 9 });
    if (job.technologies || job.stack?.length)
      text(`${copy.tools}: ${job.technologies || job.stack?.join(", ")}`, {
        size: 9,
      });
    y += 1;
  });
  heading(copy.pdfInterests);
  text(
    resume.languages.length
      ? `${copy.pdfLanguages}: ${resume.languages.join(", ")}.`
      : "",
    {
      size: 9.5,
      after: 1,
      lineHeight: 4.5,
    },
  );
  text(resume.interests, { size: 9.5, after: 0, lineHeight: 4.5 });

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(181, 197, 217);
    doc.line(left, 282, right, 282);
    setText(8, "normal", muted);
    doc.text(clean(resume.shortName), left, 287);
    doc.text(`${page} / ${count}`, right, 287, { align: "right" });
  }
  return doc;
}
