import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import HomePage from './pages/HomePage';
import FindTalentPage from './pages/FindTalentPage';
import FindWorkPage from './pages/FindWorkPage';
import ProjectsHubPage from './pages/ProjectsHubPage';
import PricingPage from './pages/PricingPage';
import ResourcesPage from './pages/ResourcesPage';
import AuthPage from './pages/AuthPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import { FREELANCERS, PROJECTS } from './data/mockData';
import { getAuthToken } from './api/client';

const PROTECTED_PAGES = new Set(['projects']);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedFreelancer, setSelectedFreelancer] = useState(FREELANCERS[0]);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [projectsInitialTab, setProjectsInitialTab] = useState('projects');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [authNotice, setAuthNotice] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('wv_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    try {
      return localStorage.getItem('wv_user_role') || 'client';
    } catch {
      return 'client';
    }
  });

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

  // Global Ctrl+K / Cmd+K Search Shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
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
    }
    setCurrentPage(page);
    window.location.hash = page;
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
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={navigateToPage}
            setSelectedFreelancer={setSelectedFreelancer}
            setSelectedProject={setSelectedProject}
          />
        )}

        {currentPage === 'talent' && (
          <FindTalentPage
            setCurrentPage={navigateToPage}
            setSelectedFreelancer={setSelectedFreelancer}
          />
        )}

        {currentPage === 'work' && (
          <FindWorkPage
            setCurrentPage={navigateToPage}
            setSelectedProject={setSelectedProject}
          />
        )}

        {currentPage === 'projects' && isLoggedIn && getAuthToken() && (
          <ProjectsHubPage
            setCurrentPage={navigateToPage}
            initialTab={projectsInitialTab}
            userRole={userRole}
            setUserRole={handleSetUserRole}
          />
        )}

        {currentPage === 'projects' && (!isLoggedIn || !getAuthToken()) && (
          <AuthPage
            setCurrentPage={navigateToPage}
            setIsLoggedIn={handleSetIsLoggedIn}
            userRole={userRole}
            setUserRole={handleSetUserRole}
            authNotice={authNotice || 'Sign in to access your Client Projects Hub or Freelancer Workspace.'}
          />
        )}

        {currentPage === 'pricing' && (
          <PricingPage
            setCurrentPage={navigateToPage}
          />
        )}

        {currentPage === 'resources' && (
          <ResourcesPage
            setCurrentPage={navigateToPage}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            setCurrentPage={navigateToPage}
            setIsLoggedIn={handleSetIsLoggedIn}
            userRole={userRole}
            setUserRole={handleSetUserRole}
            authNotice={authNotice}
          />
        )}

        {currentPage === 'profile' && (
          <FreelancerProfilePage
            freelancer={selectedFreelancer}
            setCurrentPage={navigateToPage}
          />
        )}
      </main>

      {/* Global Command Palette / Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Footer on content pages */}
      {currentPage !== 'auth' && (
        <Footer setCurrentPage={navigateToPage} />
      )}
    </div>
  );
}
