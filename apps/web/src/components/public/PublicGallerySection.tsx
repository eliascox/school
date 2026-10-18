'use client';

import React, { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function PublicGallerySection() {
  const [activeTab, setActiveTab] = useState<'all' | 'campus' | 'academic' | 'sports' | 'events'>('all');

  const galleryItems = [
    {
      id: 1,
      title: 'Main Academic Building & Landscaped Campus',
      category: 'campus',
      categoryLabel: 'Campus',
      accentColor: 'from-blue-600 to-indigo-900'
    },
    {
      id: 2,
      title: 'Interactive Teaching in Multimedia Classrooms',
      category: 'academic',
      categoryLabel: 'Academics',
      accentColor: 'from-emerald-600 to-teal-900'
    },
    {
      id: 3,
      title: 'ICT Hands-on Training in Sheikh Russel Digital Lab',
      category: 'academic',
      categoryLabel: 'Academics',
      accentColor: 'from-indigo-600 to-purple-900'
    },
    {
      id: 4,
      title: 'Annual Sports Tournament & Prize Distribution',
      category: 'sports',
      categoryLabel: 'Sports',
      accentColor: 'from-amber-600 to-rose-900'
    },
    {
      id: 5,
      title: 'National Day Observance & Cultural Program',
      category: 'events',
      categoryLabel: 'Events',
      accentColor: 'from-rose-600 to-pink-900'
    },
    {
      id: 6,
      title: 'Annual Science Fair & Student Innovation Projects',
      category: 'academic',
      categoryLabel: 'Academics',
      accentColor: 'from-cyan-600 to-blue-900'
    }
  ];

  const filteredItems = galleryItems.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 mb-3">
              <Camera className="w-3.5 h-3.5" />
              <span>CAMPUS LIFE & PHOTO GALLERY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Moments of Learning & Celebration
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Visual glimpses of academic activities, laboratory experiments, athletics, and cultural milestones.
            </p>
          </div>

          {/* Filter Tabs in English */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            {[
              { key: 'all', label: 'All Photos' },
              { key: 'campus', label: 'Campus' },
              { key: 'academic', label: 'Academics' },
              { key: 'sports', label: 'Sports' },
              { key: 'events', label: 'Events' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-950 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all"
            >
              {/* Image Graphic Frame */}
              <div className={`h-56 w-full bg-gradient-to-br ${item.accentColor} flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 border border-white/20 shadow-inner">
                  <ImageIcon className="w-8 h-8 text-white/90" />
                </div>
                <span className="relative z-10 text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                  {item.categoryLabel}
                </span>
              </div>

              {/* Title text */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
