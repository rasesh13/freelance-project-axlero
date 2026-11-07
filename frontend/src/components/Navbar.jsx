import React, { useState } from 'react';
import { Search, Bell, Menu, X, ChevronDown, ArrowRight, User, Briefcase, FileText, Settings, LogOut } from 'lucide-react';

export default function Navbar({
  currentPage,
  setCurrentPage,
  isLoggedIn,
  setIsLoggedIn,
  onOpenSearch,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);

  const navItems = [
    { id: 'talent', label: 'Find Talent' },
    { id: 'work', label: 'Find Work' },
    { id: 'projects', label: 'Projects' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'resources', label: 'Resources', hasDropdown: true },
  ];

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    setResourcesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            <div className="flex items-center gap-3 relative">
              {/* Notification Bell with Badge */}
              <button
                onClick={() => handleNavClick('projects')}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#171717] hover:bg-[#FFF3EC] border border-[#EAE2DC] transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F36B21] ring-2 ring-[#FFF9F5]" />
              </button>

              {/* User Avatar with Status Indicator */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] transition-all bg-white"
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Arjun Mehta"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 right-1" />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#EAE2DC] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-2 border-b border-[#EAE2DC]">
                      <p className="text-sm font-semibold text-[#171717]">Arjun Mehta</p>
                      <p className="text-xs text-[#777777]">arjun@workverse.io</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#777777]" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('projects');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-[#777777]" />
                        <span>Projects Hub</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavClick('pricing');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#171717] rounded-xl hover:bg-[#FFF3EC] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#777777]" />
                        <span>Subscription Plan</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#EAE2DC]">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsLoggedIn(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors"
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
                  <span>My Freelancer Profile</span>
                </button>
                <button
                  onClick={() => setIsLoggedIn(false)}
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

