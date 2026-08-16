'use client';
import { useMemo, useState } from 'react';
import type { Post, Category } from '@/lib/content';
import { PostCard } from './post-card';

export function PostBrowser({ posts, categories }: { posts: Post[]; categories: Category[] }) {
  const [selected, setSelected] = useState('all');

  const visible = useMemo(() => posts.filter((post) => {
    return selected === 'all' || post.categories?.includes(selected);
  }), [posts, selected]);

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
              onClick={() => setSelected('all')}
              className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${selected === 'all' ? 'bg-[var(--primary)] text-[var(--background)]' : 'hover:bg-[var(--background)]'}`}
            >
              همه پست‌ها
            </button>
          </li>
          {parentCategories.map(parent => (
            <li key={parent.slug} className="flex flex-col gap-1">
              <button
                onClick={() => setSelected(parent.slug)}
                className={`w-full text-right px-3 py-2 rounded-lg transition-colors ${selected === parent.slug ? 'bg-[var(--primary)] text-[var(--background)]' : 'hover:bg-[var(--background)]'}`}
              >
                {parent.name}
              </button>
              {getChildren(parent.slug).length > 0 && (
                <ul className="flex flex-col gap-1 pr-4 border-r-2 border-[var(--border)] mr-2 mt-1">
                  {getChildren(parent.slug).map(child => (
                    <li key={child.slug}>
                      <button
                        onClick={() => setSelected(child.slug)}
                        className={`w-full text-right px-3 py-1.5 rounded-lg text-sm transition-colors ${selected === child.slug ? 'bg-[var(--primary)] text-[var(--background)]' : 'hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
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

      {/* Main Content for Posts Grid */}
      <div className="flex-1">
        {visible.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} categories={categories} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">پستی در این دسته پیدا نشد.</p>
        )}
      </div>
    </div>
  );
}
