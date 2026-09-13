'use client';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Project, Category } from '@/lib/content';
import { ProjectCard } from './project-card';

export function ProjectBrowser({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');

  const [selected, setSelected] = useState(() => {
    if (categoryParam) {
      const matched = categories.find(c => c.slug.toLowerCase() === categoryParam.toLowerCase());
      return matched ? matched.slug : categoryParam;
    }
    return 'all';
  });

  useEffect(() => {
    if (categoryParam) {
      const matched = categories.find(c => c.slug.toLowerCase() === categoryParam.toLowerCase());
      setSelected(matched ? matched.slug : categoryParam);
    } else {
      setSelected('all');
    }
  }, [categoryParam, categories]);

  const handleSelect = (categorySlug: string) => {
    setSelected(categorySlug);
    if (categorySlug === 'all') {
      router.push('/projects', { scroll: false });
    } else {
      router.push(`/projects?category=${encodeURIComponent(categorySlug)}`, { scroll: false });
    }
  };

  const visible = useMemo(() => projects.filter((project) => {
    if (selected === 'all') return true;
    return project.categories?.some(c => c.toLowerCase() === selected.toLowerCase());
  }), [projects, selected]);

  // build category hierarchy
  const parentCategories = categories.filter(c => !c.parent);
  const getChildren = (parentId: string) => categories.filter(c => c.parent === parentId);

  return (
    <div className="flex flex-col gap-10 lg:flex-row-reverse">
      {/* Sidebar for Categories */}
      <aside className="w-full lg:w-64 shrink-0 h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="mb-4 text-lg font-bold">دسته‌بندی‌ها</h3>
        <ul className="flex flex-col gap-2">
          <li>
            <button
              onClick={() => handleSelect('all')}
              className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer ${selected === 'all' ? 'bg-[var(--primary)] text-[var(--background)] font-bold' : 'hover:bg-[var(--background)]'}`}
            >
              همه پروژه‌ها
            </button>
          </li>
          {parentCategories.map(parent => (
            <li key={parent.slug} className="flex flex-col gap-1">
              <button
                onClick={() => handleSelect(parent.slug)}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors cursor-pointer ${selected.toLowerCase() === parent.slug.toLowerCase() ? 'bg-[var(--primary)] text-[var(--background)] font-bold' : 'hover:bg-[var(--background)]'}`}
              >
                {parent.name}
              </button>
              {getChildren(parent.slug).length > 0 && (
                <ul className="flex flex-col gap-1 pr-4 border-r-2 border-[var(--border)] mr-2 mt-1">
                  {getChildren(parent.slug).map(child => (
                    <li key={child.slug}>
                      <button
                        onClick={() => handleSelect(child.slug)}
                        className={`w-full text-right px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${selected.toLowerCase() === child.slug.toLowerCase() ? 'bg-[var(--primary)] text-[var(--background)] font-bold' : 'hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content for Projects Grid */}
      <div className="flex-1">
        {visible.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard key={project.slug} project={project} categories={categories} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">پروژه‌ای در این دسته پیدا نشد.</p>
        )}
      </div>
    </div>
  );
}
