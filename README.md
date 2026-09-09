# Alison Shu — Resume website

A blue, mobile-friendly resume website with a photo editor, an experience editor, and an **A4 PDF preview and download**.

Built with **HTML, CSS, and JavaScript**. GitHub Pages can host it directly. There is no build step, database, account system, or API key to set up.

## What you can do

- Edit jobs, add description points, and change the job order.
- Replace your photo and adjust its square crop.
- Preview the actual PDF, turn pages, and zoom in before downloading.
- Download a portrait **A4 PDF: 210 × 297 mm** on every page.
- Download one `resume.js` file containing your saved experience and photo to publish on GitHub.

## Run it on your computer — step by step

### 1. Get the project folder

If you already have the files, use that folder. Otherwise, on the GitHub repository page, select **Code → Download ZIP**, then unzip it.

Open the folder and check that it contains `index.html`, `app.js`, `resume.js`, and the `assets` folder. Keep the files together.

### 2. Check that Python 3 is installed

Open **Terminal** on macOS/Linux, or **PowerShell** on Windows.

On macOS/Linux, enter:

```sh
python3 --version
```

On Windows, enter:

```powershell
py --version
```

You should see a version starting with `Python 3`. If the command is missing, install Python 3 from [python.org](https://www.python.org/downloads/), reopen Terminal or PowerShell, and try again. If Windows has `python` instead of `py`, use `python` in the commands below.

Python is only needed to preview the files on your computer. GitHub Pages does not need Python, Node.js, or an install command.

### 3. Open the project folder in Terminal

For the current project on this Mac, enter:

```sh
cd "/Users/mshu/Projects/Personal/resume"
```

If you saved it somewhere else, use that folder’s full path instead:

```sh
cd "/full/path/to/resume"
```

On Windows, for example:

```powershell
cd "C:\Users\YourName\Downloads\resume"
```

Replace example paths with your own. The folder should be the one that directly contains `index.html`.

### 4. Start the local website

On macOS/Linux:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

On Windows:

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

Leave this window open while using the website. A message about serving on port 4173 means it is running. This server is available only on your own computer.

### 5. Open the website

Open your browser and go to:

**[http://127.0.0.1:4173/](http://127.0.0.1:4173/)**

You should see Alison’s resume and the **Preview PDF**, **Replace photo**, and **Edit experience** controls.

Do not double-click `index.html`: the website uses JavaScript modules, which need a local server or GitHub Pages.

### 6. Stop or restart it

In the Terminal window running the server, press **Ctrl+C** to stop it.

To start it again, repeat steps 3–5. After changing a project file, refresh the browser to see the update; you normally do not need to restart the server.

## Preview and download an A4 PDF

1. Save any changes in **Edit experience** or **Replace photo** first. Unsaved editor drafts are not included.
2. Select **Preview PDF** at the top of the website.
3. Use **Previous** and **Next** to review every page. Scroll inside the preview to see the rest of a page.
4. Use **Zoom → Fit width** to fit the page to your screen, or choose **100%**, **125%**, or **150%** for a closer look. Zoom only changes the preview, not the PDF paper size.
5. Use **Read page text** if you prefer a text version of the current page.
6. Select **Download A4 PDF**. The file is named `Alison_Shu_Resume.pdf`. If a Save dialog appears, choose a folder and select **Save**. Depending on the browser, it may instead download immediately or open in a PDF viewer where you can save or share it.

The preview is rendered from the **same PDF bytes** as the download. Every page is portrait A4 (210 × 297 mm), with selectable text, a photo, page numbers, and clickable contact links in the downloaded file. The current resume uses two pages; longer descriptions and more jobs create extra A4 pages automatically.

Close the preview, save your edits, then reopen it to generate an updated PDF. Generating and previewing the PDF happens on your device; your resume is not sent to an external service.

If the preview cannot load but the PDF was created, **Download A4 PDF** remains available. You can review the file in your device’s PDF viewer. **Try preview again** regenerates it.

For a paper copy, open the downloaded PDF and choose **A4** in the print dialog. The website also has a browser print stylesheet, but printing the webpage gives a different layout from the downloadable PDF.

## Edit your resume

### Change work experience

1. Go to **Experience → Edit experience**.
2. Choose a job or select **+ Add job**.
3. Fill in the company, job title, dates, and job description. Write **one description point per line**.
4. Optionally add a team, more details, and tools.
5. Use **Move up** or **Move down** to reorder jobs. **Remove job** can be reversed with **Undo**.
6. Select **Save changes**. The page and next PDF preview use your saved content.
7. To keep a file copy or publish it, select **Download website file**. It includes your saved experience and current saved photo.

**Use published version** loads the jobs from the website’s `resume.js`. Select **Save changes** to apply them and clear your local experience override. **Undo** can restore the previous draft. Closing the experience editor keeps unsaved text for the current visit; refreshing with unsaved text triggers the browser’s leave-page warning.

### Replace your photo

1. Select **Replace photo** near your picture, then **Choose a photo**.
2. Choose a JPG, PNG, or WebP under **10 MB**, up to **40 megapixels**.
3. Preview the square crop. For a rectangular picture, move the slider to adjust the crop.
4. Select **Save photo**. The page and next PDF preview use this picture.
5. Select **Download website file** to keep or publish the photo together with your saved experience. There is no separate picture file to upload.

Closing without saving keeps your current photo. **Use published photo → Save photo** restores the photo from the website files.

The editor processes photos on your device, resizing them to square JPEGs of up to 800 × 800 pixels. It stores the image in the `photo` field of the downloaded `resume.js`.

The original photo is in `assets/alison-shu.jpg`, extracted from the supplied resume without retouching. If you prefer replacing that asset directly, use a square JPEG, remove any `photo` field from `resume.js`, and select **Use published photo → Save photo** to clear any browser override.

### Understand where edits are saved

**Save changes** and **Save photo** save only in your current browser, at the current website address. Refreshing normally keeps them, but private browsing or clearing browser storage can remove them.

- Saving in the browser does **not** change the files on your computer or the public website.
- Other visitors see the published version until you update the files on GitHub.
- Localhost, different ports, and the GitHub Pages address have separate saved edits.
- **Download website file** creates a backup containing both your saved jobs and photo. Keep its filename as `resume.js` when replacing the project file, even if your browser adds a number to the downloaded name.
- To keep changes in the local project, replace its `resume.js` with the downloaded file. To publish them, replace that file on GitHub too.

### Change other content or styling

Edit `resume.js` in a text editor to change your name, summary, contact details, skills, education, internships, languages, and interests. Both the page and PDF use these values.

| Content field | How it appears |
| --- | --- |
| `bullets` | Main job description points on the page and in the PDF |
| `details` | Under “More about this role” on the website; included in the PDF |
| `stack` | Short list of tools below the job on the website |
| `technologies` | Full tools note on the page and in the PDF |
| `photo` | Optional embedded image created by the photo editor |

Keep quotes, commas, and brackets intact when editing `resume.js`. If you directly change jobs in this file while local edits exist, use **Use published version → Save changes** to show the file’s version.

The wordmark, signature, and page description are in `index.html`. Colors, fonts, and spacing are in `styles.css`. The PDF layout is in `pdf.js`.

Content was adapted from `AlisonShu_Resume2025.pdf` using simpler words. Dates are preserved, including **May 2023 — Present**; check them before publishing. The original PDF is not included in the website files.

## Publish on GitHub Pages — step by step

1. Sign in to GitHub and create a repository, for example `resume`. A public repository works with GitHub Free.
2. Upload the website files using **Add file → Upload files**, or use GitHub Desktop. Put `index.html` at the repository’s top level, not inside another `resume` folder.
3. Include every JavaScript file, `styles.css`, `.nojekyll`, and the **entire `assets` folder**, including the PDF libraries and fonts. Keep the folder structure intact. `README.md` is useful documentation; `docs/design/` is optional. You do not need `output/`, `tmp/`, or the original resume PDF for hosting.
4. Commit the uploaded files. If you used the website editors, replace `resume.js` with the latest downloaded website file before publishing.
5. Open the repository’s **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select the branch with your files, usually **main**, and **/ (root)**. Select **Save**.
8. Wait for deployment to finish. GitHub shows the published website address on the Pages screen. Deployment progress also appears under **Actions**.
9. Open the published address and check the page, photo, and **Preview PDF → Download A4 PDF** flow.

For a repository named `resume`, the usual address is `https://YOUR-USERNAME.github.io/resume/`. The site also works at a root address such as `https://YOUR-USERNAME.github.io/`. All asset paths are relative.

Keep the empty `.nojekyll` file so GitHub serves the static files directly. If your upload tool hides it, create a new file named `.nojekyll` in the repository’s root.

GitHub’s official guide: [Configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Publish later updates

1. Make your edits and save them in the website editor.
2. Select **Download website file** from either editor.
3. On GitHub, replace the root `resume.js` with that downloaded file and commit the change. Keep the name exactly `resume.js`.
4. Wait for the Pages deployment, then refresh the public site. Use a private window to check what a visitor sees without your local overrides.

For design or feature changes, upload the changed HTML, CSS, JavaScript, or asset files as well. Downloading `resume.js` only saves resume content and the photo.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `python3` or `py` is not found | Install Python 3, reopen Terminal/PowerShell, and repeat the version check. |
| “Address already in use” | A server may already be running: try opening the local URL. Otherwise use port `4174` in the start command and open `http://127.0.0.1:4174/`. Saved browser edits on 4173 do not move to 4174. |
| Browser cannot connect | Keep the server window open. Check that the command started successfully and the URL uses the same port. |
| A file list appears instead of the resume | Stop the server with Ctrl+C, change into the folder that contains `index.html`, and start it again. |
| The page is blank or missing content | Use the local URL, not a `file://` address. Enable JavaScript and check that all project files are present. If you edited `resume.js` by hand, check its quotes, commas, and brackets. |
| PDF preview fails | Select **Try preview again**. Check that `assets/vendor/pdfjs/`, including its worker and `standard_fonts/`, was uploaded. Try a current browser. If available, download the PDF and open it on your device. |
| PDF generation fails | Check that the photo loads and `assets/vendor/jspdf.umd.min.js` exists, then retry. |
| A replacement photo is rejected | Choose a supported JPG, PNG, or WebP within the size limits. Export HEIC photos as JPG first. |
| Old jobs or photo appear after updating files | Local browser edits may override them. Use **Use published version → Save changes** and/or **Use published photo → Save photo**. |
| Public website did not change after saving | Download the website file and replace `resume.js` on GitHub; browser saves are local. Then check the Pages deployment. |
| GitHub Pages shows 404 or missing assets | Check the branch and root folder in Pages settings. Confirm `index.html` and the complete `assets` folder are at the expected paths. |

## Project files and libraries

| File or folder | Purpose |
| --- | --- |
| `index.html` | Page, editors, preview dialog, and metadata |
| `styles.css` | Blue design, mobile layouts, and browser print styles |
| `resume.js` | Resume content and optional photo shared by the page and PDF |
| `app.js` | Renders the resume and connects PDF creation to the preview |
| `editor.js` | Experience editing, local saves, undo, and website file download |
| `photo-editor.js` | Photo selection, cropping, local saves, and publishing |
| `pdf.js` | A4 PDF layout, text, photo, links, and page breaks |
| `pdf-preview.js` | Exact PDF preview, paging, zoom, text view, and download |
| `assets/alison-shu.jpg` | Original resume photo |
| `assets/vendor/jspdf.umd.min.js` | jsPDF 4.2.1, used to create the PDF; MIT license included |
| `assets/vendor/pdfjs/` | PDF.js 6.3.289, used to display the PDF; Apache-2.0 and font licenses included |
| `.nojekyll` | Tells GitHub Pages to serve the static files directly |
| `docs/design/` | Design references and brief; optional for hosting |

There are no analytics, external fonts, or runtime CDN requests. PDF libraries load from this website only when the preview is opened. These files are already included: **no `npm install` or build command is needed**.

Library references: [jsPDF](https://github.com/parallax/jsPDF), [PDF.js examples and documentation](https://mozilla.github.io/pdf.js/examples/).
