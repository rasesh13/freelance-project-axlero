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
  Play,
  Pause,
  RotateCcw,
  Printer,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  User,
  Wallet,
} from 'lucide-react';
import {
  PROJECTS,
  PROPOSALS_DATA,
  MESSAGES_THREADS_DATA,
  FILES_DATA,
  TEAM_MEMBERS_DATA,
  PAYMENTS_DATA,
} from '../data/mockData';

const INITIAL_KANBAN_TASKS = [
  {
    id: 'kb-1',
    title: 'Architecture RFC & Token Sync',
    project: 'SaaS Dashboard Development',
    column: 'backlog',
    priority: 'High',
    estimate: '8 hrs',
    assignee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Elena Rostova',
    assigneeRole: 'Lead Architect',
    subtasks: '3/4 done',
  },
  {
    id: 'kb-2',
    title: 'Stripe Escrow Webhook Integration',
    project: 'E-commerce Platform',
    column: 'backlog',
    priority: 'Medium',
    estimate: '12 hrs',
    assignee: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Marcus Vance',
    assigneeRole: 'Backend Engineer',
    subtasks: '1/3 done',
  },
  {
    id: 'kb-3',
    title: 'Core Telemetry & Analytics Charts',
    project: 'SaaS Dashboard Development',
    column: 'progress',
    priority: 'High',
    estimate: '16 hrs',
    assignee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Arjun Mehta',
    assigneeRole: 'Frontend Lead',
    subtasks: '5/6 done',
  },
  {
    id: 'kb-4',
    title: 'PostgreSQL Migration & Indexing',
    project: 'E-commerce Platform',
    column: 'progress',
    priority: 'Medium',
    estimate: '6 hrs',
    assignee: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'David Chen',
    assigneeRole: 'DB Administrator',
    subtasks: '2/2 done',
  },
  {
    id: 'kb-5',
    title: 'Mobile Responsive Audit & Tap Targets',
    project: 'Brand Identity & Web',
    column: 'review',
    priority: 'Urgent',
    estimate: '4 hrs',
    assignee: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Vinita Parmar',
    assigneeRole: 'UX Specialist',
    subtasks: '4/4 ready',
  },
  {
    id: 'kb-6',
    title: 'Design Tokens & UI Component Kit',
    project: 'Brand Identity & Web',
    column: 'done',
    priority: 'High',
    estimate: '14 hrs',
    assignee: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Vinita Parmar',
    assigneeRole: 'UX Specialist',
    subtasks: 'Completed',
  },
  {
    id: 'kb-7',
    title: 'Wireframes & User Flow Signoff',
    project: 'SaaS Dashboard Development',
    column: 'done',
    priority: 'Medium',
    estimate: '10 hrs',
    assignee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    assigneeName: 'Arjun Mehta',
    assigneeRole: 'Frontend Lead',
    subtasks: 'Approved',
  },
];

