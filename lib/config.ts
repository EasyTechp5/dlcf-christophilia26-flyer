/**
 * Single source of truth for copy and brand colours (PRD FR-12).
 * Edit this file to re-brand the site or re-word the flyer.
 */
export const config = {
  brandName: "DLCF",
  brandFull: "Deeperlife Campus Fellowship",
  campaign: "Christophilia'26",
  campaignSlug: "christophilia26",
  eventLine: "National Campus Congress · 7th–11th October 2026",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",

  hero: {
    title: "Create your personalised Christophilia’26 flyer",
    accent: "Christophilia’26",
    description:
      "Add your photo, name and address to the official National Campus Congress flyer, then download and share it in seconds.",
    trust: "Free · No sign-up · Under 30 seconds",
  },

  flyer: {
    badge: "I’LL BE THERE",
    footerStrip: "FOR STUDENTS, CORPS MEMBERS, AND STAFF",
    shareCaption:
      "I’ll be at Christophilia’26, the DLCF National Campus Congress, 7th–11th October 2026. Create your own flyer:",
  },

  limits: {
    nameMax: 40,
    addressMax: 80,
    photoMaxMB: 10,
  },

  // Flyer palette, sampled from the official artwork.
  colors: {
    primary: "#D2461A",
    primaryDark: "#B33A12",
    gold: "#F5B921",
    stripe: "#B9AE3A",
    ink: "#1F1208",
    muted: "#9A8F84",
    pageBg: "#FFF8EC",
  },
};
