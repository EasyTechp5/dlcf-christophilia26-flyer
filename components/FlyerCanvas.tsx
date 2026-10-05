"use client";

import { useEffect, useRef } from "react";
import { H, PHOTO, W, drawFlyer, maxOffset, type FlyerState } from "../lib/flyer";

type Props = {
  state: FlyerState;
  label: string;
  /** Enables drag-to-reposition on the photo circle. */
  onOffsetChange?: (o: { x: number; y: number }) => void;
  className?: string;
};

const PREVIEW_SCALE = 1.5;

export default function FlyerCanvas({ state, label, onOffsetChange, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const id = requestAnimationFrame(() => drawFlyer(ctx, PREVIEW_SCALE, state));
    return () => cancelAnimationFrame(id);
  }, [state]);

  const draggable = Boolean(onOffsetChange && state.photo);

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: state.offset.x, oy: state.offset.y };
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !state.photo || !onOffsetChange) return;
    const unitsPerPx = W / (canvasRef.current?.getBoundingClientRect().width || W);
    const diameter = PHOTO.r * 2;
    const lim = maxOffset(state.photo, state.zoom);
    const nx = d.ox + ((e.clientX - d.x) * unitsPerPx) / diameter;
    const ny = d.oy + ((e.clientY - d.y) * unitsPerPx) / diameter;
    onOffsetChange({
      x: Math.max(-lim.x, Math.min(lim.x, nx)),
      y: Math.max(-lim.y, Math.min(lim.y, ny)),
    });
  }
  function onUp() {
    drag.current = null;
  }

  return (
    <div className={`relative ${className ?? ""}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas
        ref={canvasRef}
        width={Math.round(W * PREVIEW_SCALE)}
        height={Math.round(H * PREVIEW_SCALE)}
        role="img"
        aria-label={label}
        className="block h-full w-full rounded-[inherit]"
      />
      {onOffsetChange && (
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-hidden="true"
          className={`absolute rounded-full ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{
            left: `${((PHOTO.cx - PHOTO.r) / W) * 100}%`,
            top: `${((PHOTO.cy - PHOTO.r) / H) * 100}%`,
            width: `${((PHOTO.r * 2) / W) * 100}%`,
            height: `${((PHOTO.r * 2) / H) * 100}%`,
            touchAction: draggable ? "none" : "auto",
          }}
        />
      )}
    </div>
  );
}
