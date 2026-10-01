/**
 * Database seed.
 *
 * Creates the bootstrap admin, default languages, every site setting, and demo
 * catalogue content. Demo channels point at public HLS test assets published by
 * Apple and Mux for developer testing â€” replace every `streamUrl` from
 * Admin > Channels with your own licensed sources.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Public, officially published HLS test assets (safe for demo use). */
const DEMO_STREAMS = {
  apple:
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
  mux: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  appleAlt:
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8",
};

const SETTINGS = {
  siteName: "LumiStream",
  siteTagline: "Premium streaming, everywhere",
  siteDescription:
    "LumiStream is a modern OTT platform delivering live TV channels and on-demand content in multiple languages, on every screen.",
  siteLogo: "",
  siteFavicon: "",
  primaryColor: "#e11d48",
  secondaryColor: "#0ea5e9",
  backgroundImage: "",
  backgroundOverlay: "0.72",
  radius: "1rem",
  glassIntensity: "0.12",
  fontFamily: "system",
  defaultLocale: "ar",
  whatsappNumber: "212600000000",
  supportEmail: "support@lumistream.example",
  phone: "",
  address: "",
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://twitter.com",
  instagramUrl: "https://instagram.com",
  telegramUrl: "https://t.me",
  youtubeUrl: "https://youtube.com",
  heroImage: "",
  heroTitle: "Watch the world, live",
  heroSubtitle:
    "Thousands of channels and on-demand titles in one place. Stream on your TV, tablet, phone or desktop.",
  heroPrimaryLabel: "Watch now",
  heroPrimaryLink: "/channels",
  heroSecondaryLabel: "Explore packages",
  heroSecondaryLink: "/packages",
  heroWhatsappLabel: "Support on WhatsApp",
  heroBadge: "Live 24/7",
  footerText: "Â© {year} LumiStream. All rights reserved.",
  footerDisclaimer:
    "LumiStream only distributes content for which it holds the required licences. All channel marks belong to their respective owners.",
  currency: "EUR",
  demoMode: "true",
  showFooter: "true",
  showSocial: "true",
  copyright: "",
};

const LANGUAGES = [
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", isDefault: true, sortOrder: 0 },
  { code: "en", name: "English", nativeName: "English", dir: "ltr", isDefault: false, sortOrder: 1 },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", isDefault: false, sortOrder: 2 },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", isDefault: false, sortOrder: 3 },
];

