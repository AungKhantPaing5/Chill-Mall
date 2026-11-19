import { PrismaClient, RoleName, StorageType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CHILL MALL database...');

  // 1. Seed Roles
  const roles: RoleName[] = ['GUEST', 'USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
  }

  // 2. Seed Default Local Storage Provider
  await prisma.storageProvider.upsert({
    where: { name: 'Local VPS Storage' },
    update: {},
    create: {
      name: 'Local VPS Storage',
      type: StorageType.LOCAL,
      isDefault: true,
      isEnabled: true,
      localPath: process.env.LOCAL_STORAGE_PATH || '/data/media',
    },
  });

  // 3. Seed AI Video Categories (EN + MY)
  const categories = [
    { slug: 'ai-animation', nameEn: 'AI Animation', nameMy: 'AI ကာတွန်း', sortOrder: 1 },
    { slug: 'ai-cinematic', nameEn: 'AI Cinematic', nameMy: 'AI ရုပ်ရှင်ဆန်ဆန်', sortOrder: 2 },
    { slug: 'ai-short-films', nameEn: 'AI Short Films', nameMy: 'AI ဇာတ်လမ်းတို', sortOrder: 3 },
    { slug: 'ai-sci-fi', nameEn: 'AI Sci-Fi', nameMy: 'AI သိပ္ပံစိတ်ကူးယဉ်', sortOrder: 4 },
    { slug: 'ai-fantasy', nameEn: 'AI Fantasy', nameMy: 'AI စိတ်ကူးယဉ်', sortOrder: 5 },
    { slug: 'ai-horror', nameEn: 'AI Horror', nameMy: 'AI ထိတ်လန့်ဖွယ်', sortOrder: 6 },
    { slug: 'ai-music-videos', nameEn: 'AI Music Videos', nameMy: 'AI ဂီတဗီဒီယို', sortOrder: 7 },
    { slug: 'ai-documentary', nameEn: 'AI Documentary', nameMy: 'AI မှတ်တမ်းရုပ်ရှင်', sortOrder: 8 },
    { slug: 'ai-nature', nameEn: 'AI Nature', nameMy: 'AI သဘာဝ', sortOrder: 9 },
    { slug: 'ai-experimental', nameEn: 'AI Experimental', nameMy: 'AI စမ်းသပ်ဖန်တီးမှု', sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 4. Seed Ad Settings & Placements
  await prisma.adSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      adsEnabled: false,
      adsenseEnabled: false,
    },
  });

  const placements = [
    { slotKey: 'HEADER', name: 'Header Banner' },
    { slotKey: 'HOMEPAGE', name: 'Homepage Between Sections' },
    { slotKey: 'SIDEBAR', name: 'Sidebar Slot' },
    { slotKey: 'VIDEO_DETAILS', name: 'Below Video Details' },
    { slotKey: 'IN_CONTENT', name: 'In-Content Slot' },
    { slotKey: 'FOOTER', name: 'Footer Banner' },
  ];

  for (const p of placements) {
    await prisma.adPlacement.upsert({
      where: { slotKey: p.slotKey },
      update: {},
      create: p,
    });
  }

  // 5. Seed Required Bilingual Legal & CMS Pages
  const pages = [
    { slug: 'about-us', en: 'About Us', my: 'ကျွန်ုပ်တို့အကြောင်း' },
    { slug: 'contact-us', en: 'Contact Us', my: 'ဆက်သွယ်ရန်' },
    { slug: 'privacy-policy', en: 'Privacy Policy', my: 'ကိုယ်ရေးအချက်အလက်မူဝါဒ' },
    { slug: 'cookie-policy', en: 'Cookie Policy', my: 'ကွတ်ကီးမူဝါဒ' },
    { slug: 'terms-of-service', en: 'Terms of Service', my: 'အသုံးပြုမှုစည်းကမ်းချက်များ' },
    { slug: 'copyright-policy', en: 'Copyright Policy', my: 'မူပိုင်ခွင့်မူဝါဒ' },
    { slug: 'dmca-policy', en: 'DMCA Policy', my: 'DMCA မူဝါဒ' },
    { slug: 'ai-content-disclaimer', en: 'AI Content Disclaimer', my: 'AI ဖန်တီးမှုဆိုင်ရာ ရှင်းလင်းချက်' },
  ];

  for (const p of pages) {
    const page = await prisma.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, isPublished: true },
    });

    await prisma.pageTranslation.upsert({
      where: { pageId_language: { pageId: page.id, language: 'en' } },
      update: {},
      create: {
        pageId: page.id,
        language: 'en',
        title: p.en,
        contentHtml: `<p>Official ${p.en} for CHILL MALL. Edit this page from the Admin Dashboard.</p>`,
      },
    });

    await prisma.pageTranslation.upsert({
      where: { pageId_language: { pageId: page.id, language: 'my' } },
      update: {},
      create: {
        pageId: page.id,
        language: 'my',
        title: p.my,
        contentHtml: `<p>CHILL MALL ၏ တရားဝင် ${p.my} စာမျက်နှာဖြစ်ပါသည်။ Admin Dashboard မှ ပြင်ဆင်နိုင်ပါသည်။</p>`,
      },
    });
  }

  // 6. Seed Initial Super Admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@chillmall.example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeNow!2026';
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'superadmin',
        name: 'Chill Mall Super Admin',
        passwordHash,
        emailVerified: new Date(),
      },
    });
    await prisma.userRole.create({
      data: { userId: admin.id, roleId: superAdminRole.id },
    });
    console.log(`Created initial SUPER_ADMIN: ${adminEmail}`);
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
