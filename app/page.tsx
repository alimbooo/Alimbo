import { assetUrl } from '@/lib/url';
import Link from 'next/link';
import { getCategories, getProjects, getSite, getPosts, getPostCategories } from '@/lib/content';
import { PostCard } from '@/components/post-card';
import { ProjectCard } from '@/components/project-card';
import { Icon } from '@/src/icons';

export default function Home() {
  const site = getSite();
  const categories = getCategories();
  const postCategories = getPostCategories();
  const allProjects = getProjects();
  const allPosts = getPosts();

  const hero = site.hero as Record<string, string> | undefined;
  const socials = site.socials as Record<string, string> | undefined;

  const name = hero?.name || String(site.name);
  const jobTitle = hero?.jobTitle || String(site.title);
  const about = hero?.about || String(site.bio);
  const profileImage = hero?.profileImage || String(site.profileImage);

  const ghHref = (hero?.github ?? socials?.github) || '';
  const liHref = (hero?.linkedin ?? socials?.linkedin) || '';
  const igHref = hero?.instagram || '';
  const tgHref = hero?.telegram || '';
  const ytHref = (hero?.youtube ?? socials?.youtube) || '';
  const twHref = (hero?.twitter ?? socials?.twitter) || '';

  const socialLinks = [
    ghHref.trim() !== '' ? { label: 'GitHub', href: ghHref, icon: <Icon name="github" width="22" height="22" /> } : null,
    igHref.trim() !== '' ? { label: 'Instagram', href: igHref, icon: <Icon name="instagram" width="22" height="22" /> } : null,
    tgHref.trim() !== '' ? { label: 'Telegram', href: tgHref, icon: <Icon name="telegram" width="22" height="22" /> } : null,
    liHref.trim() !== '' ? { label: 'LinkedIn', href: liHref, icon: <Icon name="linkedin" width="22" height="22" /> } : null,
    ytHref.trim() !== '' ? { label: 'YouTube', href: ytHref, icon: <Icon name="youtube" width="22" height="22" /> } : null,
    twHref.trim() !== '' ? { label: 'Twitter (X)', href: twHref, icon: <Icon name="x" width="22" height="22" /> } : null,
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[];

  const layout = (site.homeLayout as any[]) || [
    { id: 'projects', display: true, maxItems: 6, grid: 3 },
    { id: 'posts', display: true, maxItems: 6, grid: 3 }
  ];

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-profile">
              <div className="hero-avatar-wrap">
                <img src={assetUrl(profileImage)} alt={`تصویر ${name}`} className="hero-avatar" />
              </div>
              <h1 className="hero-name">{name}</h1>
              <p className="hero-job-title">{jobTitle}</p>
              {socialLinks.length > 0 && (
                <div className="hero-socials">
                  {socialLinks.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="hero-social-btn">
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="hero-about-box">
              <div className="hero-about-title">
              <Icon name="user" width="24" height="24" />
                درباره من
              </div>
              <p className="hero-about-text">{about}</p>
              <Link className="button" style={{width: 'fit-content', padding: '8px 20px 8px 10px'}} href="/resume">
                رزومه من <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"> <path d="m15 18-6-6 6-6" /> </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {layout.map((section, idx) => {
                if (section.id === 'projects' && section.display !== false) {
          const gridClasses = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };
          const gridClass = gridClasses[section.grid as keyof typeof gridClasses] || 'md:grid-cols-3';
          const max = parseInt(section.maxItems) || 6;
          const items = allProjects.slice(0, max);

          return (
            <section key={idx} className="section border-t border-[var(--border)]">
              <div className="container">
                <div className="mb-9 text-center">
                  <h2 className="mt-2 text-3xl font-bold">پروژه‌ها</h2>
                </div>
                <div className={`grid gap-5 ${gridClass}`}>
                  {items.map((project) => (
                    <ProjectCard key={project.slug} project={project} categories={categories} />
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  <Link className="button" style={{padding: '8px 20px 8px 10px'}} href="/projects">
                    مشاهده همه <Icon name="left" width="24" height="24" />
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (section.id === 'posts' && section.display !== false) {
          const gridClasses = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };
          const gridClass = gridClasses[section.grid as keyof typeof gridClasses] || 'md:grid-cols-3';
          const max = parseInt(section.maxItems) || 6;
          const items = allPosts.slice(0, max);

          return (
            <section key={idx} className="section border-t border-[var(--border)]">
              <div className="container">
                <div className="mb-9 text-center">
                  <h2 className="mt-2 text-3xl font-bold">پست‌ها</h2>
                </div>
                <div className={`grid gap-5 ${gridClass}`}>
                  {items.map((post) => (
                    <PostCard key={post.slug} post={post} categories={postCategories} />
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  <Link className="button" style={{padding: '8px 20px 8px 10px'}} href="/blog">
                    مشاهده همه <Icon name="left" width="24" height="24" />
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </>
  );
}
