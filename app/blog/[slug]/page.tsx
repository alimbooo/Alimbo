import { assetUrl } from '@/lib/url';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {  getPost, getPosts, getPostCategories } from '@/lib/content';
import { ProjectGallery } from '@/components/project-gallery';

function renderMarkdown(markdown: string) {
  // Let's create an id generator
  const getSlug = (text: string) => text.trim().toLowerCase().replace(/\s+/g, '-');
  return markdown.split('\n').map((line, index) => {
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      return <h2 id={getSlug(text)} key={index}>{text}</h2>;
    }
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      return <h3 id={getSlug(text)} key={index}>{text}</h3>;
    }
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

  return (
    <iframe title={`ویدیوی ${title}`} src={assetUrl(url)}
      className="aspect-video w-full rounded-2xl border border-[var(--border)]"
      allowFullScreen
    />
  );
}

export async function generateStaticParams() {
  const posts = getPosts();
  if (posts.length === 0) return [{ slug: 'empty' }];
  return posts.map((post) => ({ slug: post.slug }));
}


export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const categories = getPostCategories();
  const posts = getPosts();
  const index = posts.findIndex((item) => item.slug === post.slug);
  const related = posts.filter((item) => item.slug !== post.slug && item.categories?.some((cat) => post.categories?.includes(cat))).slice(0, 2);

  const getSlug = (text: string) => text.trim().toLowerCase().replace(/\s+/g, '-');
  const headings = post.content.split('\n').filter(line => line.startsWith('## ') || line.startsWith('### '));

  return (
    <article className="section pt-10 md:pt-20">
      <div className="container">
        <h1 className="mb-10 text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-right">{post.title}</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] items-start">
          <div>
            {post.template !== 'video' && post.images && post.images.length > 0 && <ProjectGallery images={post.images} />}
            {post.template !== 'video' && (!post.images || post.images.length === 0) && post.cover && <img src={assetUrl(post.cover)} alt={`تصویر پست ${post.title}`} className="w-full rounded-2xl border border-[var(--border)] shadow-sm" />}
            {post.template === 'video' && post.videoUrl && parseVideoUrl(post.videoUrl, post.videoSource || 'host', post.title)}
            <div className="prose mt-10 max-w-none">{renderMarkdown(post.content)}</div>

             {post.categories && post.categories.length > 0 && (
                <div className="mt-10">
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((slug) => (
                      <span className="tag text-xs" key={slug}>
                        {categories.find((cat) => cat.slug === slug)?.name || slug}
                      </span>
                    ))}
                  </div>
                </div>
             )}
          </div>

          <aside className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
             <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b border-[var(--border)] pb-2">فهرست مطالب</h3>
                <div className="text-sm space-y-2 text-[var(--muted)]">
                  {headings.length > 0 ? (
                    <ul className="space-y-1">
                      {headings.map((line, i) => {
                        const isH3 = line.startsWith('### ');
                        const text = isH3 ? line.slice(4) : line.slice(3);
                        return <li key={i} className={isH3 ? "mr-3" : ""}><a href={`#${getSlug(text)}`} className="hover:text-[var(--primary)] transition-colors">{text}</a></li>;
                      })}
                    </ul>
                  ) : (
                    <p>فهرستی یافت نشد.</p>
                  )}
                </div>
             </div>


          </aside>
        </div>
        {related.length > 0 && (
          <section className="mt-20 border-t border-[var(--border)] pt-10">
            <h2 className="text-2xl font-bold">پست‌های مرتبط</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="card p-5"><span className="text-[var(--primary)]">{item.title}</span><p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p></Link>)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
