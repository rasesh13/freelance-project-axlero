import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  Plus,
  MoreVertical,
  Calendar,
  Zap,
  ArrowRight,
  FolderKanban,
  Send,
  MessageSquare,
  Folder,
  Users,
  CreditCard,
  Settings,
  LayoutGrid,
  List,
  X,
  Check,
  Search,
  ShieldCheck,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  Download,
  UploadCloud,
  UserPlus,
  Paperclip,
  Smile,
  Lock,
  Shield,
  Eye,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  PROJECTS,
  PROPOSALS_DATA,
  MESSAGES_THREADS_DATA,
  FILES_DATA,
  TEAM_MEMBERS_DATA,
  PAYMENTS_DATA,
} from '../data/mockData';

export default function ProjectsHubPage({ setCurrentPage, initialTab = 'projects' }) {
  const [activeSidebarNav, setActiveSidebarNav] = useState(initialTab || 'projects');

  useEffect(() => {
    if (initialTab) {
      setActiveSidebarNav(initialTab);
    }
  }, [initialTab]); // 'projects' | 'proposals' | 'messages' | 'files' | 'team' | 'payments' | 'settings'

  // Projects State
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectList, setProjectList] = useState(PROJECTS);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState('$1,500');
  const [newCategory, setNewCategory] = useState('Web Development');
  const [newDeadline, setNewDeadline] = useState('Dec 20, 2026');

  // Proposals State
  const [proposals, setProposals] = useState(PROPOSALS_DATA);
  const [proposalFilter, setProposalFilter] = useState('All');
  const [reviewedProposal, setReviewedProposal] = useState(null);

  // Messages State
  const [messageThreads, setMessageThreads] = useState(MESSAGES_THREADS_DATA);
  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [chatInputText, setChatInputText] = useState('');

  // Files State
  const [filesList, setFilesList] = useState(FILES_DATA);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileProject, setNewFileProject] = useState('SaaS Dashboard Development');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(null);

  // Team State
  const [teamList, setTeamList] = useState(TEAM_MEMBERS_DATA);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Senior Full Stack Engineer');
  const [inviteProject, setInviteProject] = useState('SaaS Dashboard Development');

  // Payments State
  const [paymentsList, setPaymentsList] = useState(PAYMENTS_DATA);
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Settings State
  const [workspaceName, setWorkspaceName] = useState('Workverse Ventures');
  const [billingEmail, setBillingEmail] = useState('finance@workverse.io');
  const [autoEscrowRelease, setAutoEscrowRelease] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [emailDigest, setEmailDigest] = useState('Daily');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Handle Create New Project
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      const createdProj = {
        id: `proj-${Date.now()}`,
        title: newTitle,
        category: newCategory,
        description: newDesc || 'Custom freelance milestone deliverables and engineering.',
        budget: newBudget,
        budgetType: 'Fixed Price',
        duration: '2 - 3 Weeks',
        skills: ['React', 'Next.js', 'Tailwind'],
        featured: false,
        saved: false,
        applied: false,
        progress: 10,
        status: 'In Progress',
        deadline: newDeadline,
        team: [
          { name: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
        ],
        teamExtra: 0,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        type: 'dev',
      };
      setProjectList((prev) => [createdProj, ...prev]);
      setIsNewProjectModalOpen(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  // Handle Proposals Status Action
  const handleUpdateProposalStatus = (id, newStatus) => {
    setProposals((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, status: newStatus } : prop))
    );
  };

  // Handle Send Chat Message
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (chatInputText.trim()) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'you',
        text: chatInputText.trim(),
        time: 'Just now',
      };
      setMessageThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === activeThreadId) {
            return {
              ...thread,
              lastMessage: newMsg.text,
              time: 'Just now',
              messages: [...thread.messages, newMsg],
            };
          }
          return thread;
        })
      );
      setChatInputText('');
    }
  };

  // Handle Upload File
  const handleUploadFileSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      const newFileObj = {
        id: `f-${Date.now()}`,
        name: newFileName.trim(),
        size: '14.2 MB',
        type: newFileName.endsWith('.pdf') ? 'pdf' : newFileName.endsWith('.fig') ? 'figma' : 'archive',
        uploadedBy: 'You',
        date: 'Today',
        project: newFileProject,
      };
      setFilesList((prev) => [newFileObj, ...prev]);
      setIsUploadModalOpen(false);
      setNewFileName('');
    }
  };

  // Handle Download File Simulation
  const handleSimulateDownload = (fileName) => {
    setDownloadSuccessToast(fileName);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Handle Invite Contributor
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      const newMember = {
        id: `tm-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        project: inviteProject,
        status: 'Invited',
        hourly: '$40/hr',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        permission: 'Editor',
      };
      setTeamList((prev) => [...prev, newMember]);
      setIsInviteModalOpen(false);
      setInviteEmail('');
    }
  };

  // Handle Release Escrow
  const handleReleaseEscrow = (paymentId) => {
    setPaymentsList((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'Released' } : p))
    );
  };

  // Handle Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  // Filter project cards
  const displayedProjects = projectList.filter((p) => {
    const matchesFilter =
      projectStatusFilter === 'All' ||
      (projectStatusFilter === 'Active' && p.status === 'In Progress') ||
      (projectStatusFilter === 'Review' && p.status === 'In Review') ||
      (projectStatusFilter === 'Completed' && p.status === 'Completed');

    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Filter proposals
  const displayedProposals = proposals.filter((prop) => {
    if (proposalFilter === 'All') return true;
    return prop.status === proposalFilter;
  });

  // Filter payments
  const displayedPayments = paymentsList.filter((pay) => {
    if (paymentFilter === 'All') return true;
    return pay.status === paymentFilter;
  });

  const activeThread =
    messageThreads.find((t) => t.id === activeThreadId) || messageThreads[0];

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24 relative">
      {/* ========================================================
          HERO BANNER: UNBOXED 3D ARCHITECTURAL PAVILION BACKGROUND
          & OPEN-AIR TELEMETRY CARDS
      ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pb-20 border-b border-[#F3ECE7]">
        {/* Seamless 3D Architectural Pavilion Background Canvas */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] pointer-events-none select-none overflow-hidden z-0">
          <img
            src="/images/projects-hub-bg.jpg"
            alt="Workverse Architectural Workspace Pavilion"
            className="w-full h-full object-cover object-center mix-blend-multiply opacity-80 transition-opacity duration-700"
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
                  Unified Workspace Management
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[66px] leading-[1.06] tracking-tight text-[#171717]">
                Projects <span className="text-[#F36B21] italic font-serif">Hub.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#666666] max-w-xl font-normal leading-relaxed">
                Track milestones, collaborate seamlessly with top independent talent, review proposals, and manage all contracts in one unified dashboard.
              </p>

              {/* Stat Counters Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                {/* Stat 1 */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">{projectList.length}</div>
                    <div className="text-xs text-[#777777] font-medium">Total Projects</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">
                      {projectList.filter((p) => p.status === 'In Progress').length}
                    </div>
                    <div className="text-xs text-[#777777] font-medium">In Progress</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#171717]">
                      {projectList.filter((p) => p.status === 'Completed').length}
                    </div>
                    <div className="text-xs text-[#777777] font-medium">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Open-Air Floating Telemetry Badges */}
            <div className="lg:col-span-5 relative min-h-[320px] sm:min-h-[360px] flex items-center justify-center">
              {/* Telemetry Card 1 */}
              <div className="absolute top-4 right-2 sm:right-6 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">99.4%</span>
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC]" />
                  </div>
                  <span className="text-xs text-[#777777] font-medium">On-Time Sprint Velocity</span>
                </div>
              </div>

              {/* Telemetry Card 2 */}
              <div className="absolute top-32 left-0 sm:left-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#171717] tracking-tight">$24,500 USD</div>
                  <span className="text-xs text-[#777777] font-medium">Escrow Protected Funds</span>
                </div>
              </div>

              {/* Telemetry Card 3 */}
              <div className="absolute bottom-4 right-0 sm:right-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">
                      {teamList.length} Members
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Synchronized
                    </span>
                  </div>
                  <span className="text-xs text-[#777777] font-medium">Active Freelance Squad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Notification Toast for Download Simulation */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#171717] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">Downloaded: {downloadSuccessToast}</span>
        </div>
      )}

      {/* ========================================================
          MAIN WORKSPACE DASHBOARD (3-COLUMN LAYOUT)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. Left Sidebar Navigation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-3 space-y-1 sticky top-28 shadow-xs">
              {[
                { id: 'projects', label: 'My Projects', icon: FolderKanban },
                { id: 'proposals', label: 'Proposals', icon: Send, badge: String(proposals.length) },
                { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '1' },
                { id: 'files', label: 'Files', icon: Folder, badge: String(filesList.length) },
                { id: 'team', label: 'Team', icon: Users },
                { id: 'payments', label: 'Payments', icon: CreditCard },
              ].map((nav) => {
                const Icon = nav.icon;
                const isActive = activeSidebarNav === nav.id;
                return (
                  <button
                    key={nav.id}
                    onClick={() => setActiveSidebarNav(nav.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#171717]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{nav.label}</span>
                    </div>
                    {nav.badge && (
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          isActive
                            ? 'bg-[#F36B21] text-white'
                            : 'bg-[#FFF3EC] text-[#F36B21]'
                        }`}
                      >
                        {nav.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-[#F3ECE7]">
                <button
                  onClick={() => setActiveSidebarNav('settings')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeSidebarNav === 'settings'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#171717]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Center Column: DYNAMICALLY SWITCHES BASED ON ACTIVE SIDEBAR NAV */}
          <div className="lg:col-span-7 space-y-6">
            {/* VIEW 1: MY PROJECTS */}
            {activeSidebarNav === 'projects' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">My Projects</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Showing {displayedProjects.length} active initiatives
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-white border border-[#EAE2DC] rounded-xl p-1 text-xs shadow-xs">
                      {[
                        { id: 'All', label: 'All' },
                        { id: 'Active', label: 'Active' },
                        { id: 'Review', label: 'Review' },
                        { id: 'Completed', label: 'Done' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setProjectStatusFilter(f.id)}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            projectStatusFilter === f.id
                              ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                              : 'text-[#777777] hover:text-[#171717]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* + New Project Button */}
                    <button
                      onClick={() => setIsNewProjectModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Project</span>
                    </button>
                  </div>
                </div>

                {/* Projects Horizontal Cards */}
                <div className="space-y-4">
                  {displayedProjects.map((p) => {
                    const getStatusColor = (st) => {
                      if (st === 'In Progress') return 'bg-[#FFF3EC] text-[#F36B21] border-[#FCE2D3]';
                      if (st === 'In Review') return 'bg-amber-50 text-amber-700 border-amber-200';
                      if (st === 'Planning') return 'bg-slate-50 text-slate-700 border-slate-200';
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    };

                    return (
                      <div
                        key={p.id}
                        className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(243,107,33,0.1)] transition-all relative"
                      >
                        {/* Left: Thumbnail & Project Info */}
                        <div className="flex items-start sm:items-center gap-4 flex-1">
                          <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-[#EAE2DC] bg-[#FFF3EC]">
                            <img
                              src={p.thumbnail}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                                {p.title}
                              </h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(
                                  p.status
                                )}`}
                              >
                                • {p.status}
                              </span>
                            </div>

                            <p className="text-xs text-[#777777] line-clamp-1 max-w-md">
                              {p.description}
                            </p>

                            <div className="flex items-center gap-3 pt-1 text-[11px] text-[#888888]">
                              <span className="font-semibold text-[#171717]">{p.budget}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#F36B21]" />
                                {p.deadline || 'Dec 15, 2026'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Team Avatars, Progress Bar */}
                        <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#F3ECE7]">
                          <div className="flex items-center -space-x-2">
                            {p.team.map((m, idx) => (
                              <img
                                key={idx}
                                src={m.avatar}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                            ))}
                            {p.teamExtra > 0 && (
                              <span className="w-7 h-7 rounded-full bg-[#FFF3EC] text-[#F36B21] border-2 border-white text-[10px] font-bold flex items-center justify-center">
                                +{p.teamExtra}
                              </span>
                            )}
                          </div>

                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#171717]">
                              <span>{p.progress}%</span>
                              <span className="text-[10px] text-[#888888] font-normal">done</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#FFF3EC] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#F36B21] rounded-full transition-all duration-500"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* VIEW 2: PROPOSALS & PITCHES */}
            {activeSidebarNav === 'proposals' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Candidate Proposals</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Review bids, pitch letters, and technical scope estimates from verified applicants.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-white border border-[#EAE2DC] rounded-xl p-1 text-xs shadow-xs">
                    {['All', 'Accepted', 'In Review', 'Pending', 'Shortlisted'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setProposalFilter(status)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          proposalFilter === status
                            ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                            : 'text-[#777777] hover:text-[#171717]'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {displayedProposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/50 p-6 shadow-xs space-y-4 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={prop.candidate.avatar}
                            alt={prop.candidate.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#FCE2D3]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                                {prop.candidate.name}
                              </h3>
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                ★ {prop.candidate.rating}
                              </span>
                            </div>
                            <p className="text-xs text-[#777777]">{prop.candidate.title}</p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-lg font-extrabold text-[#171717]">{prop.bidAmount}</span>
                          <span className="text-xs text-[#888888] block">{prop.duration}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] space-y-1">
                        <span className="text-[11px] font-bold text-[#F36B21] uppercase tracking-wider block">
                          Project: {prop.projectTitle}
                        </span>
                        <p className="text-xs text-[#555555] leading-relaxed italic">
                          "{prop.pitch}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#F3ECE7]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              prop.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : prop.status === 'In Review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            ● Status: {prop.status}
                          </span>
                          <span className="text-[11px] text-[#888888]">{prop.submittedDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveSidebarNav('messages');
                            }}
                            className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-semibold text-[#171717] hover:text-[#F36B21] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                          {prop.status !== 'Accepted' && (
                            <button
                              onClick={() => handleUpdateProposalStatus(prop.id, 'Accepted')}
                              className="px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                            >
                              Accept Proposal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: LIVE MESSAGING WORKSPACE */}
            {activeSidebarNav === 'messages' && (
              <div className="bg-white rounded-3xl border border-[#EAE2DC] shadow-xs overflow-hidden flex flex-col md:flex-row h-[600px]">
                {/* Threads Left List */}
                <div className="w-full md:w-64 border-r border-[#EAE2DC] flex flex-col bg-[#FFF9F5]/50">
                  <div className="p-4 border-b border-[#EAE2DC]">
                    <h3 className="text-sm font-bold text-[#171717]">Conversations</h3>
                    <p className="text-[11px] text-[#888888]">Active team and candidate threads</p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#F3ECE7]">
                    {messageThreads.map((thread) => {
                      const isSelected = thread.id === activeThreadId;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => setActiveThreadId(thread.id)}
                          className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                            isSelected ? 'bg-white shadow-xs border-l-4 border-l-[#F36B21]' : 'hover:bg-white'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={thread.user.avatar}
                              alt={thread.user.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#EAE2DC]"
                            />
                            {thread.user.online && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute bottom-0 right-0" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#171717] truncate">{thread.user.name}</h4>
                              <span className="text-[10px] text-[#888888]">{thread.time}</span>
                            </div>
                            <p className="text-[11px] text-[#777777] truncate">{thread.lastMessage}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chat Right Pane */}
                <div className="flex-1 flex flex-col justify-between bg-white">
                  {/* Chat Top Header */}
                  <div className="p-4 border-b border-[#EAE2DC] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeThread.user.avatar}
                        alt={activeThread.user.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#EAE2DC]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#171717]">{activeThread.user.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            {activeThread.user.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777777]">Project: {activeThread.project}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#FFF9F5]/30">
                    {activeThread.messages.map((msg) => {
                      const isMe = msg.sender === 'you';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#171717] text-white shadow-xs rounded-br-none'
                                : 'bg-white border border-[#EAE2DC] text-[#171717] shadow-xs rounded-bl-none'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <span
                              className={`text-[9px] block text-right mt-1.5 ${
                                isMe ? 'text-white/60' : 'text-[#888888]'
                              }`}
                            >
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-[#EAE2DC] flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder={`Message ${activeThread.user.name.split(' ')[0]}...`}
                      className="flex-1 px-4 py-2.5 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#171717] focus:outline-none focus:border-[#F36B21]"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white flex items-center justify-center transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 4: FILES & DELIVERABLES */}
            {activeSidebarNav === 'files' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Project Deliverables & Files</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Central repository for design tokens, source code archives, escrow receipts, and benchmark specs.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 shrink-0 transition-transform active:scale-95 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Deliverable</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-[#EAE2DC] shadow-xs overflow-hidden">
                  <div className="divide-y divide-[#F3ECE7]">
                    {filesList.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFF9F5]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#171717]">{file.name}</h4>
                            <div className="flex items-center gap-3 text-[11px] text-[#888888] pt-0.5">
                              <span>{file.project}</span>
                              <span>•</span>
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>Uploaded by {file.uploadedBy} ({file.date})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSimulateDownload(file.name)}
                          className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] hover:text-[#F36B21] bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: TEAM & COLLABORATORS */}
            {activeSidebarNav === 'team' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Squad Members & Team</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Manage project assignments, member access levels, and billing authorizations.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 shrink-0 transition-transform active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Contributor</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamList.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/50 p-5 shadow-xs flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#FCE2D3]"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-[#171717]">{member.name}</h4>
                          <p className="text-xs text-[#777777]">{member.role}</p>
                          <span className="text-[10px] text-[#F36B21] font-semibold block mt-0.5">
                            {member.project}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-xs font-extrabold text-[#171717]">{member.hourly}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] border border-[#FCE2D3] block font-semibold">
                          {member.permission}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 6: ESCROW & PAYMENTS */}
            {activeSidebarNav === 'payments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Escrow & Payments</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Milestone fund guarantees, released disbursements, and official transaction receipts.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white border border-[#EAE2DC] rounded-xl p-1 text-xs shadow-xs">
                    {['All', 'Released', 'In Escrow', 'Pending Approval'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setPaymentFilter(st)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          paymentFilter === st
                            ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                            : 'text-[#777777] hover:text-[#171717]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Balances Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Escrow Holding</span>
                    <div className="text-2xl font-extrabold text-[#171717]">$24,500.00</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">● 100% Guaranteed</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Released to Date</span>
                    <div className="text-2xl font-extrabold text-[#171717]">$8,200.00</div>
                    <span className="text-[10px] text-[#777777]">3 Completed Milestones</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Pending Approval</span>
                    <div className="text-2xl font-extrabold text-[#F36B21]">$1,200.00</div>
                    <span className="text-[10px] text-amber-600 font-semibold">1 Awaiting Signoff</span>
                  </div>
                </div>

                {/* Payments Ledger */}
                <div className="bg-white rounded-3xl border border-[#EAE2DC] shadow-xs overflow-hidden">
                  <div className="divide-y divide-[#F3ECE7]">
                    {displayedPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFF9F5]/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#171717]">{pay.milestone}</h4>
                          <div className="flex items-center gap-3 text-[11px] text-[#777777]">
                            <span className="font-semibold text-[#171717]">Recipient: {pay.recipient}</span>
                            <span>•</span>
                            <span>{pay.project}</span>
                            <span>•</span>
                            <span>{pay.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <span className="text-base font-extrabold text-[#171717]">{pay.amount}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full block font-semibold border ${
                                pay.status === 'Released'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : pay.status === 'In Escrow'
                                  ? 'bg-[#FFF3EC] text-[#F36B21] border-[#FCE2D3]'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {pay.status}
                            </span>
                          </div>

                          {pay.status === 'In Escrow' || pay.status === 'Pending Approval' ? (
                            <button
                              onClick={() => handleReleaseEscrow(pay.id)}
                              className="px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                            >
                              Release Payout
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSimulateDownload(`Invoice_${pay.id}.pdf`)}
                              className="px-3.5 py-1.5 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-medium text-[#777777] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 7: WORKSPACE SETTINGS */}
            {activeSidebarNav === 'settings' && (
              <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Workspace Settings</h2>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Configure your organization defaults, automated milestone disbursements, and security controls.
                  </p>
                </div>

                {settingsSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-medium text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Workspace configuration saved successfully.</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Billing & Invoicing Email
                    </label>
                    <input
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                    />
                  </div>

                  <div className="pt-2 space-y-4 border-t border-[#F3ECE7]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#171717]">Automate Milestone Escrow Release</h4>
                        <p className="text-[11px] text-[#777777]">Disburse milestone funds automatically upon review approval.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoEscrowRelease(!autoEscrowRelease)}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          autoEscrowRelease ? 'bg-[#F36B21]' : 'bg-[#EAE2DC]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                            autoEscrowRelease ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#171717]">Two-Factor Escrow Authorization (2FA)</h4>
                        <p className="text-[11px] text-[#777777]">Require biometric or SMS authorization for payouts over $1,000.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          twoFactorAuth ? 'bg-[#F36B21]' : 'bg-[#EAE2DC]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                            twoFactorAuth ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 3. Right Sidebar: Project Overview Donut, Upcoming Deadlines, Boost Banner */}
          <div className="lg:col-span-3 space-y-5">
            {/* Card 1: Project Overview (Donut Chart & Legend) */}
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#F36B21]" />
                <span>Project Overview</span>
              </h3>

              {/* Ring / Donut Chart Visualization */}
              <div className="flex items-center justify-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#FFF3EC"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F36B21"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset="85"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#FBBF24"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset="230"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-extrabold text-[#171717]">{projectList.length}</span>
                    <p className="text-[10px] text-[#777777] font-medium">Projects</p>
                  </div>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-2 pt-2 border-t border-[#F3ECE7] text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F36B21]" />
                    <span className="text-[#777777]">In Progress</span>
                  </div>
                  <span className="font-bold text-[#171717]">
                    {projectList.filter((p) => p.status === 'In Progress').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-[#777777]">In Review</span>
                  </div>
                  <span className="font-bold text-[#171717]">
                    {projectList.filter((p) => p.status === 'In Review').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-[#777777]">Completed</span>
                  </div>
                  <span className="font-bold text-[#171717]">
                    {projectList.filter((p) => p.status === 'Completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Upcoming Deadlines */}
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#F36B21]" />
                <span>Upcoming Deadlines</span>
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F36B21]" />
                    <span className="font-semibold text-[#171717]">SaaS Dashboard</span>
                  </div>
                  <span className="text-[10px] font-medium text-[#777777]">Nov 12, 2026</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-[#171717]">Brand Website</span>
                  </div>
                  <span className="text-[10px] font-medium text-[#777777]">Nov 18, 2026</span>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Workflow Boost */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFF3EC] to-[#FCE2D3] border border-[#FCE2D3] p-5 shadow-xs">
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F36B21]">
                  <Zap className="w-4 h-4" />
                  <span>Boost Your Workflow</span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Use advanced collaboration tools, automated milestone disbursements, and smart contract escrow.
                </p>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-[#F36B21] text-white text-xs font-semibold hover:bg-[#e05e16] transition-colors shadow-xs mt-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          MODAL 1: CREATE NEW PROJECT
      ======================================================== */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Project Setup
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1.5">Create New Project</h3>
                <p className="text-xs text-[#777777]">Initialize milestones, assign scope, and invite contributors.</p>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Next.js SaaS Architecture"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Budget (USD)
                  </label>
                  <input
                    type="text"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="$2,500"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Scope & Deliverables
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe technical requirements, milestone outcomes..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs focus:outline-none focus:border-[#F36B21] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Launch Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: UPLOAD DELIVERABLE FILE
      ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Deliverable Upload
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1.5">Upload Project Asset</h3>
                <p className="text-xs text-[#777777]">Add Figma exports, PR bundles, or signed receipts.</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Nextjs_Sprint_2_Milestone_Signoff.pdf"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Assigned Project
                </label>
                <select
                  value={newFileProject}
                  onChange={(e) => setNewFileProject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                >
                  {projectList.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-[#FCE2D3] rounded-2xl p-6 text-center bg-[#FFF9F5]">
                <UploadCloud className="w-8 h-8 text-[#F36B21] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#171717]">Drag and drop files here</p>
                <p className="text-[10px] text-[#888888] mt-1">Supports PDF, ZIP, FIG, PNG up to 250MB</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span>Upload File</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: INVITE CONTRIBUTOR
      ======================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Squad Invite
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1.5">Invite Team Contributor</h3>
                <p className="text-xs text-[#777777]">Grant workspace access and assign deliverables.</p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Contributor Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. dev@company.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Role Title
                </label>
                <input
                  type="text"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Assign to Project
                </label>
                <select
                  value={inviteProject}
                  onChange={(e) => setInviteProject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                >
                  {projectList.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span>Send Invitation</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
