import React, { useState } from 'react';
import { ArrowRight, Check, Heart, Shield, Globe } from 'lucide-react';

export default function Footer({ setCurrentPage }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FFF3EC] border-t border-[#EAE2DC] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[#EAE2DC]">
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-2 space-y-6">
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 cursor-pointer select-none group inline-flex"
            >
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
              <span className="text-2xl font-bold tracking-tight text-[#171717]">
                Workverse
              </span>
            </div>

            <p className="text-sm text-[#777777] max-w-sm leading-relaxed">
              A modern, architectural platform connecting visionary companies with elite independent developers, designers, and AI specialists. Built for what’s next.
            </p>

            {/* Newsletter Form */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                Stay updated with modern work insights
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! You're subscribed to Workverse Weekly.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex items-center max-w-md gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-2.5 rounded-full text-sm bg-white border border-[#EAE2DC] focus:outline-none focus:border-[#F36B21] transition-all placeholder:text-[#999999]"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white transition-colors shrink-0"
                    title="Subscribe"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 1: For Clients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              For Clients
            </h4>
            <ul className="space-y-2.5 text-sm text-[#777777]">
              <li>
                <button
                  onClick={() => navigateTo('talent')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Find Top Talent
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('projects')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Project Management
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('pricing')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Escrow Protection
                </span>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Enterprise Solutions
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: For Freelancers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              For Freelancers
            </h4>
            <ul className="space-y-2.5 text-sm text-[#777777]">
              <li>
                <button
                  onClick={() => navigateTo('work')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Explore Work
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('profile')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Talent Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('resources')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Guides & Tutorials
                </button>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Payment Assurance
                </span>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Community Guilds
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[#777777]">
              <li>
                <button
                  onClick={() => navigateTo('resources')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Resources Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('pricing')}
                  className="hover:text-[#F36B21] transition-colors"
                >
                  Subscription Tiers
                </button>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Security & Trust
                </span>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-[#F36B21] cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
          <div className="flex items-center gap-2">
            <span>© 2026 Workverse Inc. All rights reserved.</span>
            <span className="text-[#EAE2DC]">•</span>
            <span className="flex items-center gap-1 text-[#F36B21]">
              <Shield className="w-3.5 h-3.5" />
              Bank-grade Escrow
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-[#171717] cursor-pointer">Privacy</span>
            <span className="hover:text-[#171717] cursor-pointer">Terms</span>
            <span className="hover:text-[#171717] cursor-pointer">Security</span>
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

