import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Star,
  ArrowRight,
  Bookmark,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Code2,
  PenTool,
  Cpu,
  CheckCircle2,
  X,
  Send,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  DollarSign,
  ShieldCheck,
  Clock,
  Zap,
  Lock,
  Building,
  Check,
} from 'lucide-react';
import {
  fetchProjects,
  submitProposal,
  fetchProposals,
  fetchBookmarks,
  toggleBookmark as toggleBookmarkApi,
  getAuthToken,
} from '../api/client';

export default function FindWorkPage({ setCurrentPage, setSelectedProject, isLoggedIn = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved' | 'applied' | 'recommended'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBudgetType, setSelectedBudgetType] = useState('All'); // 'All' | 'Fixed Price' | 'Hourly'
  const [selectedBudgetRange, setSelectedBudgetRange] = useState('All'); // 'All' | '< 1k' | '1k - 3k' | '> 3k'
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [savedProjectIds, setSavedProjectIds] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [projectsError, setProjectsError] = useState('');

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjectList(data);
      })
      .catch((err) => setProjectsError(err.message || 'Could not load opportunities.'));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken()) {
      setSavedProjectIds([]);
      setAppliedProjectIds([]);
      return;
    }

    fetchBookmarks('project')
      .then((rows) => {
        if (Array.isArray(rows)) setSavedProjectIds(rows.map((r) => r.itemId));
      })
      .catch(() => {});

    fetchProposals()
      .then((props) => {
        if (Array.isArray(props)) {
          const ids = props.map((p) => p.project_id).filter(Boolean);
          setAppliedProjectIds(ids);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Apply Modal state
  const [applyModalProject, setApplyModalProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState({
    category: true,
    budget: true,
    duration: false,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleBookmark = async (id, e) => {
    e.stopPropagation();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: 'Sign in to bookmark projects.', returnTo: 'work' });
      return;
    }
    try {
      const res = await toggleBookmarkApi('project', id);
      if (res?.ids) setSavedProjectIds(res.ids);
    } catch (err) {
      setProjectsError(err.message || 'Could not save this project.');
    }
  };

  const handleOpenApply = (project, e) => {
    e.stopPropagation();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', {
        notice: 'Sign in as a freelancer to submit project proposals.',
        returnTo: 'work',
      });
      return;
    }
    setApplyModalProject(project);
    setBidAmount(project.budgetMin ? String(project.budgetMin) : '1200');
    setCoverLetter(
      `Hi! I have extensive experience building scalable solutions with ${(project.skills || []).slice(0, 3).join(', ')}. I would love to deliver ${project.title} with clean code, robust testing, and smooth milestone communication.`
    );
    setAppliedSuccess(false);
    setApplyError('');
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (applyModalProject) {
      setApplyError('');
      setIsSubmittingProposal(true);
      try {
        await submitProposal({
          project_id: applyModalProject.id,
          project_title: applyModalProject.title,
          bid_amount: `$${bidAmount}`,
          duration: applyModalProject.duration || '2 - 3 Weeks',
          pitch: coverLetter,
          cover_letter: coverLetter,
        });
        setAppliedProjectIds((prev) => prev.includes(applyModalProject.id) ? prev : [...prev, applyModalProject.id]);
        setAppliedSuccess(true);
        setTimeout(() => {
          setApplyModalProject(null);
          setAppliedSuccess(false);
        }, 1800);
      } catch (err) {
        console.error('Failed to submit proposal to backend:', err);
        setApplyError(err.message || 'Your proposal could not be submitted.');
      } finally {
        setIsSubmittingProposal(false);
      }
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedCategory('All Categories');
    setSelectedBudgetType('All');
    setSelectedBudgetRange('All');
    setSelectedDuration('All');
    setFeaturedOnly(false);
  };

  // Filter projects
  const filteredProjects = projectList.filter((p) => {
    // Tab filter
    if (activeTab === 'saved' && !savedProjectIds.includes(p.id)) return false;
    if (activeTab === 'applied' && !appliedProjectIds.includes(p.id)) return false;
    if (activeTab === 'recommended' && !p.featured && p.budgetType !== 'Fixed Price') return false;

    // Search query
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.skills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category
    const matchesCategory =
      selectedCategory === 'All Categories' || p.category === selectedCategory;

    // Budget Type
    const matchesBudgetType =
      selectedBudgetType === 'All' || p.budgetType === selectedBudgetType;
    const matchesDuration = selectedDuration === 'All' || p.duration === selectedDuration;

    // Budget Range
    let matchesBudgetRange = true;
    if (selectedBudgetRange === '< 1k') {
      matchesBudgetRange = p.budgetMin < 1000;
    } else if (selectedBudgetRange === '1k - 3k') {
      matchesBudgetRange = p.budgetMin >= 1000 && p.budgetMin <= 3000;
    } else if (selectedBudgetRange === '> 3k') {
      matchesBudgetRange = p.budgetMax > 3000 || p.budgetMin >= 3000;
    }

    // Featured only
    const matchesFeatured = !featuredOnly || p.featured;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBudgetType &&
      matchesDuration &&
      matchesBudgetRange &&
      matchesFeatured
    );
  }).sort((a, b) => {
    if (sortBy === 'Highest Budget') return b.budgetMax - a.budgetMax;
    if (sortBy === 'Shortest Duration') return (a.duration || '').localeCompare(b.duration || '');
    return 0; // default 'Newest'
  });

  const getCategoryIcon = (type) => {
    if (type === 'dev') return <Code2 className="w-5 h-5 text-[#F36B21]" />;
    if (type === 'design') return <PenTool className="w-5 h-5 text-[#F36B21]" />;
    return <Cpu className="w-5 h-5 text-[#F36B21]" />;
  };

  const activeProjectCount = projectList.filter((project) => project.status !== 'Completed').length;
  const featuredProject = projectList.find((project) => project.featured && project.status !== 'Completed')
    || projectList.find((project) => project.status !== 'Completed');
  const recommendedCount = projectList.filter((project) => project.featured || project.budgetType === 'Fixed Price').length;
  const categories = [
    { name: 'All Categories', count: projectList.length },
    ...[...new Set(projectList.map((project) => project.category).filter(Boolean))].map((name) => ({
      name,
      count: projectList.filter((project) => project.category === name).length,
    })),
  ];
  const durations = ['All', ...new Set(projectList.map((project) => project.duration).filter(Boolean))];
  const registeredClientCount = new Set(projectList.map((project) => project.clientId).filter(Boolean)).size;
  const ratedProjects = projectList.filter((project) => Number(project.clientRating) > 0);
  const averageClientRating = ratedProjects.length > 0
    ? ratedProjects.reduce((sum, project) => sum + Number(project.clientRating || 0), 0) / ratedProjects.length
    : 0;

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24 relative">
      {/* ========================================================
          HERO SECTION: SEAMLESSLY BLENDED 3D ARCHITECTURAL WAVE & OPEN-AIR CARDS
      ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pb-20 border-b border-[#F3ECE7]">
        {/* Seamless 3D Parametric Wave Background Canvas (Pure Feathered Blend) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] pointer-events-none select-none overflow-hidden z-0">
          <img
            src="/images/find-work-bg.jpg"
            alt="Workverse Flowing Architecture Background"
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
          {/* Left Feather Shield: ensures headline & search bar have 100% clean ivory canvas */}
          <div className="absolute inset-y-0 left-0 w-48 sm:w-64 bg-gradient-to-r from-[#FFF9F5] via-[#FFF9F5]/85 to-transparent pointer-events-none" />
          {/* Bottom Feather Shield: dissolves ribbons cleanly before the trust strip */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FFF9F5] via-[#FFF9F5]/80 to-transparent pointer-events-none" />
          {/* Top Feather Shield: softens ribbons under navbar */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#FFF9F5] via-[#FFF9F5]/70 to-transparent pointer-events-none" />

          {/* Ambient Lighting Orbs */}
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
                  Workverse Opportunities
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[66px] leading-[1.06] tracking-tight text-[#171717]">
                Find Work <br />
                That Matches <br />
                Your <span className="text-[#F36B21] italic font-serif">Expertise.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#666666] max-w-xl font-normal leading-relaxed">
                Explore live opportunities posted by registered clients, build lasting partnerships, and manage every application from your account.
              </p>

              {/* Elevated Big Search Bar */}
              <div className="relative max-w-xl flex items-center bg-white rounded-full border border-[#EAE2DC] p-2 shadow-[0_10px_35px_rgba(0,0,0,0.06)] focus-within:border-[#F36B21] focus-within:shadow-[0_12px_40px_rgba(243,107,33,0.14)] transition-all">
                <Search className="w-5 h-5 text-[#888888] ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') document.getElementById('work-results-feed')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  placeholder='Search projects, tech stack (e.g. "Next.js", "Figma", "AI")...'
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
                  onClick={() => document.getElementById('work-results-feed')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-orange-500/25 cursor-pointer"
                  title="Search"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Statistics Counters Row */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-10 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">{activeProjectCount}</div>
                    <div className="text-xs text-[#777777] font-medium">Active Projects</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">{registeredClientCount}</div>
                    <div className="text-xs text-[#777777] font-medium">Registered Clients</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                    <Star className="w-5 h-5 fill-[#F36B21]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">{averageClientRating > 0 ? `${averageClientRating.toFixed(1)} ★` : 'New'}</div>
                    <div className="text-xs text-[#777777] font-medium">Avg. Client Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Open-Air Cascading 3D Cards (Floating directly over background wave — NO BOX!) */}
            <div className="lg:col-span-5 relative min-h-[360px] sm:min-h-[400px] flex items-center justify-center">
              <div className="relative w-full max-w-md h-full flex items-center justify-center [perspective:1200px]">
                {/* Back Layer Card 1: Code Skeleton (tilt -12deg) */}
                <div className="absolute left-2 sm:left-4 top-8 w-48 h-52 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-4 flex flex-col justify-between transform -rotate-12 opacity-75 hover:opacity-100 transition-all duration-300 pointer-events-none sm:pointer-events-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] font-mono font-bold text-sm">
                    &lt;/&gt;
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-2.5 rounded-full bg-[#EAE2DC]" />
                    <div className="w-1/2 h-2 rounded-full bg-[#FCE2D3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#777777]">React • Next.js</span>
                </div>

                {/* Middle Layer Card 2: Design Skeleton (tilt -6deg) */}
                <div className="absolute left-14 sm:left-20 top-4 w-52 h-56 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_16px_36px_rgba(0,0,0,0.08)] p-5 flex flex-col justify-between transform -rotate-6 opacity-90 hover:opacity-100 transition-all duration-300 pointer-events-none sm:pointer-events-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-2.5 rounded-full bg-[#EAE2DC]" />
                    <div className="w-4/5 h-2 rounded-full bg-[#EAE2DC]/80" />
                    <div className="w-2/3 h-2 rounded-full bg-[#FCE2D3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#777777]">UI/UX • Figma</span>
                </div>

                {/* Front Prominent Card 3: Live Interactive Featured Project (tilt +2deg) */}
                <div className="relative z-20 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(243,107,33,0.14)] border border-white/90 space-y-3.5 transform sm:translate-x-10 sm:translate-y-2 rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                      {featuredProject ? 'Live Opportunity' : 'Your Next Opportunity'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#171717] tracking-tight">
                      {featuredProject?.title || 'New projects will appear here'}
                    </h3>
                    <p className="text-xs text-[#777777] line-clamp-2 mt-1">
                      {featuredProject?.description || 'There are no open projects yet. Check back as clients post opportunities.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {(featuredProject?.skills || []).slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-[#FFF9F5] border border-[#EAE2DC] text-[10px] font-medium text-[#777777]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#F3ECE7]">
                    <div>
                      <span className="text-base font-extrabold text-[#171717]">
                        {featuredProject?.budget || 'No active listings'}
                      </span>
                      <p className="text-[10px] text-[#888888]">{featuredProject ? `${featuredProject.budgetType} • ${featuredProject.duration || 'Flexible'}` : 'Browse the project feed'}</p>
                    </div>
                    <button
                      onClick={(e) => featuredProject && handleOpenApply(featuredProject, e)}
                      disabled={!featuredProject}
                      className="w-10 h-10 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md shadow-orange-500/25"
                      title={featuredProject ? 'Apply Now' : 'No open projects'}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CLIENT TRUST STRIP
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-[#F3ECE7]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#888888]">
            Live opportunity details available on Workverse:
          </span>
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 opacity-70 grayscale hover:grayscale-0 transition-all text-xs font-bold tracking-wider text-[#171717]">
            <span>BUDGET</span>
            <span>DURATION</span>
            <span>SKILLS</span>
            <span>CLIENT</span>
            <span>STATUS</span>
            <span>DEADLINE</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          NAVIGATION TABS & QUICK FILTER CHIPS
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Navigation Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE2DC]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Projects', count: projectList.length, icon: Briefcase },
              { id: 'saved', label: 'Saved', count: savedProjectIds.length, icon: Bookmark },
              { id: 'applied', label: 'Applied', count: appliedProjectIds.length, icon: CheckCircle2 },
              { id: 'recommended', label: 'Recommended', count: recommendedCount, icon: Sparkles },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if ((tab.id === 'saved' || tab.id === 'applied') && (!isLoggedIn || !getAuthToken())) {
                      setCurrentPage('auth', {
                        notice: 'Sign in to view your saved projects and submitted proposals.',
                        returnTo: 'work',
                      });
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ${
                    isActive
                      ? 'bg-[#171717] text-white shadow-md'
                      : 'bg-white hover:bg-[#FFF3EC] text-[#555555] hover:text-[#171717] border border-[#EAE2DC]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FFF3EC] text-[#F36B21]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Sort & View Mode */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#777777]">
              <span className="hidden sm:inline font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#EAE2DC] rounded-xl text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#F36B21] shadow-xs cursor-pointer"
              >
                <option value="Newest">Newest</option>
                <option value="Highest Budget">Highest Budget</option>
                <option value="Shortest Duration">Shortest Duration</option>
              </select>
            </div>

            <div className="flex items-center bg-white border border-[#EAE2DC] rounded-xl p-1 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#FCE2D3] text-[#F36B21]'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#FCE2D3] text-[#F36B21]'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Badges Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 pb-2">
          <span className="text-xs font-semibold text-[#888888] mr-1">Quick Filters:</span>

          <button
            onClick={() => setFeaturedOnly(!featuredOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              featuredOnly
                ? 'bg-[#F36B21] text-white shadow-xs'
                : 'bg-white text-[#444444] border border-[#EAE2DC] hover:border-[#FCE2D3] hover:text-[#171717]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Only</span>
          </button>

          <button
            onClick={() => setSelectedBudgetType(selectedBudgetType === 'Fixed Price' ? 'All' : 'Fixed Price')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedBudgetType === 'Fixed Price'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'bg-white text-[#444444] border border-[#EAE2DC] hover:border-[#FCE2D3] hover:text-[#171717]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Fixed Price</span>
          </button>

          <button
            onClick={() => setSelectedBudgetType(selectedBudgetType === 'Hourly' ? 'All' : 'Hourly')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedBudgetType === 'Hourly'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'bg-white text-[#444444] border border-[#EAE2DC] hover:border-[#FCE2D3] hover:text-[#171717]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hourly Contract</span>
          </button>

          <button
            onClick={() => setSelectedBudgetRange(selectedBudgetRange === '> 3k' ? 'All' : '> 3k')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedBudgetRange === '> 3k'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-[#444444] border border-[#EAE2DC] hover:border-[#FCE2D3] hover:text-[#171717]'
            }`}
          >
            <span>High Budget (&gt; $3,000)</span>
          </button>

          {(featuredOnly || selectedBudgetType !== 'All' || selectedBudgetRange !== 'All' || selectedCategory !== 'All Categories' || selectedDuration !== 'All' || searchQuery) && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#F36B21] hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* ========================================================
          MAIN WORK DIRECTORY (FILTERS & PROJECT LISTINGS)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Filters Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 sticky top-28 space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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

              {/* 1. Category */}
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
                  <div className="space-y-1.5 pt-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#FFF3EC] text-[#F36B21] font-semibold'
                              : 'text-[#444444] hover:bg-[#FFF9F5] hover:text-[#171717]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#F36B21] bg-[#F36B21]'
                                  : 'border-[#CCCCCC] bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{cat.name}</span>
                          </div>
                          <span className="text-[11px] text-[#999999] font-normal">{cat.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Budget Range */}
              <div className="space-y-3 pb-4 border-b border-[#F3ECE7]">
                <button
                  onClick={() => toggleSection('budget')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Budget Range</span>
                  {openSections.budget ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.budget && (
                  <div className="space-y-1.5 pt-1">
                    {[
                      { id: 'All', label: 'All Budgets' },
                      { id: '< 1k', label: 'Under $1,000' },
                      { id: '1k - 3k', label: '$1,000 – $3,000' },
                      { id: '> 3k', label: '$3,000+' },
                    ].map((b) => {
                      const isSelected = selectedBudgetRange === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBudgetRange(b.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#FFF3EC] text-[#F36B21] font-semibold'
                              : 'text-[#444444] hover:bg-[#FFF9F5] hover:text-[#171717]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#F36B21] bg-[#F36B21]'
                                  : 'border-[#CCCCCC] bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{b.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Duration */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('duration')}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>Project Duration</span>
                  {openSections.duration ? (
                    <ChevronUp className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  )}
                </button>

                {openSections.duration && (
                  <div className="space-y-1.5 pt-1">
                    {durations.map((dur) => {
                      const isSelected = selectedDuration === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setSelectedDuration(dur)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? 'bg-[#FFF3EC] text-[#F36B21] font-semibold'
                              : 'text-[#444444] hover:bg-[#FFF9F5] hover:text-[#171717]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#F36B21] bg-[#F36B21]'
                                  : 'border-[#CCCCCC] bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{dur}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Project Listings */}
          <div id="work-results-feed" className="lg:col-span-9 space-y-4">
            {/* Results Counter Header */}
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#171717] flex items-center gap-2">
                <span className="text-[#F36B21] font-extrabold">{filteredProjects.length}</span>
                <span>Active Opportunities</span>
              </h2>
              <span className="text-xs text-[#888888] font-medium hidden sm:inline">
                Live records from registered client postings
              </span>
            </div>

            {/* Project Cards (Grid or List Mode) */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {filteredProjects.map((p) => {
                const isSaved = savedProjectIds.includes(p.id);
                const isApplied = appliedProjectIds.includes(p.id);

                if (viewMode === 'grid') {
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedDetailProject(p)}
                      className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(243,107,33,0.12)] transition-all relative overflow-hidden cursor-pointer"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-11 h-11 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center shrink-0">
                            {getCategoryIcon(p.type)}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.featured && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-bold border border-[#FCE2D3]">
                                Featured
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleBookmark(p.id, e)}
                              className={`p-2 rounded-full border border-[#EAE2DC] hover:bg-[#FFF3EC] transition-colors ${
                                isSaved ? 'text-[#F36B21] border-[#FCE2D3]' : 'text-[#777777]'
                              }`}
                              title={isSaved ? 'Saved' : 'Bookmark'}
                            >
                              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F36B21]' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                          {p.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-[#888888] mt-1 mb-2">
                          <span className="font-semibold text-[#171717]">{p.client}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            ★ {p.clientRating}
                          </span>
                        </div>

                        <p className="text-xs text-[#666666] line-clamp-3 leading-relaxed mb-4">
                          {p.description}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 my-3">
                          {p.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-[11px] text-[#555555] font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-4 mt-2 border-t border-[#F3ECE7] flex items-center justify-between">
                        <div>
                          <div className="text-base font-extrabold text-[#171717]">{p.budget}</div>
                          <div className="text-[11px] text-[#888888]">
                            {p.budgetType} • {p.duration}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleOpenApply(p, e)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                            isApplied
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-[#FFF9F5] border border-[#FCE2D3] text-[#F36B21] hover:bg-[#F36B21] hover:text-white hover:border-[#F36B21]'
                          }`}
                        >
                          <span>{isApplied ? 'Applied ✓' : 'Apply Now'}</span>
                          {!isApplied && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                }

                // List View (Signature Architectural Job Card)
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedDetailProject(p)}
                    className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(243,107,33,0.1)] transition-all relative cursor-pointer"
                  >
                    {/* Left: Icon, Title, Description, Skills */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(p.type)}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                            {p.title}
                          </h3>
                          {p.featured && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-bold border border-[#FCE2D3]">
                              Featured
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            Verified Payment
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#888888]">
                          <span className="font-semibold text-[#171717]">{p.client}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            ★ {p.clientRating}
                          </span>
                          <span>•</span>
                          <span>Posted 2 hrs ago</span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#666666] max-w-xl leading-relaxed">
                          {p.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {p.skills.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#555555] font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFF3EC] text-xs text-[#F36B21] font-semibold">
                              +{p.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Budget, Duration, Bookmark & Apply Button */}
                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#F3ECE7]">
                      {/* Budget & Type */}
                      <div className="text-left md:text-right">
                        <div className="text-lg font-extrabold text-[#171717]">{p.budget}</div>
                        <div className="text-xs text-[#888888] font-medium">{p.budgetType}</div>
                      </div>

                      {/* Duration Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-[#777777] bg-[#FFF9F5] px-3 py-1.5 rounded-full border border-[#EAE2DC]">
                        <Calendar className="w-3.5 h-3.5 text-[#F36B21]" />
                        <span>{p.duration}</span>
                      </div>

                      {/* Bookmark Toggle */}
                      <button
                        onClick={(e) => toggleBookmark(p.id, e)}
                        className={`p-2.5 rounded-full border border-[#EAE2DC] hover:bg-[#FFF3EC] transition-colors ${
                          isSaved ? 'text-[#F36B21] border-[#FCE2D3]' : 'text-[#888888]'
                        }`}
                        title={isSaved ? 'Saved to bookmarks' : 'Bookmark this project'}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            isSaved ? 'fill-[#F36B21] text-[#F36B21]' : 'stroke-current'
                          }`}
                        />
                      </button>

                      {/* Apply Now Action */}
                      <button
                        onClick={(e) => handleOpenApply(p, e)}
                        className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
                          isApplied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-[#FFF9F5] border border-[#FCE2D3] text-[#F36B21] hover:bg-[#F36B21] hover:text-white hover:border-[#F36B21]'
                        }`}
                      >
                        <span>{isApplied ? 'Applied ✓' : 'Apply Now'}</span>
                        {!isApplied && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE2DC] p-8 shadow-xs">
                <Briefcase className="w-12 h-12 text-[#F36B21] mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-[#171717]">No opportunities match your filter</h3>
                <p className="text-xs text-[#777777] mt-1 mb-5 max-w-sm mx-auto">
                  {projectsError || (projectList.length === 0 ? 'No clients have posted an open project yet.' : activeTab === 'saved'
                    ? "You haven't bookmarked any projects yet."
                    : activeTab === 'applied'
                    ? "You haven't submitted any proposals yet."
                    : 'Try clearing your filters or search keywords to see all available listings.')}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-full bg-[#F36B21] text-white text-xs font-semibold hover:bg-[#e05e16] transition-colors shadow-md shadow-orange-500/20"
                >
                  View All Opportunities
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          FREELANCER SECURITY & BENEFITS GUARANTEE
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-3xl border border-[#EAE2DC] p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F36B21] mb-2 block">
              Built for High-Performing Freelancers
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-[#171717]">
              Earn, Build, and Grow with Total Confidence
            </h2>
            <p className="text-sm text-[#777777] mt-2">
              Workverse keeps proposals, contracts, milestone states, and direct client relationships connected to your account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Tracked Milestones</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                Follow contract milestones and their status from your workspace. Payment collection is not connected yet.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Direct Proposals</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                Send a proposal to a registered client and track its status in your account.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#171717]">Dispute Records</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                Contract participants can record and review a dispute. No arbitration service is provided.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          PROJECT DETAILS DRAWER / MODAL
      ======================================================== */}
      {selectedDetailProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedDetailProject(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-[#F3ECE7] bg-[#FFF9F5]">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-bold border border-[#FCE2D3]">
                    {selectedDetailProject.category || 'Engineering'}
                  </span>
                  {selectedDetailProject.featured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#171717] text-white text-[11px] font-semibold">
                      Featured
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    Project posted
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#171717] leading-snug">
                  {selectedDetailProject.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#777777]">
                  <span className="font-semibold text-[#171717] flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#F36B21]" />
                    {selectedDetailProject.client}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    ★ {selectedDetailProject.clientRating} Client Rating
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                    Posted {selectedDetailProject.createdAt ? new Date(selectedDetailProject.createdAt).toLocaleDateString() : 'recently'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailProject(null)}
                className="p-2 rounded-full text-[#777777] hover:text-[#171717] hover:bg-white border border-[#EAE2DC] transition-colors"
                title="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Quick Highlights Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Budget</span>
                  <p className="text-base font-extrabold text-[#171717] mt-0.5">{selectedDetailProject.budget}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Rate Type</span>
                  <p className="text-sm font-semibold text-[#171717] mt-0.5">{selectedDetailProject.budgetType}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Duration</span>
                  <p className="text-sm font-semibold text-[#171717] mt-0.5">{selectedDetailProject.duration}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Experience</span>
                  <p className="text-sm font-semibold text-[#171717] mt-0.5">Discuss with client</p>
                </div>
              </div>

              {/* Project Description & Deliverables */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717]">
                  Project Scope & Responsibilities
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {selectedDetailProject.description}
                </p>
                <p className="text-sm text-[#777777] leading-relaxed">Confirm deliverables and milestones directly with the client before accepting work.</p>
              </div>

              <p className="text-xs text-[#777777] rounded-xl border border-[#EAE2DC] bg-[#FFF9F5] p-3.5">
                Milestone terms and payment arrangements are agreed with the client. No funds are held by this demo.
              </p>

              {/* Required Skills */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717]">
                  Required Expertise & Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedDetailProject.skills || []).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold text-[#171717]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Client Reputation Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] font-bold">
                    {selectedDetailProject.client.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#171717]">{selectedDetailProject.client}</p>
                    <p className="text-[11px] text-[#777777]">San Francisco, CA • 14 Jobs Posted • $42K Total Spent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Payment Method</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-[#F3ECE7] bg-[#FFF9F5] flex items-center justify-between gap-4">
              <button
                onClick={(e) => toggleBookmark(selectedDetailProject.id, e)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#EAE2DC] text-xs font-semibold transition-colors ${
                  savedProjectIds.includes(selectedDetailProject.id)
                    ? 'bg-[#FFF3EC] text-[#F36B21] border-[#FCE2D3]'
                    : 'bg-white text-[#555555] hover:text-[#171717]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${savedProjectIds.includes(selectedDetailProject.id) ? 'fill-[#F36B21]' : ''}`} />
                <span>{savedProjectIds.includes(selectedDetailProject.id) ? 'Saved' : 'Save Project'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDetailProject(null)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717]"
                >
                  Close
                </button>

                <button
                  onClick={(e) => {
                    const proj = selectedDetailProject;
                    setSelectedDetailProject(null);
                    handleOpenApply(proj, e);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all"
                >
                  <span>{appliedProjectIds.includes(selectedDetailProject.id) ? 'Already Applied' : 'Submit Proposal Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          APPLY PROPOSAL MODAL
      ======================================================== */}
      {applyModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Submit Proposal
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1.5">
                  {applyModalProject.title}
                </h3>
                <p className="text-xs text-[#777777] mt-0.5">
                  Client: <span className="font-semibold text-[#171717]">{applyModalProject.client}</span> • Budget: <span className="font-bold text-[#F36B21]">{applyModalProject.budget}</span>
                </p>
              </div>
              <button
                onClick={() => setApplyModalProject(null)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appliedSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-800">Proposal Submitted Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  The client has received your bid and profile. They will contact you directly via Workverse messages.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                {applyError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                    {applyError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Your Proposed Bid / Total Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#777777]">$</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm font-semibold focus:outline-none focus:border-[#F36B21]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Cover Letter & Relevant Experience
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm focus:outline-none focus:border-[#F36B21] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalProject(null)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProposal}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] disabled:opacity-60 text-white text-xs font-semibold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <span>{isSubmittingProposal ? 'Submitting…' : 'Submit Proposal'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
