import { NextResponse } from "next/server";
import { config } from "../../../lib/config";

export const runtime = "nodejs";

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

// Vercel sends the visitor's approximate location as request headers.
const geo = (req: Request, h: string, max: number) => {
  const raw = req.headers.get(h);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).slice(0, max);
  } catch {
    return raw.slice(0, max);
  }
};

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 503 });

  let body: { name?: unknown; address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = clean(body.name, config.limits.nameMax);
  const address = clean(body.address, config.limits.addressMax);
  if (!name || !address) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await fetch(`${url}/rest/v1/flyer_submissions`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      name,
      address,
      city: geo(req, "x-vercel-ip-city", 100),
      region: geo(req, "x-vercel-ip-country-region", 100),
      country: geo(req, "x-vercel-ip-country", 10),
    }),
  });

  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