const FREELANCER_CONTRACTS = [
  {
    id: 'cnt-1',
    title: 'SaaS Dashboard Development',
    client: {
      name: 'Sarah Jenkins',
      company: 'CloudScale AI',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    type: 'Hourly',
    rate: '$45.00/hr',
    weeklyLimit: '40 hrs/wk',
    totalEarned: '$4,850.00',
    escrowLocked: '$3,200.00',
    currentMilestone: 'Phase 2: Core Telemetry & Analytics Charts',
    deadline: 'Nov 12, 2026',
    status: 'In Progress',
    progress: 65,
    milestonesCount: '4 of 6 approved',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cnt-2',
    title: 'PostgreSQL Migration & Index Optimization',
    client: {
      name: 'Marcus Cole',
      company: 'FinTech Labs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    },
    type: 'Fixed Price',
    rate: '$3,200.00',
    totalEarned: '$2,000.00',
    escrowLocked: '$1,200.00',
    currentMilestone: 'Milestone 3: Sharding & Query Optimization',
    deadline: 'Nov 20, 2026',
    status: 'In Progress',
    progress: 70,
    milestonesCount: '2 of 3 approved',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cnt-3',
    title: 'Design Tokens & UI Component Kit',
    client: {
      name: 'Elena Woods',
      company: 'Studio Arc',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
    type: 'Hourly',
    rate: '$50.00/hr',
    totalEarned: '$4,200.00',
    escrowLocked: '$0.00',
    currentMilestone: 'All Deliverables Signed Off',
    deadline: 'Oct 30, 2026',
    status: 'Completed',
    progress: 100,
    milestonesCount: '5 of 5 approved',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80',
  },
];

const FREELANCER_SUBMITTED_PROPOSALS = [
  {
    id: 'my-prop-1',
    projectTitle: 'SaaS Dashboard Development',
    clientName: 'Sarah Jenkins (CloudScale AI)',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    bidAmount: '$45.00/hr',
    duration: '6 Weeks',
    submittedDate: 'Oct 12, 2026',
    status: 'Awarded & Active',
    statusBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    coverLetter: 'Delivering interactive analytics widgets with React 19, Tailwind CSS, and Recharts. All milestone deliverables include comprehensive unit tests and automated escrow verification.',
  },
  {
    id: 'my-prop-2',
    projectTitle: 'Integrate AI Features into Existing Product',
    clientName: 'David Zhang (TechPulse)',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    bidAmount: '$55.00/hr',
    duration: 'Ongoing Sprint',
    submittedDate: 'Nov 01, 2026',
    status: 'Awarded & Active',
    statusBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    coverLetter: 'Extensive background building streaming LLM interfaces, vector similarity search, and model fallback mechanisms with 99.9% uptime SLA.',
  },
  {
    id: 'my-prop-3',
    projectTitle: 'Realtime Collaborative Whiteboard Engine',
    clientName: 'Alex Rivera (CollabStack)',
    clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    bidAmount: '$2,800.00',
    duration: '2 Weeks',
    submittedDate: 'Nov 06, 2026',
    status: 'Interview Requested',
    statusBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    coverLetter: 'Specialized in WebSockets and operational transforms for low-latency multi-user canvas synchronization.',
  },
  {
    id: 'my-prop-4',
    projectTitle: 'FinTech Mobile App UI Architecture',
    clientName: 'Neha Sharma (Neobank Co)',
    clientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    bidAmount: '$1,100.00',
    duration: '10 Days',
    submittedDate: 'Nov 08, 2026',
    status: 'Under Client Review',
    statusBadgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    coverLetter: 'Conducting comprehensive touch target audit, accessibility color contrast compliance, and biometric auth flows.',
  },
];

export default function ProjectsHubPage({
  setCurrentPage,
  initialTab = 'projects',
  userRole = 'client',
  setUserRole,
}) {
  const [activeSidebarNav, setActiveSidebarNav] = useState(() => {
    if (initialTab && initialTab !== 'projects') return initialTab;
    return userRole === 'freelancer' ? 'contracts' : 'projects';
  });

  useEffect(() => {
    if (initialTab && initialTab !== 'projects') {
      setActiveSidebarNav(initialTab);
    } else {
      setActiveSidebarNav(userRole === 'freelancer' ? 'contracts' : 'projects');
    }
  }, [initialTab, userRole]);

  // Freelancer Specific State
  const [contractsFilter, setContractsFilter] = useState('All');
  const [freelancerContracts, setFreelancerContracts] = useState(FREELANCER_CONTRACTS);
  const [myProposalsFilter, setMyProposalsFilter] = useState('All');
  const [myProposalsList, setMyProposalsList] = useState(FREELANCER_SUBMITTED_PROPOSALS);
  const [freelancerBalance, setFreelancerBalance] = useState(4250.00);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('4250.00');
  const [withdrawMethod, setWithdrawMethod] = useState('stripe');

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const triggerToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Projects State
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectList, setProjectList] = useState(PROJECTS);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // New Project 3-Step Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBudget, setNewBudget] = useState('$1,500');
  const [newCategory, setNewCategory] = useState('Web Development');
  const [newDeadline, setNewDeadline] = useState('Dec 20, 2026');
  const [m1Name, setM1Name] = useState('Discovery & Architecture');
  const [m1Pct, setM1Pct] = useState('30');
  const [m2Name, setM2Name] = useState('Core Feature Build');
  const [m2Pct, setM2Pct] = useState('50');
  const [m3Name, setM3Name] = useState('Testing & Deployment');
  const [m3Pct, setM3Pct] = useState('20');

  // Kanban Tasks State
  const [kanbanTasks, setKanbanTasks] = useState(INITIAL_KANBAN_TASKS);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCol, setNewTaskCol] = useState('backlog');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskEstimate, setNewTaskEstimate] = useState('4 hrs');
  const [newTaskProject, setNewTaskProject] = useState('SaaS Dashboard Development');
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanPriorityFilter, setKanbanPriorityFilter] = useState('All');

  // Live Stopwatch Time Tracker State
  const [timerSeconds, setTimerSeconds] = useState(5076); // 01:24:36
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(45);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const moveTask = (taskId, direction) => {
    const cols = ['backlog', 'progress', 'review', 'done'];
    setKanbanTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentIndex = cols.indexOf(t.column);
          const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < cols.length) {
            const nextCol = cols[nextIndex];
            triggerToast('Task Moved', `Moved "${t.title}" to ${nextCol.toUpperCase()}`);
            return { ...t, column: nextCol };
          }
        }
        return t;
      })
    );
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const task = {
        id: `kb-${Date.now()}`,
        title: newTaskTitle.trim(),
        project: newTaskProject,
        column: newTaskCol,
        priority: newTaskPriority,
        estimate: newTaskEstimate,
        assignee: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        assigneeName: 'Arjun Mehta',
        assigneeRole: 'Frontend Lead',
        subtasks: '1/2 ready',
      };
      setKanbanTasks((prev) => [task, ...prev]);
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      triggerToast('Task Created', `Added "${task.title}" to Kanban board`);
    }
  };

  // Official Invoice Modal State
  const [activeInvoicePayment, setActiveInvoicePayment] = useState(null);

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

  const budgetValue = Number(
    String(newBudget).replace(/[$,]/g, '')
  );

  if (!newTitle.trim()) {
    triggerToast('Validation Error', 'Please enter a project title.');
    return;
  }

  if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
    triggerToast('Invalid Budget', 'Please enter a valid project budget.');
    return;
  }

  const createdProj = {
    id: `proj-${Date.now()}`,
    title: newTitle.trim(),
    category: newCategory,
    description: newDesc.trim() || 'Custom freelance project.',
    budget: `$${budgetValue.toLocaleString('en-US')}`,
    budgetType: 'Fixed Price',
    duration: '2 - 3 Weeks',
    skills: ['React', 'Next.js', 'Tailwind'],
    featured: false,
    saved: false,
    applied: false,
    progress: 0,
    status: 'In Progress',
    deadline: newDeadline,
    team: [
      {
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
      }
    ],
    teamExtra: 0,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    type: 'dev',
  };

  setProjectList((prev) => [createdProj, ...prev]);

  setIsNewProjectModalOpen(false);
  setWizardStep(1);
  setNewTitle('');
  setNewDesc('');
  setNewBudget('$1,500');
  setNewCategory('Web Development');

  triggerToast(
    'Project Created Successfully',
    `${createdProj.title} has been added to your dashboard.`
  );
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
                  {userRole === 'client' ? 'Client & Hiring Management Hub' : 'Freelancer Delivery & Earnings Hub'}
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[66px] leading-[1.06] tracking-tight text-[#171717]">
                {userRole === 'client' ? (
                  <>Client Projects <span className="text-[#F36B21] italic font-serif">Hub.</span></>
                ) : (
                  <>Freelancer <span className="text-[#F36B21] italic font-serif">Workspace.</span></>
                )}
              </h1>

              <p className="text-base sm:text-lg text-[#666666] max-w-xl font-normal leading-relaxed">
                {userRole === 'client'
                  ? 'Commission high-impact initiatives, review inbound freelancer proposals, manage active contractors, and release secure milestone escrow.'
                  : 'Track active client contracts, clock in hours with the live milestone stopwatch, deliver sprint milestones, and withdraw instant escrow payouts.'}
              </p>

              {/* Stat Counters Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                {userRole === 'client' ? (
                  <>
                    {/* Client Stat 1 */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#171717]">{projectList.length}</div>
                        <div className="text-xs text-[#777777] font-medium">Total Initiatives</div>
                      </div>
                    </div>

                    {/* Client Stat 2 */}
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

                    {/* Client Stat 3 */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#171717]">{teamList.length}</div>
                        <div className="text-xs text-[#777777] font-medium">Hired Talent</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Freelancer Stat 1 */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#171717]">{freelancerContracts.length}</div>
                        <div className="text-xs text-[#777777] font-medium">Active Contracts</div>
                      </div>
                    </div>

                    {/* Freelancer Stat 2 */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-600">${freelancerBalance.toLocaleString()}</div>
                        <div className="text-xs text-[#777777] font-medium">Available Payout</div>
                      </div>
                    </div>

                    {/* Freelancer Stat 3 */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-[#EAE2DC] shadow-xs hover:border-[#FCE2D3] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#171717]">42.5 hrs</div>
                        <div className="text-xs text-[#777777] font-medium">Logged This Week</div>
                      </div>
                    </div>
                  </>
                )}
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
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">
                      {userRole === 'client' ? '99.4%' : 'Top Rated Plus'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC]" />
                  </div>
                  <span className="text-xs text-[#777777] font-medium">
                    {userRole === 'client' ? 'On-Time Sprint Velocity' : '99% Job Success Score'}
                  </span>
                </div>
              </div>

              {/* Telemetry Card 2 */}
              <div className="absolute top-32 left-0 sm:left-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#171717] tracking-tight">
                    {userRole === 'client' ? '$32,400 USD' : '$8,900 USD'}
                  </div>
                  <span className="text-xs text-[#777777] font-medium">
                    {userRole === 'client' ? 'Escrow Protected Funds' : 'Guaranteed Milestone Escrow'}
                  </span>
                </div>
              </div>

              {/* Telemetry Card 3 */}
              <div className="absolute bottom-4 right-0 sm:right-4 backdrop-blur-xl bg-white/90 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-white/90 flex items-center gap-3.5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(243,107,33,0.14)]">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] flex items-center justify-center text-[#F36B21] border border-[#FCE2D3] shrink-0">
                  {userRole === 'client' ? <Users className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight">
                      {userRole === 'client' ? `${teamList.length} Members` : '$48,720 USD'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {userRole === 'client' ? 'Synchronized' : 'Lifetime Paid'}
                    </span>
                  </div>
                  <span className="text-xs text-[#777777] font-medium">
                    {userRole === 'client' ? 'Active Freelance Squad' : 'Direct Stripe Payouts'}
                  </span>
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
          MAIN WORKSPACE DASHBOARD (EXPANSIVE WORKBENCH)
      ======================================================== */}
      <section className={`mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-300 ${activeSidebarNav === 'kanban' ? 'max-w-[1720px]' : 'max-w-7xl'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. Left Sidebar Navigation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-3 space-y-1 sticky top-28 shadow-xs">
              {(userRole === 'client'
                ? [
                    { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: String(projectList.length) },
                    { id: 'kanban', label: 'Milestones Review', icon: Activity, badge: 'Live' },
                    { id: 'proposals', label: 'Candidate Bids', icon: Send, badge: String(proposals.length) },
                    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '1' },
                    { id: 'files', label: 'Project Files', icon: Folder, badge: String(filesList.length) },
                    { id: 'team', label: 'Hired Team', icon: Users },
                    { id: 'payments', label: 'Escrow & Invoices', icon: CreditCard },
                  ]
                : [
                    { id: 'contracts', label: 'My Contracts', icon: Briefcase, badge: String(freelancerContracts.length) },
                    { id: 'kanban', label: 'Milestones & Timer', icon: Clock, badge: 'Live' },
                    { id: 'my_proposals', label: 'My Submitted Bids', icon: Send, badge: String(myProposalsList.length) },
                    { id: 'earnings', label: 'Earnings & Wallet', icon: Wallet, badge: `$${Math.round(freelancerBalance / 1000)}k` },
                    { id: 'messages', label: 'Client Messages', icon: MessageSquare, badge: '1' },
                    { id: 'files', label: 'Deliverables', icon: Folder, badge: String(filesList.length) },
                    { id: 'profile', label: 'Public Profile', icon: User },
                  ]
              ).map((nav) => {
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
          <div className={`${activeSidebarNav === 'kanban' ? 'lg:col-span-10' : 'lg:col-span-7'} space-y-6 transition-all duration-300`}>
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

            {/* VIEW 1B: FREELANCER ACTIVE CONTRACTS */}
            {activeSidebarNav === 'contracts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">My Active Contracts</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Showing {freelancerContracts.length} awarded contracts with guaranteed escrow backing
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1 bg-white border border-[#EAE2DC] rounded-xl p-1 text-xs shadow-xs">
                      {['All', 'Hourly', 'Fixed Price', 'Completed'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setContractsFilter(f)}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            contractsFilter === f
                              ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                              : 'text-[#777777] hover:text-[#171717]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {/* Find More Work */}
                    <button
                      onClick={() => setCurrentPage('work')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Find More Gigs</span>
                    </button>
                  </div>
                </div>

                {/* Contracts List */}
                <div className="space-y-4">
                  {freelancerContracts
                    .filter((c) => {
                      if (contractsFilter === 'All') return true;
                      if (contractsFilter === 'Hourly') return c.type === 'Hourly';
                      if (contractsFilter === 'Fixed Price') return c.type === 'Fixed Price';
                      if (contractsFilter === 'Completed') return c.status === 'Completed';
                      return true;
                    })
                    .map((contract) => (
                      <div
                        key={contract.id}
                        className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(243,107,33,0.1)] transition-all relative"
                      >
                        {/* Left: Thumbnail & Contract Info */}
                        <div className="flex items-start sm:items-center gap-4 flex-1">
                          <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-[#EAE2DC] bg-[#FFF3EC]">
                            <img
                              src={contract.thumbnail}
                              alt={contract.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                                {contract.title}
                              </h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  contract.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-[#FFF3EC] text-[#F36B21] border-[#FCE2D3]'
                                }`}
                              >
                                ● {contract.status}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {contract.type}
                              </span>
                            </div>

                            {/* Client Attribution */}
                            <div className="flex items-center gap-2 text-xs text-[#777777]">
                              <img
                                src={contract.client.avatar}
                                alt={contract.client.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span>
                                Client: <strong className="text-[#171717]">{contract.client.name}</strong> ({contract.client.company})
                              </span>
                            </div>

                            {/* Current Milestone & Financials */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-[#888888]">
                              <span className="font-semibold text-[#171717]">{contract.rate}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">Earned: {contract.totalEarned}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">Escrow: {contract.escrowLocked}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#F36B21]" />
                                Due {contract.deadline}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Milestone Progress & Tactile Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#F3ECE7]">
                          <div className="w-32 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#171717]">
                              <span>{contract.progress}%</span>
                              <span className="text-[10px] text-[#888888] font-normal">{contract.milestonesCount}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#FFF3EC] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#F36B21] rounded-full transition-all duration-500"
                                style={{ width: `${contract.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveSidebarNav('kanban');
                                triggerToast('Stopwatch Ready', `Opened Milestones board for ${contract.title}`);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Track Hours</span>
                            </button>
                            <button
                              onClick={() => setActiveSidebarNav('messages')}
                              className="p-2 rounded-xl border border-[#EAE2DC] hover:border-[#F36B21] hover:bg-[#FFF3EC] text-[#777777] hover:text-[#171717] transition-colors cursor-pointer"
                              title="Message Client"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* VIEW 2: MILESTONES KANBAN BOARD & LIVE TIME TRACKER */}
            {activeSidebarNav === 'kanban' && (
              <div className="space-y-6">
                {/* 1. Executive Stopwatch & Time Tracking Command Center */}
                <div className="bg-[#141414] border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  {/* Ambient Radial Glows */}
                  <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#F36B21]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute left-1/3 -bottom-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-6">
                    {/* Top Badges & Project Context Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FCE2D3]">
                          <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20' : 'bg-amber-400'}`} />
                          <span>{isTimerRunning ? 'Stopwatch Active' : 'Session Ready'}</span>
                        </div>
                        <span className="text-white/40">•</span>
                        <div className="flex items-center gap-2 text-xs text-white/80">
                          <span className="text-[#888888]">Active Milestone:</span>
                          <span className="font-semibold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">Phase 2: Core Components & Escrow Hook</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Escrow Funded: $4,850.00</span>
                        </span>
                      </div>
                    </div>

                    {/* Main Controls & Live Clock Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Active Contractor & Project Details */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                            alt="Contractor"
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#F36B21] shadow-md"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#141414]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white tracking-tight">SaaS Dashboard Development</h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#F36B21]/20 text-[#F36B21] border border-[#F36B21]/30">Active Sprint</span>
                          </div>
                          <p className="text-xs text-white/70 mt-1 flex flex-wrap items-center gap-2">
                            <span>Contractor: <strong className="text-white">Arjun Mehta</strong></span>
                            <span className="text-white/30">•</span>
                            <span>Rate: <strong className="text-[#F36B21] font-bold">${hourlyRate}.00/hr</strong></span>
                            <span className="text-white/30">•</span>
                            <span>Auto-disbursement: <strong className="text-emerald-400">Enabled</strong></span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Digital LED Display & Tactile Controls */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-start lg:self-auto">
                        {/* LED Display Box */}
                        <div className="px-6 py-3.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl shadow-inner flex flex-col items-center justify-center min-w-[190px]">
                          <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                            {formatTimer(timerSeconds)}
                          </span>
                          <div className="flex items-center justify-between w-full mt-1 px-1 text-[10px] text-white/60">
                            <span className="uppercase tracking-widest font-mono">Session Timer</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              +${((timerSeconds / 3600) * hourlyRate).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Play/Pause & Reset Controls */}
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`h-12 px-5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg ${
                              isTimerRunning
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/50'
                                : 'bg-[#F36B21] hover:bg-[#e05e16] text-white shadow-orange-500/30'
                            }`}
                            title={isTimerRunning ? 'Pause Session' : 'Start Session'}
                          >
                            {isTimerRunning ? (
                              <>
                                <Pause className="w-5 h-5 fill-current" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                                <span>Start Session</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerSeconds(0);
                              triggerToast('Timer Reset', 'Stopwatch reset to 00:00:00');
                            }}
                            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Reset Stopwatch"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Log Hours to Milestone CTA */}
                        <button
                          onClick={() => {
                            const hrs = (timerSeconds / 3600).toFixed(2);
                            const earned = ((timerSeconds / 3600) * hourlyRate).toFixed(2);
                            triggerToast('Session Logged to Milestone', `Logged ${hrs} hrs ($${earned}) with verified escrow audit!`);
                          }}
                          className="h-12 px-6 rounded-2xl bg-white hover:bg-[#FFF3EC] text-[#171717] font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <DollarSign className="w-4 h-4 text-[#F36B21]" />
                          <span>Log ${((timerSeconds / 3600) * hourlyRate).toFixed(2)} to Milestone</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Live Sprint Status & Quick Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Sprint Deliverables</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block">{kanbanTasks.length} Tasks</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] text-[#F36B21] flex items-center justify-center font-bold">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Estimated Scope</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block">70 Hours</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Milestone Escrow</span>
                      <span className="text-xl font-bold text-emerald-600 mt-0.5 block">$12,450.00</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Sprint Deadline</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block">Nov 18, 2026</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 3. Milestones Board Header, Search & Filter Controls */}
                <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Milestones Delivery Board</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-bold border border-[#FCE2D3]">
                        Sprint 04 Live
                      </span>
                    </div>
                    <p className="text-xs text-[#777777] mt-1">
                      Move scoped deliverables across sprint stages with real-time status transitions and escrow sync.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={kanbanSearch}
                        onChange={(e) => setKanbanSearch(e.target.value)}
                        placeholder="Search deliverables..."
                        className="pl-9 pr-3.5 py-2 rounded-xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-medium focus:outline-none focus:border-[#F36B21] w-44 sm:w-56"
                      />
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-1 bg-[#FFF9F5] border border-[#EAE2DC] rounded-xl p-1 text-xs">
                      {['All', 'Urgent', 'High', 'Medium'].map((pri) => (
                        <button
                          key={pri}
                          onClick={() => setKanbanPriorityFilter(pri)}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            kanbanPriorityFilter === pri
                              ? 'bg-[#171717] text-white font-semibold shadow-xs'
                              : 'text-[#777777] hover:text-[#171717]'
                          }`}
                        >
                          {pri}
                        </button>
                      ))}
                    </div>

                    {/* Add Task CTA */}
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task Card</span>
                    </button>
                  </div>
                </div>

                {/* 4. Full-Width 4-Column Responsive Kanban Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 items-start">
                  {[
                    { id: 'backlog', title: 'Backlog / Specs', accentColor: 'bg-slate-400', badgeBg: 'bg-slate-100 text-slate-700' },
                    { id: 'progress', title: 'In Development', accentColor: 'bg-[#F36B21]', badgeBg: 'bg-amber-100 text-amber-800' },
                    { id: 'review', title: 'Milestone Review', accentColor: 'bg-purple-500', badgeBg: 'bg-purple-100 text-purple-800' },
                    { id: 'done', title: 'Approved & Released', accentColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
                  ].map((col) => {
                    const colTasks = kanbanTasks.filter((t) => {
                      const matchesCol = t.column === col.id;
                      const matchesSearch = !kanbanSearch || t.title.toLowerCase().includes(kanbanSearch.toLowerCase()) || t.project.toLowerCase().includes(kanbanSearch.toLowerCase());
                      const matchesPriority = kanbanPriorityFilter === 'All' || t.priority === kanbanPriorityFilter;
                      return matchesCol && matchesSearch && matchesPriority;
                    });

                    return (
                      <div
                        key={col.id}
                        className="bg-[#FFF9F5] border border-[#EAE2DC] rounded-3xl p-5 space-y-4 min-h-[520px] flex flex-col justify-between shadow-xs transition-all"
                      >
                        <div className="space-y-4">
                          {/* Column Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-[#EAE2DC]">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-3 h-3 rounded-full ${col.accentColor}`} />
                              <span className="text-sm font-bold text-[#171717]">{col.title}</span>
                            </div>
                            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-black/5 ${col.badgeBg}`}>
                              {colTasks.length}
                            </span>
                          </div>

                          {/* Task Cards Container */}
                          <div className="space-y-3.5">
                            {colTasks.map((t) => (
                              <div
                                key={t.id}
                                className="bg-white rounded-2xl border border-[#EAE2DC] p-4.5 space-y-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#F36B21]/60 hover:shadow-[0_12px_28px_rgba(243,107,33,0.08)] transition-all group relative"
                              >
                                {/* Top Row: Priority Pill & Estimate */}
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                      t.priority === 'Urgent'
                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                        : t.priority === 'High'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {t.priority}
                                  </span>
                                  <span className="text-[11px] text-[#666666] font-semibold flex items-center gap-1 bg-[#FFF9F5] px-2.5 py-0.5 rounded-full border border-[#EAE2DC]">
                                    <Clock className="w-3 h-3 text-[#F36B21]" />
                                    {t.estimate}
                                  </span>
                                </div>

                                {/* Task Title */}
                                <h4 className="text-sm font-bold text-[#171717] leading-snug group-hover:text-[#F36B21] transition-colors">
                                  {t.title}
                                </h4>

                                {/* Project Name & Subtasks / Progress Indicator */}
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-xs text-[#777777] font-medium flex items-center gap-1.5">
                                    <FolderKanban className="w-3.5 h-3.5 text-[#888888]" />
                                    <span className="truncate">{t.project}</span>
                                  </p>
                                  {t.subtasks && (
                                    <div className="flex items-center justify-between text-[10px] text-[#888888] font-medium pt-1 border-t border-[#F7F2EE]">
                                      <span>Checklist: {t.subtasks}</span>
                                      <span className="text-emerald-600 font-semibold">Ready</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer: Contractor Profile & Move Action Controls */}
                                <div className="flex items-center justify-between pt-3 border-t border-[#F3ECE7]">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={t.assignee}
                                      alt="Assignee"
                                      className="w-6 h-6 rounded-full object-cover border border-[#EAE2DC] shadow-xs"
                                    />
                                    <span className="text-[11px] font-semibold text-[#171717] truncate max-w-[110px]">
                                      {t.assigneeName || 'Assigned'}
                                    </span>
                                  </div>

                                  {/* Direction Shift Controls */}
                                  <div className="flex items-center gap-1.5">
                                    {col.id !== 'backlog' && (
                                      <button
                                        onClick={() => moveTask(t.id, 'prev')}
                                        className="px-2 py-1 rounded-lg bg-[#FFF9F5] hover:bg-[#FFF3EC] border border-[#EAE2DC] text-[#777777] hover:text-[#171717] text-[11px] font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                                        title="Move to previous stage"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Prev</span>
                                      </button>
                                    )}
                                    {col.id !== 'done' && (
                                      <button
                                        onClick={() => moveTask(t.id, 'next')}
                                        className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] hover:bg-[#F36B21] text-[#F36B21] hover:text-white text-[11px] font-semibold flex items-center gap-0.5 transition-all shadow-xs cursor-pointer"
                                        title="Move to next stage"
                                      >
                                        <span>Next</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {col.id === 'done' && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Done</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {colTasks.length === 0 && (
                              <div className="text-center py-12 px-4 border-2 border-dashed border-[#EAE2DC] rounded-2xl bg-white/50 space-y-2">
                                <span className="text-xs font-semibold text-[#888888] block">No deliverables in this stage</span>
                                <p className="text-[11px] text-[#AAAAAA]">
                                  {kanbanSearch || kanbanPriorityFilter !== 'All' ? 'Try adjusting your filters' : 'Add a task card to get started'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column Quick Add Task Footer */}
                        <button
                          onClick={() => {
                            setNewTaskCol(col.id);
                            setIsNewTaskModalOpen(true);
                          }}
                          className="w-full py-2.5 mt-4 rounded-xl border border-dashed border-[#EAE2DC] hover:border-[#F36B21] hover:bg-white text-xs font-semibold text-[#777777] hover:text-[#F36B21] flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-white/60 shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Deliverable</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: PROPOSALS & PITCHES */}
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

            {/* VIEW 3B: FREELANCER SUBMITTED PROPOSALS */}
            {activeSidebarNav === 'my_proposals' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">My Submitted Bids & Proposals</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Track your pitches, client interview requests, and awarded contracts
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage('work')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Submit New Proposal</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {myProposalsList.map((myProp) => (
                    <div
                      key={myProp.id}
                      className="bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/50 p-5 sm:p-6 space-y-4 shadow-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#F3ECE7]">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={myProp.clientAvatar}
                            alt={myProp.clientName}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#EAE2DC]"
                          />
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#171717]">{myProp.projectTitle}</h3>
                            <p className="text-xs text-[#777777]">Client: {myProp.clientName}</p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-extrabold text-[#171717]">{myProp.bidAmount}</span>
                          <span className="block text-[10px] text-[#888888]">Proposed Duration: {myProp.duration}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#777777] uppercase tracking-wider block">
                          Submitted Pitch:
                        </span>
                        <p className="text-xs text-[#555555] leading-relaxed italic bg-[#FFF9F5] p-3 rounded-2xl border border-[#F3ECE7]">
                          "{myProp.coverLetter}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${myProp.statusBadgeColor}`}>
                            ● {myProp.status}
                          </span>
                          <span className="text-[11px] text-[#888888]">Submitted: {myProp.submittedDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveSidebarNav('messages')}
                            className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-semibold text-[#171717] hover:text-[#F36B21] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Client</span>
                          </button>
                          {myProp.status.includes('Active') && (
                            <button
                              onClick={() => setActiveSidebarNav('contracts')}
                              className="px-4 py-2 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                            >
                              View Contract
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4B: FREELANCER EARNINGS & WALLET */}
            {activeSidebarNav === 'earnings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">Earnings & Escrow Wallet</h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Protected milestone disbursements, withdrawable funds, and tax invoice history
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Withdraw Funds</span>
                    </button>
                  </div>
                </div>

                {/* 4 Financial Highlight Pods */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl border border-emerald-200 p-5 space-y-1 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Available for Payout</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">${freelancerBalance.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-700 font-medium">Ready for instant transfer</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-amber-200 p-5 space-y-1 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">In Milestone Escrow</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 block">$8,900.00</span>
                    <span className="text-[10px] text-amber-700 font-medium">Locked in smart contract</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-1 shadow-xs">
                    <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">2026 Total Earnings</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#171717] block">$48,720.00</span>
                    <span className="text-[10px] text-emerald-600 font-medium">▲ +24% vs last year</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-1 shadow-xs">
                    <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Pending Clearance</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-700 block">$1,450.00</span>
                    <span className="text-[10px] text-[#777777] font-medium">Clearing in 24 hours</span>
                  </div>
                </div>

                {/* Payout History Ledger */}
                <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F3ECE7]">
                    <div>
                      <h3 className="text-sm font-bold text-[#171717]">Recent Payout Transactions</h3>
                      <p className="text-xs text-[#888888]">Official escrow disbursements to your verified Stripe account</p>
                    </div>

                    <button
                      onClick={() => {
                        if (paymentsList && paymentsList.length > 0) {
                          setActiveInvoicePayment(paymentsList[0]);
                        }
                      }}
                      className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-semibold text-[#171717] hover:text-[#F36B21] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generate Tax Statement</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[#F3ECE7] text-xs">
                    {[
                      { id: 'PAY-881', client: 'CloudScale AI', milestone: 'Sprint 03: Telemetry Engine', amount: '$1,650.00', date: 'Nov 05, 2026', method: 'Stripe Instant (•••• 4921)' },
                      { id: 'PAY-842', client: 'Studio Arc', milestone: 'Final Milestone: Token Signoff', amount: '$2,800.00', date: 'Oct 28, 2026', method: 'Stripe Instant (•••• 4921)' },
                      { id: 'PAY-799', client: 'FinTech Labs', milestone: 'Milestone 2: Postgres Schema', amount: '$1,200.00', date: 'Oct 15, 2026', method: 'Stripe Instant (•••• 4921)' },
                    ].map((tx) => (
                      <div key={tx.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFF9F5] px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[#171717] block">{tx.milestone}</span>
                            <span className="text-[#777777] text-[11px]">Client: {tx.client} • Ref: {tx.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          <div className="text-left sm:text-right">
                            <span className="font-bold text-emerald-600 block">{tx.amount}</span>
                            <span className="text-[10px] text-[#888888]">{tx.date}</span>
                          </div>

                          <button
                            onClick={() => {
                              setActiveInvoicePayment({
                                id: tx.id,
                                projectTitle: tx.milestone,
                                contractor: { name: 'Arjun Mehta', title: 'Fullstack Lead' },
                                milestone: tx.milestone,
                                amount: tx.amount,
                                status: 'Paid',
                                date: tx.date,
                                invoiceNumber: `INV-${tx.id}`,
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE2DC] hover:border-[#F36B21] text-[11px] font-semibold text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-[#F36B21]" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5B: FREELANCER PUBLIC PROFILE SHORTCUT */}
            {activeSidebarNav === 'profile' && (
              <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">My Public Profile & Reputation</h2>
                  <p className="text-xs text-[#888888] mt-0.5">
                    This is how top clients and hiring managers discover you on Workverse
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#FFF9F5] border border-[#EAE2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      alt="Arjun Mehta"
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-[#F36B21] shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#171717]">Arjun Mehta</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-bold border border-[#FCE2D3]">
                          Top Rated Plus
                        </span>
                      </div>
                      <p className="text-xs text-[#777777] mt-0.5">Lead Fullstack Architect & Cloud Specialist</p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-[#888888]">
                        <span className="text-amber-500 font-bold">★ 4.9 (128 reviews)</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">99% Job Success</span>
                        <span>•</span>
                        <span className="font-bold text-[#171717]">$45.00/hr</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage('profile')}
                    className="px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer self-start sm:self-auto"
                  >
                    View & Edit Full Profile →
                  </button>
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
                              onClick={() => {
                                handleReleaseEscrow(pay.id);
                                triggerToast('Escrow Released', `Disbursed ${pay.amount} to ${pay.recipient}!`);
                              }}
                              className="px-4 py-2 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                            >
                              Release Payout
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveInvoicePayment(pay)}
                              className="px-3.5 py-1.5 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-semibold text-[#777777] hover:text-[#171717] flex items-center gap-1.5 cursor-pointer hover:bg-[#FFF3EC] transition-all"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#F36B21]" />
                              <span>View Invoice</span>
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

          {/* 3. Right Sidebar: Role-Specific Telemetry (Client vs Freelancer) */}
          {activeSidebarNav !== 'kanban' && (
            <div className="lg:col-span-3 space-y-5 animate-in fade-in duration-200">
              {userRole === 'client' ? (
                <>
                  {/* Client Card 1: Project Overview (Donut Chart & Legend) */}
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

                  {/* Client Card 2: Upcoming Deadlines */}
                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F36B21]" />
                      <span>Upcoming Deadlines</span>
                    </h3>

                    <div className="space-y-2.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F36B21]" />
                          <span className="font-semibold text-[#171717]">SaaS Dashboard</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#777777]">Nov 12, 2026</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="font-semibold text-[#171717]">Brand Website</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#777777]">Nov 18, 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Card 3: Quick Workflow Boost */}
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
                </>
              ) : (
                <>
                  {/* Freelancer Card 1: Escrow & Available Funds Widget */}
                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-4 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Wallet & Escrow Balance</span>
                    </h3>

                    {/* Ring Visualization */}
                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#FFF3EC" strokeWidth="10" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#10B981" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="90" strokeLinecap="round" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#F59E0B" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="180" strokeLinecap="round" fill="none" />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-lg font-black text-emerald-600">${freelancerBalance.toFixed(0)}</span>
                          <p className="text-[9px] text-[#777777] font-semibold uppercase">Available</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#F3ECE7] text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[#777777]">Ready for Payout</span>
                        </div>
                        <span className="font-bold text-emerald-600">${freelancerBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-[#777777]">Locked in Escrow</span>
                        </div>
                        <span className="font-bold text-amber-600">$8,900.00</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Instant Withdrawal</span>
                    </button>
                  </div>

                  {/* Freelancer Card 2: Upcoming Contract Deadlines */}
                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F36B21]" />
                      <span>Contract Milestones Due</span>
                    </h3>

                    <div className="space-y-2.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F36B21]" />
                          <span className="font-semibold text-[#171717]">SaaS Dashboard (P2)</span>
                        </div>
                        <span className="text-[10px] font-medium text-amber-600 font-bold">Nov 12</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span className="font-semibold text-[#171717]">PostgreSQL Indexing</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#777777]">Nov 20</span>
                      </div>
                    </div>
                  </div>

                  {/* Freelancer Card 3: Reputation & Badges */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#171717] to-[#262626] text-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#FCE2D3] text-[10px] font-bold border border-white/15">
                        Verified Talent
                      </span>
                      <span className="text-amber-400 font-bold text-xs">★ 4.9</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">Top Rated Plus</h4>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        Top 3% of architects on Workverse with 99% client satisfaction.
                      </p>
                    </div>

                    <button
                      onClick={() => setCurrentPage('profile')}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Public Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          MODAL 1: CREATE NEW PROJECT (3-STEP WIZARD)
      ======================================================== */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Step Tracker */}
            <div className="flex items-start justify-between border-b border-[#F3ECE7] pb-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Project Setup Wizard
                </span>
                <h3 className="text-xl font-bold text-[#171717]">
                  {wizardStep === 1 && 'Step 1: Scope & Role Identity'}
                  {wizardStep === 2 && 'Step 2: Milestone Escrow Schedule'}
                  {wizardStep === 3 && 'Step 3: Budget & Escrow Guarantee'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewProjectModalOpen(false);
                  setWizardStep(1);
                }}
                className="p-1.5 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between gap-2 px-1">
              {[
                { s: 1, label: 'Scope' },
                { s: 2, label: 'Milestones' },
                { s: 3, label: 'Budget & Escrow' },
              ].map((st) => (
                <div key={st.s} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      wizardStep === st.s
                        ? 'bg-[#F36B21] text-white shadow-xs'
                        : wizardStep > st.s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#FFF3EC] text-[#888888]'
                    }`}
                  >
                    {wizardStep > st.s ? '✓' : st.s}
                  </div>
                  <span className="text-xs font-semibold text-[#171717] hidden sm:inline">{st.label}</span>
                  {st.s < 3 && <div className="flex-1 h-0.5 bg-[#EAE2DC] mx-1" />}
                </div>
              ))}
            </div>

            {/* STEP 1: Basic Scope */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Project Initiative Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Next.js SaaS Analytics Platform"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm font-semibold focus:outline-none focus:border-[#F36B21]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                      Domain Category
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
                      Target Completion Date
                    </label>
                    <input
                      type="text"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Technical Scope & Deliverables
                  </label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide overview, tech stack requirements, and key architectural criteria..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs focus:outline-none focus:border-[#F36B21] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newTitle.trim()}
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#171717] hover:bg-[#F36B21] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Next: Milestones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Milestones Breakdown */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <p className="text-xs text-[#777777]">
                  Define milestone phases to protect both your deliverables and developer payments via automated escrow.
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                      <span>Milestone 1</span>
                      <span className="text-[#F36B21]">{m1Pct}% Allocation</span>
                    </div>
                    <input
                      type="text"
                      value={m1Name}
                      onChange={(e) => setM1Name(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#EAE2DC] text-xs font-semibold"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                      <span>Milestone 2</span>
                      <span className="text-[#F36B21]">{m2Pct}% Allocation</span>
                    </div>
                    <input
                      type="text"
                      value={m2Name}
                      onChange={(e) => setM2Name(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#EAE2DC] text-xs font-semibold"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                      <span>Milestone 3</span>
                      <span className="text-[#F36B21]">{m3Pct}% Allocation</span>
                    </div>
                    <input
                      type="text"
                      value={m3Name}
                      onChange={(e) => setM3Name(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#EAE2DC] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold">
                  ✓ 100% Milestone Schedule Balanced (30% + 50% + 20%)
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Next: Escrow Deposit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Budget & Escrow Confirmation */}
            {wizardStep === 3 && (
              <form onSubmit={handleCreateProject} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Total Contract Budget (USD)
                  </label>
                  <input
                    type="text"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="$2,500"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-base font-extrabold text-[#171717] focus:outline-none focus:border-[#F36B21]"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Workverse 100% Escrow Protection</span>
                  </div>
                  <p className="text-[11px] text-[#777777] leading-relaxed">
                    Funds will be safeguarded in smart escrow. Payouts are only disbursed when you inspect and approve each milestone deliverable.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Launch & Fund Escrow</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
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

      {/* ========================================================
          MODAL 4: OFFICIAL TAX INVOICE & ESCROW RECEIPT
      ======================================================== */}
      {activeInvoicePayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveInvoicePayment(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invoice Top Strip */}
            <div className="flex items-start justify-between border-b border-[#F3ECE7] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F36B21] to-[#E0560E] flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#171717]">Workverse Escrow Disbursement</h3>
                  <p className="text-xs text-[#777777]">Official Tax Invoice & Release Certificate</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#F36B21] block">WV-INV-2026-0892</span>
                <span className="text-[10px] text-[#888888]">Issued: {activeInvoicePayment.date}</span>
              </div>
            </div>

            {/* Client / Contractor Dossier */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#888888]">Billed To (Client)</span>
                <p className="font-bold text-[#171717] mt-0.5">Workverse Ventures LLC</p>
                <p className="text-[#777777]">San Francisco, CA • VAT: US-9281928</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#888888]">Paid To (Contractor)</span>
                <p className="font-bold text-[#171717] mt-0.5">{activeInvoicePayment.recipient}</p>
                <p className="text-[#777777]">Verified Freelance Specialist</p>
              </div>
            </div>

            {/* Financial Ledger Table */}
            <div className="border border-[#EAE2DC] rounded-2xl overflow-hidden text-xs">
              <div className="bg-[#FFF9F5] px-4 py-2.5 font-bold text-[#171717] grid grid-cols-12 gap-2 border-b border-[#EAE2DC]">
                <span className="col-span-6">Milestone Deliverable</span>
                <span className="col-span-3 text-center">Status</span>
                <span className="col-span-3 text-right">Net Amount</span>
              </div>
              <div className="p-4 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 space-y-0.5">
                  <span className="font-bold text-[#171717]">{activeInvoicePayment.milestone}</span>
                  <p className="text-[10px] text-[#777777]">{activeInvoicePayment.project}</p>
                </div>
                <div className="col-span-3 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Disbursed ✓
                  </span>
                </div>
                <div className="col-span-3 text-right font-extrabold text-[#171717] text-sm">
                  {activeInvoicePayment.amount}
                </div>
              </div>
            </div>

            {/* Cryptographic Escrow Seal */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#666666] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tx Hash: 0x8a92...f71c4d</span>
              </span>
              <span className="text-emerald-700 font-semibold">100% Escrow Cleared</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveInvoicePayment(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#EAE2DC] hover:bg-[#FFF3EC] text-xs font-semibold text-[#171717] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => {
                    handleSimulateDownload(`Invoice_${activeInvoicePayment.id}.pdf`);
                    setActiveInvoicePayment(null);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: ADD TASK TO KANBAN BOARD
      ======================================================== */}
      {isNewTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsNewTaskModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                  Sprint Task
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1.5">Add Task to Board</h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Optimize Lighthouse score to 95+"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Target Column
                  </label>
                  <select
                    value={newTaskCol}
                    onChange={(e) => setNewTaskCol(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="progress">In Development</option>
                    <option value="review">Milestone Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Priority Tier
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Estimated Effort (Hours)
                </label>
                <input
                  type="text"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                  placeholder="e.g. 6 hrs"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WITHDRAW FREELANCER FUNDS */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#F3ECE7] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Escrow Wallet Payout
                </span>
                <h3 className="text-xl font-bold text-[#171717] mt-1.5">Withdraw Earnings</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF9F5] rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#777777] font-medium block">Available Balance</span>
                <span className="text-2xl font-black text-emerald-600">${freelancerBalance.toFixed(2)}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                Zero Fee Transfer
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                Select Payout Destination
              </label>
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${withdrawMethod === 'stripe' ? 'border-[#F36B21] bg-[#FFF3EC] shadow-xs' : 'border-[#EAE2DC] hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="withdrawMethod"
                      value="stripe"
                      checked={withdrawMethod === 'stripe'}
                      onChange={() => setWithdrawMethod('stripe')}
                      className="accent-[#F36B21]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#171717] block">Stripe Instant Payout (Bank Account)</span>
                      <span className="text-[11px] text-[#777777]">Checking account ending in •••• 4921</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#F36B21] bg-white px-2 py-0.5 rounded-md border border-[#FCE2D3]">Instant</span>
                </label>

                <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${withdrawMethod === 'wire' ? 'border-[#F36B21] bg-[#FFF3EC] shadow-xs' : 'border-[#EAE2DC] hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="withdrawMethod"
                      value="wire"
                      checked={withdrawMethod === 'wire'}
                      onChange={() => setWithdrawMethod('wire')}
                      className="accent-[#F36B21]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#171717] block">International Wire Transfer (SWIFT)</span>
                      <span className="text-[11px] text-[#777777]">1-2 business days</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#F3ECE7]">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {const amount = Number(withdrawAmountInput);
                if (!amount || amount <= 0) {triggerToast('Invalid Amount', 'Please enter a valid withdrawal amount.');
                 return;}
                if (amount > freelancerBalance) {triggerToast('Insufficient Balance', 'You do not have enough available balance.');
                 return;}

                setFreelancerBalance((prev) => prev - amount);
                setIsWithdrawModalOpen(false);
                triggerToast('Withdrawal Initiated', `$${amount.toFixed(2)} withdrawal request submitted successfully!`);
                }}
                className="px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Withdrawal of ${withdrawAmountInput}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#171717] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-[#F36B21] flex items-center justify-center text-white shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">{toast.title}</h5>
            <p className="text-[11px] text-white/80">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
