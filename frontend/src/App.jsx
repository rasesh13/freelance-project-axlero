import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import HomePage from './pages/HomePage';
import FindTalentPage from './pages/FindTalentPage';
import FindWorkPage from './pages/FindWorkPage';
import ProjectsHubPage from './pages/ProjectsHubPage';
import PricingPage from './pages/PricingPage';
import ResourcesPage from './pages/ResourcesPage';
import AuthPage from './pages/AuthPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import {
  getStoredUser,
  authGetMe,
  authLogout,
  getAuthToken,
  fetchTalents,
  fetchProjects,
  subscribeNetworkStatus,
} from './api/client';

const PROTECTED_PAGES = new Set(['projects']);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsInitialTab, setProjectsInitialTab] = useState('projects');
  const [projectsTabNonce, setProjectsTabNonce] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [authNotice, setAuthNotice] = useState('');

  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!getAuthToken();
    } catch {
      return false;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    try {
      const stored = getStoredUser();
      if (stored && stored.role) return stored.role;
      return localStorage.getItem('wv_user_role') || 'client';
    } catch {
      return 'client';
    }
  });

  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    return subscribeNetworkStatus((online) => {
      setIsOnline(online);
    });
  }, []);

  // Verify session and hydrate initial defaults from live backend on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      authGetMe()
        .then((user) => {
          if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
            if (user.role) setUserRole(user.role);
          }
        })
        .catch(() => {
          console.warn('Session expired, logging out');
          authLogout();
          setCurrentUser(null);
          setIsLoggedIn(false);
          if (window.location.hash === '#projects') {
            setAuthNotice('Your session expired. Please sign in to access your Workspace.');
            setPendingRedirect({ page: 'projects', options: {} });
            setCurrentPage('auth');
            window.location.hash = 'auth';
          }
        });
    }

    fetchTalents()
      .then((list) => {
        if (Array.isArray(list) && list.length) setSelectedFreelancer((prev) => prev || list[0]);
      })
      .catch(() => {});

    fetchProjects()
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          setSelectedProject((prev) => prev || list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSetIsLoggedIn = (val) => {
    setIsLoggedIn(val);
    try {
      localStorage.setItem('wv_is_logged_in', String(val));
    } catch {
      // ignore
    }
  };

  const handleSetUserRole = (role) => {
    setUserRole(role);
    try {
      localStorage.setItem('wv_user_role', role);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setUserRole('client');
    setPendingRedirect(null);
    setAuthNotice('');
    if (currentPage === 'projects' || window.location.hash === '#projects') {
      setCurrentPage('home');
      window.location.hash = 'home';
    }
  };

  // Global Hotkeys: Ctrl+K (Search), ? (Shortcuts Guide), Alt+1..5 (Quick Jump)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      // Ctrl/Cmd + K -> Toggle Global Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // '?' (Shift + /) when not typing in an input field -> Toggle Shortcuts Modal
      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Alt + Number Keys for fast page navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') { e.preventDefault(); navigateToPage('home'); }
        if (e.key === '2') { e.preventDefault(); navigateToPage('talent'); }
        if (e.key === '3') { e.preventDefault(); navigateToPage('work'); }
        if (e.key === '4') { e.preventDefault(); navigateToPage('projects'); }
        if (e.key === '5') { e.preventDefault(); navigateToPage('pricing'); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sync hash with page for browser back/forward navigation & enforce protected route guard
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'talent', 'work', 'projects', 'pricing', 'resources', 'auth', 'profile'].includes(hash)) {
        if (PROTECTED_PAGES.has(hash) && !getAuthToken()) {
          setPendingRedirect({ page: hash, options: {} });
          setAuthNotice('Sign in to access your Client Projects Hub or Freelancer Workspace.');
          setCurrentPage('auth');
          window.location.hash = 'auth';
          return;
        }
        setCurrentPage(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToPage = (page, options = {}) => {
    const authed = isLoggedIn && !!getAuthToken();
    if (PROTECTED_PAGES.has(page) && !authed) {
      setPendingRedirect({ page, options });
      setAuthNotice(
        options?.notice || 'Sign in to access your Client Projects Hub or Freelancer Workspace.'
      );
      setCurrentPage('auth');
      window.location.hash = 'auth';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (page === 'auth') {
      setAuthNotice(options?.notice || '');
      if (options?.returnTo) {
        setPendingRedirect({ page: options.returnTo, options: options.returnOptions || {} });
      }
    } else {
      setAuthNotice('');
    }

    if (options && options.tab) {
      setProjectsInitialTab(options.tab);
      setProjectsTabNonce((n) => n + 1);
    } else if (page === 'projects') {
      setProjectsInitialTab('projects');
      setProjectsTabNonce((n) => n + 1);
    }
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user, selectedRole) => {
    const effectiveRole = user?.role || selectedRole || 'client';
    if (user) setCurrentUser(user);
    handleSetUserRole(effectiveRole);
    handleSetIsLoggedIn(true);
    setAuthNotice('');

    const targetPage = pendingRedirect?.page || 'projects';
    const targetOpts = pendingRedirect?.options || {};
    setPendingRedirect(null);

    if (targetOpts?.tab) {
      setProjectsInitialTab(targetOpts.tab);
      setProjectsTabNonce((n) => n + 1);
    } else if (targetPage === 'projects') {
      setProjectsInitialTab('projects');
      setProjectsTabNonce((n) => n + 1);
    }
    setCurrentPage(targetPage);
    window.location.hash = targetPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchResultSelect = (targetPage, item) => {
    setIsSearchOpen(false);
    if (targetPage === 'profile' && item) {
      setSelectedFreelancer(item);
    }
    if (targetPage === 'work' && item) {
      setSelectedProject(item);
    }
    navigateToPage(targetPage);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#171717] flex flex-col font-sans selection:bg-[#FCE2D3] selection:text-[#F36B21]">
      {/* Top Universal Navbar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={navigateToPage}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleSetIsLoggedIn}
        userRole={userRole}
        setUserRole={handleSetUserRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={navigateToPage}
            setSelectedFreelancer={setSelectedFreelancer}
            setSelectedProject={setSelectedProject}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentPage === 'talent' && (
          <FindTalentPage
            setCurrentPage={navigateToPage}
            setSelectedFreelancer={setSelectedFreelancer}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentPage === 'work' && (
          <FindWorkPage
            setCurrentPage={navigateToPage}
            setSelectedProject={setSelectedProject}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentPage === 'projects' && isLoggedIn && getAuthToken() && (
          <ProjectsHubPage
            setCurrentPage={navigateToPage}
            initialTab={projectsInitialTab}
            initialTabNonce={projectsTabNonce}
            userRole={userRole}
            setUserRole={handleSetUserRole}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}

        {currentPage === 'projects' && (!isLoggedIn || !getAuthToken()) && (
          <AuthPage
            setCurrentPage={navigateToPage}
            setIsLoggedIn={handleSetIsLoggedIn}
            userRole={userRole}
            setUserRole={handleSetUserRole}
            setCurrentUser={setCurrentUser}
            authNotice={authNotice || 'Sign in to access your Client Projects Hub or Freelancer Workspace.'}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            setCurrentPage={navigateToPage}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentPage === 'resources' && (
          <ResourcesPage
            setCurrentPage={navigateToPage}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            setCurrentPage={navigateToPage}
            setIsLoggedIn={handleSetIsLoggedIn}
            userRole={userRole}
            setUserRole={handleSetUserRole}
            setCurrentUser={setCurrentUser}
            authNotice={authNotice}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {currentPage === 'profile' && (
          <FreelancerProfilePage
            freelancer={selectedFreelancer}
            setCurrentPage={navigateToPage}
            isLoggedIn={isLoggedIn}
          />
        )}
      </main>

      {/* Global Command Palette / Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        navigateTo={navigateToPage}
      />

      {/* Footer on content pages */}
      {currentPage !== 'auth' && (
        <Footer setCurrentPage={navigateToPage} />
      )}

      {/* Offline Connectivity Notification Pill */}
      {!isOnline && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#171717] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-white/10 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Offline mode active. Cached assets available.</span>
        </div>
      )}
    </div>
  );
}
