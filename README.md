# Alison Shu — React and TypeScript resume

A blue, mobile-friendly resume website built with **React, TypeScript, and Vite**. Edit your work experience, replace and crop your photo, and preview or download an **A4 PDF**.

The website runs entirely in the browser. It needs no database, API key, or backend. GitHub Actions builds it and publishes the finished website to GitHub Pages.

## Run it on your computer — step by step

### 1. Install Node.js

Install **Node.js 24 LTS or newer** from [nodejs.org](https://nodejs.org/en/download). npm is included. Then open Terminal on macOS/Linux or PowerShell on Windows and check:

```sh
node --version
npm --version
```

Node should report `v24` or newer. If either command is missing, reopen the terminal after installation.

### 2. Get the project

If you already have the project, use that folder. Otherwise, select **Code → Download ZIP** on GitHub and unzip it, or clone the repository:

```sh
git clone https://github.com/alisonsmy/resume.git
cd resume
```

For the existing project on this Mac:

```sh
cd "/Users/mshu/Projects/Personal/resume"
```

On Windows, an example is:

```powershell
cd "C:\Users\YourName\Downloads\resume"
```

Use your own path. This folder must directly contain `package.json` and `index.html`.

### 3. Install the dependencies

```sh
npm ci
```

This installs the versions recorded in `package-lock.json`. Run it the first time and after pulling changes to that lockfile. Keep `package-lock.json` in GitHub so local and hosted builds use the same versions.

### 4. Start the website

```sh
npm run dev
```

Keep the terminal open. Open **[http://127.0.0.1:4173/](http://127.0.0.1:4173/)** in your browser.

You should see the resume, **Preview PDF**, **Replace photo**, and **Edit experience**. Changes to source files update the development preview automatically.

Do not double-click `index.html` or use the old Python server for the source folder. Vite compiles the React and TypeScript source for your browser.

### 5. Stop and restart

Press **Ctrl+C** in the running terminal to stop the server. To restart it, open the project folder and run `npm run dev` again.

### 6. Check the production build

Stop the development server first, then run:

```sh
npm test
npm run build
npm run preview
```

Open the same local URL. This time you are viewing the built website in `dist/`, just as it will be served on GitHub Pages. Rebuild after changing source files if you are using this preview.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependency versions |
| `npm run dev` | Run the site with live updates |
| `npm run typecheck` | Check strict TypeScript types |
| `npm test` | Test saved-data compatibility and A4 PDF generation |
| `npm run build` | Check types and create the website in `dist/` |
| `npm run preview` | Serve the built website locally |

## Edit your experience

1. Select **Experience → Edit experience**.
2. Choose a job or select **+ Add job**.
3. Enter the company, job title, dates, and description. Write **one description point per line**.
4. Optionally add a team, more details, and tools.
5. Use **Move up** and **Move down** to reorder jobs. You can reverse **Remove job** with **Undo**.
6. Select **Save changes**. The page and next PDF preview use the saved version.
7. Select **Download website file** to download `resume.json`, which includes your saved jobs and photo.

To publish the edits, replace **`src/data/resume.json`** in your GitHub repository with the downloaded file and commit the change. GitHub Actions will build and publish it.

**Use published version → Save changes** restores the jobs from the source file and clears the local override. Closing the experience editor keeps unsaved text for the current visit. Reloading with an unsaved draft triggers the browser’s leave-page warning.

## Replace and crop your photo

1. Select **Replace photo → Choose a photo**.
2. Choose a **JPG, PNG, or WebP** under **10 MB**, up to **40 megapixels**.
3. Preview the square crop. With a rectangular picture, use the slider to move the crop up/down or left/right.
4. Select **Save photo**. Your page and the next PDF use the new picture.
5. Select **Download website file**, then replace **`src/data/resume.json`** on GitHub to publish it with your saved jobs.

The crop is square with adjustable position; zoom cropping and other crop shapes are not included. Closing before saving keeps your current picture. **Use published photo → Save photo** restores the photo from the website files.

Photos are processed on your device and resized to square JPEGs of up to 800 × 800 pixels. The downloaded JSON contains the image, so you do not need to upload a separate picture.

The original picture is `public/assets/alison-shu.jpg`. To replace it directly, use a square JPEG, remove any `photo` property from `src/data/resume.json`, and clear the browser override using **Use published photo → Save photo**.

## Preview and download an A4 PDF

1. Save your job and photo edits first. Unsaved drafts are not included.
2. Select **Preview PDF** at the top of the website.
3. Use **Previous** and **Next** to check every page. Scroll inside the preview to read the whole page.
4. Select **Fit width**, **100%**, **125%**, or **150%** under **Zoom**. Zoom changes the preview only.
5. Open **Read page text** for an accessible text version of the current page.
6. Select **Download A4 PDF**. If a Save dialog appears, choose a folder and select **Save**. Some mobile browsers open the PDF so you can save or share it.

The filename is `Alison_Shu_Resume.pdf`. Every page is **A4 portrait, 210 × 297 mm**, with selectable text, a photo, page numbers, and clickable contact links. The current resume fits on two pages; longer content creates extra A4 pages automatically.

The preview and download use the same generated PDF. Close the preview, save your changes, and reopen it for an updated version. PDF generation and preview happen on your device. The PDF libraries and fonts are served from the site, without external CDN requests.

If preview rendering fails but the PDF is ready, the download button remains available. Use **Try preview again**, or open the downloaded file in your device’s PDF viewer. For paper printing, open the downloaded PDF and select **A4** in the print dialog. Printing the webpage itself uses a different layout.

## Where edits are saved

**Save changes** and **Save photo** save in your current browser, at the current website address. They do not change source files or the public website.

- Refreshing normally keeps saved edits. Private browsing or clearing browser storage can remove them.
- Other visitors see the published version until you commit the updated JSON file to GitHub.
- Localhost, different ports, and the GitHub Pages address have separate browser saves.
- Both editors’ **Download website file** buttons include your saved jobs and current saved photo.
- Keep the downloaded filename exactly `resume.json` when replacing `src/data/resume.json`, even if the browser adds a number to it.
- To update the local project, replace `src/data/resume.json` in that folder too.

### Existing saves from the JavaScript version

Browser saves from the previous website are kept when you use the same browser and URL: the React app reads the original storage keys. The default local address is still `http://127.0.0.1:4173/` for that reason.

New website-file downloads are **`resume.json`**, replacing the old `resume.js` format. The current source of resume content is **`src/data/resume.json`**. Keep old downloaded files as backups; an old `resume.js` cannot be used directly as a JSON file.

## Change other content or design

Edit **`src/data/resume.json`** in a text editor to update the name, summary, contact details, skills, education, internships, languages, and interests. Use valid JSON: double quotes, no comments, and no trailing commas.

| Field | Use |
| --- | --- |
| `experience[].bullets` | Main job descriptions, one string per point |
| `experience[].details` | Expandable details on the website; included in the PDF |
| `experience[].stack` | Short list of tools on the website |
| `experience[].technologies` | Full tools note on the website and PDF |
| `photo` | Optional image included by the photo editor |

If old browser saves hide file changes, use **Use published version → Save changes** and/or **Use published photo → Save photo**.

The page layout, wordmark, and signature are in `src/App.tsx`. Colors and spacing are in `src/styles.css`. Page metadata is in `index.html`. The PDF layout is in `src/lib/pdf.ts`. Shared data types are in `src/types.ts`.

The resume was adapted from `AlisonShu_Resume2025.pdf` using simple words. Dates are preserved, including **May 2023 — Present**; check them before publishing. The source PDF is not included in the hosted site.

## Publish with GitHub Pages — step by step

1. Upload or push the project to GitHub, including **`src/`**, **`public/assets/`**, **`.github/workflows/deploy.yml`**, `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, and `vite.config.ts`. GitHub Desktop can help upload the full folder structure.
2. Keep the source files at the repository’s top level. Do not upload `node_modules/`, `dist/`, `output/`, or `public/pdfjs/`; the workflow installs dependencies and creates the build and local PDF fonts.
3. Open the repository’s **Settings → Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**. If the previous version used **Deploy from a branch**, switch it to GitHub Actions.
5. Commit or push the changes to **main**. You can also open **Actions → Build and deploy resume → Run workflow** and choose main.
6. Wait for both the build and deploy jobs to finish. The workflow installs dependencies, runs tests, checks TypeScript, builds `dist/`, and publishes that folder.
7. Open the address shown under **Settings → Pages** or the deployment environment. For this repository, the expected address is `https://alisonsmy.github.io/resume/`.
8. Check the page, photo, and **Preview PDF → Download A4 PDF** flow on the published site.

The Vite configuration uses relative asset paths, so the build works at both a root domain and a repository path such as `/resume/`. There is no client-side URL router to configure.

The workflow checks pull requests too, but only deploys main. If your publishing branch has another name, update both the branch triggers and deploy condition in `.github/workflows/deploy.yml`.

For future content updates, replace `src/data/resume.json` and commit. For design changes, commit the changed TypeScript or CSS files. Each push to main rebuilds the website. Use a private browser window to check the published version without local overrides.

This follows [Vite’s GitHub Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `node` or `npm` is not found | Install Node.js 24 or newer and reopen the terminal. |
| `npm ci` fails | Check your Node version and internet connection. Run it from the folder containing `package.json`. Keep `package-lock.json` with the project. |
| PowerShell blocks `npm.ps1` | Use `npm.cmd` in place of `npm` (for example, `npm.cmd run dev`). |
| Port 4173 is in use | Stop the old server with Ctrl+C, or run `npm run dev -- --port 4174` and use the new address. Local saves on 4173 do not move to 4174. |
| Browser cannot connect | Keep the server terminal open and check the printed URL and port. |
| Blank page or raw source | Use `npm run dev`, or build then run `npm run preview`. Do not open `index.html` directly. |
| File changes do not appear in production preview | Run `npm run build` again. `npm run dev` updates source changes automatically. |
| Old jobs or photo override file changes | Restore the published version from the matching editor and save. |
| Photo is rejected | Check format and size. Export HEIC pictures as JPG first. |
| PDF preview fails | Try preview again in a current browser. Reinstall with `npm ci` and rebuild if files are missing. Keep the whole `dist/` together when hosting manually. |
| Public website does not change after browser save | Download `resume.json`, replace `src/data/resume.json` on GitHub, and commit. |
| GitHub Pages is blank or shows 404 | Set Pages Source to GitHub Actions and inspect the workflow under Actions. Serve the built `dist/`, not the TypeScript source folder. |
| Build fails after editing resume content | Check JSON syntax and required fields, then run `npm run typecheck`. |

## Project structure

```text
src/
  App.tsx                     Resume page and shared saved state
  main.tsx                    React entry point
  types.ts                    Resume, job, and education types
  styles.css                  Blue design and responsive layouts
  data/resume.json            Editable resume content and optional photo
  components/
    Modal.tsx                 Shared accessible dialog
    ExperienceEditor.tsx      Jobs, descriptions, reorder, undo, and save
    PhotoEditor.tsx           Picture selection and square crop
    PdfPreview.tsx            A4 preview, page controls, zoom, and download
  lib/
    storage.ts                Browser saves and JSON download
    pdf.ts                    Typed A4 PDF layout
    resume.test.ts            Migration and PDF tests
public/assets/                Original photo and favicon
.github/workflows/deploy.yml  Build, test, and GitHub Pages deployment
vite.config.ts               React build, relative paths, and local PDF fonts
```

Dependencies are managed by npm. React renders the interface; TypeScript checks the source; Vite builds it. jsPDF creates the PDF, and PDF.js displays it. PDF libraries load when the preview is opened. Their licenses are included in the production build under `licenses/`; font licenses are included alongside the fonts.
