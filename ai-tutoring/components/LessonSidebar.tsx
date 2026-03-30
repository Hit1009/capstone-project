import React, { useState, useCallback } from 'react';
import { GraduationCap, CheckCircle, Circle, PlayCircle, ChevronRight, ChevronDown } from 'lucide-react';
import type { SlideData, CoursePlan, TopicNode } from '@/types/presentation';

interface LessonSidebarProps {
  onToggle?: () => void;
  slides: SlideData[];
  currentSlideIndex: number;
  onGoToSlide: (index: number) => void;
  coursePlan?: CoursePlan;
  currentPosition?: {
    chapterIndex: number;
    topicPath: number[];
  };
}

/** Check if a given index path is a prefix of (or matches) the active path */
function isOnActivePath(currentPath: number[], checkPath: number[]): boolean {
  if (checkPath.length > currentPath.length) return false;
  return checkPath.every((v, i) => v === currentPath[i]);
}

/** Recursive topic node renderer */
function TopicNodeItem({
  node,
  depth,
  currentPath,
  nodePath,
  currentSlideIndex,
  onGoToSlide,
}: {
  node: TopicNode;
  depth: number;
  currentPath: number[];
  nodePath: number[];
  currentSlideIndex: number;
  onGoToSlide: (index: number) => void;
}) {
  const isActive = isOnActivePath(currentPath, nodePath);
  const hasChildren = node.children && node.children.length > 0;
  const hasSlides = node.slideIndices && node.slideIndices.length > 0;
  const isCurrentSlide = hasSlides && node.slideIndices!.includes(currentSlideIndex);
  const isCompletedSlide = hasSlides && node.slideIndices!.every(i => i < currentSlideIndex);

  const [isExpanded, setIsExpanded] = useState(isActive);

  const handleClick = useCallback(() => {
    if (hasSlides) {
      onGoToSlide(node.slideIndices![0]);
    }
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasChildren, hasSlides, node.slideIndices, onGoToSlide]);

  // Icon logic
  let icon: React.ReactNode;
  if (hasChildren) {
    icon = isExpanded ? (
      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
    ) : (
      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
    );
  } else if (isCurrentSlide) {
    icon = <PlayCircle className="w-4 h-4 shrink-0 text-indigo-500 animate-pulse" />;
  } else if (isCompletedSlide) {
    icon = <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />;
  } else {
    icon = <Circle className={`w-3 h-3 shrink-0 ${hasSlides ? 'text-slate-300' : 'text-slate-200'}`} />;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all ${
          isCurrentSlide
            ? 'text-indigo-700 font-semibold bg-white border border-indigo-200 shadow-sm'
            : isCompletedSlide
            ? 'text-slate-500 hover:bg-slate-200'
            : isActive && !hasSlides
            ? 'text-slate-700 font-medium'
            : hasSlides
            ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            : 'text-slate-400'
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px`, paddingRight: '10px' }}
      >
        {icon}
        <span className="truncate">{node.title}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, idx) => (
            <TopicNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentPath={isActive ? currentPath : []}
              nodePath={[...nodePath, idx]}
              currentSlideIndex={currentSlideIndex}
              onGoToSlide={onGoToSlide}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LessonSidebar({
  onToggle,
  slides,
  currentSlideIndex,
  onGoToSlide,
  coursePlan,
  currentPosition,
}: LessonSidebarProps) {
  const progress = slides.length > 1
    ? Math.round((currentSlideIndex / (slides.length - 1)) * 100)
    : 0;

  return (
    <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 transition-colors">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Course Plan
        </h2>
        <button 
          onClick={onToggle}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 12l12 6"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {coursePlan && currentPosition ? (
          coursePlan.chapters.map((chapter, chIdx) => {
            const isActiveChapter = chIdx === currentPosition.chapterIndex;
            return (
              <div key={chapter.id} className="mb-2">
                <h4
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md ${
                    isActiveChapter
                      ? 'text-indigo-700 bg-indigo-50/80'
                      : 'text-slate-400'
                  }`}
                >
                  {chapter.title}
                </h4>
                <div className="mt-1 space-y-0.5">
                  {chapter.topics.map((topic, tIdx) => (
                    <TopicNodeItem
                      key={topic.id}
                      node={topic}
                      depth={1}
                      currentPath={isActiveChapter ? currentPosition.topicPath : []}
                      nodePath={[tIdx]}
                      currentSlideIndex={currentSlideIndex}
                      onGoToSlide={onGoToSlide}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          /* Fallback: flat slide list if no course plan provided */
          slides.map((slide, index) => {
            const isCurrent = index === currentSlideIndex;
            const isCompleted = index < currentSlideIndex;
            const lines = slide.rawMarkdown.trim().split('\n');
            let title = `Slide ${index + 1}`;
            for (const line of lines) {
              const m = line.match(/^#{1,3}\s+(.+)/);
              if (m) { title = m[1].trim(); break; }
            }
            return (
              <button
                key={slide.id}
                onClick={() => onGoToSlide(index)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-all ${
                  isCurrent
                    ? 'bg-white text-indigo-700 border border-indigo-200 shadow-sm'
                    : isCompleted
                    ? 'text-slate-500 hover:bg-slate-200'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <PlayCircle className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className="truncate font-medium">{title}</span>
              </button>
            );
          })
        )}
      </div>
      
      {/* Progress & User Footer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="mb-4">
             <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>{progress}% Completed</span>
                <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
             </div>
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
             </div>
        </div>

         <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              JD
            </div>
            <div>
              <div className="text-sm text-slate-800 font-bold">John Doe</div>
              <div className="text-xs text-slate-500 font-medium">Free Plan</div>
            </div>
         </div>
      </div>
    </aside>
  );
}
