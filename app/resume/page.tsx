import { assetUrl } from '@/lib/url';
import { getResume, getSite } from '@/lib/content';
import { Icon } from '@/src/icons';

export default function ResumePage() {
  const resume = getResume() as {
    summary: string;
    experience: { id: string; title: string; company: string; period: string; description: string }[];
    education: { id: string; title: string; school: string; period: string }[];
    skills: string[];
    tools: string[];
    languages: string[];
    location?: string;
    maritalStatus?: string;
    militaryService?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    telegram?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    twitter?: string;
    instagram?: string;
  };
  const site = getSite();

  const infos = [
    { label: 'موقعیت', value: resume.location, icon: <Icon name="location" width="24" height="24" /> },
    { label: 'متولد', value: resume.birthDate, icon: <Icon name="birthDate" width="24" height="24" /> },
    { label: 'وضعیت تاهل', value: resume.maritalStatus, icon: <Icon name="user" width="24" height="24" /> },
    { label: 'وضعیت سربازی', value: resume.militaryService, icon: <Icon name="militaryService" width="24" height="24" /> },
    { label: 'تماس', value: resume.phone, icon: <Icon name="phone" width="24" height="24" /> },
    { label: 'ایمیل', value: resume.email, icon: <Icon name="email" width="24" height="24" /> },
  ].filter(i => i.value && i.value.trim() !== '');

  const linkIcon = <Icon name="link" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />;

  const links = ((resume as any).links || []).filter((i: any) => i.url && i.url.trim() !== '').map((i: any) => {
    let iconName = 'link';
    const url = i.url.toLowerCase();
    if (url.includes('github.com')) iconName = 'github';
    else if (url.includes('instagram.com')) iconName = 'instagram';
    else if (url.includes('linkedin.com')) iconName = 'linkedin';
    else if (url.includes('t.me') || url.includes('telegram.org') || url.includes('telegram.me')) iconName = 'telegram';
    else if (url.includes('twitter.com') || url.includes('x.com')) iconName = 'x';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) iconName = 'youtube';

    return {
      label: i.label,
      link: i.url,
      value: i.label,
      icon: <Icon name={iconName as any} width="20" height="20" />
    };
  });


  return (
    <section className="section">
      <div className="container max-w-4xl">
        <h1 className="mt-2 text-3xl font-black">رزومه</h1>

        <div className="mt-14 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="mb-6 text-2xl font-bold">درباره من</h2>
            <p className="mb-12 text-lg text-[var(--muted)]">{resume.summary}</p>

            <h2 className="mb-6 text-2xl font-bold">تجربه کاری</h2>
            {resume.experience.map((item) => (
              <div className="mb-7 border-r-2 border-[var(--primary)] pr-5" key={item.id}>
                <p className="text-sm text-[var(--primary)]">{item.period}</p>
                <h3 className="mt-1 text-xl font-bold">{item.title}</h3>
                <p className="text-[var(--muted)] flex items-center gap-2 mt-3">
                  {(item as any).logo && <img src={assetUrl((item as any).logo)} alt={item.company} className="w-7 h-7 object-cover rounded" />}
                  {item.company}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
              </div>
            ))}

            <h2 className="mb-6 mt-12 text-2xl font-bold">تحصیلات</h2>
            {resume.education.map((item) => (
              <div className="mb-6 border-r-2 border-[var(--secondary)] pr-5" key={item.id}>
                <p className="text-sm text-[var(--secondary)]">{item.period}</p>
                <h3 className="mt-1 font-bold">{item.title}</h3>
                <p className="text-[var(--muted)] flex items-center gap-2 mt-3">
                  {(item as any).logo && <img src={assetUrl((item as any).logo)} alt={item.school} className="w-7 h-7 object-cover rounded" />}
                  {item.school}
                </p>
              </div>
            ))}

            <h2 className="mb-5 mt-12 text-2xl font-bold">مهارت‌ها</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((item) => <span className="tag" key={item}>{item}</span>)}
            </div>

            <h2 className="mb-5 mt-12 text-2xl font-bold">ابزارها</h2>
            <div className="flex flex-wrap gap-2 mb-12">
              {resume.tools.map((item) => <span className="tag" key={item}>{item}</span>)}
            </div>
          </div>

          <div>
            {infos.length > 0 && (
              <>
                <h2 className="mb-2 text-2xl font-bold">اطلاعات</h2>
                <ul className="space-y-1 text-[var(--muted)] mb-12 rounded-md">
                  {infos.map((info) => (
                    <li key={info.label} className="flex items-center gap-4 py-2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]">
                        {info.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--muted)] mb-1 font-medium">{info.label}</span>
                        <strong className="text-[var(--foreground)] text-sm font-bold" style={{direction: 'ltr', textAlign: 'right'}}>{info.value}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {links.length > 0 && (
              <>
                <h2 className="mb-2 text-xl font-bold">لینک‌ها</h2>
                <div className="flex flex-col gap-3 mb-12 rounded-md">
                  {links.map((link: any) => (
                    <a key={link.label} href={link.link} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-4 py-1 group">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] group-hover:text-[var(--primary)] transition-colors">
                        {link.icon}
                      </div>
                      <div className="flex flex-col">
                        <strong className="text-[var(--foreground)] text-sm font-bold group-hover:text-[var(--primary)] transition-colors">{link.label}</strong>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            <h2 className="mb-5 text-2xl font-bold">زبان‌ها</h2>
            <ul className="space-y-2 text-[var(--muted)]">
              {resume.languages.map((item) => <li key={item} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
