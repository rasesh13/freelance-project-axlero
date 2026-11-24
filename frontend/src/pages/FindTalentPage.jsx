import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  ArrowRight,
  Heart,
  LayoutGrid,
  List,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  Lock,
  Clock,
  MessageSquare,
  Send,
  X,
  Briefcase,
  Check,
} from 'lucide-react';
import { fetchTalents, fetchBookmarks, toggleBookmark, sendMessage, getAuthToken } from '../api/client';

export default function FindTalentPage({ setCurrentPage, setSelectedFreelancer, isLoggedIn = false }) {
  const [talentsList, setTalentsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedRateRange, setSelectedRateRange] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Top Rated');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [savedTalents, setSavedTalents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchTalents()
      .then((data) => {
        if (Array.isArray(data)) setTalentsList(data);
      })
      .catch((err) => console.error('Failed to load talents:', err));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken()) {
      setSavedTalents([]);
      return;
    }
    fetchBookmarks('talent')
      .then((rows) => {
        if (Array.isArray(rows)) setSavedTalents(rows.map((r) => r.itemId));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Quick Direct Message Modal State
  const [contactModalTalent, setContactModalTalent] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState({
    category: true,
    experience: true,
    rate: true,
    location: false,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleSave = async (id, e) => {
    e.stopPropagation();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: 'Sign in to bookmark verified freelancers.', returnTo: 'talent' });
      return;
    }
    setSavedTalents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    try {
      const res = await toggleBookmark('talent', id);
      if (res?.ids) setSavedTalents(res.ids);
    } catch (err) {
      console.error('Failed to toggle talent bookmark:', err);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedExperience('All');
    setSelectedRateRange('All');
    setSelectedLocation('All');
    setAvailableOnly(false);
    setVerifiedOnly(false);
    setTopRatedOnly(false);
    setVisibleCount(6);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6);
      setIsLoadingMore(false);
    }, 300);
  };

  const handleOpenContact = (talent, e) => {
    e.stopPropagation();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: `Sign in to send a direct message to ${talent.name}.`, returnTo: 'talent' });
      return;
    }
    setContactModalTalent(talent);
    setMessageText(`Hi ${talent.name.split(' ')[0]}! I reviewed your portfolio on Workverse and would like to discuss an upcoming project with you.`);
    setMessageSentSuccess(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageText.trim() && contactModalTalent) {
      try {
        await sendMessage({
          recipientId: contactModalTalent.userId || contactModalTalent.id,
          recipientName: contactModalTalent.name,
          recipientRole: contactModalTalent.title,
          recipientAvatar: contactModalTalent.avatar,
          project: 'Direct Talent Inquiry',
          text: messageText.trim(),
        });
        setMessageSentSuccess(true);
        setTimeout(() => {
          setMessageSentSuccess(false);
          setContactModalTalent(null);
          setMessageText('');
        }, 1400);
      } catch (err) {
        console.error('Failed to send direct message:', err);
      }
    }
  };

  // Filter & sort talents
  const filteredTalents = talentsList.filter((t) => {
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All Categories' || t.category === selectedCategory;

    const matchesExperience =
      selectedExperience === 'All' || t.experienceLevel === selectedExperience;

    const matchesRate =
      selectedRateRange === 'All' ||
      (selectedRateRange === '< $35' && t.hourlyRate < 35) ||
      (selectedRateRange === '$35 - $50' && t.hourlyRate >= 35 && t.hourlyRate <= 50) ||
      (selectedRateRange === '> $50' && t.hourlyRate > 50);

    const matchesLocation =
      selectedLocation === 'All' ||
      (selectedLocation === 'United States' && t.location.includes('United States')) ||
      (selectedLocation === 'Europe' && (t.location.includes('UK') || t.location.includes('Germany'))) ||
      (selectedLocation === 'Global (Remote)' && t.location.includes('Remote'));

    const matchesAvailable = !availableOnly || t.available;
    const matchesVerified = !verifiedOnly || t.verified;
    const matchesTopRated = !topRatedOnly || t.rating >= 4.9;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesExperience &&
      matchesRate &&
      matchesLocation &&
      matchesAvailable &&
      matchesVerified &&
      matchesTopRated
    );
  }).sort((a, b) => {
    if (sortBy === 'Top Rated') return b.rating - a.rating;
    if (sortBy === 'Most Reviews') return b.reviewsCount - a.reviewsCount;
    if (sortBy === 'Rate: Low to High') return a.hourlyRate - b.hourlyRate;
    if (sortBy === 'Rate: High to Low') return b.hourlyRate - a.hourlyRate;
    return 0;
  });

  const viewProfile = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setCurrentPage('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const verifiedTalentCount = talentsList.filter((talent) => talent.verified).length;
  const ratedTalents = talentsList.filter((talent) => Number(talent.reviewsCount) > 0);
  const totalVerifiedReviews = ratedTalents.reduce((sum, talent) => sum + Number(talent.reviewsCount || 0), 0);
  const averageTalentRating = ratedTalents.length > 0
    ? ratedTalents.reduce((sum, talent) => sum + Number(talent.rating || 0), 0) / ratedTalents.length
    : 0;
  const skillSpecializationCount = new Set(talentsList.flatMap((talent) => talent.skills || [])).size;

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24 relative">
      {/* ========================================================
          HERO BANNER: EDITORIAL TYPOGRAPHY & SEAMLESS BACKGROUND WAVE
      ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pb-20 border-b border-[#F3ECE7]">
        {/* Seamless 3D Parametric Wave Background Canvas */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] pointer-events-none select-none overflow-hidden z-0">
          <img
            src="/images/find-talent-wave.jpg"
            alt="Workverse Flowing Background Wave"
            className="w-full h-full object-cover object-center mix-blend-multiply opacity-75 transition-opacity duration-700"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, transparent 12%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.85) 45%, black 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 10%, black 25%, black 75%, rgba(0,0,0,0.4) 90%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, transparent 12%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.85) 45%, black 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 10%, black 25%, black 75%, rgba(0,0,0,0.4) 90%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'source-in',
            }}
          />

          {/* Smooth Multi-Directional Gradient Shields into #FFF9F5 */}
          <div className="absolute inset-y-0 left-0 w-48 sm:w-64 bg-gradient-to-r from-[#FFF9F5] via-[#FFF9F5]/85 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FFF9F5] via-[#FFF9F5]/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#FFF9F5] via-[#FFF9F5]/70 to-transparent pointer-events-none" />

          {/* Ambient Warm Lighting Orbs */}
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#F36B21]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-12 w-96 h-96 bg-[#FB923C]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#FCE2D3] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#F36B21] animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#171717]">
                  Workverse Talent Directory
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[66px] leading-[1.06] tracking-tight text-[#171717]">
                Discover <br />
                Exceptional <span className="text-[#F36B21] italic font-serif">Talent.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#666666] max-w-xl font-normal leading-relaxed">
                Connect with registered engineers, designers, and AI specialists through live, account-backed profiles.
              </p>

              {/* Big High-Elevation Search Bar */}
              <div className="relative max-w-xl flex items-center bg-white rounded-full border border-[#EAE2DC] p-2 shadow-[0_10px_35px_rgba(0,0,0,0.06)] focus-within:border-[#F36B21] focus-within:shadow-[0_12px_40px_rgba(243,107,33,0.14)] transition-all">
                <Search className="w-5 h-5 text-[#888888] ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') document.getElementById('talent-results-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  placeholder='Search by role, skill (e.g. "React", "UI/UX", "Python")...'
                  className="w-full px-3 py-2 text-sm sm:text-base text-[#171717] placeholder:text-[#999999] focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#999999] hover:text-[#171717] px-2 mr-1 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => document.getElementById('talent-results-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-orange-500/25 cursor-pointer"
                  title="Search"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Trending Tags Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#171717] mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F36B21]" />
                  <span>Trending:</span>
                </div>
                {[
                  { label: 'React', icon: '⚛', query: 'React' },
                  { label: 'Next.js', icon: '▲', query: 'Next.js' },
                  { label: 'UI/UX Design', icon: '✎', query: 'UI/UX' },
                  { label: 'AI & LLMs', icon: '✦', query: 'AI' },
                  { label: 'DevOps', icon: '∞', query: 'DevOps' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setSearchQuery(item.query)}
                    className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 shadow-xs ${searchQuery === item.query
                      ? 'bg-[#F36B21] text-white border-[#F36B21]'
                      : 'bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] hover:text-[#F36B21] border-[#EAE2DC] text-[#444444]'
                      }`}
                  >
                    <span className="text-[11px] font-bold opacity-80">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Filters Row (Faithful to Reference Image 3) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[#888888] font-medium mr-1">Quick Filters:</span>
                <button
                  type="button"
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${availableOnly
                    ? 'bg-emerald-500 text-white border-emerald-500 font-semibold'
                    : 'bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] border-[#EAE2DC] text-[#444444]'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Available Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopRatedOnly(!topRatedOnly)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${topRatedOnly
                    ? 'bg-[#171717] text-white border-[#171717] font-semibold'
                    : 'bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] border-[#EAE2DC] text-[#444444]'
                    }`}
                >
                  <Star className={`w-3.5 h-3.5 ${topRatedOnly ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'}`} />
                  <span>Top Rated (4.9+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${verifiedOnly
                    ? 'bg-[#F36B21] text-white border-[#F36B21] font-semibold'
                    : 'bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] border-[#EAE2DC] text-[#444444]'
                    }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Talent Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRateRange(selectedRateRange === '< $35' ? 'All' : '< $35')}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${selectedRateRange === '< $35'
                    ? 'bg-[#171717] text-white border-[#171717] font-semibold'
                    : 'bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] border-[#EAE2DC] text-[#444444]'
                    }`}
                >
                  <span>Under $35/hr</span>
                </button>
                {(availableOnly || topRatedOnly || verifiedOnly || selectedRateRange !== 'All' || searchQuery) && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-[#F36B21] hover:underline ml-1"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Open-Air Floating Glassmorphic Badges */}
            <div className="lg:col-span-5 relative min-h-[320px] sm:min-h-[360px] flex items-center justify-center">
              {/* Live talent totals */}
              <div className="absolute top-4 right-2 sm:right-6 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">{talentsList.length}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC]" />
                  </div>
                  <span className="text-xs text-[#777777] font-medium">Registered Talents ({verifiedTalentCount} verified)</span>
                </div>
              </div>

              {/* Live review metrics */}
              <div className="absolute top-32 left-0 sm:left-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <Star className="w-5 h-5 fill-[#F36B21]" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#171717] tracking-tight">{averageTalentRating > 0 ? `${averageTalentRating.toFixed(1)} / 5.0` : 'No ratings yet'}</div>
                  <span className="text-xs text-[#777777] font-medium">From {totalVerifiedReviews} verified review{totalVerifiedReviews === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* Live skill coverage */}
              <div className="absolute bottom-4 right-0 sm:right-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">{skillSpecializationCount}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Profiles
                    </span>
                  </div>
                  <span className="text-xs text-[#777777] font-medium">Skill Specializations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live profile capability strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-[#F3ECE7]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
            Profile data visible to hiring teams:
          </span>
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 opacity-70 grayscale hover:grayscale-0 transition-all text-xs font-bold tracking-wider text-[#171717]">
            <span>SKILLS</span>
            <span>RATES</span>
            <span>AVAILABILITY</span>
            <span>PORTFOLIOS</span>
            <span>REVIEWS</span>
            <span>WORK HISTORY</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          MAIN TALENTS BROWSER (FILTERS & CARDS GRID)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Clean Minimalist Filters Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 sticky top-28 space-y-6 shadow-xs">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F3ECE7]">
                <div className="flex items-center gap-2 font-bold text-sm text-[#171717]">
                  <Filter className="w-4 h-4 text-[#F36B21]" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-[#F36B21] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* 1. Category Filter */}
              <div className="space-y-3 pb-4 border-b border-[#F3ECE7]">
                <button
                  onClick={() => toggleSection('category')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Category</span>
                  {openSections.category ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.category && (
                  <div className="space-y-2 pt-1">
                    {[
                      { name: 'All Categories', count: talentsList.length },
                      { name: 'Development', count: talentsList.filter((talent) => talent.category === 'Development').length },
                      { name: 'Design & Creative', count: talentsList.filter((talent) => talent.category === 'Design & Creative').length },
                      { name: 'Data & Analytics', count: talentsList.filter((talent) => talent.category === 'Data & Analytics').length },
                      { name: 'Marketing', count: talentsList.filter((talent) => talent.category === 'Marketing').length },
                    ].map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          className="w-full flex items-center justify-between text-xs cursor-pointer group py-0.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                ? 'border-[#F36B21] bg-white'
                                : 'border-[#CCCCCC] bg-white group-hover:border-[#999999]'
                                }`}
                            >
                              {isSelected && <span className="w-2 h-2 rounded-full bg-[#F36B21]" />}
                            </span>
                            <span
                              className={`transition-colors ${isSelected
                                ? 'font-bold text-[#171717]'
                                : 'text-[#555555] group-hover:text-[#171717]'
                                }`}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#999999] font-normal">{cat.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Experience Level */}
              <div className="space-y-3 pb-4 border-b border-[#F3ECE7]">
                <button
                  onClick={() => toggleSection('experience')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Experience Level</span>
                  {openSections.experience ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.experience && (
                  <div className="space-y-2 pt-1">
                    {['All', 'Intermediate', 'Expert'].map((exp) => {
                      const isSelected = selectedExperience === exp;
                      return (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setSelectedExperience(exp)}
                          className="w-full flex items-center gap-2.5 text-xs cursor-pointer group py-0.5"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                              ? 'border-[#F36B21] bg-white'
                              : 'border-[#CCCCCC] bg-white group-hover:border-[#999999]'
                              }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#F36B21]" />}
                          </span>
                          <span
                            className={`transition-colors ${isSelected
                              ? 'font-bold text-[#171717]'
                              : 'text-[#555555] group-hover:text-[#171717]'
                              }`}
                          >
                            {exp}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Hourly Rate */}
              <div className="space-y-3 pb-4 border-b border-[#F3ECE7]">
                <button
                  onClick={() => toggleSection('rate')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Hourly Rate</span>
                  {openSections.rate ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.rate && (
                  <div className="space-y-2 pt-1">
                    {['All', '< $35', '$35 - $50', '> $50'].map((rate) => {
                      const isSelected = selectedRateRange === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSelectedRateRange(rate)}
                          className="w-full flex items-center gap-2.5 text-xs cursor-pointer group py-0.5"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                              ? 'border-[#F36B21] bg-white'
                              : 'border-[#CCCCCC] bg-white group-hover:border-[#999999]'
                              }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#F36B21]" />}
                          </span>
                          <span
                            className={`transition-colors ${isSelected
                              ? 'font-bold text-[#171717]'
                              : 'text-[#555555] group-hover:text-[#171717]'
                              }`}
                          >
                            {rate}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Location */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('location')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Location</span>
                  {openSections.location ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.location && (
                  <div className="space-y-2 pt-1">
                    {['All', 'United States', 'Europe', 'Global (Remote)'].map((loc) => {
                      const isSelected = selectedLocation === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setSelectedLocation(loc)}
                          className="w-full flex items-center gap-2.5 text-xs cursor-pointer group py-0.5"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                              ? 'border-[#F36B21] bg-white'
                              : 'border-[#CCCCCC] bg-white group-hover:border-[#999999]'
                              }`}
                          >
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#F36B21]" />}
                          </span>
                          <span
                            className={`transition-colors ${isSelected
                              ? 'font-bold text-[#171717]'
                              : 'text-[#555555] group-hover:text-[#171717]'
                              }`}
                          >
                            {loc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Clean, Elegant Talent Cards Grid (Faithful to Reference Image 2) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Results Header: Count & Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#171717] flex items-center gap-2">
                <span className="text-[#F36B21] font-extrabold">
                  {filteredTalents.length}
                </span>
                <span>Talents Found</span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-white border border-[#EAE2DC] rounded-xl p-1 shadow-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid'
                      ? 'bg-[#FCE2D3] text-[#F36B21]'
                      : 'text-[#777777] hover:text-[#171717]'
                      }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list'
                      ? 'bg-[#FCE2D3] text-[#F36B21]'
                      : 'text-[#777777] hover:text-[#171717]'
                      }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-[#777777]">
                  <span className="hidden sm:inline font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#EAE2DC] rounded-xl text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#F36B21] shadow-xs cursor-pointer"
                  >
                    <option value="Top Rated">Top Rated</option>
                    <option value="Most Reviews">Most Reviews</option>
                    <option value="Rate: Low to High">Hourly Rate: Low to High</option>
                    <option value="Rate: High to Low">Hourly Rate: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Talent Cards Grid */}
            <div
              id="talent-results-grid"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredTalents.slice(0, visibleCount).map((t) => {
                const isSaved = savedTalents.includes(t.id);

                if (viewMode === 'list') {
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/50 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-[0_12px_30px_rgba(243,107,33,0.08)] transition-all relative group"
                    >
                      <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                        <div className="relative shrink-0">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-[#FCE2D3] shadow-sm"
                          />
                          {t.available && (
                            <span
                              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                              title="Available"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                              {t.name}
                            </h3>
                            {t.verified && (
                              <CheckCircle2 className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC]" />
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.available
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600'
                                }`}
                            >
                              {t.available ? '● Available' : 'Busy'}
                            </span>
                          </div>
                          <p className="text-xs text-[#777777] font-medium">{t.title}</p>
                          <div className="flex items-center gap-3 text-xs text-[#777777] pt-0.5">
                            <span className="flex items-center gap-1 font-bold text-[#171717]">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {t.rating}
                              <span className="font-normal text-[#888888]">
                                ({t.reviewsCount} reviews)
                              </span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-[#999999]" />
                              {t.location}
                            </span>
                          </div>
                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {t.skills.slice(0, 4).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-[11px] text-[#555555]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F3ECE7]">
                        <div className="text-left sm:text-right">
                          <span className="text-xl font-extrabold text-[#171717]">${t.hourlyRate}</span>
                          <span className="text-xs text-[#888888]">/hr</span>
                          <p className="text-[11px] text-[#888888]">{t.experience}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleOpenContact(t, e)}
                            className="p-2.5 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] bg-white hover:bg-[#FFF3EC] text-[#777777] hover:text-[#F36B21] transition-colors"
                            title="Message Freelancer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => toggleSave(t.id, e)}
                            className={`p-2.5 rounded-full border border-[#EAE2DC] hover:bg-[#FFF3EC] transition-colors ${isSaved ? 'text-[#F36B21] border-[#FCE2D3]' : 'text-[#888888]'
                              }`}
                            title="Save Freelancer"
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#F36B21]' : ''}`} />
                          </button>
                          <button
                            onClick={() => viewProfile(t)}
                            className="px-5 py-2.5 rounded-full bg-[#FFF9F5] border border-[#FCE2D3] text-[#F36B21] hover:bg-[#F36B21] hover:text-white hover:border-[#F36B21] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <span>View Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Grid View: Pure, Uniform, Beautiful Card (Exact Match to Reference Image 2)
                return (
                  <div
                    key={t.id}
                    className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(243,107,33,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                  >
                    <div>
                      {/* Top Soft Gradient Wave Cover */}
                      <div className="h-24 sm:h-26 w-full bg-gradient-to-br from-[#FFF3EC] via-[#FCE2D3]/40 to-[#FFF9F5] relative p-4 flex items-start justify-between border-b border-[#FCE2D3]/30">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${t.available
                            ? 'bg-white/90 border border-emerald-200 text-emerald-700'
                            : 'bg-white/90 border border-zinc-200 text-zinc-600'
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${t.available ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                              }`}
                          />
                          {t.available ? 'Available' : 'Busy'}
                        </span>

                        {/* Save Heart Button */}
                        <button
                          onClick={(e) => toggleSave(t.id, e)}
                          className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-[#EAE2DC] flex items-center justify-center hover:scale-110 transition-all shadow-xs ${isSaved
                            ? 'text-[#F36B21] border-[#FCE2D3]'
                            : 'text-[#888888] hover:text-[#F36B21]'
                            }`}
                          title="Save Freelancer"
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#F36B21]' : ''}`} />
                        </button>
                      </div>

                      {/* Avatar with Elevation Ring Overlapping the Banner */}
                      <div className="-mt-12 mb-3 text-center px-6 relative z-10">
                        <div className="relative inline-block mx-auto group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-[0_6px_20px_rgba(0,0,0,0.10)] mx-auto"
                          />
                          {t.available && (
                            <span
                              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                              title="Online"
                            />
                          )}
                        </div>

                        {/* Name & Verified Check */}
                        <div className="flex items-center justify-center gap-1.5 mt-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight group-hover:text-[#F36B21] transition-colors">
                            {t.name}
                          </h3>
                          {t.verified && (
                            <CheckCircle2
                              className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC] shrink-0"
                              title="Verified Talent"
                            />
                          )}
                        </div>
                        <p className="text-xs text-[#777777] font-medium mt-0.5">{t.title}</p>
                      </div>

                      {/* Key Metrics Row (Rating on Left, Hourly Rate on Right - Clean & Spacious) */}
                      <div className="mx-6 my-4 py-3 border-y border-[#F3ECE7] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#171717]">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-sm">{t.rating}</span>
                          <span className="text-[#888888] font-normal">
                            ({t.reviewsCount})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-[#171717]">
                            ${t.hourlyRate}
                          </span>
                          <span className="text-xs text-[#888888] font-normal">/hr</span>
                        </div>
                      </div>

                      {/* Skill Tags */}
                      <div className="px-6 flex flex-wrap gap-1.5 mb-5">
                        {t.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#555555] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {t.skills.length > 3 && (
                          <span className="px-2 py-1 rounded-full bg-[#FFF3EC] text-xs text-[#F36B21] font-semibold border border-[#FCE2D3]">
                            +{t.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA Buttons */}
                    <div className="p-6 pt-0 mt-auto flex items-center gap-2">
                      <button
                        onClick={() => viewProfile(t)}
                        className="flex-1 py-2.5 sm:py-3 rounded-full border border-[#FCE2D3] bg-[#FFF9F5] text-[#F36B21] hover:bg-[#F36B21] hover:text-white hover:border-[#F36B21] transition-all duration-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs group/btn cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenContact(t, e)}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] bg-white hover:bg-[#FFF3EC] text-[#777777] hover:text-[#F36B21] flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                        title={`Message ${t.name}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredTalents.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE2DC] p-8 shadow-xs">
                <Search className="w-12 h-12 text-[#F36B21] mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-[#171717]">No talents match your criteria</h3>
                <p className="text-xs text-[#777777] mt-1 mb-5 max-w-sm mx-auto">
                  Try clearing some filter tags or adjusting your search keywords to see more freelancers.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-full bg-[#F36B21] text-white text-xs font-semibold hover:bg-[#e05e16] transition-colors shadow-md shadow-orange-500/20"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Load More Section */}
            {filteredTalents.length > 0 && (
              <div className="pt-8 text-center border-t border-[#EAE2DC]">
                <p className="text-xs text-[#777777] mb-3">
                  Showing <span className="font-bold text-[#171717]">{Math.min(visibleCount, filteredTalents.length)}</span> of{' '}
                  <span className="font-bold text-[#F36B21]">{filteredTalents.length}</span> matching live talent profile{filteredTalents.length === 1 ? '' : 's'}
                </p>
                {visibleCount < filteredTalents.length ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-7 py-3 rounded-full border border-[#EAE2DC] bg-white hover:bg-[#FFF3EC] hover:border-[#FCE2D3] text-[#171717] hover:text-[#F36B21] text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    {isLoadingMore && <span className="w-3.5 h-3.5 border-2 border-[#F36B21] border-t-transparent rounded-full animate-spin" />}
                    <span>{isLoadingMore ? 'Loading Talents...' : 'Load More Talents'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF3EC] text-xs font-semibold text-[#F36B21] border border-[#FCE2D3]">
                    <Check className="w-3.5 h-3.5" />
                    <span>All matching live profiles loaded</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          THE WORKVERSE STANDARD: HIRE WITH COMPLETE PEACE OF MIND
          (Exact Signature Guarantee Section from Reference Image 5)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4">
        <div className="bg-white rounded-3xl border border-[#EAE2DC] p-8 sm:p-12 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-bold uppercase tracking-wider text-[#F36B21]">
            The Workverse Standard
          </div>
          <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-[#171717]">
            Hire with Complete Peace of Mind
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] max-w-xl mx-auto leading-relaxed">
            Compare live profiles, communicate directly, and track milestone payment status inside the project workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
            {/* Guarantee 1 */}
            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3 hover:border-[#FCE2D3] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Transparent Talent Profiles</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                See registered account details, skills, rates, verified reviews, and completed-project history in one place.
              </p>
            </div>

            {/* Guarantee 2 */}
            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3 hover:border-[#FCE2D3] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Tracked Milestone Payments</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Payment states and releases are persisted in the workspace and remain visible to the contract participants.
              </p>
            </div>

            {/* Guarantee 3 */}
            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3 hover:border-[#FCE2D3] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Persisted Dispute Records</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Either contract participant can open a dispute, notify the other party, and freeze unreleased milestone payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          QUICK DIRECT MESSAGE MODAL
      ======================================================== */}
      {contactModalTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={contactModalTalent.avatar}
                  alt={contactModalTalent.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#FCE2D3]"
                />
                <div>
                  <h3 className="text-base font-bold text-[#171717]">Message {contactModalTalent.name}</h3>
                  <p className="text-xs text-[#777777]">{contactModalTalent.title}</p>
                </div>
              </div>
              <button
                onClick={() => setContactModalTalent(null)}
                className="p-1.5 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSentSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800">Message Dispatched!</h4>
                <p className="text-xs text-emerald-700">
                  Your inquiry has been sent to {contactModalTalent.name}. You can review this thread under Projects Hub Messages.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Your Inquiry / Scope Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Briefly describe your deliverables, timeline, and questions..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#171717] focus:outline-none focus:border-[#F36B21] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#888888]">
                    Rate: <strong className="text-[#171717]">${contactModalTalent.hourlyRate}/hr</strong> • Escrow protected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContactModalTalent(null)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
