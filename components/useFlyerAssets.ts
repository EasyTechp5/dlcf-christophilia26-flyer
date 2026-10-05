"use client";

import { useEffect, useState } from "react";
import { loadFonts, loadImage, type Fonts } from "../lib/flyer";

/** Loads the artwork and fonts once; the flyer only renders when both are ready. */
export function useFlyerAssets() {
  const [template, setTemplate] = useState<HTMLImageElement | null>(null);
  const [fonts, setFonts] = useState<Fonts>({ display: "sans-serif", body: "sans-serif" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const cs = getComputedStyle(document.body);
      const f = {
        display: cs.getPropertyValue("--font-display").trim() || "sans-serif",
        body: cs.getPropertyValue("--font-body").trim() || "sans-serif",
      };
      const [img] = await Promise.all([loadImage("/template.jpg"), loadFonts(f)]);
      if (!alive) return;
      setFonts(f);
      setTemplate(img);
      setReady(true);
    })().catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  return { template, fonts, ready };
}
