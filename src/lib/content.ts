import type { Resume, ResumeContent } from "../types";

export const labelDefinitions = {
  navExperience: ["Experience navigation", "Experience"],
  navSkills: ["Skills navigation", "Skills"],
  navAbout: ["About navigation", "About"],
  explore: ["Experience link", "Explore my experience"],
  getInTouch: ["Contact link", "Get in touch"],
  experienceTitle: ["Experience heading — first part", "Where I’ve"],
  experienceEmphasis: ["Experience heading — italic part", "worked."],
  experienceSubtitle: [
    "Experience subtitle",
    "Building software for fast-moving financial markets.",
  ],
  moreAboutRole: ["Job details link", "More about this role"],
  tools: ["Tools label", "Tools"],
  skillsTitle: ["Skills heading", "Tools of the trade."],
  educationTitle: ["Education heading", "Always learning."],
  internshipsTitle: ["Internships heading", "Where it started"],
  readMore: ["Internship details link", "Read more"],
  interestsTitle: ["Interests heading", "Away from the keyboard."],
  languagesIntro: ["Languages introduction", "I speak"],
  contactTitle: ["Contact heading", "Let’s build something good."],
  linkedin: ["LinkedIn link label", "LinkedIn"],
  backToTop: ["Back to top link", "Back to top"],
  pdfExperience: ["PDF experience heading", "Experience"],
  pdfSkills: ["PDF skills heading", "Skills"],
  pdfEducation: ["PDF education heading", "Education"],
  pdfInternships: ["PDF internships heading", "Internships"],
  pdfInterests: ["PDF interests heading", "Outside work"],
  pdfLanguages: ["PDF languages label", "Languages"],
} as const;
export type LabelKey = keyof typeof labelDefinitions;
export type ResumeLabels = Record<LabelKey, string>;
export const defaultLabels = Object.fromEntries(
  Object.entries(labelDefinitions).map(([key, [, value]]) => [key, value]),
) as ResumeLabels;
export const labelsFor = (resume: Pick<Resume, "copy">): ResumeLabels => ({
  ...defaultLabels,
  ...resume.copy,
});
const textKeys = [
  "name",
  "shortName",
  "role",
  "location",
  "email",
  "phone",
  "linkedin",
  "intro",
  "summary",
  "interests",
] as const;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid resume section");
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid text field");
  return value.trim();
}
function list(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Invalid list");
  return value.map(string).filter(Boolean);
}
function entries(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error("Invalid section");
  return value.map(record);
}
export function normalizeContent(value: unknown): ResumeContent {
  const data = record(value);
  const fields = Object.fromEntries(
    textKeys.map((key) => [key, string(data[key])]),
  ) as Pick<Resume, (typeof textKeys)[number]>;
  if (fields.email && !/^[^\s@]+@[^\s@]+$/.test(fields.email))
    throw new Error("Please enter a valid email address.");
  if (fields.linkedin && !/^https?:\/\//i.test(fields.linkedin))
    throw new Error("Use a full LinkedIn address starting with https://.");
  if (fields.linkedin) new URL(fields.linkedin);
  const copy = { ...defaultLabels };
  if (data.copy !== undefined) {
    const saved = record(data.copy);
    for (const key of Object.keys(defaultLabels) as LabelKey[]) {
      if (saved[key] !== undefined) copy[key] = string(saved[key]);
    }
  }
  return {
    ...fields,
    headline: Array.isArray(data.headline)
      ? data.headline.map(string)
      : list(data.headline),
    focus: list(data.focus),
    languages: list(data.languages),
    copy,
    skills: entries(data.skills).map((item) => ({
      label: string(item.label),
      items: list(item.items),
    })),
    education: entries(data.education).map((item) => ({
      school: string(item.school),
      location: string(item.location),
      degree: string(item.degree),
      shortDegree: string(item.shortDegree),
      dates: string(item.dates),
      years: string(item.years),
      note: string(item.note),
    })),
    internships: entries(data.internships).map((item) => ({
      company: string(item.company),
      role: string(item.role),
      shortRole: string(item.shortRole),
      dates: string(item.dates),
      years: string(item.years),
      location: string(item.location),
      division: string(item.division ?? ""),
      bullets: list(item.bullets),
      details: list(item.details ?? []),
      stack: list(item.stack ?? []),
      technologies: string(item.technologies ?? ""),
    })),
  };
}
export const contentFrom = (resume: Resume): ResumeContent =>
  normalizeContent(resume);
export const differentContent = (a: ResumeContent, b: ResumeContent) =>
  JSON.stringify(normalizeContent(a)) !== JSON.stringify(normalizeContent(b));
