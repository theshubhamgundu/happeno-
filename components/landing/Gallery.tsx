'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback, useEffect } from 'react';
import { GALLERY_IMAGES, type GalleryImage } from './galleryImages';
import Image from 'next/image';

// Distinct bento configurations for high-end modern layout
const BENTO_PATTERNS = [
  { span: 'md:col-span-2 md:row-span-2 min-h-[320px] md:min-h-[460px]', featured: true },
  { span: 'md:col-span-1 md:row-span-1 min-h-[220px]', featured: false },
  { span: 'md:col-span-1 md:row-span-1 min-h-[220px]', featured: false },
  { span: 'md:col-span-1 md:row-span-2 min-h-[320px] md:min-h-[460px]', featured: false },
  { span: 'md:col-span-1 md:row-span-1 min-h-[220px]', featured: false },
  { span: 'md:col-span-2 md:row-span-1 min-h-[220px]', featured: false },
  { span: 'md:col-span-1 md:row-span-1 min-h-[220px]', featured: false },
  { span: 'md:col-span-1 md:row-span-1 min-h-[220px]', featured: false },
];

interface BentoCardProps {
  image: GalleryImage;
  index: number;
  onClick: (image: GalleryImage, index: number) => void;
}

function BentoCard({ image, index, onClick }: BentoCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [loaded, setLoaded] = useState(false);
  const pattern = BENTO_PATTERNS[index % BENTO_PATTERNS.length];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 25 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 5) * 0.08, ease: [0.25, 0.8, 0.25, 1] }}
      className={`group relative overflow-hidden rounded-2xl bg-gray-100 border border-gray-200/80 hover:border-[#0f766e]/60 shadow-sm hover:shadow-xl transition-all duration-500 cursor-zoom-in ${pattern.span}`}
      onClick={() => onClick(image, index)}
    >
      {/* Loading Skeleton Shimmer */}
      {!loaded && (
        <div className="absolute inset-0 skeleton-shimmer flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <svg
              className="w-8 h-8 text-gray-500 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-mono text-[10px] tracking-wider uppercase text-gray-500 font-medium">
              Loading...
            </span>
          </div>
        </div>
      )}

      {/* Main Image */}
      <img
        src={image.src}
        alt={image.name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Glassmorphic Ambient Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/85 via-[#0f172a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top Floating Badge */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-white/90 backdrop-blur-md border border-gray-200/80 text-gray-800 shadow-sm font-semibold">
          {image.day}
        </span>
        {pattern.featured && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#0f766e] text-white shadow-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-200 animate-pulse" />
            Spotlight
          </span>
        )}
      </div>

      {/* Interactive Expand Action Button (Top Right) */}
      <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300 shadow-md">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
          />
        </svg>
      </div>

      {/* Bottom Card Information */}
      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center gap-2 text-teal-300 text-[11px] font-mono uppercase tracking-wider mb-1 font-medium">
          <span>Happeno 2026</span>
          <span>•</span>
          <span>{image.day}</span>
        </div>
        <h4 className="font-display font-bold text-base sm:text-lg text-white leading-snug drop-shadow-sm">
          {image.title || image.name}
        </h4>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const [activeTab, setActiveTab] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });

  const filteredImages =
    activeTab === 'All'
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) => img.day === activeTab);

  const [lightboxLoaded, setLightboxLoaded] = useState(false);

  const openLightbox = useCallback((image: GalleryImage, idx: number) => {
    setLightboxLoaded(false);
    setLightboxIndex(idx);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex !== null) {
        setLightboxLoaded(false);
        setLightboxIndex((prev) => (prev! + 1) % filteredImages.length);
      }
    },
    [lightboxIndex, filteredImages.length]
  );

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex !== null) {
        setLightboxLoaded(false);
        setLightboxIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
      }
    },
    [lightboxIndex, filteredImages.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, nextImage, prevImage]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  const currentLightboxImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  return (
    <section id="gallery" className="relative py-24 sm:py-32 px-6 bg-white" ref={sectionRef}>
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#0f766e] font-semibold">
                04
              </span>
              <span className="h-[1px] w-10 bg-teal-600/40" />
              <span className="font-mono text-xs tracking-[0.25em] uppercase text-gray-500">
                Visual Archive
              </span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0f172a] leading-tight mb-3">
              Event Gallery
            </h2>
            <p className="font-body text-base text-gray-600 max-w-xl leading-relaxed">
              Curated highlights capturing the intensity, teamwork, and energy of the 24-hour
              sprint.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-[#F8F9FA] p-1.5 border border-gray-200">
              {['All', 'Day 1', 'Day 2'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg font-mono text-xs tracking-wider transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-[#0f172a] font-bold shadow-sm border border-gray-200/80'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[220px]">
          {filteredImages.map((img, i) => (
            <BentoCard key={img.id} image={img} index={i} onClick={openLightbox} />
          ))}
        </div>
      </div>

      {/* High-End Lightbox Modal */}
      <AnimatePresence>
        {currentLightboxImage && (
          <motion.div
            className="lightbox-overlay p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Top Bar Header */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
              <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-lg flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]" />
                <span className="font-mono text-xs text-gray-900 font-semibold tracking-wide">
                  {currentLightboxImage.day} — {currentLightboxImage.title || currentLightboxImage.name}
                </span>
                <span className="font-mono text-xs text-gray-500">
                  [{(lightboxIndex ?? 0) + 1} of {filteredImages.length}]
                </span>
              </div>

              <button
                onClick={closeLightbox}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center text-lg font-bold shadow-lg border border-gray-200 transition-all hover:scale-105"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Previous Button */}
            <button
              onClick={prevImage}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center font-bold text-xl shadow-xl border border-gray-200 transition-all hover:scale-110"
              aria-label="Previous image"
            >
              ←
            </button>

            {/* Centered Image with Skeleton */}
            <motion.div
              key={currentLightboxImage.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-5xl max-h-[82vh] min-w-[300px] min-h-[220px] flex items-center justify-center cursor-default rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!lightboxLoaded && (
                <div className="absolute inset-0 skeleton-shimmer flex items-center justify-center z-10 rounded-xl min-h-[300px] min-w-[300px]">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <svg
                      className="w-10 h-10 text-gray-600 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-mono text-xs tracking-wider uppercase text-gray-600 font-medium">
                      Loading Full Image...
                    </span>
                  </div>
                </div>
              )}

              <img
                src={currentLightboxImage.src}
                alt={currentLightboxImage.name}
                onLoad={() => setLightboxLoaded(true)}
                className={`max-h-[82vh] max-w-[90vw] object-contain rounded-xl shadow-2xl bg-black/90 border border-white/20 transition-opacity duration-300 ${
                  lightboxLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </motion.div>

            {/* Next Button */}
            <button
              onClick={nextImage}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center font-bold text-xl shadow-xl border border-gray-200 transition-all hover:scale-110"
              aria-label="Next image"
            >
              →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
