import { getPostCategories, getPosts } from '@/lib/content';
import { PostBrowser } from '@/components/post-browser';
export default function BlogPage() { return <section className="section"><div className="container"><h1 className="mt-2 text-3xl font-black">بلاگ</h1><div className="mt-12"><PostBrowser posts={getPosts()} categories={getPostCategories()}/></div></div></section>; }
