"use client";

import { useMemo } from "react";
import FlyerCanvas from "./FlyerCanvas";
import { useFlyerAssets } from "./useFlyerAssets";

export default function HeroFlyer() {
  const { template, fonts } = useFlyerAssets();
  const state = useMemo(
    () => ({ template, fonts, photo: null, zoom: 1, offset: { x: 0, y: 0 }, name: "", address: "" }),
    [template, fonts],
  );
  return (
    <div className="relative mx-auto w-[min(78vw,360px)] rotate-2 transition-transform duration-500 hover:rotate-0 motion-reduce:transition-none">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-gold/50 to-primary/25 blur-2xl" />
      <FlyerCanvas
        state={state}
        label="Sample Christophilia’26 flyer with a placeholder for your photo, name and address"
        className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10"
      />
    </div>
  );
}
