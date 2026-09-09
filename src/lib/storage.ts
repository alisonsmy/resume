import type { Job, Resume, ResumeContent } from "../types";

import { contentFrom, differentContent, normalizeContent } from "./content";

export const CONTENT_KEY = "alison-resume-content-v1";

// Keep the existing keys so saved edits survive the React migration at the same URL.
export const EXPERIENCE_KEY = "alison-resume-experience-v1";
export const PHOTO_KEY = "alison-resume-photo-v1";
export const isPhoto = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length < 2500000 &&
  /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value);
export const defaultPhoto = `${import.meta.env.BASE_URL}assets/alison-shu.jpg`;

export function normalizeExperience(value: unknown): Job[] {
  if (!Array.isArray(value)) throw new Error("Expected a list of jobs");
  return value.map((job: unknown) => {
    if (!job || typeof job !== "object") throw new Error("Invalid job");
    const record = job as Record<string, unknown>;
    const text = (key: string): string => {
      const field = record[key] ?? "";
      if (typeof field !== "string") throw new Error("Invalid job field");
      return field.trim();
    };
    const list = (key: string): string[] => {
      const field = record[key] ?? [];
      if (
        !Array.isArray(field) ||
        !field.every((item: unknown) => typeof item === "string")
      )
        throw new Error("Invalid descriptions");
      return field.map((item: string) => item.trim()).filter(Boolean);
    };
    return {
      company: text("company"),
      role: text("role"),
      dates: text("dates"),
      location: text("location"),
      division: text("division"),
      bullets: list("bullets"),
      details: list("details"),
      stack: list("stack"),
      technologies: text("technologies"),
    };
  });
}
export const differentJobs = (a: Job[], b: Job[]) =>
  JSON.stringify(normalizeExperience(a)) !==
  JSON.stringify(normalizeExperience(b));

export function readSavedResume(published: Resume): Resume {
  const resume = structuredClone(published);
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    if (raw !== null) Object.assign(resume, normalizeContent(JSON.parse(raw)));
  } catch {
    /* Keep published text; jobs and photo are restored independently. */
  }
  try {
    const raw = localStorage.getItem(EXPERIENCE_KEY);
    if (raw !== null) resume.experience = normalizeExperience(JSON.parse(raw));
  } catch {
    /* Keep published jobs when storage is unavailable or invalid. */
  }
  try {
    const photo = localStorage.getItem(PHOTO_KEY);
    if (isPhoto(photo)) resume.photo = photo;
  } catch {
    /* Keep the published photo. */
  }
  return resume;
}
export function persistJobs(jobs: Job[], original: Job[]): boolean {
  try {
    if (differentJobs(jobs, original))
      localStorage.setItem(EXPERIENCE_KEY, JSON.stringify(jobs));
    else localStorage.removeItem(EXPERIENCE_KEY);
    return true;
  } catch {
    return false;
  }
}
export function persistPhoto(
  photo: string | undefined,
  original: string | undefined,
): boolean {
  try {
    if (photo === original || photo === undefined)
      localStorage.removeItem(PHOTO_KEY);
    else localStorage.setItem(PHOTO_KEY, photo);
    return true;
  } catch {
    return false;
  }
}
export function websiteFile(resume: Resume): string {
  return `${JSON.stringify(resume, null, 2)}\n`;
}
export function downloadWebsiteFile(resume: Resume): void {
  const url = URL.createObjectURL(
    new Blob([websiteFile(resume)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.json";
  (document.querySelector("dialog[open]") ?? document.body).append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function persistContent(
  content: ResumeContent,
  original: Resume,
): boolean {
  try {
    const normalized = normalizeContent(content);
    if (differentContent(normalized, contentFrom(original)))
      localStorage.setItem(CONTENT_KEY, JSON.stringify(normalized));
    else localStorage.removeItem(CONTENT_KEY);
    return true;
  } catch {
    return false;
  }
}
