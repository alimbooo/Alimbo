import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Project = { title: string; slug: string; description: string; cover?: string; images?: string[]; year?: string; client?: string; technologies?: string[]; categories?: string[]; template?: 'image' | 'video'; videoSource?: 'youtube' | 'aparat' | 'host' | 'embed'; videoUrl?: string; content: string };
export type Category = { name: string; slug: string; description?: string; parent: string | null; sort: number };
const root = process.cwd();
const readJson = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as T;
export function getSite() { return readJson<Record<string, unknown>>('content/site.json'); }
export function getCategories() {
  const data = readJson<{ projects: Category[], posts: Category[] }>('content/categories.json');
  return (data.projects || []).sort((a, b) => a.sort - b.sort);
}
export function getResume() { return readJson<Record<string, unknown>>('content/resume.json'); }
export function getProjects(): Project[] {
  const dir = path.join(root, 'content/projects');
  return fs.readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => { const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8')); return { ...(parsed.data as Omit<Project, 'content'>), content: parsed.content } as Project; }).sort((a, b) => new Date((b as any).date || 0).getTime() - new Date((a as any).date || 0).getTime());
}
export function getProject(slug: string) { return getProjects().find((project) => project.slug === slug); }

export type Post = { title: string; slug: string; description: string; cover?: string; images?: string[]; categories?: string[]; template?: 'image' | 'video'; videoSource?: 'youtube' | 'aparat' | 'host' | 'embed'; videoUrl?: string; content: string };
export function getPostCategories() {
  try {
    const data = readJson<{ projects: Category[], posts: Category[] }>('content/categories.json');
    return (data.posts || []).sort((a, b) => a.sort - b.sort);
  } catch { return []; }
}
export function getPosts(): Post[] {
  const dir = path.join(root, 'content/blog');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => { const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8')); return { ...(parsed.data as Omit<Post, 'content'>), content: parsed.content } as Post; }).sort((a, b) => new Date((b as any).date || 0).getTime() - new Date((a as any).date || 0).getTime());
}
export function getPost(slug: string) { return getPosts().find((post) => post.slug === slug); }

export function categoryName(slug: string, categories: Category[]) { return categories.find((category) => category.slug === slug)?.name ?? slug; }

export type Page = { title: string; slug: string; content: string };
export type MenuItem = { label: string; href: string };

export function getMenu(): MenuItem[] {
  try { return readJson<MenuItem[]>('content/menu.json'); } catch { return []; }
}

export function getPages(): Page[] {
  const dir = path.join(root, 'content/pages');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => {
    const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    return { ...(parsed.data as Omit<Page, 'content'>), content: parsed.content } as Page;
  });
}
export function getPage(slug: string) { return getPages().find((page) => page.slug === slug); }
