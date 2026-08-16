import { getCategories, getProjects } from '@/lib/content';
import { ProjectBrowser } from '@/components/project-browser';
export default function ProjectsPage() { return <section className="section"><div className="container"><h1 className="mt-2 text-3xl font-black">پروژه‌ها</h1><div className="mt-12"><ProjectBrowser projects={getProjects()} categories={getCategories()}/></div></div></section>; }
