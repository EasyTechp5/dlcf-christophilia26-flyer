"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FlyerCanvas from "./FlyerCanvas";
import { useFlyerAssets } from "./useFlyerAssets";
import { config } from "../lib/config";
import {
  EXPORT_SCALE,
  H,
  W,
  decodePhoto,
  drawFlyer,
  maxOffset,
  slugify,
  type FlyerState,
  type PhotoSource,
} from "../lib/flyer";

type Errors = { photo?: string; name?: string; address?: string };
const ACCEPT = ["image/jpeg", "image/png"];

export default function FlyerStudio() {
  const { template, fonts, ready } = useFlyerAssets();
  const [photo, setPhoto] = useState<PhotoSource | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [thumb, setThumb] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { limits } = config;

  useEffect(() => {
    return () => {
      if (thumb) URL.revokeObjectURL(thumb);
    };
  }, [thumb]);

  const state: FlyerState = useMemo(
    () => ({ template, fonts, photo, zoom, offset, name, address }),
    [template, fonts, photo, zoom, offset, name, address],
  );

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        setErrors((e) => ({ ...e, photo: "Please upload a JPG, JPEG or PNG image." }));
        return;
      }
      if (file.size > limits.photoMaxMB * 1024 * 1024) {
        setErrors((e) => ({
          ...e,
          photo: `That photo is larger than ${limits.photoMaxMB}MB. Please choose a smaller one.`,
        }));
        return;
      }
      try {
        const decoded = await decodePhoto(file);
        setPhoto(decoded);
        setPhotoName(file.name);
        setThumb(URL.createObjectURL(file));
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setErrors((e) => ({ ...e, photo: undefined }));
        if (window.matchMedia("(max-width: 1023px)").matches) {
          previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch {
        setErrors((e) => ({ ...e, photo: "We couldn’t read that image. Try another photo." }));
      }
    },
    [limits.photoMaxMB],
  );

  function changeZoom(z: number) {
    setZoom(z);
    if (photo) {
      const lim = maxOffset(photo, z);
      setOffset((o) => ({
        x: Math.max(-lim.x, Math.min(lim.x, o.x)),
        y: Math.max(-lim.y, Math.min(lim.y, o.y)),
      }));
    }
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!photo) next.photo = "Photo is required.";
    if (!name.trim()) next.name = "Name cannot be empty.";
    if (!address.trim()) next.address = "Address cannot be empty.";
    setErrors(next);
    if (next.photo) fileRef.current?.focus();
    else if (next.name) nameRef.current?.focus();
    else if (next.address) addressRef.current?.focus();
    return Object.keys(next).length === 0;
  }

  async function renderBlob(): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = W * EXPORT_SCALE;
    canvas.height = H * EXPORT_SCALE;
    const ctx = canvas.getContext("2d")!;
    drawFlyer(ctx, EXPORT_SCALE, state);
    return new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("export failed"))), "image/png"),
    );
  }

  const fileName = `dlcf-${config.campaignSlug}-flyer-${slugify(name)}.png`;

  async function download() {
    if (!validate()) return;
    setBusy(true);
    try {
      const blob = await renderBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus("Your flyer has been downloaded.");
      // Record the entry; never block or fail the download because of it.
      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      setStatus("Something went wrong creating your flyer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const siteUrl = config.siteUrl || origin;
  const caption = config.flyer.shareCaption;
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${caption} ${siteUrl}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(siteUrl)}&quote=${enc(caption)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(siteUrl)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(caption)}&url=${enc(siteUrl)}` },
  ];

  async function nativeShare() {
    if (!validate()) return;
    try {
      const blob = await renderBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${caption} ${siteUrl}` });
      } else {
        await navigator.share({ text: caption, url: siteUrl });
      }
    } catch {
      /* user cancelled */
    }
  }

  function reset() {
    setPhoto(null);
    setPhotoName("");
    setThumb("");
    setName("");
    setAddress("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setErrors({});
    setStatus("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const field =
    "w-full rounded-xl border bg-white px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-4 focus:ring-primary/20";
  const label = "mb-1.5 block text-sm font-semibold text-ink";

  return (
    <section id="studio" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-ink sm:text-5xl">
          Build your flyer
        </h2>
        <p className="mt-2 max-w-xl text-ink/70">
          Fill in the three details below. Your flyer updates live as you type.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14">
          {/* ---------- Form ---------- */}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              download();
            }}
            className="space-y-7 rounded-3xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(120,40,0,0.25)] ring-1 ring-black/5 sm:p-8"
          >
            {/* Photo */}
            <div>
              <label htmlFor="photo" className={label}>
                1 · Your photo
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={`relative flex min-h-32 items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${
                  dragOver ? "border-primary bg-primary/5" : errors.photo ? "border-red-600" : "border-ink/20 bg-cream/60"
                }`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="size-20 shrink-0 rounded-full object-cover ring-2 ring-primary" />
                ) : (
                  <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gold/30 text-primary-dark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {photoName || "Tap to choose, or drag a photo here"}
                  </p>
                  <p className="text-xs text-ink/60">JPG, JPEG or PNG · up to {limits.photoMaxMB}MB</p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-primary-dark/30 bg-white px-4 text-sm font-semibold text-primary-dark transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  >
                    {photo ? "Change photo" : "Choose photo"}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  aria-describedby={errors.photo ? "photo-err" : undefined}
                  aria-invalid={Boolean(errors.photo)}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
              {errors.photo && (
                <p id="photo-err" role="alert" className="mt-2 text-sm font-medium text-red-700">
                  {errors.photo}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className={label}>
                2 · Your full name
              </label>
              <input
                ref={nameRef}
                id="name"
                type="text"
                autoComplete="name"
                maxLength={limits.nameMax}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
                }}
                placeholder="e.g. Adaeze Okonkwo"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-err" : undefined}
                className={`${field} ${errors.name ? "border-red-600" : "border-ink/15"}`}
              />
              <div className="mt-1.5 flex justify-between gap-3 text-xs">
                <span id="name-err" role={errors.name ? "alert" : undefined} className="font-medium text-red-700">
                  {errors.name}
                </span>
                <span className="text-ink/55">
                  {name.length}/{limits.nameMax}
                </span>
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className={label}>
                3 · Your address
              </label>
              <textarea
                ref={addressRef}
                id="address"
                rows={2}
                maxLength={limits.addressMax}
                autoComplete="street-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value.replace(/\n/g, " "));
                  if (errors.address) setErrors((x) => ({ ...x, address: undefined }));
                }}
                placeholder="e.g. University of Ibadan, Oyo State"
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "address-err" : undefined}
                className={`${field} resize-none ${errors.address ? "border-red-600" : "border-ink/15"}`}
              />
              <div className="mt-1.5 flex justify-between gap-3 text-xs">
                <span id="address-err" role={errors.address ? "alert" : undefined} className="font-medium text-red-700">
                  {errors.address}
                </span>
                <span className="text-ink/55">
                  {address.length}/{limits.addressMax}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={busy || !ready}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark px-6 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
                {busy ? "Preparing…" : "Download flyer"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ink/20 bg-white px-6 text-base font-semibold text-ink transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                Reset
              </button>
            </div>
            <p className="text-xs leading-relaxed text-ink/60">
              Your photo stays on your device. When you download, your name and address (and your approximate
              city) are saved so the {config.brandName} team can see who is joining.
            </p>
            <p role="status" aria-live="polite" className="min-h-5 text-sm font-medium text-green-800">
              {status}
            </p>
          </form>

          {/* ---------- Preview ---------- */}
          <div ref={previewRef} className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <FlyerCanvas
              state={state}
              onOffsetChange={setOffset}
              label={`Your Christophilia’26 flyer${name.trim() ? ` for ${name.trim()}` : ""}`}
              className="mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10"
            />
            <div className="mx-auto mt-5 w-full max-w-[440px] space-y-5">
              <div>
                <label htmlFor="zoom" className="flex justify-between text-sm font-semibold text-ink">
                  <span>Adjust photo</span>
                  <span className="font-normal text-ink/60">{zoom.toFixed(1)}×</span>
                </label>
                <input
                  id="zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  disabled={!photo}
                  onChange={(e) => changeZoom(Number(e.target.value))}
                  className="mt-2 h-11 w-full accent-primary-dark disabled:opacity-40"
                />
                <p className="text-xs text-ink/60">
                  {photo ? "Drag the photo on the flyer to reposition it." : "Add a photo to zoom and reposition."}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Share</p>
                <div className="flex flex-wrap gap-2">
                  {canShare && (
                    <button
                      type="button"
                      onClick={nativeShare}
                      className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                    >
                      Share image…
                    </button>
                  )}
                  {links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg border border-ink/20 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink/60">
                  Tip: download your flyer first, then attach the image when posting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
