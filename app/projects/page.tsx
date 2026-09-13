import { Suspense } from 'react';
import { getCategories, getProjects } from '@/lib/content';
import { ProjectBrowser } from '@/components/project-browser';

export default function ProjectsPage() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="mt-2 text-3xl font-black">پروژه‌ها</h1>
        <div className="mt-12">
          <Suspense fallback={<div className="text-center py-10 text-[var(--muted)]">در حال بارگذاری پروژه‌ها...</div>}>
            <ProjectBrowser projects={getProjects()} categories={getCategories()} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
