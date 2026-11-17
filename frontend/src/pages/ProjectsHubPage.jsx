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
  ArrowUpRight,
  GripVertical,
} from 'lucide-react';
import {
  fetchProjects,
  createProject,
  fetchKanbanTasks,
  createKanbanTask,
  updateKanbanColumn,
  deleteKanbanTask,
  fetchContracts,
  fetchProposals,
  submitProposal,
  updateProposalStatus,
  logTimeSession,
  fetchWalletInfo,
  requestWithdrawal,
  fetchMessages,
  sendMessage,
  fetchFiles,
  uploadFile,
  deleteFile,
  fetchTeam,
  inviteTeamMember,
  fetchPayments,
  releasePaymentEscrow,
  fetchSettings,
  saveSettings,
  getAuthToken,
} from '../api/client';

function formatUsd(val, decimals = 2) {
  const num = Number(val);
  const safe = Number.isFinite(num) ? num : 0;
  return `$${safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function parseUsdAmount(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const parsed = parseFloat(String(val ?? '0').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatLedgerDate(dateStr) {
  if (!dateStr) return 'Today';
  const normalized = dateStr.includes('T')
    ? dateStr
    : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)
      ? `${dateStr.replace(' ', 'T')}Z`
      : dateStr;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatWalletMethodLabel(method) {
  const map = {
    stripe: 'Stripe Instant Transfer',
    wire: 'SWIFT Wire Transfer',
    escrow: 'Escrow Settlement',
    paypal: 'PayPal Instant Payout',
  };
  return map[String(method || '').toLowerCase()] || 'Workverse Wallet';
}

const WORKSPACE_MEMBERS = [
  { name: 'Arjun Mehta', role: 'Frontend Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
  { name: 'Vinita Paramar', role: 'Fullstack Engineer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
  { name: 'Elena Rostova', role: 'UI/UX Designer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' },
  { name: 'Marcus Chen', role: 'Smart Contract Dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
];

const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog / Specs', accentColor: 'bg-slate-400', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'progress', title: 'In Development', accentColor: 'bg-[#F36B21]', badgeBg: 'bg-amber-100 text-amber-800' },
  { id: 'review', title: 'Milestone Review', accentColor: 'bg-purple-500', badgeBg: 'bg-purple-100 text-purple-800' },
  { id: 'done', title: 'Approved & Released', accentColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
];

export default function ProjectsHubPage({
  setCurrentPage,
  initialTab = 'projects',
  initialTabNonce = 0,
  userRole = 'client',
  setUserRole,
  currentUser,
  setCurrentUser,
}) {
  const [activeSidebarNav, setActiveSidebarNav] = useState(() => {
    if (!initialTab || initialTab === 'projects') {
      return userRole === 'freelancer' ? 'contracts' : 'projects';
    }
    const roleTabMap =
      userRole === 'freelancer'
        ? { proposals: 'my_proposals', payments: 'earnings', contracts: 'contracts' }
        : { my_proposals: 'proposals', earnings: 'payments', contracts: 'projects' };
    return roleTabMap[initialTab] || initialTab;
  });

  useEffect(() => {
    if (!initialTab || initialTab === 'projects') {
      setActiveSidebarNav(userRole === 'freelancer' ? 'contracts' : 'projects');
      return;
    }
    const roleTabMap =
      userRole === 'freelancer'
        ? { proposals: 'my_proposals', payments: 'earnings', contracts: 'contracts' }
        : { my_proposals: 'proposals', earnings: 'payments', contracts: 'projects' };
    setActiveSidebarNav(roleTabMap[initialTab] || initialTab);
  }, [initialTab, initialTabNonce, userRole]);

  // Freelancer Specific State
  const [contractsFilter, setContractsFilter] = useState('All');
  const [freelancerContracts, setFreelancerContracts] = useState([]);
  const [myProposalsFilter, setMyProposalsFilter] = useState('All');
  const [myProposalsList, setMyProposalsList] = useState([]);
  const [freelancerBalance, setFreelancerBalance] = useState(currentUser?.wallet_balance ?? 4250.00);
  const [escrowBalance, setEscrowBalance] = useState(currentUser?.escrow_balance ?? 8900.00);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState(
    (currentUser?.wallet_balance ?? 4250.00) > 0
      ? Math.min(250, currentUser?.wallet_balance ?? 4250.00).toFixed(2)
      : '0.00'
  );
  const [withdrawMethod, setWithdrawMethod] = useState('stripe');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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

// Project Overview Statistics
const totalProjects = projectList.length;

const inProgressCount = projectList.filter(
  (p) => p.status === 'In Progress'
).length;

const inReviewCount = projectList.filter(
  (p) => p.status === 'In Review'
).length;

const completedCount = projectList.filter(
  (p) => p.status === 'Completed'
).length;

const circumference = 251.2;

const inProgressLength =
  totalProjects > 0
    ? (inProgressCount / totalProjects) * circumference
    : 0;

const inReviewLength =
  totalProjects > 0
    ? (inReviewCount / totalProjects) * circumference
    : 0;

const completedLength =
  totalProjects > 0
    ? (completedCount / totalProjects) * circumference
    : 0;
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
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCol, setNewTaskCol] = useState('backlog');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskEstimate, setNewTaskEstimate] = useState('4 hrs');
  const [newTaskProject, setNewTaskProject] = useState('SaaS Dashboard Development');
  const [newTaskSubtasksList, setNewTaskSubtasksList] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newTaskAssigneeIndex, setNewTaskAssigneeIndex] = useState(0);
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [kanbanPriorityFilter, setKanbanPriorityFilter] = useState('All');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);

  // Live Stopwatch Time Tracker State
  const [timerSeconds, setTimerSeconds] = useState(5076); // 01:24:36
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(currentUser?.hourly_rate || 45);

  // Official Invoice Modal State
  const [activeInvoicePayment, setActiveInvoicePayment] = useState(null);

  // Proposals State
  const [proposals, setProposals] = useState([]);
  const [proposalFilter, setProposalFilter] = useState('All');
  const [reviewedProposal, setReviewedProposal] = useState(null);

  // Messages State
  const [messageThreads, setMessageThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [chatInputText, setChatInputText] = useState('');

  // Files State
  const [filesList, setFilesList] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileProject, setNewFileProject] = useState('SaaS Dashboard Development');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(null);

  // Team State
  const [teamList, setTeamList] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Senior Full Stack Engineer');
  const [inviteProject, setInviteProject] = useState('SaaS Dashboard Development');

  // Payments State
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Settings State
  const [workspaceName, setWorkspaceName] = useState(currentUser?.workspace_name || 'Workverse Ventures');
  const [billingEmail, setBillingEmail] = useState(currentUser?.billing_email || 'finance@workverse.io');
  const [autoEscrowRelease, setAutoEscrowRelease] = useState(currentUser?.auto_escrow_release ?? true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(currentUser?.two_factor_auth ?? true);
  const [emailDigest, setEmailDigest] = useState(currentUser?.email_digest || 'Daily');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // ========================================================
  // LIVE BACKEND DATA HYDRATION (SQLite + Express API on port 5000)
  // ========================================================
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      if (!getAuthToken()) return;
      try {
        const [
          projRes,
          kanbanRes,
          contractRes,
          propRes,
          msgRes,
          filesRes,
          teamRes,
          paymentsRes,
          walletRes,
          settingsRes,
        ] = await Promise.allSettled([
          fetchProjects(),
          fetchKanbanTasks(),
          fetchContracts(),
          fetchProposals(),
          fetchMessages(),
          fetchFiles(),
          fetchTeam(),
          fetchPayments(),
          fetchWalletInfo(),
          fetchSettings(),
        ]);

        if (!isMounted) return;

        if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
          setProjectList(projRes.value);
        }
        if (kanbanRes.status === 'fulfilled' && Array.isArray(kanbanRes.value)) {
          setKanbanTasks(kanbanRes.value);
        }
        if (contractRes.status === 'fulfilled' && Array.isArray(contractRes.value)) {
          setFreelancerContracts(contractRes.value);
        }
        if (propRes.status === 'fulfilled' && Array.isArray(propRes.value)) {
          setProposals(propRes.value);
          setMyProposalsList(propRes.value);
        }
        if (msgRes.status === 'fulfilled' && Array.isArray(msgRes.value)) {
          setMessageThreads(msgRes.value);
          if (msgRes.value.length > 0 && !msgRes.value.some((t) => t.id === activeThreadId)) {
            setActiveThreadId(msgRes.value[0].id);
          }
        }
        if (filesRes.status === 'fulfilled' && Array.isArray(filesRes.value)) {
          setFilesList(filesRes.value);
        }
        if (teamRes.status === 'fulfilled' && Array.isArray(teamRes.value)) {
          setTeamList(teamRes.value);
        }
        if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value)) {
          setPaymentsList(paymentsRes.value);
        }
        if (walletRes.status === 'fulfilled' && walletRes.value) {
          if (typeof walletRes.value.walletBalance === 'number') {
            setFreelancerBalance(walletRes.value.walletBalance);
            setWithdrawAmountInput(
              walletRes.value.walletBalance > 0
                ? Math.min(250, walletRes.value.walletBalance).toFixed(2)
                : '0.00'
            );
          }
          if (typeof walletRes.value.escrowBalance === 'number') {
            setEscrowBalance(walletRes.value.escrowBalance);
          }
          if (Array.isArray(walletRes.value.transactions)) {
            setWalletTransactions(walletRes.value.transactions);
          }
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          const s = settingsRes.value;
          if (s.workspaceName) setWorkspaceName(s.workspaceName);
          if (s.billingEmail) setBillingEmail(s.billingEmail);
          if (typeof s.autoEscrowRelease === 'boolean') setAutoEscrowRelease(s.autoEscrowRelease);
          if (typeof s.twoFactorAuth === 'boolean') setTwoFactorAuth(s.twoFactorAuth);
          if (s.emailDigest) setEmailDigest(s.emailDigest);
        }
      } catch (err) {
        console.error('Failed to load live backend data:', err);
      }
    }

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [userRole]);

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

  // Move or Reorder Kanban Card across/within columns (Optimistic UI + API Sync)
  const moveTaskToColumn = async (taskId, targetColId, beforeTaskId = null) => {
    const currentTask = kanbanTasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const columnChanged = currentTask.column !== targetColId;

    setKanbanTasks((prev) => {
      const moving = prev.find((t) => t.id === taskId);
      if (!moving) return prev;
      const updated = { ...moving, column: targetColId };
      const remaining = prev.filter((t) => t.id !== taskId);

      if (beforeTaskId && beforeTaskId !== taskId) {
        const insertIdx = remaining.findIndex((t) => t.id === beforeTaskId);
        if (insertIdx !== -1) {
          const nextList = [...remaining];
          nextList.splice(insertIdx, 0, updated);
          return nextList;
        }
      }
      return [...remaining, updated];
    });

    if (!columnChanged) return;

    const targetLabel =
      KANBAN_COLUMNS.find((c) => c.id === targetColId)?.title || targetColId.toUpperCase();
    triggerToast('Deliverable Moved', `Moved "${currentTask.title}" to ${targetLabel}`);

    try {
      await updateKanbanColumn(taskId, targetColId);
    } catch (err) {
      console.error('Failed to persist task column move:', err);
      setKanbanTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, column: currentTask.column } : t))
      );
      triggerToast('Sync Error', 'Could not persist task move. Reverted.', 'error');
    }
  };

  // Button-based Prev / Next fallback
  const moveTask = (taskId, direction) => {
    const cols = KANBAN_COLUMNS.map((c) => c.id);
    const currentTask = kanbanTasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const currentIndex = cols.indexOf(currentTask.column);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= cols.length) return;
    moveTaskToColumn(taskId, cols[nextIndex]);
  };

  // Kanban HTML5 Drag & Drop Handlers
  const handleCardDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
    }
  };

  const handleCardDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
    setDragOverTaskId(null);
  };

  const handleColumnDragOver = (e, colId, targetTaskId = null) => {
    e.preventDefault();
    if (targetTaskId !== null) e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
    if (dragOverTaskId !== targetTaskId) setDragOverTaskId(targetTaskId);
  };

  const handleColumnDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null);
      setDragOverTaskId(null);
    }
  };

  const handleDropTarget = (e, targetColId, beforeTaskId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer?.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverCol(null);
    setDragOverTaskId(null);
    if (taskId) {
      moveTaskToColumn(taskId, targetColId, beforeTaskId);
    }
  };

  // Create Kanban Card (API Sync)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const chosenMember = WORKSPACE_MEMBERS[newTaskAssigneeIndex] || WORKSPACE_MEMBERS[0];
      const subtasksSummary = newTaskSubtasksList.length > 0
        ? `0/${newTaskSubtasksList.length} items`
        : '1/2 ready';

      const taskPayload = {
        title: newTaskTitle.trim(),
        project: newTaskProject || (projectList[0]?.title || 'SaaS Dashboard Development'),
        column: newTaskCol,
        priority: newTaskPriority,
        estimate: newTaskEstimate || '4 hrs',
        subtasks: subtasksSummary,
        assigneeName: chosenMember.name,
        assigneeRole: chosenMember.role,
        assignee: chosenMember.avatar,
      };

      try {
        const res = await createKanbanTask(taskPayload);
        const task = res.task || { id: `kb-${Date.now()}`, ...taskPayload };
        setKanbanTasks((prev) => [task, ...prev]);
        setIsNewTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskSubtasksList([]);
        setSubtaskInput('');
        triggerToast('Task Created', `Added "${task.title}" to Kanban board`);
      } catch (err) {
        console.error('Failed to create task on backend:', err);
        const task = { id: `kb-${Date.now()}`, ...taskPayload };
        setKanbanTasks((prev) => [task, ...prev]);
        setIsNewTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskSubtasksList([]);
        setSubtaskInput('');
        triggerToast('Task Created', `Added "${task.title}" to Kanban board`);
      }
    }
  };

  // Handle Create New Project (API Sync + Validation)
  const handleCreateProject = async (e) => {
    e.preventDefault();

    const budgetValue = Number(String(newBudget).replace(/[$,]/g, ''));
    if (!newTitle.trim()) {
      triggerToast('Validation Error', 'Please enter a project title.');
      return;
    }
    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      triggerToast('Invalid Budget', 'Please enter a valid project budget.');
      return;
    }

    const projPayload = {
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || 'Custom freelance milestone deliverables and engineering.',
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
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        },
      ],
      teamExtra: 0,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      type: 'dev',
    };

    try {
      const res = await createProject(projPayload);
      const createdProj = res.project || { id: `proj-${Date.now()}`, ...projPayload };
      setProjectList((prev) => [createdProj, ...prev]);
      setIsNewProjectModalOpen(false);
      setWizardStep(1);
      setNewTitle('');
      setNewDesc('');
      setNewBudget('$1,500');
      setNewCategory('Web Development');
      triggerToast('Project Created Successfully', `${createdProj.title} has been added to your dashboard.`);
    } catch (err) {
      console.error('Failed to create project on backend:', err);
      const createdProj = { id: `proj-${Date.now()}`, ...projPayload };
      setProjectList((prev) => [createdProj, ...prev]);
      setIsNewProjectModalOpen(false);
      setWizardStep(1);
      setNewTitle('');
      setNewDesc('');
      setNewBudget('$1,500');
      setNewCategory('Web Development');
      triggerToast('Project Created', `Saved "${createdProj.title}" locally.`);
    }
  };

// Handle Log Milestone Time (API Sync)
const handleLogMilestoneTime = async () => {
  const hrs = (timerSeconds / 3600).toFixed(2);
  const earned = ((timerSeconds / 3600) * hourlyRate).toFixed(2);

  try {
    const res = await logTimeSession({
      seconds: timerSeconds,
      project_title: 'SaaS Dashboard Development',
      hourly_rate: hourlyRate,
      formatted_time: formatTimer(timerSeconds),
    });

    if (res && typeof res.newWalletBalance === 'number') {
      setFreelancerBalance(res.newWalletBalance);
      setWithdrawAmountInput(res.newWalletBalance.toFixed(2));
    } else {
      setFreelancerBalance((prev) => prev + parseFloat(earned));
    }

    fetchWalletInfo().then((w) => {
      if (Array.isArray(w?.transactions)) setWalletTransactions(w.transactions);
    }).catch(() => { });

    triggerToast('Session Logged to Milestone', `Logged ${hrs} hrs ($${earned}) to verified wallet!`);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  } catch (err) {
    console.error('Failed to log session:', err);
    triggerToast('Log Error', err.message || 'Could not log time session.', 'error');
  }
};

// Handle Confirm Withdrawal (API Sync)
const handleConfirmWithdrawal = async () => {
  if (isWithdrawing) return;

  const requested = parseFloat(withdrawAmountInput);

  if (isNaN(requested) || requested <= 0) {
    triggerToast('Invalid Amount', 'Enter a positive withdrawal amount.', 'error');
    return;
  }

  if (requested > freelancerBalance) {
    triggerToast('Insufficient Funds', `Maximum available balance is ${formatUsd(freelancerBalance)}.`, 'error');
    return;
  }

  setIsWithdrawing(true);

  try {
    const res = await requestWithdrawal({ amount: requested, method: withdrawMethod });
    setIsWithdrawModalOpen(false);

    if (res && typeof res.remainingBalance === 'number') {
      setFreelancerBalance(res.remainingBalance);
      setWithdrawAmountInput(Math.min(250, res.remainingBalance).toFixed(2));
    }

    fetchWalletInfo().then((w) => {
      if (Array.isArray(w?.transactions)) setWalletTransactions(w.transactions);
    }).catch(() => { });

    triggerToast('Withdrawal Processed', res.message || `${formatUsd(requested)} transferred via ${withdrawMethod.toUpperCase()}!`);
  } catch (err) {
    console.error('Failed withdrawal:', err);
    triggerToast('Withdrawal Failed', err.message || 'Unable to process withdrawal.', 'error');
  } finally {
    setIsWithdrawing(false);
  }
};

// Delete Kanban Task (API Sync)
const handleDeleteTask = async (taskId, title) => {
  setKanbanTasks((prev) => prev.filter((t) => t.id !== taskId));
  triggerToast('Deliverable Removed', `Removed "${title}" from sprint board.`);

  try {
    await deleteKanbanTask(taskId);
  } catch (err) {
    console.error('Failed to delete task:', err);
  }
};

// Handle Proposals Status Action (API Sync)
const handleUpdateProposalStatus = async (id, newStatus) => {
    setProposals((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, status: newStatus } : prop))
    );
    setMyProposalsList((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, status: newStatus } : prop))
    );
    try {
      await updateProposalStatus(id, newStatus);
      if (newStatus === 'Accepted') {
        const updatedContracts = await fetchContracts();
        if (Array.isArray(updatedContracts)) setFreelancerContracts(updatedContracts);
      }
      triggerToast('Proposal Updated', `Proposal marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update proposal status:', err);
    }
  };

  // Handle Send Chat Message (API Sync)
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (chatInputText.trim()) {
      const text = chatInputText.trim();
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'you',
        text,
        time: 'Just now',
      };
      setMessageThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === activeThreadId) {
            return {
              ...thread,
              lastMessage: text,
              time: 'Just now',
              messages: [...thread.messages, newMsg],
            };
          }
          return thread;
        })
      );
      setChatInputText('');

      try {
        await sendMessage({ thread_id: activeThreadId, text, project: activeThread?.project || 'SaaS Dashboard Development' });
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  // Handle Upload File (API Sync)
  const handleUploadFileSubmit = async (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      const name = newFileName.trim();
      try {
        const res = await uploadFile({ name, size: '14.2 MB', project: newFileProject });
        const savedFile = res?.file || {
          id: `f-${Date.now()}`,
          name,
          size: '14.2 MB',
          type: name.endsWith('.pdf') ? 'pdf' : name.endsWith('.fig') ? 'figma' : 'archive',
          uploaded_by: currentUser?.name || 'You',
          date: 'Today',
          project: newFileProject,
        };
        setFilesList((prev) => [savedFile, ...prev]);
        setIsUploadModalOpen(false);
        setNewFileName('');
        triggerToast('File Uploaded', `Uploaded "${name}" to project repository.`);
      } catch (err) {
        console.error('Failed to upload file:', err);
        triggerToast('Upload Error', err.message || 'Could not save file.', 'error');
      }
    }
  };

  // Handle Delete File (API Sync)
  const handleDeleteFile = async (fileId, fileName) => {
    setFilesList((prev) => prev.filter((f) => f.id !== fileId));
    triggerToast('File Deleted', `Removed "${fileName}" from repository.`);
    try {
      await deleteFile(fileId);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  // Real File Download Trigger (generates downloadable receipt/bundle)
  const handleSimulateDownload = (fileName, summaryText) => {
    try {
      const content =
        summaryText ||
        `Workverse Deliverable / Escrow Receipt\nFile: ${fileName}\nExported: ${new Date().toISOString()}\nWorkspace: ${workspaceName}\nStatus: Verified & Archived\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore fallback
    }
    setDownloadSuccessToast(fileName);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  // Handle Invite Contributor (API Sync)
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      const email = inviteEmail.trim();
      try {
        const res = await inviteTeamMember({ email, role: inviteRole, project: inviteProject });
        const newMember = res?.member || {
          id: `tm-${Date.now()}`,
          name: email.split('@')[0],
          role: inviteRole,
          project: inviteProject,
          status: 'Active',
          hourly: '$40/hr',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          permission: 'Editor',
        };
        setTeamList((prev) => [newMember, ...prev]);
        setIsInviteModalOpen(false);
        setInviteEmail('');
        triggerToast('Invitation Sent', `Added ${email} to ${inviteProject}`);
      } catch (err) {
        console.error('Failed to invite member:', err);
        triggerToast('Invite Error', err.message || 'Unable to invite member.', 'error');
      }
    }
  };

  // Handle Release Escrow (API Sync)
  const handleReleaseEscrow = async (paymentId) => {
    try {
      const res = await releasePaymentEscrow(paymentId);
      setPaymentsList((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: 'Released' } : p))
      );
      triggerToast('Escrow Payment Released', res.message || 'Milestone funds credited to contractor balance.');
    } catch (err) {
      console.error('Failed to release escrow:', err);
      triggerToast('Release Notice', err.message || 'Unable to release escrow.', 'error');
    }
  };

  // Handle Save Settings (API Sync)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await saveSettings({
        workspaceName,
        billingEmail,
        autoEscrowRelease,
        twoFactorAuth,
        emailDigest,
      });
      if (res?.settings && setCurrentUser) {
        setCurrentUser(res.settings);
      }
      setSettingsSuccess(true);
      triggerToast('Settings Saved', 'Workspace preferences persisted to database.');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      triggerToast('Save Failed', err.message || 'Unable to save settings.', 'error');
    }
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
    messageThreads.find((t) => t.id === activeThreadId) ||
    messageThreads[0] || {
      id: 'loading',
      user: {
        name: 'Workspace Chat',
        role: '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        online: true,
      },
      project: 'Collaboration',
      messages: [],
    };

  // Live financial & escrow aggregations (never hardcoded)
  const totalWithdrawnAmount = walletTransactions
    .filter((wt) => wt.type === 'withdrawal')
    .reduce((sum, wt) => sum + parseUsdAmount(wt.amount), 0);

  const freelancerTotalEarnings = freelancerBalance + escrowBalance + totalWithdrawnAmount;

  const pendingClearanceTotal = paymentsList
    .filter((p) => p.status === 'Pending Approval')
    .reduce((sum, p) => sum + parseUsdAmount(p.amount), 0);
  const pendingClearanceCount = paymentsList.filter((p) => p.status === 'Pending Approval').length;

  const clientEscrowHolding = paymentsList
    .filter((p) => p.status === 'In Escrow')
    .reduce((sum, p) => sum + parseUsdAmount(p.amount), 0);

  const clientReleasedTotal = paymentsList
    .filter((p) => p.status === 'Released')
    .reduce((sum, p) => sum + parseUsdAmount(p.amount), 0);
  const clientReleasedCount = paymentsList.filter((p) => p.status === 'Released').length;

  const totalPaymentsVolume = clientEscrowHolding + pendingClearanceTotal + clientReleasedTotal;

  const donutCircumference = 251.33;
  const donutTotal = Math.max(0, freelancerBalance + escrowBalance);
  const availableArc = donutTotal > 0 ? (freelancerBalance / donutTotal) * donutCircumference : 0;
  const escrowArc = donutTotal > 0 ? (escrowBalance / donutTotal) * donutCircumference : 0;

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24 relative overflow-x-clip">
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
                        <div className="text-lg font-bold text-emerald-600 tabular-nums">{formatUsd(freelancerBalance)}</div>
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
                  <div className="text-lg font-extrabold text-[#171717] tracking-tight tabular-nums">
                    {userRole === 'client' ? `${formatUsd(clientEscrowHolding + pendingClearanceTotal, 0)} USD` : `${formatUsd(escrowBalance, 0)} USD`}
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
                    <span className="text-lg font-extrabold text-[#171717] tracking-tight tabular-nums">
                      {userRole === 'client' ? `${teamList.length} Members` : `${formatUsd(freelancerTotalEarnings, 0)} USD`}
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
      <section className={`mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-300 ${activeSidebarNav === 'kanban' ? 'max-w-[1720px]' : 'max-w-[1440px]'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* 1. Left Sidebar Navigation */}
          <div className="lg:col-span-3 xl:col-span-2 min-w-0">
            <div className="bg-white rounded-3xl border border-[#EAE2DC] p-3 space-y-1 sticky top-28 shadow-xs">
              {(userRole === 'client'
                ? [
                  { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: String(projectList.length) },
                  { id: 'kanban', label: 'Milestones Review', icon: Activity, badge: 'Live' },
                  { id: 'proposals', label: 'Candidate Bids', icon: Send, badge: String(proposals.length) },
                  { id: 'messages', label: 'Messages', icon: MessageSquare, badge: String(messageThreads.length) },
                  { id: 'files', label: 'Project Files', icon: Folder, badge: String(filesList.length) },
                  { id: 'team', label: 'Hired Team', icon: Users },
                  { id: 'payments', label: 'Escrow & Invoices', icon: CreditCard },
                ]
                : [
                  { id: 'contracts', label: 'My Contracts', icon: Briefcase, badge: String(freelancerContracts.length) },
                  { id: 'kanban', label: 'Milestones & Timer', icon: Clock, badge: 'Live' },
                  { id: 'my_proposals', label: 'My Submitted Bids', icon: Send, badge: String(myProposalsList.length) },
                  {
                    id: 'earnings',
                    label: 'Earnings & Wallet',
                    icon: Wallet,
                    badge:
                      freelancerBalance >= 1000
                        ? `$${(freelancerBalance / 1000).toFixed(1).replace(/\.0$/, '')}k`
                        : `$${Math.round(freelancerBalance)}`,
                  },
                  { id: 'messages', label: 'Client Messages', icon: MessageSquare, badge: String(messageThreads.length) },
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
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${isActive
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#171717]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{nav.label}</span>
                    </div>
                    {nav.badge && (
                      <span
                        className={`min-w-[22px] h-5 px-1.5 rounded-full text-[10px] shrink-0 flex items-center justify-center font-bold tabular-nums ${isActive
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${activeSidebarNav === 'settings'
                      ? 'bg-[#171717] text-white shadow-xs'
                      : 'text-[#666666] hover:bg-[#FFF9F5] hover:text-[#171717]'
                    }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="truncate">Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Center Column: DYNAMICALLY SWITCHES BASED ON ACTIVE SIDEBAR NAV */}
          <div className={`${activeSidebarNav === 'kanban' ? 'lg:col-span-9 xl:col-span-10' : 'lg:col-span-6 xl:col-span-7'} min-w-0 space-y-6 transition-all duration-300`}>
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
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${projectStatusFilter === f.id
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
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${contractsFilter === f
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
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${contract.status === 'Completed'
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
                                src={contract.client?.avatar || contract.client_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'}
                                alt={contract.client?.name || contract.client_name || 'Client'}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span>
                                Client: <strong className="text-[#171717]">{contract.client?.name || contract.client_name || 'Client'}</strong> {contract.client?.company || contract.client_company ? `(${contract.client?.company || contract.client_company})` : ''}
                              </span>
                            </div>

                            {/* Current Milestone & Financials */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-[#888888]">
                              <span className="font-semibold text-[#171717]">{contract.rate}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">Earned: {contract.totalEarned || contract.total_earned}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">Escrow: {contract.escrowLocked || contract.escrow_locked}</span>
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
                            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt={currentUser?.name || 'Contractor'}
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
                            <span>Contractor: <strong className="text-white">{userRole === 'freelancer' ? (currentUser?.name || 'Arjun Mehta') : 'Arjun Mehta'}</strong></span>
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
                            className={`h-12 px-5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg ${isTimerRunning
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
                          onClick={handleLogMilestoneTime}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between gap-3 shadow-xs min-w-0">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Sprint Deliverables</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block tabular-nums">{kanbanTasks.length} Tasks</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] text-[#F36B21] flex items-center justify-center font-bold shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between gap-3 shadow-xs min-w-0">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">In Review Queue</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block tabular-nums">
                        {kanbanTasks.filter((t) => t.column === 'review').length} Deliverables
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between gap-3 shadow-xs min-w-0">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Milestone Escrow</span>
                      <span className="text-xl font-bold text-emerald-600 mt-0.5 block tabular-nums truncate">
                        {formatUsd(totalPaymentsVolume || escrowBalance)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#EAE2DC] p-4 flex items-center justify-between gap-3 shadow-xs min-w-0">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Sprint Deadline</span>
                      <span className="text-xl font-bold text-[#171717] mt-0.5 block truncate">
                        {projectList[0]?.dueDate || 'Nov 18, 2026'}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
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
                      Drag and drop scoped deliverables across sprint stages with instant SQLite persistence and escrow sync.
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
                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${kanbanPriorityFilter === pri
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

                {/* 4. Full-Width 4-Column Responsive Drag & Drop Kanban Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 items-start">
                  {KANBAN_COLUMNS.map((col) => {
                    const colTasks = kanbanTasks.filter((t) => {
                      const matchesCol = t.column === col.id;
                      const matchesSearch = !kanbanSearch || t.title.toLowerCase().includes(kanbanSearch.toLowerCase()) || t.project.toLowerCase().includes(kanbanSearch.toLowerCase());
                      const matchesPriority = kanbanPriorityFilter === 'All' || t.priority === kanbanPriorityFilter;
                      return matchesCol && matchesSearch && matchesPriority;
                    });
                    const isColumnHovered = dragOverCol === col.id && draggedTaskId !== null;

                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleColumnDragOver(e, col.id, null)}
                        onDragLeave={handleColumnDragLeave}
                        onDrop={(e) => handleDropTarget(e, col.id, null)}
                        className={`rounded-3xl p-5 space-y-4 min-h-[520px] flex flex-col justify-between transition-all duration-150 border ${isColumnHovered
                            ? 'bg-[#FFF3EC]/70 border-[#F36B21] ring-2 ring-[#F36B21]/20 shadow-[0_12px_32px_rgba(243,107,33,0.12)]'
                            : 'bg-[#FFF9F5] border-[#EAE2DC] shadow-xs'
                          }`}
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
                            {colTasks.map((t) => {
                              const isDraggingThis = draggedTaskId === t.id;
                              const isDropIndicatorBefore =
                                draggedTaskId && draggedTaskId !== t.id && dragOverTaskId === t.id;

                              return (
                                <React.Fragment key={t.id}>
                                  {isDropIndicatorBefore && (
                                    <div className="h-1.5 rounded-full bg-[#F36B21] shadow-xs animate-pulse" />
                                  )}
                                  <div
                                    draggable
                                    onDragStart={(e) => handleCardDragStart(e, t.id)}
                                    onDragEnd={handleCardDragEnd}
                                    onDragOver={(e) => handleColumnDragOver(e, col.id, t.id)}
                                    onDrop={(e) => handleDropTarget(e, col.id, t.id)}
                                    className={`bg-white rounded-2xl border p-4.5 space-y-3 transition-all group relative cursor-grab active:cursor-grabbing select-none ${isDraggingThis
                                        ? 'opacity-45 scale-[0.97] border-[#F36B21] ring-2 ring-[#F36B21]/30 shadow-lg'
                                        : 'border-[#EAE2DC] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#F36B21]/60 hover:shadow-[0_12px_28px_rgba(243,107,33,0.08)]'
                                      }`}
                                  >
                                    {/* Top Row: Grab Handle + Priority Pill + Estimate */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <GripVertical
                                          className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#F36B21] transition-colors shrink-0"
                                          title="Drag to move card"
                                        />
                                        <span
                                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${t.priority === 'Urgent'
                                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                              : t.priority === 'High'
                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}
                                        >
                                          {t.priority}
                                        </span>
                                      </div>
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
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img
                                          src={t.assignee}
                                          alt="Assignee"
                                          draggable={false}
                                          className="w-6 h-6 rounded-full object-cover border border-[#EAE2DC] shadow-xs shrink-0"
                                        />
                                        <span className="text-[11px] font-semibold text-[#171717] truncate max-w-[100px]">
                                          {t.assigneeName || t.assignee_name || 'Assigned'}
                                        </span>
                                      </div>

                                      {/* Direction Shift & Delete Controls */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        {col.id !== 'backlog' && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              moveTask(t.id, 'prev');
                                            }}
                                            className="px-2 py-1 rounded-lg bg-[#FFF9F5] hover:bg-[#FFF3EC] border border-[#EAE2DC] text-[#777777] hover:text-[#171717] text-[11px] font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                                            title="Move to previous stage"
                                          >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Prev</span>
                                          </button>
                                        )}
                                        {col.id !== 'done' && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              moveTask(t.id, 'next');
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] hover:bg-[#F36B21] text-[#F36B21] hover:text-white text-[11px] font-semibold flex items-center gap-0.5 transition-all shadow-xs cursor-pointer"
                                            title="Move to next stage"
                                          >
                                            <span>Next</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        {col.id === 'done' && (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Done</span>
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(t.id, t.title);
                                          }}
                                          className="p-1 rounded-lg text-[#BBBBBB] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                          title="Delete task"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}

                            {colTasks.length === 0 && (
                              <div
                                className={`text-center py-12 px-4 border-2 border-dashed rounded-2xl space-y-2 transition-colors ${isColumnHovered
                                    ? 'border-[#F36B21] bg-white text-[#F36B21]'
                                    : 'border-[#EAE2DC] bg-white/50 text-[#888888]'
                                  }`}
                              >
                                <span className="text-xs font-semibold block">
                                  {isColumnHovered ? `Drop to move into ${col.title}` : 'No deliverables in this stage'}
                                </span>
                                <p className="text-[11px] opacity-80">
                                  {isColumnHovered
                                    ? 'Release mouse button to sync status'
                                    : kanbanSearch || kanbanPriorityFilter !== 'All'
                                      ? 'Try adjusting your filters'
                                      : 'Drag a card here or add a new deliverable'}
                                </p>
                              </div>
                            )}

                            {isColumnHovered && colTasks.length > 0 && dragOverTaskId === null && (
                              <div className="py-3 px-4 rounded-2xl border-2 border-dashed border-[#F36B21]/60 bg-white/80 text-center text-xs font-semibold text-[#F36B21]">
                                Drop here to move into {col.title}
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
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${proposalFilter === status
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
                            src={prop.candidate?.avatar || prop.candidate_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                            alt={prop.candidate?.name || prop.candidate_name || 'Candidate'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#FCE2D3]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-[#171717]">
                                {prop.candidate?.name || prop.candidate_name}
                              </h3>
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                ★ {prop.candidate?.rating || prop.candidate_rating || 5.0}
                              </span>
                            </div>
                            <p className="text-xs text-[#777777]">{prop.candidate?.title || prop.candidate_title || 'Specialist'}</p>
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
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${prop.status === 'Accepted'
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
                            src={myProp.clientAvatar || myProp.client_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'}
                            alt={myProp.clientName || myProp.client_name || 'Client'}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#EAE2DC]"
                          />
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#171717]">{myProp.projectTitle || myProp.project_title}</h3>
                            <p className="text-xs text-[#777777]">Client: {myProp.clientName || myProp.client_name}</p>
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
                          {(myProp.status.includes('Active') || myProp.status === 'Accepted') && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl border border-emerald-200 p-5 space-y-1.5 shadow-xs bg-gradient-to-br from-white to-emerald-50/30 min-w-0 overflow-hidden">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Available for Payout</span>
                    <span className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight block truncate" title={formatUsd(freelancerBalance)}>
                      {formatUsd(freelancerBalance)}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium block">Ready for instant transfer</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-amber-200 p-5 space-y-1.5 shadow-xs bg-gradient-to-br from-white to-amber-50/30 min-w-0 overflow-hidden">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">In Milestone Escrow</span>
                    <span className="text-2xl font-black text-amber-600 tabular-nums tracking-tight block truncate" title={formatUsd(escrowBalance)}>
                      {formatUsd(escrowBalance)}
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium block">Locked in smart contract</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-1.5 shadow-xs min-w-0 overflow-hidden">
                    <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">2026 Total Earnings</span>
                    <span className="text-2xl font-black text-[#171717] tabular-nums tracking-tight block truncate" title={formatUsd(freelancerTotalEarnings)}>
                      {formatUsd(freelancerTotalEarnings)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium block">▲ Available + Escrow + Paid</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-1.5 shadow-xs min-w-0 overflow-hidden">
                    <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block">Pending Clearance</span>
                    <span className="text-2xl font-black text-slate-700 tabular-nums tracking-tight block truncate" title={formatUsd(pendingClearanceTotal)}>
                      {formatUsd(pendingClearanceTotal)}
                    </span>
                    <span className="text-[11px] text-[#777777] font-medium block">
                      {pendingClearanceCount > 0 ? `${pendingClearanceCount} awaiting signoff` : 'Escrow review stage'}
                    </span>
                  </div>
                </div>

                {/* Payout History Ledger */}
                <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F3ECE7]">
                    <div>
                      <h3 className="text-sm font-bold text-[#171717]">Recent Payout & Ledger Transactions</h3>
                      <p className="text-xs text-[#888888]">Live SQLite wallet ledger & escrow disbursements</p>
                    </div>

                    <button
                      onClick={() => {
                        const first = paymentsList[0] || {
                          id: 'TAX-2026',
                          milestone: '2026 Annual Escrow Summary',
                          project: 'Workverse Workspace',
                          recipient: currentUser?.name || 'Arjun Mehta',
                          amount: formatUsd(freelancerTotalEarnings),
                          date: 'Today',
                        };
                        setActiveInvoicePayment(first);
                      }}
                      className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] text-xs font-semibold text-[#171717] hover:text-[#F36B21] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generate Tax Statement</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[#F3ECE7] text-xs">
                    {[
                      ...walletTransactions.map((wt) => {
                        const isDebit = wt.type === 'withdrawal';
                        const methodLabel = formatWalletMethodLabel(wt.method);
                        return {
                          id: wt.id,
                          client: methodLabel,
                          milestone: isDebit ? `Withdrawal via ${methodLabel}` : (wt.note || `${wt.type} credit`),
                          project: 'Workverse Wallet Ledger',
                          recipient: currentUser?.name || 'Arjun Mehta',
                          amount: `${isDebit ? '-' : '+'}${formatUsd(wt.amount)}`,
                          isDebit,
                          date: formatLedgerDate(wt.created_at),
                        };
                      }),
                      ...paymentsList
                        .filter((p) => p.status === 'Released')
                        .map((p) => ({
                          id: p.id,
                          client: p.project,
                          milestone: p.milestone,
                          project: p.project,
                          recipient: p.recipient,
                          amount: p.amount,
                          isDebit: false,
                          date: p.date,
                        })),
                    ].map((tx) => (
                      <div key={tx.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFF9F5] px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${tx.isDebit ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {tx.isDebit ? <ArrowUpRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#171717] block truncate">{tx.milestone}</span>
                            <span className="text-[#777777] text-[11px] block truncate">Source: {tx.client} • Ref: {tx.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className={`font-bold block tabular-nums ${tx.isDebit ? 'text-amber-700' : 'text-emerald-600'}`}>{tx.amount}</span>
                            <span className="text-[10px] text-[#888888]">{tx.date}</span>
                          </div>

                          <button
                            onClick={() => {
                              setActiveInvoicePayment({
                                id: tx.id,
                                project: tx.project || tx.client,
                                recipient: tx.recipient || currentUser?.name || 'Arjun Mehta',
                                milestone: tx.milestone,
                                amount: tx.amount,
                                status: 'Released',
                                date: tx.date,
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE2DC] hover:border-[#F36B21] text-[11px] font-semibold text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC] transition-all flex items-center gap-1 cursor-pointer shrink-0"
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
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={currentUser?.name || 'Freelancer'}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-[#F36B21] shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#171717]">{currentUser?.name || 'Arjun Mehta'}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-bold border border-[#FCE2D3]">
                          Verified Talent
                        </span>
                      </div>
                      <p className="text-xs text-[#777777] mt-0.5">{currentUser?.title || 'Senior Full Stack & Cloud Architect'}</p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-[#888888]">
                        <span className="text-amber-500 font-bold">★ 4.9 (Verified)</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">99% Job Success</span>
                        <span>•</span>
                        <span className="font-bold text-[#171717]">${(currentUser?.hourly_rate || hourlyRate).toFixed(2)}/hr</span>
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
                          className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${isSelected ? 'bg-white shadow-xs border-l-4 border-l-[#F36B21]' : 'hover:bg-white'
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
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${isMe
                                ? 'bg-[#171717] text-white shadow-xs rounded-br-none'
                                : 'bg-white border border-[#EAE2DC] text-[#171717] shadow-xs rounded-bl-none'
                              }`}
                          >
                            <p>{msg.text}</p>
                            <span
                              className={`text-[9px] block text-right mt-1.5 ${isMe ? 'text-white/60' : 'text-[#888888]'
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
                              <span>Uploaded by {file.uploadedBy || file.uploaded_by || 'Workverse'} ({file.date})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => handleSimulateDownload(file.name, `Workverse Deliverable\nFile: ${file.name}\nProject: ${file.project}\nSize: ${file.size}\nUploaded by: ${file.uploadedBy || file.uploaded_by || 'Workverse'}\nDate: ${file.date}`)}
                            className="px-4 py-2 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] hover:text-[#F36B21] bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-2 rounded-full border border-[#EAE2DC] hover:border-red-300 hover:bg-red-50 text-[#888888] hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${paymentFilter === st
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
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1 min-w-0 overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] block">Escrow Holding</span>
                    <div className="text-2xl font-extrabold text-[#171717] tabular-nums truncate">{formatUsd(clientEscrowHolding)}</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">● 100% Guaranteed</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1 min-w-0 overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] block">Released to Date</span>
                    <div className="text-2xl font-extrabold text-[#171717] tabular-nums truncate">{formatUsd(clientReleasedTotal)}</div>
                    <span className="text-[10px] text-[#777777]">{clientReleasedCount} Completed Milestone{clientReleasedCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="p-5 rounded-3xl bg-white border border-[#EAE2DC] shadow-xs space-y-1 min-w-0 overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] block">Pending Approval</span>
                    <div className="text-2xl font-extrabold text-[#F36B21] tabular-nums truncate">{formatUsd(pendingClearanceTotal)}</div>
                    <span className="text-[10px] text-amber-600 font-semibold">{pendingClearanceCount} Awaiting Signoff</span>
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
                              className={`text-[10px] px-2 py-0.5 rounded-full block font-semibold border ${pay.status === 'Released'
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
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${autoEscrowRelease ? 'bg-[#F36B21]' : 'bg-[#EAE2DC]'
                          }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${autoEscrowRelease ? 'right-0.5' : 'left-0.5'
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
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${twoFactorAuth ? 'bg-[#F36B21]' : 'bg-[#EAE2DC]'
                          }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${twoFactorAuth ? 'right-0.5' : 'left-0.5'
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
            <div className="lg:col-span-3 min-w-0 space-y-5 animate-in fade-in duration-200">
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
                            stroke="#F36B21"
                            strokeWidth="10"
                            strokeDasharray={`${inProgressLength} ${circumference}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                            fill="none"
                          />

                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#FBBF24"
                            strokeWidth="10"
                            strokeDasharray={`${inReviewLength} ${circumference}`}
                            strokeDashoffset={-inProgressLength}
                            strokeLinecap="round"
                            fill="none"
                          />

                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#94A3B8"
                            strokeWidth="10"
                            strokeDasharray={`${completedLength} ${circumference}`}
                            strokeDashoffset={-(inProgressLength + inReviewLength)}
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
                      {projectList.slice(0, 3).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === 0 ? 'bg-[#F36B21]' : 'bg-amber-500'}`} />
                            <span className="font-semibold text-[#171717] truncate">{p.title}</span>
                          </div>
                          <span className="text-[10px] font-medium text-[#777777] shrink-0">{p.deadline}</span>
                        </div>
                      ))}
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
                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-4 shadow-xs min-w-0 overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5 min-w-0">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Wallet & Escrow Balance</span>
                    </h3>

                    {/* Live Proportional Ring Visualization */}
                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#FFF3EC" strokeWidth="10" fill="none" />
                          {escrowArc > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#F59E0B"
                              strokeWidth="10"
                              strokeDasharray={`${escrowArc.toFixed(2)} ${donutCircumference}`}
                              strokeDashoffset={(-availableArc).toFixed(2)}
                              strokeLinecap="round"
                              fill="none"
                            />
                          )}
                          {availableArc > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#10B981"
                              strokeWidth="10"
                              strokeDasharray={`${Math.max(availableArc, 6).toFixed(2)} ${donutCircumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                              fill="none"
                            />
                          )}
                        </svg>
                        <div className="absolute text-center px-2 max-w-[92px]">
                          <span className="text-sm font-black text-emerald-600 tabular-nums block truncate">
                            {formatUsd(freelancerBalance)}
                          </span>
                          <p className="text-[9px] text-[#777777] font-semibold uppercase tracking-wide">Available</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#F3ECE7] text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[#777777] truncate">Ready for Payout</span>
                        </div>
                        <span className="font-bold text-emerald-600 tabular-nums shrink-0">{formatUsd(freelancerBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-[#777777] truncate">Locked in Escrow</span>
                        </div>
                        <span className="font-bold text-amber-600 tabular-nums shrink-0">{formatUsd(escrowBalance)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Instant Withdrawal</span>
                    </button>
                  </div>

                  {/* Freelancer Card 2: Upcoming Contract Deadlines */}
                  <div className="bg-white rounded-3xl border border-[#EAE2DC] p-5 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F36B21]" />
                      <span>Contract Milestones Due</span>
                    </h3>

                    <div className="space-y-2.5 pt-1 text-xs">
                      {freelancerContracts.slice(0, 3).map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === 0 ? 'bg-[#F36B21]' : 'bg-slate-400'}`} />
                            <span className="font-semibold text-[#171717] truncate">{c.title}</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 shrink-0">{c.deadline}</span>
                        </div>
                      ))}
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
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${wizardStep === st.s
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

                <div className="p-3 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                    <span>Total Milestone Allocation</span>
                    <span className="text-[#F36B21]">
                      {Number(m1Pct) + Number(m2Pct) + Number(m3Pct)}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white overflow-hidden flex">
                    <div
                      className="bg-[#F36B21] transition-all"
                      style={{ width: `${Number(m1Pct)}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${Number(m2Pct)}%` }}
                    />
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${Number(m3Pct)}%` }}
                    />
                  </div>

                  <p className={`text-[11px] font-semibold text-center ${Number(m1Pct) + Number(m2Pct) + Number(m3Pct) === 100
                    ? 'text-emerald-700'
                    : 'text-red-600'
                    }`}>
                    {Number(m1Pct) + Number(m2Pct) + Number(m3Pct) === 100
                      ? '✓ Milestone allocation is balanced'
                      : '⚠ Total allocation must equal 100%'}
                  </p>
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Associated Project
                </label>
                <select
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                >
                  {projectList.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                  Assign Team Member
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKSPACE_MEMBERS.map((member, idx) => (
                    <button
                      key={member.name}
                      type="button"
                      onClick={() => setNewTaskAssigneeIndex(idx)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        newTaskAssigneeIndex === idx
                          ? 'border-[#F36B21] bg-[#FFF3EC]/60 ring-1 ring-[#F36B21]'
                          : 'border-[#EAE2DC] bg-[#FFF9F5] hover:border-[#FCE2D3]'
                      }`}
                    >
                      <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#171717] truncate">{member.name}</p>
                        <p className="text-[10px] text-[#777777] truncate">{member.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                    Task Checklist ({newTaskSubtasksList.length})
                  </label>
                  <span className="text-[11px] text-[#777777]">Optional milestone subtasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subtaskInput.trim()) {
                          setNewTaskSubtasksList((prev) => [...prev, subtaskInput.trim()]);
                          setSubtaskInput('');
                        }
                      }
                    }}
                    placeholder="Add subtask (e.g. Implement unit tests)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-medium focus:outline-none focus:border-[#F36B21]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (subtaskInput.trim()) {
                        setNewTaskSubtasksList((prev) => [...prev, subtaskInput.trim()]);
                        setSubtaskInput('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-[#171717] text-white text-xs font-bold hover:bg-[#333333] cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
                {newTaskSubtasksList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newTaskSubtasksList.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF3EC] text-[#F36B21] border border-[#FCE2D3] text-[11px] font-semibold"
                      >
                        <span>✓ {item}</span>
                        <button
                          type="button"
                          onClick={() => setNewTaskSubtasksList((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-[#F36B21] hover:text-[#171717] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                <span className="text-2xl font-black text-emerald-600 tabular-nums">{formatUsd(freelancerBalance)}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                Zero Fee Transfer
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Withdrawal Amount (USD)
                </label>
                <div className="flex items-center gap-1.5">
                  {[100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={freelancerBalance < preset}
                      onClick={() => setWithdrawAmountInput(preset.toFixed(2))}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFF3EC] text-[#F36B21] border border-[#FCE2D3] hover:bg-[#FCE2D3] disabled:opacity-40 cursor-pointer"
                    >
                      ${preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={freelancerBalance <= 0}
                    onClick={() => setWithdrawAmountInput(freelancerBalance.toFixed(2))}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#171717] text-white hover:bg-[#333333] disabled:opacity-40 cursor-pointer"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#777777]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={freelancerBalance}
                  value={withdrawAmountInput}
                  onChange={(e) => setWithdrawAmountInput(e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-[#EAE2DC] focus:border-[#F36B21] focus:outline-none text-sm font-bold text-[#171717] tabular-nums"
                  placeholder="250.00"
                />
              </div>
              {Number(withdrawAmountInput) > freelancerBalance && (
                <p className="text-[11px] text-red-600 font-medium">
                  Amount exceeds your available balance ({formatUsd(freelancerBalance)}).
                </p>
              )}
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
                disabled={isWithdrawing || freelancerBalance <= 0 || Number(withdrawAmountInput) <= 0 || Number(withdrawAmountInput) > freelancerBalance}
                onClick={handleConfirmWithdrawal}
                className="px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isWithdrawing
                    ? 'Processing...'
                    : `Confirm Withdrawal of ${formatUsd(withdrawAmountInput)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#171717] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-top-4 duration-200">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${toast.type === 'error' ? 'bg-red-500' : 'bg-[#F36B21]'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
