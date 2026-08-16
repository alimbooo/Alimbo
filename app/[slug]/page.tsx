import { notFound } from 'next/navigation';
import { getPage, getPages } from '@/lib/content';

function renderMarkdown(markdown: string) {
  return markdown.split('\n').map((line, index) => {
    if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith('- ')) return <li key={index}>{line.slice(2)}</li>;
    if (!line.trim()) return <div key={index} className="h-2" />;
    if (line.startsWith('<')) return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />;
    return <p key={index}>{line}</p>;
  });
}

export function generateStaticParams() {
  const pages = getPages();
  if (pages.length === 0) return [{ slug: 'fallback' }];
  return pages.map((page) => ({ slug: page.slug }));
}

export default function NormalPage({ params }: { params: { slug: string } }) {
  const page = getPage(params.slug);
  if (!page) notFound();

  return (
    <article className="section pt-10 md:pt-20">
      <div className="container max-w-4xl">
        <h1 className="mb-10 text-4xl md:text-5xl lg:text-6xl font-black leading-tight">{page.title}</h1>
        <div className="prose mt-10 max-w-none">
          {renderMarkdown(page.content)}
        </div>
      </div>
    </article>
  );
}
