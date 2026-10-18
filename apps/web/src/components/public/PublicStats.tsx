'use client';

import React from 'react';
import { Users, GraduationCap, School, Calendar } from 'lucide-react';

interface PublicStatsProps {
  totalStudents: number;
  totalTeachers: number;
  estdYear?: string;
}

export default function PublicStats({ totalStudents, totalTeachers, estdYear = '1969' }: PublicStatsProps) {
  const currentYear = new Date().getFullYear();
  const estdNum = parseInt(estdYear, 10) || 1969;
  const yearsOfExcellence = Math.max(1, currentYear - estdNum);

  const stats = [
    {
      label: 'Enrolled Students',
      value: totalStudents > 0 ? `${totalStudents}+` : '800+',
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
    },
    {
      label: 'Dedicated Faculty',
      value: totalTeachers > 0 ? `${totalTeachers}+` : '25+',
      icon: <GraduationCap className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30'
    },
    {
      label: 'Years of Academic Legacy',
      value: `${yearsOfExcellence}+`,
      icon: <Calendar className="w-6 h-6 text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30'
    },
    {
      label: 'Academic Grades',
      value: 'Class 6 - 10',
      icon: <School className="w-6 h-6 text-cyan-400" />,
      color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30'
    }
  ];

  return (
    <section className="bg-slate-900 border-b border-slate-800 py-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-b ${stat.color} border backdrop-blur-xs flex items-center gap-4 transition-all hover:scale-105`}
            >
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner">
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
