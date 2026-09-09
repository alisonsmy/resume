import { Fragment, lazy, Suspense, useEffect, useState } from "react";
import type { Job, Resume, ResumeContent } from "./types";
import content from "./data/resume.json";
import {
  defaultPhoto,
  differentJobs,
  persistJobs,
  persistContent,
  persistPhoto,
  readSavedResume,
} from "./lib/storage";
import { ExperienceEditor } from "./components/ExperienceEditor";
import { PhotoEditor } from "./components/PhotoEditor";
import { Modal } from "./components/Modal";

import { ContentEditor } from "./components/ContentEditor";
import {
  labelsFor,
  type ResumeLabels,
  differentContent,
  contentFrom,
} from "./lib/content";

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
function Experience({ jobs, copy }: { jobs: Job[]; copy: ResumeLabels }) {
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
                <summary aria-label={`${copy.moreAboutRole} — ${job.company}`}>
                  {copy.moreAboutRole}
                </summary>
                <Points items={job.details || []} />
                {job.technologies && (
                  <p className="technical-note">
                    {copy.tools}: {job.technologies}
                  </p>
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
  const [editor, setEditor] = useState<
    "experience" | "photo" | "pdf" | "content" | null
  >(null);
  const [experienceMounted, setExperienceMounted] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const copy = labelsFor(resume);
  function saveContent(content: ResumeContent) {
    const persisted = persistContent(content, published);
    setResume((previous) => ({ ...previous, ...content }));
    return persisted;
  }
  const openExperience = () => {
    setExperienceMounted(true);
    setEditor("experience");
  };
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
          aria-label={`${resume.shortName}, ${copy.backToTop}`}
        >
          {resume.shortName.toLowerCase()}.
        </a>
        <nav aria-label="Main navigation">
          <a href="#experience">{copy.navExperience}</a>
          <a href="#skills">{copy.navSkills}</a>
          <a href="#about">{copy.navAbout}</a>
        </nav>
        <button className="button download" onClick={() => setEditor("pdf")}>
          <Arrow direction="download" />
          <span>Preview PDF</span>
        </button>
      </header>
      <div className="resume-edit-tools wrap">
        {differentContent(contentFrom(resume), contentFrom(published)) && (
          <span>Showing text saved in this browser.</span>
        )}
        <button
          className="editor-button"
          onClick={() => {
            setContentMounted(true);
            setEditor("content");
          }}
        >
          Edit resume
        </button>
      </div>
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
                {copy.explore} <Arrow direction="down" />
              </a>
              <a className="text-link" href="#contact">
                {copy.getInTouch} <Arrow />
              </a>
            </div>
          </div>
          <aside className="signature" aria-label={`About ${resume.shortName}`}>
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
              <em>{resume.shortName.split(" ")[0]}</em>
              {resume.shortName.includes(" ")
                ? ` ${resume.shortName.split(" ").slice(1).join(" ")}`
                : ""}
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
              <li key={index}>
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
                {copy.experienceTitle} <em>{copy.experienceEmphasis}</em>
              </h2>
              <p>{copy.experienceSubtitle}</p>
            </div>
            <button
              className="editor-button"
              id="edit-experience"
              onClick={openExperience}
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
          <Experience jobs={resume.experience} copy={copy} />
        </section>
        <section className="foundations wrap" aria-label="Skills and education">
          <div id="skills">
            <h2>{copy.skillsTitle}</h2>
            <dl className="skill-list">
              {resume.skills.map((skill, index) => (
                <Fragment key={index}>
                  <dt>{skill.label}</dt>
                  <dd>{skill.items.join(", ")}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
          <div className="learning">
            <h2>{copy.educationTitle}</h2>
            <div>
              {resume.education.map((degree, index) => (
                <Fragment key={index}>
                  {(!index ||
                    degree.school !== resume.education[index - 1].school) && (
                    <h3>{degree.school}</h3>
                  )}
                  <p>
                    {degree.shortDegree} · {degree.years}
                    {degree.note ? ` · ${degree.note}` : ""}
                  </p>
                </Fragment>
              ))}
            </div>
            <h3>{copy.internshipsTitle}</h3>
            <div>
              {resume.internships.map((job, index) => (
                <div className="internship" key={index}>
                  <p>
                    {job.company} · {job.shortRole} · {job.years}
                  </p>
                  <details>
                    <summary aria-label={`${copy.readMore} — ${job.company}`}>
                      {copy.readMore}
                    </summary>
                    <Points items={job.bullets} />
                    <Points items={job.details || []} />
                    {job.division && <p>{job.division}</p>}
                    {job.location && <p>{job.location}</p>}
                    {!!job.stack?.length && <p>{job.stack.join(" · ")}</p>}
                    {job.technologies && (
                      <p>
                        {copy.tools}: {job.technologies}
                      </p>
                    )}
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
          <h2 id="about-title">{copy.interestsTitle}</h2>
          <div>
            <p className="interests">{resume.interests}</p>
            {resume.languages.length > 0 && (
              <p>
                {copy.languagesIntro} {spoken}
                {resume.languages.length > 2 ? "," : ""}
                {spoken ? " and " : ""}
                {resume.languages.at(-1)}.
              </p>
            )}
          </div>
        </section>
      </main>
      <footer id="contact" className="contact">
        <div className="wrap">
          <h2>{copy.contactTitle}</h2>
          <div className="contact-links">
            <a href={`mailto:${resume.email}`}>
              {resume.email}
              <Arrow />
            </a>
            <a
              href={resume.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${copy.linkedin} (opens in a new tab)`}
            >
              {copy.linkedin}
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
              {copy.backToTop} <Arrow direction="up" />
            </a>
          </div>
        </div>
      </footer>
      {contentMounted && (
        <ContentEditor
          open={editor === "content"}
          onClose={close}
          onExperience={openExperience}
          resume={resume}
          published={published}
          onSave={saveContent}
        />
      )}
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
