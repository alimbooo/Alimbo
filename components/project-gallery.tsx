'use client';

import { useState } from 'react';
import { assetUrl } from '@/lib/url';

export function ProjectGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return (
      <>
        <img src={assetUrl(images[0])} alt="تصویر پروژه" className="w-full rounded-2xl border border-[var(--border)] shadow-sm cursor-pointer object-cover" onClick={() => setLightboxOpen(true)} />
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setLightboxOpen(false)}>
            <button className="absolute right-6 top-6 text-white hover:text-gray-300" onClick={() => setLightboxOpen(false)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={assetUrl(images[0])} alt="تصویر بزرگ پروژه" className="max-h-[90vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </>
    );
  }

  const next = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm bg-[var(--card)]">
        <img
          src={assetUrl(images[currentIndex])}
          alt="تصویر پروژه"
          className="h-full w-full object-cover cursor-pointer" onClick={() => setLightboxOpen(true)}
        />

        <button
          onClick={prev}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="قبلی"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <button
          onClick={next}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="بعدی"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${currentIndex === index ? 'border-[var(--primary)] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={assetUrl(img)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setLightboxOpen(false)}>
          <button className="absolute right-6 top-6 text-white hover:text-gray-300" onClick={() => setLightboxOpen(false)}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <img
            src={assetUrl(images[currentIndex])}
            alt="تصویر بزرگ پروژه"
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80 md:right-10"
                aria-label="قبلی"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80 md:left-10"
                aria-label="بعدی"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
