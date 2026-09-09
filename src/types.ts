import type { ResumeLabels } from "./lib/content";

export interface Job {
  company: string;
  role: string;
  dates: string;
  location: string;
  division?: string;
  bullets: string[];
  details?: string[];
  stack?: string[];
  technologies?: string;
}
export interface Education {
  school: string;
  location: string;
  degree: string;
  shortDegree: string;
  dates: string;
  years: string;
  note: string;
}
export interface Internship extends Job {
  shortRole: string;
  years: string;
}
export interface Resume {
  name: string;
  shortName: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  headline: string[];
  intro: string;
  summary: string;
  focus: string[];
  experience: Job[];
  skills: { label: string; items: string[] }[];
  education: Education[];
  internships: Internship[];
  interests: string;
  languages: string[];
  photo?: string;
  copy?: Partial<ResumeLabels>;
}

export type ResumeContent = Omit<Resume, "experience" | "photo">;
