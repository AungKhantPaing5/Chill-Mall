import { prisma } from '@/lib/prisma/client';
import { PagesEditorClient } from '@/components/admin/PagesEditorClient';

export default async function AdminPagesEditorPage() {
  const pages = await prisma.page.findMany({ include: { translations: true }, orderBy: { slug: 'asc' } });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">CMS & Legal Pages (Bilingual EN / MY)</h1>
      <PagesEditorClient pages={pages} />
    </div>
  );
}
