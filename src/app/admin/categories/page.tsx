import { prisma } from '@/lib/prisma/client';
import { CategoriesClient } from '@/components/admin/CategoriesClient';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Category Management</h1>
      <CategoriesClient categories={categories} />
    </div>
  );
}
