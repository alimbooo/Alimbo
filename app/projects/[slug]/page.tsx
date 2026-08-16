import { assetUrl } from '@/lib/url';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getProject, getProjects } from '@/lib/content';
import { ProjectGallery } from '@/components/project-gallery';

function renderMarkdown(markdown: string) {
  return markdown.split('\n').map((line, index) => {
    if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith('- ')) return <li key={index}>{line.slice(2)}</li>;
    if (!line.trim()) return <div key={index} className="h-2" />;
    if (line.startsWith('<')) return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />;
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      let src = imgMatch[2];
      src = src.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      return <img key={index} src={assetUrl(src)} alt={alt} className="max-w-full rounded-2xl border border-[var(--border)]" />;
    }
    return <p key={index}>{line}</p>;
  });
}

function parseVideoUrl(url: string, source: string, title: string) {
  if (!url) return null;

  if (source === 'embed') {
    return (
      <div
        className="aspect-video w-full rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden"
        dangerouslySetInnerHTML={{ __html: url }}
      />
    );
  }

  if (source === 'host') {
    return (
      <video src={assetUrl(url)}
        title={`ویدیوی ${title}`}
        controls
        className="aspect-video w-full rounded-2xl border border-[var(--border)]"
      />
    );
  }

  if (source === 'youtube') {
    let youtubeId = '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'youtu.be') youtubeId = parsed.pathname.slice(1);
      else if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) youtubeId = parsed.pathname.slice(8);
        else if (parsed.pathname.startsWith('/shorts/')) youtubeId = parsed.pathname.slice(8);
        else if (parsed.searchParams.get('v')) youtubeId = parsed.searchParams.get('v') || '';
      }
    } catch {}
    if (!youtubeId && url.match(/^[a-zA-Z0-9_-]{11}$/)) youtubeId = url;

    const finalUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : url;

    return (
      <iframe
        title={`ویدیوی ${title}`}
        src={finalUrl}
        className="aspect-video w-full rounded-2xl border border-[var(--border)]"
        allowFullScreen
      />
    );
  }

  // Default / aparat
  return (
    <iframe title={`ویدیوی ${title}`} src={assetUrl(url)}
      className="aspect-video w-full rounded-2xl border border-[var(--border)]"
      allowFullScreen
    />
  );
}

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug);
  if (!project) notFound();
  const categories = getCategories();
  const projects = getProjects();
  const index = projects.findIndex((item) => item.slug === project.slug);
  const related = projects.filter((item) => item.slug !== project.slug && item.categories?.some((cat) => project.categories?.includes(cat))).slice(0, 2);
  return (
    <article className="section pt-10 md:pt-20">
      <div className="container">
        <h1 className="mb-10 text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-right">{project.title}</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] items-start">
          <div>
            {project.template !== 'video' && project.images && project.images.length > 0 && <ProjectGallery images={project.images} />}
            {project.template !== 'video' && (!project.images || project.images.length === 0) && project.cover && <img src={assetUrl(project.cover)} alt={`تصویر پروژه ${project.title}`} className="w-full rounded-2xl border border-[var(--border)] shadow-sm" />}
            {project.template === 'video' && project.videoUrl && parseVideoUrl(project.videoUrl, project.videoSource || 'host', project.title)}
            <div className="prose mt-10 max-w-none">{renderMarkdown(project.content)}</div>
          </div>

          <aside className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <dl className="space-y-6 text-sm">
              {project.year && String(project.year).trim() !== '' && (
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-[var(--primary)]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)] text-xs mb-0.5">سال</dt>
                    <dd className="font-medium text-base">{project.year}</dd>
                  </div>
                </div>
              )}

              {project.client && project.client.trim() !== '' && (
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-[var(--primary)]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)] text-xs mb-0.5">کارفرما</dt>
                    <dd className="font-medium text-base">{project.client}</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-[var(--primary)]">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <div>
                  <dt className="text-[var(--muted)] text-xs mb-1">دسته‌ها</dt>
                  <dd className="flex flex-wrap gap-1.5 mt-1">
                    {project.categories && project.categories.length > 0 ? project.categories.map((slug) => (
                      <span className="tag text-xs" key={slug}>
                        {categories.find((cat) => cat.slug === slug)?.name || slug}
                      </span>
                    )) : '—'}
                  </dd>
                </div>
              </div>
            </dl>
          </aside>
        </div>
        {related.length > 0 && (
          <section className="mt-20 border-t border-[var(--border)] pt-10">
            <h2 className="text-2xl font-bold">پروژه‌های مرتبط</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {related.map((item) => <Link key={item.slug} href={`/projects/${item.slug}`} className="card p-5"><span className="text-[var(--primary)]">{item.title}</span><p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p></Link>)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
