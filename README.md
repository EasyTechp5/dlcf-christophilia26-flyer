# Christophilia'26 Personalised Flyer Generator

Visitors add **their photo, name and address** to the official DLCF National Campus Congress flyer,
preview it live, then download a 2116 × 3016 PNG or share it. Everything runs in the browser;
nothing is uploaded or stored.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure
- `public/template.jpg`: the official flyer artwork (cropped from the supplied screenshot, venue address removed by the card overlay)
- `lib/config.ts`: all copy, limits and colours
- `lib/flyer.ts`: canvas renderer (card position is `CARD` / `PHOTO` at the top)
- `components/FlyerStudio.tsx`: form, validation, download, share
- `components/FlyerCanvas.tsx`: live preview + drag-to-reposition

## Customise
- Change wording/limits in `lib/config.ts`.
- To use a higher-resolution flyer, replace `public/template.jpg` (keep the 1058 × 1448 aspect ratio).
- Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) so share links point to your domain.

## Deploy
Push to GitHub and import the repo in Vercel (framework preset: Next.js, no extra settings).
