import { config } from "./config";

/** Canvas size in "design units". The official artwork is 1058 px wide. */
export const W = 1058;
export const H = 1508;
const ART_H = 1448; // height of the artwork; the footer strip is drawn below it
export const EXPORT_SCALE = 2;

/** Geometry of the personalisation card (bottom right). */
export const CARD = { x: 566, y: 1295, w: 472, h: 142, r: 22 };
export const PHOTO = { cx: 630, cy: 1366, r: 52 };
const TEXT_X = 706;
const TEXT_W = 312;

export type Fonts = { display: string; body: string };
export type PhotoSource = ImageBitmap | HTMLImageElement;

export type FlyerState = {
  template: HTMLImageElement | null;
  photo: PhotoSource | null;
  zoom: number;
  offset: { x: number; y: number }; // in photo-circle diameters
  name: string;
  address: string;
  fonts: Fonts;
};

const iw = (p: PhotoSource) => ("naturalWidth" in p ? p.naturalWidth : p.width);
const ih = (p: PhotoSource) => ("naturalHeight" in p ? p.naturalHeight : p.height);

/** Maximum pan (in diameters) that still keeps the circle fully covered. */
export function maxOffset(photo: PhotoSource, zoom: number) {
  const d = PHOTO.r * 2;
  const s = Math.max(d / iw(photo), d / ih(photo)) * zoom;
  return {
    x: Math.max(0, (iw(photo) * s - d) / 2 / d),
    y: Math.max(0, (ih(photo) * s - d) / 2 / d),
  };
}

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

/** Draw text with manual letter-spacing so every browser renders identically. */
function spaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" = "left",
) {
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (widths.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  ctx.textAlign = "left";
  [...text].forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxW || !cur) cur = test;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function drawSilhouette(ctx: CanvasRenderingContext2D) {
  const { cx, cy, r } = PHOTO;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, "#F3E6D2");
  g.addColorStop(1, "#E2CFB2");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = "#C9B392";
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.18, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.85, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlyer(ctx: CanvasRenderingContext2D, scale: number, s: FlyerState) {
  const { colors, flyer } = config;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingQuality = "high";

  // 1. Official artwork
  ctx.fillStyle = "#7A1C0F";
  ctx.fillRect(0, 0, W, H);
  if (s.template) ctx.drawImage(s.template, 0, 0, W, ART_H);

  // 2. Footer strip (rebuilt, the source screenshot was cropped here)
  ctx.fillStyle = colors.stripe;
  ctx.fillRect(0, ART_H, W, H - ART_H);
  ctx.fillStyle = "#1A0F05";
  ctx.font = `700 17px ${s.fonts.body}`;
  ctx.textBaseline = "alphabetic";
  spaced(ctx, flyer.footerStrip, W / 2, ART_H + 37, 4.2, "center");

  // 3. Personalisation card
  ctx.save();
  ctx.shadowColor = "rgba(60,15,0,0.35)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fillStyle = "#FFFDF8";
  ctx.fill();
  ctx.restore();
  roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = colors.gold;
  ctx.stroke();

  // 4. Photo
  const { cx, cy, r } = PHOTO;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (s.photo) {
    const d = r * 2;
    const sc = Math.max(d / iw(s.photo), d / ih(s.photo)) * s.zoom;
    const lim = maxOffset(s.photo, s.zoom);
    const ox = clamp(s.offset.x, lim.x) * d;
    const oy = clamp(s.offset.y, lim.y) * d;
    const w = iw(s.photo) * sc;
    const h = ih(s.photo) * sc;
    ctx.drawImage(s.photo, cx - w / 2 + ox, cy - h / 2 + oy, w, h);
  } else {
    drawSilhouette(ctx);
  }
  ctx.restore();
  ctx.lineWidth = 5;
  ctx.strokeStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Text
  ctx.fillStyle = colors.primaryDark;
  ctx.font = `700 13px ${s.fonts.body}`;
  spaced(ctx, flyer.badge, TEXT_X, 1331, 3.2);

  const name = s.name.trim();
  ctx.fillStyle = name ? colors.ink : colors.muted;
  const nameText = name || "YOUR NAME HERE";
  let size = 42;
  ctx.font = `700 ${size}px ${s.fonts.display}`;
  while (ctx.measureText(nameText).width > TEXT_W && size > 18) {
    size -= 1;
    ctx.font = `700 ${size}px ${s.fonts.display}`;
  }
  ctx.fillText(nameText, TEXT_X, 1368);

  // address with a pin icon
  const hasAddr = s.address.trim().length > 0;
  ctx.font = `600 15px ${s.fonts.body}`;
  const lines = wrap(ctx, hasAddr ? s.address : "Your address here", TEXT_W - 20, 2);
  const y0 = lines.length === 1 ? 1398 : 1391;
  ctx.fillStyle = hasAddr ? "#4A3A2C" : colors.muted;
  lines.forEach((l, i) => ctx.fillText(l, TEXT_X + 20, y0 + i * 20));
  // pin
  ctx.fillStyle = colors.primary;
  const px = TEXT_X + 6;
  const py = y0 - 5;
  ctx.beginPath();
  ctx.arc(px, py - 3, 5, Math.PI, 0);
  ctx.lineTo(px, py + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFFDF8";
  ctx.beginPath();
  ctx.arc(px, py - 3, 1.9, 0, Math.PI * 2);
  ctx.fill();
}

export async function loadFonts(f: Fonts) {
  await Promise.all([
    document.fonts.load(`700 42px ${f.display}`),
    document.fonts.load(`700 13px ${f.body}`),
    document.fonts.load(`600 15px ${f.body}`),
  ]);
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Decode a user file, honouring EXIF orientation so phone photos are upright. */
export async function decodePhoto(file: File): Promise<PhotoSource> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      return await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "guest"
  );
}
