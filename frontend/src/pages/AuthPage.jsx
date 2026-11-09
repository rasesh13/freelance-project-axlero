import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Check, Sparkles, Shield, ArrowLeft } from 'lucide-react';

export default function AuthPage({ setCurrentPage, setIsLoggedIn, userRole, setUserRole }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [role, setRole] = useState(userRole || 'client'); // 'client' | 'freelancer'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (setUserRole) {
        setUserRole(role);
      }
      setIsLoggedIn(true);
      setCurrentPage('projects');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  const handleSocialAuth = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (setUserRole) {
        setUserRole(role);
      }
      setIsLoggedIn(true);
      setCurrentPage('projects');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Outer Split-Screen Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#EAE2DC] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ========================================================
            LEFT COLUMN: ARCHITECTURAL WORKSPACE & MOUNTAIN SCENERY
        ======================================================== */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-10 bg-[#171717] text-white overflow-hidden">
          {/* Architectural Background Texture */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80')`,
            }}
          />

          {/* Warm Amber/Orange Lighting Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-[#171717]/80 to-transparent" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F36B21]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-semibold mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Workverse</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F36B21] flex items-center justify-center shadow-lg shadow-orange-500/30">
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
              <span className="text-2xl font-bold tracking-tight text-white">Workverse</span>
            </div>
          </div>

          {/* Middle Inspiring Quote */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#FCE2D3]">
              <Sparkles className="w-3.5 h-3.5 text-[#F36B21]" />
              <span>Next-Gen Work Paradigm</span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl leading-snug text-white/95">
              "The future of work is decentralized, fluid, and beautifully designed."
            </h2>

            <p className="text-xs text-white/70 leading-relaxed">
              Join elite software architects, product designers, and AI specialists building high-impact products with top founders.
            </p>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#F36B21]" />
              Bank-grade Escrow
            </span>
            <span>50K+ Freelancers</span>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: AUTHENTICATION FORM WITH TOGGLE
        ======================================================== */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Top Toggle: Log In | Sign Up (Image 7) */}
            <div className="flex items-center justify-between">
              <div className="lg:hidden flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#F36B21] flex items-center justify-center text-white">
                  <span className="font-bold text-xs">W</span>
                </div>
                <span className="font-bold text-base text-[#171717]">Workverse</span>
              </div>

              <div className="w-full sm:w-auto inline-flex items-center bg-[#FFF3EC] border border-[#EAE2DC] rounded-full p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-[#F36B21] text-white shadow-sm'
                      : 'text-[#777777] hover:text-[#171717]'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                  }}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    authMode === 'signup'
                      ? 'bg-[#F36B21] text-white shadow-sm'
                      : 'text-[#777777] hover:text-[#171717]'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Header Text */}
            <div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#171717]">
                {authMode === 'login' ? 'Welcome back to Workverse' : 'Create your Workverse account'}
              </h3>
              <p className="text-xs sm:text-sm text-[#777777] mt-1">
                {authMode === 'login'
                  ? 'Access your projects, escrow milestones, and team messages.'
                  : 'Get started in minutes and connect with world-class opportunities.'}
              </p>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#EAE2DC] hover:border-[#d4c8bf] hover:bg-[#FFF9F5] text-xs font-semibold text-[#171717] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('github')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#EAE2DC] hover:border-[#d4c8bf] hover:bg-[#FFF9F5] text-xs font-semibold text-[#171717] transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#EAE2DC]" />
              <span className="absolute px-3 bg-white text-[11px] uppercase tracking-wider text-[#777777]">
                or with email
              </span>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name input (only on Sign Up) */}
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Mehta"
                    required={authMode === 'signup'}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm focus:outline-none focus:border-[#F36B21] transition-all"
                  />
                </div>
              )}

              {/* Account intent / workspace role selector (Available on both Login & Sign Up) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                  {authMode === 'login' ? 'Select Workspace Mode' : 'I am joining Workverse to'}
                </label>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer flex flex-col gap-1 ${
                      role === 'client'
                        ? 'border-[#F36B21] bg-[#FFF3EC] text-[#F36B21] shadow-xs ring-1 ring-[#F36B21]'
                        : 'border-[#EAE2DC] bg-[#FFF9F5] text-[#777777] hover:border-[#F36B21]/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-sm">👔</span>
                      <span>Hire Talent</span>
                    </div>
                    <span className="text-[10px] font-normal text-[#888888]">Client & Hiring Hub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer flex flex-col gap-1 ${
                      role === 'freelancer'
                        ? 'border-[#F36B21] bg-[#FFF3EC] text-[#F36B21] shadow-xs ring-1 ring-[#F36B21]'
                        : 'border-[#EAE2DC] bg-[#FFF9F5] text-[#777777] hover:border-[#F36B21]/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-sm">💻</span>
                      <span>Work as Freelancer</span>
                    </div>
                    <span className="text-[10px] font-normal text-[#888888]">Specialist & Time Hub</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#888888]">
                  {role === 'client'
                    ? 'Opens Client Hub to manage project postings, review bids, and release escrow.'
                    : 'Opens Freelancer Hub to manage active contracts, time tracker, and earnings.'}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@workverse.io"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm focus:outline-none focus:border-[#F36B21] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-sm focus:outline-none focus:border-[#F36B21] pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#777777] hover:text-[#171717]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me / Forgot Password */}
              <div className="flex items-center justify-between text-xs text-[#777777] pt-1">
                {authMode === 'login' ? (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-[#F36B21] w-4 h-4 rounded"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-semibold text-[#F36B21] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </>
                ) : (
                  <label className="flex items-start gap-2 cursor-pointer select-none text-[11px]">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                      className="accent-[#F36B21] w-4 h-4 rounded mt-0.5"
                    />
                    <span>
                      I agree to the Workverse Terms of Service and Privacy Policy.
                    </span>
                  </label>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#171717] hover:bg-[#2b2b2b] text-white text-sm font-semibold transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 text-[#F36B21]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-[#171717]">Reset Password</h3>
            <p className="text-xs text-[#777777]">
              Enter your account email and we'll send you a secure reset link.
            </p>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-700">
                A password reset email has been sent to {forgotEmail || 'your email'}.
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs focus:outline-none focus:border-[#F36B21]"
                />
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="w-full py-2.5 rounded-full bg-[#F36B21] text-white text-xs font-semibold"
                >
                  Send Reset Link
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSent(false);
              }}
              className="text-xs text-[#777777] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

