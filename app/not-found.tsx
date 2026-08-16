import Link from 'next/link';
export default function NotFound() { return <section className="section"><div className="container text-center"><p className="eyebrow">خطای ۴۰۴</p><h1 className="mt-3 text-6xl font-black">این صفحه پیدا نشد.</h1><p className="mt-5 text-[var(--muted)]">ممکن است آدرس تغییر کرده باشد.</p><Link href="/" className="button mt-8">بازگشت به خانه</Link></div></section>; }
