import React, { useState, useEffect } from 'react';
import { Search, X, User, Briefcase, FileText, ArrowRight } from 'lucide-react';
import { globalSearch } from '../api/client';

export default function SearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [filteredTalents, setFilteredTalents] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      globalSearch(query)
        .then((res) => {
          if (cancelled) return;
          setFilteredTalents(res?.talents || []);
          setFilteredProjects(res?.projects || []);
          setFilteredArticles(res?.articles || []);
        })
        .catch(() => {});
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-[#EAE2DC] gap-3">
          <Search className="w-5 h-5 text-[#F36B21]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search talents, skills, projects, guides..."
            autoFocus
            className="flex-1 text-base text-[#171717] placeholder:text-[#999999] focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Section: Freelancers */}
          {filteredTalents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] px-3 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#F36B21]" />
                <span>Freelancers ({filteredTalents.length})</span>
              </p>
              <div className="space-y-1">
                {filteredTalents.slice(0, 3).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onSelectResult('profile', f)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF3EC] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#EAE2DC]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[#171717]">
                            {f.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] font-medium">
                            ${f.hourlyRate}/hr
                          </span>
                        </div>
                        <p className="text-xs text-[#777777]">{f.title}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#777777] group-hover:text-[#F36B21] transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] px-3 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#F36B21]" />
                <span>Projects ({filteredProjects.length})</span>
              </p>
              <div className="space-y-1">
                {filteredProjects.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectResult('work', p)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF3EC] transition-colors text-left group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#171717]">{p.title}</p>
                      <p className="text-xs text-[#777777] line-clamp-1">{p.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#F36B21] shrink-0 ml-3">
                      {p.budget}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Resources */}
          {filteredArticles.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] px-3 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#F36B21]" />
                <span>Guides & Articles ({filteredArticles.length})</span>
              </p>
              <div className="space-y-1">
                {filteredArticles.slice(0, 2).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectResult('resources', a)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF3EC] transition-colors text-left group"
                  >
                    <p className="text-sm font-medium text-[#171717] line-clamp-1">
                      {a.title}
                    </p>
                    <span className="text-xs text-[#777777] shrink-0 ml-3">
                      {a.readTime}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTalents.length === 0 &&
            filteredProjects.length === 0 &&
            filteredArticles.length === 0 && (
              <div className="text-center py-10 text-[#777777]">
                <p className="text-sm">No matches found for "{query}"</p>
                <p className="text-xs text-[#999999] mt-1">
                  Try searching for "React", "Design", or "Dashboard"
                </p>
              </div>
            )}
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 bg-[#FFF9F5] border-t border-[#EAE2DC] flex items-center justify-between text-xs text-[#777777]">
          <span>Press ESC to close</span>
          <span className="text-[#F36B21] font-medium">Workverse Universal Index</span>
        </div>
      </div>
    </div>
  );
}

