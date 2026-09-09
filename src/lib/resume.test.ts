import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsPDF } from "jspdf";
import resume from "../data/resume.json";
import { createResumePdf } from "./pdf";
import {
  EXPERIENCE_KEY,
  PHOTO_KEY,
  normalizeExperience,
  readSavedResume,
  persistJobs,
  persistPhoto,
  websiteFile,
} from "./storage";

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("Saved content migration", () => {
  it("reads jobs and a photo saved by the previous JavaScript site", () => {
    localStorage.setItem(
      EXPERIENCE_KEY,
      JSON.stringify([{ ...resume.experience[0], company: "Saved company" }]),
    );
    localStorage.setItem(PHOTO_KEY, "data:image/jpeg;base64,YWJj");
    const result = readSavedResume(resume);
    expect(result.experience[0].company).toBe("Saved company");
    expect(result.photo).toBe("data:image/jpeg;base64,YWJj");
  });
  it("falls back independently when saved jobs are malformed", () => {
    localStorage.setItem(EXPERIENCE_KEY, JSON.stringify([{ bullets: [42] }]));
    localStorage.setItem(PHOTO_KEY, "data:image/jpeg;base64,YWJj");
    expect(readSavedResume(resume).experience).toEqual(resume.experience);
    expect(readSavedResume(resume).photo).toBeDefined();
  });
  it("works when browser storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("Blocked");
      },
      setItem() {
        throw new Error("Full");
      },
    });
    expect(readSavedResume(resume)).toEqual(resume);
    expect(persistPhoto("data:image/jpeg;base64,YWJj", undefined)).toBe(false);
  });
  it("restores published content by clearing browser overrides", () => {
    localStorage.setItem(EXPERIENCE_KEY, "[]");
    localStorage.setItem(PHOTO_KEY, "data:image/jpeg;base64,YWJj");
    expect(persistJobs(resume.experience, resume.experience)).toBe(true);
    expect(persistPhoto(undefined, undefined)).toBe(true);
    expect(localStorage.getItem(EXPERIENCE_KEY)).toBeNull();
    expect(localStorage.getItem(PHOTO_KEY)).toBeNull();
  });
  it("exports valid JSON with edited jobs and photo together", () => {
    const edited = {
      ...resume,
      experience: [
        { ...resume.experience[0], company: 'Quotes " and <script> as text' },
      ],
      photo: "data:image/jpeg;base64,YWJj",
    };
    expect(JSON.parse(websiteFile(edited))).toEqual(edited);
    expect(normalizeExperience(edited.experience)[0].company).toBe(
      edited.experience[0].company,
    );
  });
});
describe("A4 PDF compatibility", () => {
  it("keeps the current content on two A4 pages and gives identical preview/download bytes", () => {
    const pdf = createResumePdf(resume, jsPDF);
    expect(pdf.getNumberOfPages()).toBe(2);
    expect(Buffer.from(pdf.output("arraybuffer"))).toEqual(
      Buffer.from(pdf.output("arraybuffer")),
    );
    for (let page = 1; page <= 2; page++) {
      pdf.setPage(page);
      expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 2);
      expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 2);
    }
  });
  it("adds A4 pages for long descriptions", () => {
    const edited = structuredClone(resume);
    edited.experience[0].bullets = Array.from(
      { length: 80 },
      (_, index) =>
        `Description ${index + 1}: Built reliable services for financial markets.`,
    );
    const pdf = createResumePdf(edited, jsPDF);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
      pdf.setPage(page);
      expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 2);
      expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 2);
    }
  });
});
