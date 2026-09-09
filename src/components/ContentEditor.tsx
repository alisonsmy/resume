import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Education, Internship, Resume, ResumeContent } from "../types";
import {
  contentFrom,
  labelDefinitions,
  labelsFor,
  normalizeContent,
  type LabelKey,
} from "../lib/content";
import { downloadWebsiteFile } from "../lib/storage";
import { Modal } from "./Modal";

const sections = [
  "Profile & contact",
  "Introduction",
  "Skills",
  "Education",
  "Internships",
  "Interests & languages",
  "Headings & links",
] as const;
type Section = (typeof sections)[number];
type ListKey = "skills" | "education" | "internships";
const emptyEducation: Education = {
  school: "",
  location: "",
  degree: "",
  shortDegree: "",
  dates: "",
  years: "",
  note: "",
};
const emptyInternship: Internship = {
  company: "",
  role: "",
  shortRole: "",
  dates: "",
  years: "",
  location: "",
  division: "",
  bullets: [],
  details: [],
  stack: [],
  technologies: "",
};
function Field({
  label,
  value,
  onChange,
  rows,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  type?: "text" | "email" | "url";
}) {
  return (
    <label className={rows ? "field-wide" : ""}>
      <span>{label}</span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}
interface Props {
  open: boolean;
  onClose: () => void;
  onExperience: () => void;
  resume: Resume;
  published: Resume;
  onSave: (content: ResumeContent) => boolean;
}
export function ContentEditor({
  open,
  onClose,
  onExperience,
  resume,
  published,
  onSave,
}: Props) {
  const [draft, setDraft] = useState(() => contentFrom(resume));
  const [section, setSection] = useState<Section>("Profile & contact");
  const [undo, setUndo] = useState<ResumeContent[]>([]);
  const [status, setStatus] = useState("No unsaved changes.");
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(contentFrom(resume));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof ResumeContent>(
    key: K,
    value: ResumeContent[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setStatus("Unsaved changes.");
  }
  function remember() {
    setUndo((previous) => [...previous.slice(-19), structuredClone(draft)]);
  }
  function move(key: ListKey, index: number, offset: number) {
    remember();
    setDraft((previous) => {
      const items = [...previous[key]];
      [items[index], items[index + offset]] = [
        items[index + offset],
        items[index],
      ];
      return { ...previous, [key]: items };
    });
    setStatus("Order changed. Save when ready.");
  }
  function remove(key: ListKey, index: number) {
    remember();
    setDraft((previous) => ({
      ...previous,
      [key]: previous[key].filter((_, i) => i !== index),
    }));
    setStatus("Entry removed. Use Undo to bring it back.");
  }
  function save(): ResumeContent | undefined {
    if (!formRef.current?.reportValidity()) return;
    if (!draft.name.trim() || !draft.shortName.trim()) {
      setSection("Profile & contact");
      setStatus("Please enter your full name and display name.");
      return;
    }
    try {
      const clean = normalizeContent(draft);
      const persisted = onSave(clean);
      setDraft(clean);
      setStatus(
        persisted
          ? "Saved in this browser. The page and PDF now use your changes."
          : "Updated for this visit. Browser storage is unavailable—download your website file to keep these changes.",
      );
      return clean;
    } catch (error) {
      setSection("Profile & contact");
      setStatus(
        error instanceof Error ? error.message : "Please check your text.",
      );
    }
  }
  function textField(
    key:
      | "name"
      | "shortName"
      | "role"
      | "location"
      | "email"
      | "phone"
      | "linkedin"
      | "intro"
      | "summary"
      | "interests",
    label: string,
    rows?: number,
    hint?: string,
  ) {
    return (
      <Field
        key={key}
        label={label}
        value={draft[key]}
        onChange={(value) => change(key, value)}
        rows={rows}
        hint={hint}
        type={key === "email" ? "email" : key === "linkedin" ? "url" : "text"}
      />
    );
  }
  function listField(key: "focus" | "languages", label: string) {
    return (
      <Field
        label={label}
        value={draft[key].join("\n")}
        onChange={(value) => change(key, value.split("\n"))}
        rows={4}
        hint="One item per line."
      />
    );
  }
  function card(
    key: ListKey,
    index: number,
    title: string,
    children: ReactNode,
  ) {
    return (
      <fieldset className="content-card" key={index}>
        <legend>{title}</legend>
        <div className="editor-job-actions">
          <button
            type="button"
            className="editor-button"
            disabled={index === 0}
            aria-label={`Move ${title} up`}
            onClick={() => move(key, index, -1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="editor-button"
            disabled={index === draft[key].length - 1}
            aria-label={`Move ${title} down`}
            onClick={() => move(key, index, 1)}
          >
            Move down
          </button>
          <button
            type="button"
            className="editor-button editor-remove"
            aria-label={`Remove ${title}`}
            onClick={() => remove(key, index)}
          >
            Remove
          </button>
        </div>
        <div className="job-form">{children}</div>
      </fieldset>
    );
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      id="content-editor"
      title="Edit your resume"
      description="Choose a section and change the text. Save to update the page and your next PDF preview."
      closeLabel="Close resume editor"
      className="content-editor"
    >
      <p className="editor-notice">
        Changes stay in this browser. To publish them, download the website file
        and replace <strong>src/data/resume.json</strong> in GitHub.
      </p>
      <div className="editor-body">
        <aside className="editor-sidebar">
          <nav className="editor-job-list" aria-label="Resume sections">
            {sections.map((item) => (
              <button
                key={item}
                className="editor-job"
                aria-pressed={section === item}
                onClick={() => setSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <button
            className="editor-button company-shortcut"
            onClick={onExperience}
          >
            Companies & jobs ↗
          </button>
          <button
            className="editor-reset"
            onClick={() => {
              remember();
              setDraft(contentFrom(published));
              setStatus(
                "Published text loaded. Save to apply it. Your jobs and photo are kept.",
              );
            }}
          >
            Use published text
          </button>
        </aside>
        <div className="editor-fields">
          <div className="content-section-heading">
            <h3>{section}</h3>
            <button
              className="editor-button"
              disabled={!undo.length}
              onClick={() => {
                const previous = undo.at(-1);
                if (previous) {
                  setDraft(previous);
                  setUndo((items) => items.slice(0, -1));
                  setStatus("Change undone. Save when ready.");
                }
              }}
            >
              Undo
            </button>
          </div>
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            {section === "Profile & contact" && (
              <div className="job-form">
                {textField("name", "Full name")}
                {textField(
                  "shortName",
                  "Display name",
                  undefined,
                  "Used in the wordmark, signature, and PDF footer.",
                )}
                {textField("role", "Professional title")}
                {textField("location", "Location")}
                {textField("email", "Email")}
                {textField("phone", "Phone")}
                {textField(
                  "linkedin",
                  "LinkedIn address",
                  undefined,
                  "Use the full address, starting with https://.",
                )}
              </div>
            )}
            {section === "Introduction" && (
              <div className="job-form">
                <Field
                  label="Headline — first line"
                  value={draft.headline[0] ?? ""}
                  onChange={(value) =>
                    change("headline", [value, draft.headline[1] ?? ""])
                  }
                />
                <Field
                  label="Headline — second line (italic)"
                  value={draft.headline[1] ?? ""}
                  onChange={(value) =>
                    change("headline", [draft.headline[0] ?? "", value])
                  }
                />
                {textField(
                  "intro",
                  "Introduction",
                  4,
                  "Shown on the website and in the PDF.",
                )}
                {textField(
                  "summary",
                  "Professional summary",
                  5,
                  "Shown below your introduction on the website and in the PDF.",
                )}
                {listField("focus", "Focus areas")}
              </div>
            )}
            {section === "Skills" && (
              <>
                {draft.skills.map((skill, index) =>
                  card(
                    "skills",
                    index,
                    `Skill group ${index + 1}`,
                    <>
                      <Field
                        label="Group name"
                        value={skill.label}
                        onChange={(value) =>
                          change(
                            "skills",
                            draft.skills.map((item, i) =>
                              i === index ? { ...item, label: value } : item,
                            ),
                          )
                        }
                      />
                      <Field
                        label="Skills"
                        value={skill.items.join("\n")}
                        rows={4}
                        hint="One skill per line."
                        onChange={(value) =>
                          change(
                            "skills",
                            draft.skills.map((item, i) =>
                              i === index
                                ? { ...item, items: value.split("\n") }
                                : item,
                            ),
                          )
                        }
                      />
                    </>,
                  ),
                )}
                <button
                  type="button"
                  className="editor-button"
                  onClick={() => {
                    remember();
                    change("skills", [
                      ...draft.skills,
                      { label: "", items: [] },
                    ]);
                  }}
                >
                  + Add skill group
                </button>
              </>
            )}
            {section === "Education" && (
              <>
                {draft.education.map((degree, index) =>
                  card(
                    "education",
                    index,
                    `Education ${index + 1}`,
                    (
                      Object.entries({
                        school: "School",
                        location: "Location (PDF)",
                        degree: "Full degree (PDF)",
                        shortDegree: "Degree on website",
                        dates: "Study period (PDF)",
                        years: "Study period on website",
                        note: "Notes",
                      }) as [keyof Education, string][]
                    ).map(([key, label]) => (
                      <Field
                        key={key}
                        label={label}
                        value={degree[key]}
                        rows={key === "note" ? 2 : undefined}
                        onChange={(value) =>
                          change(
                            "education",
                            draft.education.map((item, i) =>
                              i === index ? { ...item, [key]: value } : item,
                            ),
                          )
                        }
                      />
                    )),
                  ),
                )}
                <button
                  type="button"
                  className="editor-button"
                  onClick={() => {
                    remember();
                    change("education", [
                      ...draft.education,
                      { ...emptyEducation },
                    ]);
                  }}
                >
                  + Add education
                </button>
              </>
            )}
            {section === "Internships" && (
              <>
                {draft.internships.map((job, index) =>
                  card(
                    "internships",
                    index,
                    `Internship ${index + 1}`,
                    <>
                      {(
                        Object.entries({
                          company: "Company",
                          role: "Full job title (PDF)",
                          shortRole: "Job title on website",
                          dates: "Employment period (PDF)",
                          years: "Employment period on website",
                          location: "Location",
                          division: "Team or division",
                          technologies: "Full list of tools",
                        }) as [keyof Internship, string][]
                      ).map(([key, label]) => (
                        <Field
                          key={key}
                          label={label}
                          value={String(job[key] ?? "")}
                          onChange={(value) =>
                            change(
                              "internships",
                              draft.internships.map((item, i) =>
                                i === index ? { ...item, [key]: value } : item,
                              ),
                            )
                          }
                        />
                      ))}
                      {(
                        [
                          ["bullets", "Job description"],
                          ["details", "More details"],
                          ["stack", "Key tools"],
                        ] as const
                      ).map(([key, label]) => (
                        <Field
                          key={key}
                          label={label}
                          value={(job[key] ?? []).join("\n")}
                          rows={4}
                          hint="One point per line."
                          onChange={(value) =>
                            change(
                              "internships",
                              draft.internships.map((item, i) =>
                                i === index
                                  ? { ...item, [key]: value.split("\n") }
                                  : item,
                              ),
                            )
                          }
                        />
                      ))}
                    </>,
                  ),
                )}
                <button
                  type="button"
                  className="editor-button"
                  onClick={() => {
                    remember();
                    change("internships", [
                      ...draft.internships,
                      structuredClone(emptyInternship),
                    ]);
                  }}
                >
                  + Add internship
                </button>
              </>
            )}
            {section === "Interests & languages" && (
              <div className="job-form">
                {textField("interests", "Interests", 4)}
                {listField("languages", "Languages")}
              </div>
            )}
            {section === "Headings & links" && (
              <div className="job-form">
                {(Object.keys(labelDefinitions) as LabelKey[]).map((key) => (
                  <Field
                    key={key}
                    label={labelDefinitions[key][0]}
                    value={labelsFor(draft)[key]}
                    onChange={(value) =>
                      change("copy", { ...draft.copy, [key]: value })
                    }
                  />
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
      <div className="editor-footer">
        <p role="status" aria-live="polite">
          {dirty && !status.includes("Please") && !status.includes("address")
            ? `Unsaved changes. ${status === "Unsaved changes." ? "Save when ready." : status}`
            : status}
        </p>
        <div>
          <button
            className="editor-button"
            onClick={() => {
              const saved = save();
              if (saved) downloadWebsiteFile({ ...resume, ...saved });
            }}
          >
            Download website file
          </button>
          <button className="button" onClick={() => save()}>
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
