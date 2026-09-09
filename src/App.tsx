import { Fragment, lazy, Suspense, useEffect, useState } from "react";
import type { Job, Resume } from "./types";
import content from "./data/resume.json";
import {
  defaultPhoto,
  differentJobs,
  persistJobs,
  persistPhoto,
  readSavedResume,
} from "./lib/storage";
import { ExperienceEditor } from "./components/ExperienceEditor";
import { PhotoEditor } from "./components/PhotoEditor";
import { Modal } from "./components/Modal";

const PdfPreview = lazy(() => import("./components/PdfPreview"));
const published: Resume = content;
function Arrow({
  direction = "diagonal",
}: {
  direction?: "diagonal" | "down" | "up" | "download";
}) {
  const paths = {
    diagonal: "M5 19 19 5M5 5h14v14",
    down: "M12 3v18m-7-7 7 7 7-7",
    up: "M12 21V3m-7 7 7-7 7 7",
    download: "M12 3v13m-5-5 5 5 5-5M4 21h16",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[direction]} />
    </svg>
  );
}
function Points({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
function Experience({ jobs }: { jobs: Job[] }) {
  return (
    <div id="experience-list">
      {jobs.map((job, index) => (
        <article className="job" key={index}>
          <div className="job-meta">
            <p>{job.dates}</p>
            <p>{job.location}</p>
          </div>
          <div className="job-content">
            <h3>{job.company}</h3>
            <p className="job-role">
              {[job.role, job.division].filter(Boolean).join(" · ")}
            </p>
            <Points items={job.bullets} />
            {!!job.stack?.length && (
              <p className="job-stack">{job.stack.join(" · ")}</p>
            )}
            {(!!job.details?.length || !!job.technologies) && (
              <details>
                <summary aria-label={`More about this role at ${job.company}`}>
                  More about this role
                </summary>
                <Points items={job.details || []} />
                {job.technologies && (
                  <p className="technical-note">Tools: {job.technologies}</p>
                )}
              </details>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
export default function App() {
  const [resume, setResume] = useState(() => readSavedResume(published));
  const [editor, setEditor] = useState<"experience" | "photo" | "pdf" | null>(
    null,
  );
  const [experienceMounted, setExperienceMounted] = useState(false);
  useEffect(() => {
    document.title = `${resume.shortName} — ${resume.role}`;
  }, [resume.shortName, resume.role]);
  function saveJobs(jobs: Job[]) {
    const persisted = persistJobs(jobs, published.experience);
    setResume((previous) => ({ ...previous, experience: jobs }));
    return persisted;
  }
  function savePhoto(photo: string | undefined) {
    const persisted = persistPhoto(photo, published.photo);
    setResume((previous) => ({ ...previous, photo }));
    return persisted;
  }
  const spoken = resume.languages.slice(0, -1).join(", ");
  const close = () => setEditor(null);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header wrap">
        <a
          className="wordmark"
          href="#top"
          aria-label="Alison Shu, back to top"
        >
          alison shu.
        </a>
        <nav aria-label="Main navigation">
          <a href="#experience">Experience</a>
          <a href="#skills">Skills</a>
          <a href="#about">About</a>
        </nav>
        <button className="button download" onClick={() => setEditor("pdf")}>
          <Arrow direction="download" />
          <span>Preview PDF</span>
        </button>
      </header>
      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-main">
            <h1 id="hero-title">
              {resume.headline[0]}
              <br />
              <em>{resume.headline[1]}</em>
            </h1>
            <div className="introduction">
              <p>{resume.intro}</p>
              <p>{resume.summary}</p>
            </div>
            <div className="hero-actions">
              <a className="button" href="#experience">
                Explore my experience <Arrow direction="down" />
              </a>
              <a className="text-link" href="#contact">
                Get in touch <Arrow />
              </a>
            </div>
          </div>
          <aside className="signature" aria-label="About Alison">
            <img
              id="portrait"
              className="portrait"
              src={resume.photo || defaultPhoto}
              width={400}
              height={400}
              alt={resume.shortName}
              fetchPriority="high"
            />
            <div className="signature-name" aria-hidden="true">
              <em>Alison</em> Shu
            </div>
            <p>{resume.name}</p>
            <p>
              {resume.role} ·{" "}
              <span className="location">{resume.location}</span>
            </p>
            <div className="photo-controls">
              <button
                className="editor-button"
                onClick={() => setEditor("photo")}
              >
                Replace photo
              </button>
              {resume.photo !== published.photo && (
                <span>Photo saved in this browser.</span>
              )}
            </div>
          </aside>
          <ol className="focus-list">
            {resume.focus.map((focus, index) => (
              <li key={focus}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span>{focus}</span>
              </li>
            ))}
          </ol>
        </section>
        <section
          id="experience"
          className="experience wrap"
          aria-labelledby="experience-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="experience-title">
                Where I’ve <em>worked.</em>
              </h2>
              <p>Building software for fast-moving financial markets.</p>
            </div>
            <button
              className="editor-button"
              id="edit-experience"
              onClick={() => {
                setExperienceMounted(true);
                setEditor("experience");
              }}
            >
              Edit experience
            </button>
          </div>
          {differentJobs(resume.experience, published.experience) && (
            <p className="local-edit-note">
              Showing your saved edits. Download the website file from the
              editor to publish them.
            </p>
          )}
          <Experience jobs={resume.experience} />
        </section>
        <section className="foundations wrap" aria-label="Skills and education">
          <div id="skills">
            <h2>Tools of the trade.</h2>
            <dl className="skill-list">
              {resume.skills.map((skill) => (
                <Fragment key={skill.label}>
                  <dt>{skill.label}</dt>
                  <dd>{skill.items.join(", ")}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
          <div className="learning">
            <h2>Always learning.</h2>
            <div>
              {resume.education.map((degree, index) => (
                <Fragment key={degree.degree}>
                  {(!index ||
                    degree.school !== resume.education[index - 1].school) && (
                    <h3>{degree.school}</h3>
                  )}
                  <p>
                    {degree.shortDegree} · {degree.years}
                    {degree.note.startsWith("GPA") ? ` · ${degree.note}` : ""}
                  </p>
                </Fragment>
              ))}
            </div>
            <h3>Where it started</h3>
            <div>
              {resume.internships.map((job) => (
                <div className="internship" key={job.company}>
                  <p>
                    {job.company} · {job.shortRole} · {job.years}
                  </p>
                  <details>
                    <summary aria-label={`Read more about ${job.company}`}>
                      Read more
                    </summary>
                    <Points items={job.bullets} />
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="about"
          className="personal wrap"
          aria-labelledby="about-title"
        >
          <h2 id="about-title">Away from the keyboard.</h2>
          <div>
            <p className="interests">{resume.interests}</p>
            <p>
              I speak {spoken}
              {resume.languages.length > 2 ? "," : ""}
              {spoken ? " and " : ""}
              {resume.languages.at(-1)}.
            </p>
          </div>
        </section>
      </main>
      <footer id="contact" className="contact">
        <div className="wrap">
          <h2>Let’s build something good.</h2>
          <div className="contact-links">
            <a href={`mailto:${resume.email}`}>
              {resume.email}
              <Arrow />
            </a>
            <a
              href={resume.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn (opens in a new tab)"
            >
              LinkedIn
              <Arrow />
            </a>
            <a href={`tel:${resume.phone.replace(/\s/g, "")}`}>
              {resume.phone}
            </a>
          </div>
          <div className="footer-bottom">
            <p>
              {resume.shortName} · {resume.location}
            </p>
            <a href="#top">
              Back to top <Arrow direction="up" />
            </a>
          </div>
        </div>
      </footer>
      {experienceMounted && (
        <ExperienceEditor
          open={editor === "experience"}
          onClose={close}
          resume={resume}
          published={published.experience}
          onSave={saveJobs}
        />
      )}
      {editor === "photo" && (
        <PhotoEditor
          resume={resume}
          published={published.photo}
          onSave={savePhoto}
          onClose={close}
        />
      )}
      {editor === "pdf" && (
        <Suspense
          fallback={
            <Modal
              open
              onClose={close}
              id="pdf-loading"
              className="pdf-preview"
              title="Resume preview"
              description="Preparing your A4 resume…"
              closeLabel="Close PDF preview"
            >
              <p className="editor-notice" role="status">
                Loading PDF preview…
              </p>
            </Modal>
          }
        >
          <PdfPreview resume={resume} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