const CHANNELS = [
  { slug: "lumi-news", name: "Lumi News", category: "news", country: "Morocco", countryCode: "MA", language: "Arabic", quality: "FHD", stream: "apple", description: "Rolling 24/7 international and regional news coverage.", tags: "news,headlines,live", featured: true, viewers: 12480 },
  { slug: "lumi-sport", name: "Lumi Sport", category: "sports", country: "France", countryCode: "FR", language: "French", quality: "4K", stream: "mux", description: "Live football, athletics and motorsport in ultra HD.", tags: "sports,football,live", featured: true, viewers: 23100 },
  { slug: "lumi-cinema", name: "Lumi Cinema", category: "movies", country: "United States", countryCode: "US", language: "English", quality: "FHD", stream: "appleAlt", description: "Classic and modern films, uncut and subtitled.", tags: "movies,cinema,films", featured: true, viewers: 8750 },
  { slug: "lumi-kids", name: "Lumi Kids", category: "kids", country: "United Kingdom", countryCode: "GB", language: "English", quality: "HD", stream: "mux", description: "Safe, ad-light entertainment for younger viewers.", tags: "kids,cartoons,family", featured: true, viewers: 5120 },
  { slug: "lumi-doc", name: "Lumi Documentary", category: "documentary", country: "Germany", countryCode: "DE", language: "English", quality: "FHD", stream: "apple", description: "Nature, science and history, curated daily.", tags: "documentary,nature,science", featured: false, viewers: 2310 },
  { slug: "lumi-music", name: "Lumi Music", category: "music", country: "Spain", countryCode: "ES", language: "Spanish", quality: "HD", stream: "mux", description: "Concerts, festivals and music videos around the clock.", tags: "music,concerts,videos", featured: false, viewers: 3140 },
  { slug: "lumi-general", name: "Lumi General", category: "general", country: "Morocco", countryCode: "MA", language: "Arabic", quality: "HD", stream: "appleAlt", description: "The general entertainment mix for the whole family.", tags: "general,entertainment", featured: false, viewers: 6630 },
  { slug: "lumi-religion", name: "Lumi Religion", category: "religion", country: "Saudi Arabia", countryCode: "SA", language: "Arabic", quality: "HD", stream: "mux", description: "Religious programming and live services.", tags: "religion,live", featured: false, viewers: 1980 },
  { slug: "lumi-education", name: "Lumi Education", category: "education", country: "Canada", countryCode: "CA", language: "English", quality: "FHD", stream: "apple", description: "Language courses, lectures and documentaries for learners.", tags: "education,learning", featured: false, viewers: 1420 },
  { slug: "lumi-entertainment", name: "Lumi Entertainment", category: "entertainment", country: "Italy", countryCode: "IT", language: "Italian", quality: "FHD", stream: "mux", description: "Reality shows, talk shows and celebrity programming.", tags: "entertainment,reality,talk", featured: false, viewers: 4410 },
  { slug: "lumi-africa", name: "Lumi Africa", category: "general", country: "Nigeria", countryCode: "NG", language: "English", quality: "HD", stream: "appleAlt", description: "The best of African news, music and culture.", tags: "africa,news,music", featured: false, viewers: 3890 },
  { slug: "lumi-asia", name: "Lumi Asia", category: "entertainment", country: "Japan", countryCode: "JP", language: "Japanese", quality: "FHD", stream: "mux", description: "Pan-Asian entertainment, drama and pop culture.", tags: "asia,drama,pop", featured: false, viewers: 5270 },
];

const PACKAGES = [
  { slug: "monthly", name: "Monthly", description: "Full access, billed every month. Cancel any time.", price: 9.99, durationDays: 30, durationLabel: "1 month", maxDevices: 1, isPopular: false, sortOrder: 1, categories: ["general", "news", "sports", "movies", "entertainment", "music"], features: ["All entertainment channels", "1 simultaneous screen", "HD & FHD quality", "Email support"] },
  { slug: "quarterly", name: "3 Months", description: "Three months of everything, with a better monthly rate.", price: 24.99, durationDays: 90, durationLabel: "3 months", maxDevices: 2, isPopular: true, sortOrder: 2, categories: ["general", "news", "sports", "movies", "entertainment", "music", "kids", "documentary"], features: ["All entertainment channels", "Kids & documentary packs", "2 simultaneous screens", "4K where available", "Priority support"] },
  { slug: "yearly", name: "Yearly", description: "Our best value: a full year of premium streaming.", price: 79.99, durationDays: 365, durationLabel: "12 months", maxDevices: 4, isPopular: false, sortOrder: 3, categories: ["general", "news", "sports", "movies", "entertainment", "music", "kids", "documentary", "religion", "education"], features: ["Every channel in the catalogue", "Kids, documentary & education packs", "4 simultaneous screens", "4K + picture-in-picture", "Dedicated WhatsApp support"] },
];

