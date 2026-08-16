import { getBaseUrl } from '@/lib/url';
import { MetadataRoute } from 'next';
import { getProjects } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();

  return [
    '',
    '/projects',
    '/resume',
    '/about',
    '/contact',
    ...getProjects().map((project) => `/projects/${project.slug}`)
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date()
  }));
}
