import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Resume } from "../types";
import { defaultPhoto, downloadWebsiteFile } from "../lib/storage";
import { Modal } from "./Modal";

interface Props {
  resume: Resume;
  published?: string;
  onSave: (photo: string | undefined) => boolean;
  onClose: () => void;
}
export function PhotoEditor({ resume, published, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(resume.photo);
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [position, setPosition] = useState(50);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    "Preview your photo before saving. Closing without saving keeps your current photo.",
  );
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function crop(image: HTMLImageElement, value: number) {
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(800, size);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing is unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      ((image.naturalWidth - size) * value) / 100,
      ((image.naturalHeight - size) * value) / 100,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setDraft(canvas.toDataURL("image/jpeg", 0.9));
    setStatus("Preview ready. Select Save photo to use it.");
  }
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const current = ++request.current;
    setLoading(false);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Please choose a JPG, PNG, or WebP picture.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("This picture is too large. Choose one under 10 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setLoading(true);
    setStatus("Preparing your photo…");
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (current !== request.current) return;
      if (image.naturalWidth * image.naturalHeight > 40000000)
        throw new Error("Image too large");
      setSource(image);
      setPosition(50);
      crop(image, 50);
    } catch {
      if (current === request.current)
        setStatus(
          "Couldn’t open this picture. Try another JPG, PNG, or WebP, up to 40 megapixels.",
        );
    } finally {
      URL.revokeObjectURL(url);
      if (current === request.current) setLoading(false);
    }
  }
  function save(download = false) {
    if (loading) return;
    const persisted = onSave(draft);
    if (download) {
      downloadWebsiteFile({ ...resume, photo: draft });
      setStatus(
        "File downloaded with your photo and saved resume edits. Replace src/data/resume.json on GitHub to publish them.",
      );
    } else
      setStatus(
        persisted
          ? "Photo saved. Your page and next PDF use this picture."
          : "Updated for this visit. Download the website file to keep your photo; browser storage is unavailable.",
      );
  }
  return (
    <Modal
      open
      onClose={onClose}
      id="photo-editor"
      title="Your photo"
      description="Choose a picture for your website and PDF."
      className="photo-editor"
      closeLabel="Close photo editor"
    >
      <div className="photo-scroll">
        <div className="photo-body">
          <img
            className="photo-preview"
            src={draft || defaultPhoto}
            width={240}
            height={240}
            alt="Preview of your resume photo"
          />
          <div className="photo-options">
            <button
              className="editor-button"
              onClick={() => input.current?.click()}
            >
              Choose a photo
            </button>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={choose}
            />
            <p className="field-hint">
              JPG, PNG, or WebP · up to 10 MB.
              <br />
              Your picture stays on your device.
            </p>
            {source && source.naturalWidth !== source.naturalHeight && (
              <label className="photo-position">
                <span>
                  {source.naturalWidth > source.naturalHeight
                    ? "Move crop left or right"
                    : "Move crop up or down"}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={position}
                  disabled={loading}
                  aria-label="Adjust photo crop"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPosition(value);
                    crop(source, value);
                  }}
                />
              </label>
            )}
            <button
              className="editor-reset"
              onClick={() => {
                request.current++;
                setLoading(false);
                setSource(null);
                setDraft(published);
                setStatus(
                  "Published photo loaded. Select Save photo to apply it.",
                );
              }}
            >
              Use published photo
            </button>
          </div>
        </div>
        <p className="editor-notice">
          Saving updates this browser. To publish your photo and saved resume
          edits, download the website file and replace{" "}
          <strong>src/data/resume.json</strong> on GitHub.
        </p>
      </div>
      <div className="editor-footer">
        <p role="status">{status}</p>
        <div>
          <button
            className="editor-button"
            disabled={loading}
            onClick={() => save(true)}
          >
            Download website file
          </button>
          <button className="button" disabled={loading} onClick={() => save()}>
            Save photo
          </button>
        </div>
      </div>
    </Modal>
  );
}