const CONTENT = [
  { slug: "midnight-in-casablanca", title: "Midnight in Casablanca", type: "movie", year: 2024, duration: 128, rating: 7.8, genres: "Drama,Crime", director: "Nadia Bensalem", ageRating: "16+", featured: true, stream: "appleAlt", cast: "Leila Amrani, Karim Idrissi, Salma Bennani" },
  { slug: "the-long-desert", title: "The Long Desert", originalTitle: "Al-Sahra al-Tawila", type: "movie", year: 2023, duration: 115, rating: 7.2, genres: "Drama,Adventure", director: "Youssef Amrani", ageRating: "12+", featured: true, stream: "mux", cast: "Ahmed Ouazzani, Nadia Tazi" },
  { slug: "orbital-drift", title: "Orbital Drift", type: "series", year: 2025, duration: 52, rating: 8.4, genres: "Sci-Fi,Thriller", director: "Lena Fischer", ageRating: "16+", featured: true, stream: "apple", cast: "Miriam Vogel, Jonas Brandt" },
  { slug: "blue-harbour", title: "Blue Harbour", type: "series", year: 2024, duration: 47, rating: 7.9, genres: "Crime,Mystery", director: "Marcus Reid", ageRating: "16+", featured: false, stream: "mux", cast: "Daniel Okoro, Sarah Whitmore" },
  { slug: "the-silent-reef", title: "The Silent Reef", type: "documentary", year: 2023, duration: 94, rating: 8.9, genres: "Documentary,Nature", director: "Camille Laurent", ageRating: "All", featured: true, stream: "appleAlt", cast: "Narrated by Idris Karim" },
  { slug: "concrete-skyline", title: "Concrete Skyline", type: "documentary", year: 2022, duration: 88, rating: 7.6, genres: "Documentary,Architecture", director: "Omar Haddad", ageRating: "All", featured: false, stream: "apple", cast: "Narrated by Lena Brandt" },
  { slug: "summer-of-neon", title: "Summer of Neon", type: "movie", year: 2025, duration: 102, rating: 6.9, genres: "Comedy,Romance", director: "Paolo Ricci", ageRating: "12+", featured: false, stream: "mux", cast: "Giulia Ferrari, Marco Conti" },
  { slug: "the-last-cartographer", title: "The Last Cartographer", type: "movie", year: 2021, duration: 121, rating: 8.1, genres: "Adventure,Drama", director: "Sam Whitfield", ageRating: "12+", featured: false, stream: "appleAlt", cast: "Elliot Barnes, Priya Nair" },
];
/* ------------------------------------------------------------------ */
/* Seed steps                                                          */
/* ------------------------------------------------------------------ */

const SETTING_GROUPS = {
  general: ["siteName", "siteTagline", "siteDescription", "siteLogo", "siteFavicon", "footerText", "footerDisclaimer", "copyright", "showFooter", "showSocial"],
  appearance: ["primaryColor", "secondaryColor", "backgroundImage", "backgroundOverlay", "radius", "glassIntensity", "fontFamily"],
  hero: ["heroBadge", "heroImage", "heroTitle", "heroSubtitle", "heroPrimaryLabel", "heroPrimaryLink", "heroSecondaryLabel", "heroSecondaryLink", "heroWhatsappLabel"],
  contact: ["whatsappNumber", "supportEmail", "phone", "address", "facebookUrl", "twitterUrl", "instagramUrl", "telegramUrl", "youtubeUrl"],
  commerce: ["currency", "demoMode", "defaultLocale"],
};

function groupOf(key) {
  for (const [group, keys] of Object.entries(SETTING_GROUPS)) {
    if (keys.includes(key)) return group;
  }
  return "general";
}

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value, group: groupOf(key) },
      update: { group: groupOf(key) },
    });
  }
  console.log(`  settings: ${Object.keys(SETTINGS).length}`);
}

async function seedLanguages() {
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({ where: { code: lang.code }, create: lang, update: {} });
  }
  console.log(`  languages: ${LANGUAGES.length}`);
}

async function seedChannels() {
  const ids = {};
  for (const [index, c] of CHANNELS.entries()) {
    const data = {
      name: c.name,
      slug: c.slug,
      description: c.description,
      country: c.country,
      countryCode: c.countryCode,
      language: c.language,
      category: c.category,
      quality: c.quality,
      tags: c.tags,
      streamUrl: DEMO_STREAMS[c.stream],
      fallbackUrl: c.stream === "apple" ? DEMO_STREAMS.mux : DEMO_STREAMS.apple,
      isLive: true,
      isActive: true,
      isFeatured: c.featured,
      sortOrder: index,
      viewCount: c.viewers * 12,
      subscriberCount: c.viewers,
    };
    const channel = await prisma.channel.upsert({
      where: { slug: c.slug },
      create: data,
      update: data,
      select: { id: true, category: true },
    });
    ids[c.slug] = { id: channel.id, category: channel.category };
  }
  console.log(`  channels: ${CHANNELS.length}`);
  return ids;
}

