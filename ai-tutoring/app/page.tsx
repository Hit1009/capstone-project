'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchCourses, type CourseInfo } from '@/lib/api';
import { 
  Brain, 
  Cpu, 
  Binary, 
  Network, 
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-10 h-10 text-indigo-500" />,
  Cpu: <Cpu className="w-10 h-10 text-rose-500" />,
  Binary: <Binary className="w-10 h-10 text-emerald-500" />,
  Network: <Network className="w-10 h-10 text-sky-500" />,
  Sparkles: <Sparkles className="w-10 h-10 text-amber-500" />,
};

export default function HomePage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Course Grid */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Available Courses</h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl px-8 py-6 max-w-md text-center">
              <p className="text-red-700 font-semibold mb-2">Failed to load courses</p>
              <p className="text-red-500 text-sm">{error}</p>
              <p className="text-slate-400 text-xs mt-3">Make sure the backend is running on port 5000</p>
            </div>
          </div>
        )}

        {/* Course Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const isComingSoon = course.status === 'coming-soon';
              const isLearnAnything = course.id === 'learn-anything';

              const cardContent = (
                <div className={`h-full flex flex-col p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden
                  ${isLearnAnything 
                    ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-700/50 shadow-xl shadow-indigo-900/20 group-hover:shadow-indigo-900/40 group-hover:border-indigo-500/50' 
                    : isComingSoon
                      ? 'bg-white/40 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-200 hover:-translate-y-1'
                  }
                `}>
                  
                  {/* Background glow for 'Learn Anything' */}
                  {isLearnAnything && (
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />
                  )}

                  <div className="mb-6 bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100/10 backdrop-blur-sm">
                    {iconMap[course.icon] || <Brain className={`w-10 h-10 ${isLearnAnything ? 'text-indigo-400' : 'text-slate-400'}`} />}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-3 ${isLearnAnything ? 'text-white' : 'text-slate-900'}`}>
                    {course.title}
                  </h3>
                  
                  <p className={`text-sm leading-relaxed mb-8 flex-1 ${isLearnAnything ? 'text-indigo-100/80' : 'text-slate-500'}`}>
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    {isComingSoon ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${isLearnAnything 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }
                      `}>
                        Coming Soon
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {course.slideCount} slides
                        </span>
                        <ArrowRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </div>
              );

              return isComingSoon ? (
                <div key={course.id} className="group relative">
                  {cardContent}
                </div>
              ) : (
                <Link key={course.id} href={`/learn?course=${course.id}`} className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-3xl">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 bg-white mt-auto">
        <p className="text-sm font-medium text-slate-400">
          AI Tutor — Capstone Project &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
