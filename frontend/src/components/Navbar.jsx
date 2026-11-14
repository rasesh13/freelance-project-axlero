import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  User,
  Briefcase,
  Settings,
  LogOut,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Check,
  BellOff,
  Sparkles,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getAuthToken,
} from '../api/client';

function formatRelativeTime(isoOrSqlDate) {
  if (!isoOrSqlDate) return 'Just now';
  const normalized = isoOrSqlDate.includes('T')
    ? isoOrSqlDate
    : `${isoOrSqlDate.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return 'Recent';
  const diffSec = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationBadgeMeta(type) {
  switch (type) {
    case 'payment':
      return { Icon: DollarSign, badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' };
    case 'message':
      return { Icon: MessageSquare, badgeClass: 'bg-blue-50 border-blue-200 text-blue-600' };
    case 'proposal':
      return { Icon: Briefcase, badgeClass: 'bg-[#FFF3EC] border-[#FCE2D3] text-[#F36B21]' };
    case 'milestone':
    case 'contract':
      return { Icon: CheckCircle2, badgeClass: 'bg-purple-50 border-purple-200 text-purple-600' };
    default:
      return { Icon: Sparkles, badgeClass: 'bg-amber-50 border-amber-200 text-amber-600' };
  }
}

export default function Navbar({
  currentPage,
  setCurrentPage,
  isLoggedIn,
  setIsLoggedIn,
  userRole = 'client',
  setUserRole,
  currentUser,
  onLogout,
  onOpenSearch,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const notificationsRef = useRef(null);
  const userDropdownRef = useRef(null);

  const loadNotifications = useCallback(async (showSpinner = false) => {
    if (!isLoggedIn || !getAuthToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (showSpinner) setIsLoadingNotifs(true);
    try {
      const data = await fetchNotifications(userRole);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);
    } catch {
      // ignore transient network polling failure
    } finally {
      if (showSpinner) setIsLoadingNotifs(false);
    }
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    loadNotifications(false);
    if (!isLoggedIn) return undefined;
    const handleRefreshEvent = () => loadNotifications(false);
    window.addEventListener('workverse:refresh-notifications', handleRefreshEvent);
    const interval = setInterval(() => loadNotifications(false), 12000);
    return () => {
      window.removeEventListener('workverse:refresh-notifications', handleRefreshEvent);
      clearInterval(interval);
    };
  }, [loadNotifications, isLoggedIn, currentPage]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { id: 'talent', label: 'Find Talent' },
    { id: 'work', label: 'Find Work' },
    ...(isLoggedIn
      ? [{ id: 'projects', label: userRole === 'freelancer' ? 'My Workspace' : 'Projects' }]
      : []),
    { id: 'pricing', label: 'Pricing' },
    { id: 'resources', label: 'Resources', hasDropdown: true },
  ];

  const handleNavClick = (pageId, options = {}) => {
    setCurrentPage(pageId, options);
    setMobileMenuOpen(false);
    setResourcesDropdownOpen(false);
    setNotificationsOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleNotifications = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    setUserDropdownOpen(false);
    setResourcesDropdownOpen(false);
    if (next) {
      loadNotifications(notifications.length === 0);
    }
  };

  const handleNotificationClick = async (notif) => {
    const targetPage = notif.target_page || notif.targetPage || 'projects';
    const targetTab = notif.target_tab || notif.targetTab || '';
    const isAlreadyRead = Boolean(notif.isRead || notif.is_read);

    setNotificationsOpen(false);
    setMobileMenuOpen(false);

    if (!isAlreadyRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, isRead: true, is_read: 1 } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        const res = await markNotificationRead(notif.id, userRole);
        if (typeof res?.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch {
        loadNotifications(false);
      }
    }

    setCurrentPage(targetPage, targetTab ? { tab: targetTab } : {});
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, is_read: 1 })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(userRole);
    } catch {
      loadNotifications(false);
    }
  };

  const handleDismissNotification = async (e, notif) => {
    e.stopPropagation();
    const wasUnread = !notif.isRead && !notif.is_read;
    setNotifications((prev) => prev.filter((item) => item.id !== notif.id));
    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await deleteNotification(notif.id);
    } catch {
      loadNotifications(false);
    }
  };

  const visibleNotifications =
    notifFilter === 'unread'
      ? notifications.filter((n) => !n.isRead && !n.is_read)
      : notifications;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFF9F5]/90 backdrop-blur-md border-b border-[#EAE2DC]/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          {/* Workverse Orange W Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F36B21] to-[#E0560E] flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6l4.5 12 4.5-9 4.5 9L21 6" />
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717] font-sans">
            Workverse
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;

            if (item.hasDropdown) {
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                    onMouseEnter={() => setResourcesDropdownOpen(true)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                        : 'text-[#171717]/80 hover:text-[#171717] hover:bg-[#FFF3EC]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {resourcesDropdownOpen && (
                    <div
                      onMouseLeave={() => setResourcesDropdownOpen(false)}
                      className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-[#EAE2DC] p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <button
                        onClick={() => handleNavClick('resources')}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[#FFF3EC] hover:text-[#F36B21] font-medium transition-colors"
                      >
                        Resources Hub
                      </button>
                      <button
                        onClick={() => handleNavClick('resources')}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[#FFF3EC] hover:text-[#F36B21] font-medium transition-colors"
                      >
                        Guides & Tutorials
                      </button>
                      <button
                        onClick={() => handleNavClick('resources')}
                        className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[#FFF3EC] hover:text-[#F36B21] font-medium transition-colors"
                      >
                        Best Practices & FAQs
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#FCE2D3] text-[#171717] font-semibold shadow-xs'
                    : 'text-[#171717]/80 hover:text-[#171717] hover:bg-[#FFF3EC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#171717] hover:bg-[#FFF3EC] border border-[#EAE2DC] transition-colors"
            title="Search anything (Talent, Projects, Resources)"
          >
            <Search className="w-4 h-4" />
          </button>

          {isLoggedIn ? (
            /* Logged-In User Controls */
            <div className="flex items-center gap-2.5 sm:gap-3 relative">
              {/* Notification Bell with Popover Drawer */}
              <div ref={notificationsRef} className="relative">
                <button
                  onClick={handleToggleNotifications}
                  aria-label="Toggle notifications"
                  aria-expanded={notificationsOpen}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
                    notificationsOpen
                      ? 'bg-[#FFF3EC] border-[#F36B21] text-[#F36B21] shadow-xs'
                      : 'text-[#171717] hover:bg-[#FFF3EC] border-[#EAE2DC]'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F36B21] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#FFF9F5] shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Popover Header */}
                    <div className="px-4 py-3.5 border-b border-[#EAE2DC] bg-[#FFFDFB] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#171717]">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF3EC] text-[#F36B21] border border-[#FCE2D3]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="flex items-center gap-1 text-xs font-semibold text-[#F36B21] hover:text-[#E0560E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    </div>

                    {/* All / Unread Filter Pills */}
                    <div className="px-4 py-2 border-b border-[#F2ECE7] bg-[#FAF7F5] flex items-center gap-2">
                      <button
                        onClick={() => setNotifFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          notifFilter === 'all'
                            ? 'bg-[#171717] text-white'
                            : 'text-[#666666] hover:bg-white hover:text-[#171717]'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setNotifFilter('unread')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          notifFilter === 'unread'
                            ? 'bg-[#F36B21] text-white'
                            : 'text-[#666666] hover:bg-white hover:text-[#171717]'
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {/* Scrollable Notification List */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F2ECE7]">
                      {isLoadingNotifs ? (
                        <div className="px-4 py-10 text-center text-xs text-[#777777]">
                          Loading latest notifications...
                        </div>
                      ) : visibleNotifications.length === 0 ? (
                        <div className="px-6 py-10 text-center space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] text-[#F36B21] flex items-center justify-center mx-auto">
                            <BellOff className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-[#171717]">
                            {notifFilter === 'unread' ? 'No unread notifications' : "You're all caught up!"}
                          </p>
                          <p className="text-xs text-[#777777]">
                            New messages, proposals, milestones, and escrow payouts appear here live.
                          </p>
                        </div>
                      ) : (
                        visibleNotifications.map((notif) => {
                          const isUnread = !notif.isRead && !notif.is_read;
                          const { Icon, badgeClass } = getNotificationBadgeMeta(notif.type);
                          const targetLabel = notif.target_tab || notif.targetTab || notif.target_page || 'workspace';

                          return (
                            <div
                              key={notif.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleNotificationClick(notif)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleNotificationClick(notif);
                                }
                              }}
                              className={`group px-4 py-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                                isUnread
                                  ? 'bg-[#FFF9F5]/90 hover:bg-[#FFF3EC]/70'
                                  : 'bg-white hover:bg-[#FAF7F5]'
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${badgeClass}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`text-xs sm:text-sm leading-snug ${
                                      isUnread ? 'font-bold text-[#171717]' : 'font-semibold text-[#333333]'
                                    }`}
                                  >
                                    {notif.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isUnread && (
                                      <span
                                        className="w-2 h-2 rounded-full bg-[#F36B21]"
                                        title="Unread"
                                      />
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => handleDismissNotification(e, notif)}
                                      aria-label="Dismiss notification"
                                      title="Dismiss notification"
                                      className="p-1 rounded-lg text-[#999999] hover:text-red-600 hover:bg-red-50 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs text-[#666666] mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[11px] font-medium text-[#999999]">
                                    {formatRelativeTime(notif.created_at || notif.createdAt)}
                                  </span>
                                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#F5EFEA] text-[#666666]">
                                    {targetLabel.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Action */}
                    <div className="px-4 py-2.5 border-t border-[#EAE2DC] bg-[#FFFDFB] flex items-center justify-between">
                      <span className="text-[11px] text-[#888888] font-medium">
                        Role: {userRole === 'freelancer' ? 'Freelancer' : 'Client'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavClick('projects')}
                        className="text-xs font-semibold text-[#171717] hover:text-[#F36B21] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar with Status Indicator */}
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] transition-all bg-white cursor-pointer"
                >
                  <img
                    src={
                      currentUser?.avatar ||
                      (userRole === 'client'
                        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80')
                    }
                    alt={currentUser?.name || (userRole === 'client' ? 'Sarah Jenkins' : 'Arjun Mehta')}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 right-1" />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EAE2DC] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-2 border-b border-[#EAE2DC]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#171717] truncate max-w-[150px]">
                          {currentUser?.name || (userRole === 'client' ? 'Sarah Jenkins' : 'Arjun Mehta')}
                        </p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] border border-[#FCE2D3] uppercase">
                          {userRole === 'client' ? 'Client' : 'Freelancer'}
                        </span>
                      </div>
                      <p className="text-xs text-[#777777] truncate">
                        {currentUser?.email || (userRole === 'client' ? 'sarah@cloudscale.ai' : 'arjun@workverse.io')}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#777777]" />
                        <span>{userRole === 'client' ? 'Company Profile' : 'My Public Profile'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('projects');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-[#777777]" />
                        <span>{userRole === 'client' ? 'Client Projects Hub' : 'Freelancer Workspace'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('pricing');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#777777]" />
                        <span>Subscription Plan</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#EAE2DC]">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) {
                            onLogout();
                          } else {
                            setIsLoggedIn(false);
                          }
                          handleNavClick('home');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged-Out Controls (As shown in Reference 1, 2, 3) */
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleNavClick('auth')}
                className="px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#171717] bg-white hover:bg-[#FFF3EC] border border-[#EAE2DC] transition-all hover:border-[#d6c9c1]"
              >
                Log In
              </button>

              <button
                onClick={() => handleNavClick('auth')}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#171717] hover:bg-[#2b2b2b] transition-all shadow-xs"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#171717] hover:bg-[#FFF3EC] border border-[#EAE2DC]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFF9F5] border-b border-[#EAE2DC] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-base font-medium transition-all ${
                  currentPage === item.id
                    ? 'bg-[#FCE2D3] text-[#171717] font-semibold'
                    : 'text-[#171717]/80 hover:bg-[#FFF3EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#EAE2DC] space-y-2.5">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavClick('profile')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#EAE2DC] font-medium text-sm text-[#171717]"
                >
                  <User className="w-4 h-4" />
                  <span>{userRole === 'client' ? 'Company Profile' : 'My Freelancer Profile'}</span>
                </button>
                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      setIsLoggedIn(false);
                    }
                    handleNavClick('home');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-50 text-red-600 font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNavClick('auth')}
                  className="w-full py-3 rounded-full text-sm font-medium text-[#171717] bg-white border border-[#EAE2DC] text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNavClick('auth')}
                  className="w-full py-3 rounded-full text-sm font-medium text-white bg-[#171717] text-center flex items-center justify-center gap-1.5"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