async function seedPackages(channelIds) {
  for (const p of PACKAGES) {
    const data = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      currency: SETTINGS.currency,
      durationDays: p.durationDays,
      durationLabel: p.durationLabel,
      maxDevices: p.maxDevices,
      isActive: true,
      isPopular: p.isPopular,
      sortOrder: p.sortOrder,
      features: p.features,
    };
    const pkg = await prisma.package.upsert({
      where: { slug: p.slug },
      create: data,
      update: data,
      select: { id: true },
    });

    // A package includes every channel in its declared categories.
    await prisma.packageChannel.deleteMany({ where: { packageId: pkg.id } });
    const channelIdsForPackage = Object.entries(channelIds)
      .filter(([, meta]) => p.categories.includes(meta.category))
      .map(([, meta]) => meta.id);

    if (channelIdsForPackage.length > 0) {
      await prisma.packageChannel.createMany({
        data: channelIdsForPackage.map((channelId) => ({ packageId: pkg.id, channelId })),
      });
    }
  }
  console.log(`  packages: ${PACKAGES.length}`);
}

async function seedContent() {
  for (const [index, c] of CONTENT.entries()) {
    const data = {
      title: c.title,
      slug: c.slug,
      originalTitle: c.originalTitle ?? null,
      type: c.type,
      description: `${c.title} â€” part of the LumiStream on-demand catalogue.`,
      year: c.year,
      duration: c.duration,
      rating: c.rating,
      genres: c.genres,
      director: c.director,
      cast: c.cast,
      ageRating: c.ageRating,
      videoUrl: DEMO_STREAMS[c.stream],
      isVod: true,
      isActive: true,
      isFeatured: c.featured,
      sortOrder: index,
      viewCount: 1200 + index * 430,
      releaseDate: new Date(`${c.year}-01-15T00:00:00Z`),
    };
    await prisma.content.upsert({ where: { slug: c.slug }, create: data, update: data });
  }
  console.log(`  content: ${CONTENT.length}`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@lumistream.local").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Always make sure the bootstrap account has admin rights.
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin", isActive: true },
    });
    console.log(`  admin: existing account kept (${email})`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD || "ChangeMe!2024";
  const [firstName, ...rest] = (process.env.ADMIN_NAME || "Platform Admin").split(" ");

  await prisma.user.create({
    data: {
      firstName,
      lastName: rest.join(" ") || "Admin",
      email,
      password: await bcrypt.hash(password, 12),
      role: "admin",
      isActive: true,
    },
  });
  console.log(`  admin: created ${email}`);
}

async function seedDemoUser() {
  const email = "viewer@lumistream.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  await prisma.user.create({
    data: {
      firstName: "Demo",
      lastName: "Viewer",
      email,
      password: await bcrypt.hash("Viewer!2024", 12),
      role: "user",
      isActive: true,
    },
  });
  console.log("  demo user: viewer@lumistream.local / Viewer!2024");
}

async function main() {
  console.log("Seeding LumiStreamâ€¦");
  await seedSettings();
  await seedLanguages();
  const channelIds = await seedChannels();
  await seedPackages(channelIds);
  await seedContent();
  await seedAdmin();
  await seedDemoUser();
  console.log("Done.\n");
  console.log("  Admin login   :", process.env.ADMIN_EMAIL || "admin@lumistream.local");
  console.log("  Admin password :", process.env.ADMIN_PASSWORD || "ChangeMe!2024");
  console.log("  Demo viewer    : viewer@lumistream.local / Viewer!2024");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
