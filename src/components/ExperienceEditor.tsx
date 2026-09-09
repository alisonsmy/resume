import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Job, Resume } from "../types";
import {
  differentJobs,
  downloadWebsiteFile,
  normalizeExperience,
} from "../lib/storage";
import { Modal } from "./Modal";

const fields = [
  "company",
  "role",
  "dates",
  "location",
  "division",
  "bullets",
  "details",
  "stack",
  "technologies",
] as const;
type Field = (typeof fields)[number];
type FormJob = Record<Field, string>;
const toForm = (jobs: Job[]): FormJob[] =>
  normalizeExperience(jobs).map(
    (job) =>
      Object.fromEntries(
        fields.map((field) => {
          const value = job[field];
          return [
            field,
            Array.isArray(value)
              ? value.join(field === "stack" ? ", " : "\n")
              : (value ?? ""),
          ];
        }),
      ) as FormJob,
  );
const fromForm = (jobs: FormJob[]): Job[] =>
  normalizeExperience(
    jobs.map((job) => ({
      ...job,
      bullets: job.bullets.split("\n"),
      details: job.details.split("\n"),
      stack: job.stack.split(","),
    })),
  );
const definitions: {
  field: Field;
  label: string;
  rows?: number;
  hint?: string;
  required?: boolean;
}[] = [
  { field: "company", label: "Company", required: true },
  { field: "role", label: "Job title", required: true },
  { field: "dates", label: "Dates", required: true },
  { field: "location", label: "Location" },
  { field: "division", label: "Team or division (optional)" },
  {
    field: "bullets",
    label: "Job description",
    rows: 5,
    hint: "Write one point per line.",
    required: true,
  },
  {
    field: "details",
    label: "More details (optional)",
    rows: 4,
    hint: "One point per line. Shown under “More about this role” and included in the PDF.",
  },
  {
    field: "stack",
    label: "Key tools (optional)",
    hint: "Separate tools with commas, for example: Java, Python, AWS.",
  },
  { field: "technologies", label: "Full list of tools (optional)", rows: 2 },
];
interface Props {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  published: Job[];
  onSave: (jobs: Job[]) => boolean;
}
export function ExperienceEditor({
  open,
  onClose,
  resume,
  published,
  onSave,
}: Props) {
  const [draft, setDraft] = useState(() => toForm(resume.experience));
  const [selected, setSelected] = useState(0);
  const [undo, setUndo] = useState<{ jobs: FormJob[]; selected: number }[]>([]);
  const [status, setStatus] = useState("No unsaved changes.");
  const [invalid, setInvalid] = useState<Field | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = differentJobs(fromForm(draft), resume.experience);
  const job = draft[selected];
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (invalid)
      formRef.current
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${invalid}"]`,
        )
        ?.focus();
  }, [invalid, selected]);
  const remember = () =>
    setUndo((history) => [
      ...history,
      { jobs: structuredClone(draft), selected },
    ]);
  function update(field: Field, value: string) {
    setDraft((jobs) =>
      jobs.map((item, index) =>
        index === selected ? { ...item, [field]: value } : item,
      ),
    );
    setInvalid(null);
    setStatus("Changes not saved yet.");
  }
  function save(download = false) {
    const jobs = fromForm(draft);
    const missing = jobs.findIndex(
      (item) =>
        !item.company || !item.role || !item.dates || !item.bullets.length,
    );
    if (missing >= 0) {
      const item = jobs[missing];
      setSelected(missing);
      setInvalid(
        !item.company
          ? "company"
          : !item.role
            ? "role"
            : !item.dates
              ? "dates"
              : "bullets",
      );
      setStatus(
        "Please add a company, job title, dates, and description for each job.",
      );
      return;
    }
    const persisted = onSave(jobs);
    setInvalid(null);
    if (download) {
      downloadWebsiteFile({ ...resume, experience: jobs });
      setStatus(
        "File downloaded. Replace src/data/resume.json on GitHub to publish these changes.",
      );
    } else
      setStatus(
        persisted
          ? "Saved. Your page and PDF are up to date."
          : "Updated for this visit. Browser storage is unavailable; download the file to keep your edits.",
      );
  }
  function move(direction: number) {
    const next = selected + direction;
    if (next < 0 || next >= draft.length) return;
    remember();
    const jobs = [...draft];
    [jobs[selected], jobs[next]] = [jobs[next], jobs[selected]];
    setDraft(jobs);
    setSelected(next);
    setStatus("Changes not saved yet.");
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      id="experience-editor"
      title="Edit experience"
      description="Update your jobs and descriptions. Saved changes appear on this page and in your PDF."
      closeLabel="Close experience editor"
    >
      <p className="editor-notice">
        Edits are saved in this browser. To update your public website, download
        the file and replace <strong>src/data/resume.json</strong> on GitHub.
      </p>
      <div className="editor-body">
        <aside className="editor-sidebar" aria-label="Choose a job">
          <div className="editor-sidebar-heading">
            <h3>Your jobs</h3>
            <button
              className="editor-button"
              onClick={() => {
                remember();
                setDraft([
                  {
                    company: "",
                    role: "",
                    dates: "",
                    location: resume.location,
                    division: "",
                    bullets: "",
                    details: "",
                    stack: "",
                    technologies: "",
                  },
                  ...draft,
                ]);
                setSelected(0);
                setInvalid("company");
                setStatus("Fill in the new job, then save.");
              }}
            >
              + Add job
            </button>
          </div>
          <div className="editor-job-list">
            {draft.map((item, index) => (
              <button
                type="button"
                key={index}
                className="editor-job"
                aria-pressed={index === selected}
                onClick={() => {
                  setSelected(index);
                  setInvalid(null);
                }}
              >
                <strong>{item.company || "New job"}</strong>
                <span>{item.role || "Add a job title"}</span>
              </button>
            ))}
          </div>
          <button
            className="editor-reset"
            onClick={() => {
              remember();
              setDraft(toForm(published));
              setSelected(0);
              setInvalid(null);
              setStatus(
                "Published version loaded. Select Save changes to apply it, or Undo to go back.",
              );
            }}
          >
            Use published version
          </button>
        </aside>
        <div className="editor-fields">
          <div className="editor-job-actions">
            {undo.length > 0 && (
              <button
                className="editor-button"
                onClick={() => {
                  const previous = undo[undo.length - 1];
                  setDraft(previous.jobs);
                  setSelected(previous.selected);
                  setUndo(undo.slice(0, -1));
                  setInvalid(null);
                  setStatus("Previous draft restored.");
                }}
              >
                Undo
              </button>
            )}
            <button
              className="editor-button"
              disabled={!job || selected === 0}
              onClick={() => move(-1)}
            >
              Move up
            </button>
            <button
              className="editor-button"
              disabled={!job || selected === draft.length - 1}
              onClick={() => move(1)}
            >
              Move down
            </button>
            <button
              className="editor-button editor-remove"
              disabled={!job}
              onClick={() => {
                remember();
                setDraft(draft.filter((_, index) => index !== selected));
                setSelected(Math.max(0, selected - 1));
                setInvalid(null);
                setStatus(
                  "Job removed from your draft. Select Undo to bring it back.",
                );
              }}
            >
              Remove job
            </button>
          </div>
          {job ? (
            <form
              ref={formRef}
              className="job-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              {definitions.map(({ field, label, rows, hint, required }) => {
                const props = {
                  name: field,
                  value: job[field],
                  required,
                  "aria-label": label,
                  "aria-invalid": invalid === field,
                  "aria-describedby": hint ? `${field}-hint` : undefined,
                  onChange: (
                    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                  ) => update(field, event.target.value),
                };
                return (
                  <label
                    key={field}
                    className={fields.indexOf(field) >= 4 ? "field-wide" : ""}
                  >
                    {label}
                    {rows ? (
                      <textarea {...props} rows={rows} />
                    ) : (
                      <input
                        {...props}
                        autoComplete="off"
                        placeholder={
                          field === "dates" ? "May 2023 — Present" : undefined
                        }
                      />
                    )}
                    {hint && (
                      <span id={`${field}-hint`} className="field-hint">
                        {hint}
                      </span>
                    )}
                  </label>
                );
              })}
            </form>
          ) : (
            <p>No jobs yet. Select “Add job” to get started.</p>
          )}
        </div>
      </div>
      <div className="editor-footer">
        <p role="status">{status}</p>
        <div>
          <button className="editor-button" onClick={() => save(true)}>
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
