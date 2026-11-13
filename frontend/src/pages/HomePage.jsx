import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Users, Layers, Star, CheckCircle2, Shield, Sparkles, Code2, Palette, Cpu, Cloud, Smartphone, TrendingUp, Briefcase, FolderKanban } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchTalents, fetchProjects, fetchBookmarks, toggleBookmark, getAuthToken } from '../api/client';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage({ setCurrentPage, setSelectedFreelancer, setSelectedProject, isLoggedIn = false }) {
  const rootRef = useRef(null);
  const [featuredTalents, setFeaturedTalents] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [savedTalentIds, setSavedTalentIds] = useState([]);

  useEffect(() => {
    fetchTalents().then((data) => {
      if (Array.isArray(data)) setFeaturedTalents(data.slice(0, 3));
    }).catch(() => {});
    fetchProjects().then((data) => {
      if (Array.isArray(data)) setFeaturedProjects(data.slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken()) {
      setSavedTalentIds([]);
      return;
    }
    fetchBookmarks('talent').then((rows) => {
      if (Array.isArray(rows)) setSavedTalentIds(rows.map((r) => r.itemId));
    }).catch(() => {});
  }, [isLoggedIn]);

  const handleToggleTalentBookmark = async (id, e) => {
    e.stopPropagation();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: 'Sign in to bookmark freelancers.', returnTo: 'home' });
      return;
    }
    setSavedTalentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      const res = await toggleBookmark('talent', id);
      if (res?.ids) setSavedTalentIds(res.ids);
    } catch (err) {
      console.error('Failed to toggle talent bookmark:', err);
    }
  };

  const navigateTo = (page, data = null) => {
    if (page === 'profile' && data) {
      setSelectedFreelancer(data);
    }
    if (page === 'work' && data) {
      setSelectedProject(data);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // GSAP Smooth Entrance Stagger & Scroll Transitions
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.hero-pill-badge',
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      )
        .fromTo(
          '.hero-editorial-heading',
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85 },
          '-=0.35'
        )
        .fromTo(
          '.hero-editorial-desc',
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65 },
          '-=0.45'
        )
        .fromTo(
          '.hero-action-buttons',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          '.hero-stats-row',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          '-=0.35'
        );

      // Section Reveals on Scroll
      const revealElements = gsap.utils.toArray('.section-reveal');
      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 35, opacity: 0 },
          {
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 50%',
              toggleActions: 'play none none reverse',
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="w-full bg-[#FFF9F5] text-[#171717]">
      {/* ========================================================
          HERO SECTION (REFINED EDITORIAL COMPOSITION)
      ======================================================== */}
      <section className="hero-section relative w-full min-h-[640px] lg:min-h-[740px] xl:min-h-[800px] flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT SIDE: Exact reference composition & refined typography */}
            <div className="lg:col-span-6 space-y-7 max-w-xl z-20">
              {/* Badge: Small Freelance Marketplace */}
              <div className="hero-pill-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#F36B21]" />
                <span className="text-xs sm:text-sm font-semibold text-[#171717] tracking-tight">
                  Freelance Marketplace
                </span>
              </div>

              {/* Editorial Heading */}
              <h1 className="hero-editorial-heading font-editorial text-4xl sm:text-6xl lg:text-[72px] leading-[1.06] tracking-tight text-[#171717]">
                Hire Freelancers. <br />
                Build What's <span className="text-[#F36B21] italic font-serif">Next.</span>
              </h1>

              {/* Description */}
              <p className="hero-editorial-desc text-base sm:text-lg text-[#555555] leading-relaxed max-w-lg font-sans">
                A modern platform to hire skilled freelancers, manage projects, and bring your ideas to life.
              </p>

              {/* Buttons: Black Get Started + White Browse Talent */}
              <div className="hero-action-buttons flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => navigateTo('talent')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-[#171717] hover:bg-[#262626] transition-all shadow-sm hover:translate-y-[-1px] cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigateTo('talent')}
                  className="px-7 py-3.5 rounded-full text-sm font-semibold text-[#171717] bg-white hover:bg-[#FFF3EC] border border-[#EAE2DC] transition-all hover:border-[#d6c9c1] cursor-pointer shadow-xs"
                >
                  Browse Talent
                </button>
              </div>

              {/* Statistics Row (50K+ Freelancers, 12K+ Active Projects, 4.9 Average Rating) */}
              <div className="hero-stats-row pt-8 border-t border-[#EAE2DC] flex items-center gap-4 sm:gap-7">
                {/* Stat 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#171717] shrink-0">
                    <Users className="w-4.5 h-4.5 text-[#171717]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#171717] tracking-tight">50K+</div>
                    <div className="text-xs text-[#777777] font-medium">Freelancers</div>
                  </div>
                </div>

                {/* Elegant Divider 1 */}
                <div className="h-8 w-px bg-[#EAE2DC] shrink-0" />

                {/* Stat 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#171717] shrink-0">
                    <Layers className="w-4.5 h-4.5 text-[#171717]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#171717] tracking-tight">12K+</div>
                    <div className="text-xs text-[#777777] font-medium">Active Projects</div>
                  </div>
                </div>

                {/* Elegant Divider 2 */}
                <div className="h-8 w-px bg-[#EAE2DC] shrink-0" />

                {/* Stat 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                    <Star className="w-4.5 h-4.5 text-[#F36B21] fill-[#F36B21]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#171717] tracking-tight">4.9</div>
                    <div className="text-xs text-[#777777] font-medium">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for desktop layout balance */}
            <div className="hidden lg:block lg:col-span-6 pointer-events-none" />
          </div>
        </div>

        {/* RIGHT SIDE: Exact Replicated Architectural Landmark Visual (100% Completely STATIC) */}
        {/* Fixed in original position within hero, zero parallax, zero scroll animation, zero cursor movement */}
        <div className="absolute top-0 right-0 w-full sm:w-[85%] md:w-[75%] lg:w-[55%] xl:w-[53%] h-full pointer-events-none flex items-end justify-end overflow-hidden z-0 select-none">
          <img
            src="/images/hero-building-exact.jpg"
            alt="Workverse Monumental Architectural Landmark"
            className="w-full h-full object-cover object-right-bottom select-none pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 8%, black 20%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 8%, black 20%, black 100%)',
            }}
          />
        </div>
      </section>

      {/* ========================================================
          1. TRUSTED BY SECTION
      ======================================================== */}
      <section className="section-reveal border-y border-[#EAE2DC] bg-[#FFF3EC]/50 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#777777] mb-6">
            Trusted by fast-moving companies and design-forward startups
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
            <span className="text-lg sm:text-xl font-bold tracking-tighter text-[#171717]">
              STRIPE
            </span>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-[#171717]">
              Linear
            </span>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#171717]">
              airbnb
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold tracking-wider text-[#171717]">
              ▲ Vercel
            </span>
            <span className="text-lg sm:text-xl font-serif font-bold tracking-tight text-[#171717]">
              Notion
            </span>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#171717]">
              Figma
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. EVERYTHING YOU NEED TO WORK BETTER (PREMIER 4-CATEGORY SECTION)
      ======================================================== */}
      <section className="section-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 relative z-10">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F36B21]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-[#171717] tracking-tight leading-[1.12]">
            Everything You Need to <span className="text-[#F36B21] italic font-serif">Work Better.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#555555] mt-4 leading-relaxed font-sans">
            A comprehensive, unified ecosystem designed for ambitious businesses and the world's finest independent talent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Find Talent */}
          <div
            onClick={() => navigateTo('talent')}
            className="wv-card bg-white p-7 rounded-2xl border border-[#EAE2DC] hover:border-[#F36B21]/60 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] group-hover:scale-105 group-hover:bg-[#F36B21] group-hover:text-white transition-all duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-[#999999] tracking-wider uppercase">01</span>
              </div>
              <h3 className="text-xl font-bold text-[#171717] tracking-tight mb-2 group-hover:text-[#F36B21] transition-colors">
                Find Talent
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-6 font-sans">
                Source pre-vetted engineers, designers, and specialists ready to accelerate your product roadmap.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-[#EAE2DC]/80">
                {['Verified Portfolios', 'Fast-Track Matching', 'Top 1% Independent Builders'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#555555]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F36B21]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-[#EAE2DC]/80 flex items-center justify-between text-xs font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
              <span>Browse Directory</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Discover Projects */}
          <div
            onClick={() => navigateTo('work')}
            className="wv-card bg-white p-7 rounded-2xl border border-[#EAE2DC] hover:border-[#F36B21]/60 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] group-hover:scale-105 group-hover:bg-[#F36B21] group-hover:text-white transition-all duration-300">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-[#999999] tracking-wider uppercase">02</span>
              </div>
              <h3 className="text-xl font-bold text-[#171717] tracking-tight mb-2 group-hover:text-[#F36B21] transition-colors">
                Discover Projects
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-6 font-sans">
                Access handpicked, high-value opportunities from venture-backed startups and global design leaders.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-[#EAE2DC]/80">
                {['Fixed-Price & Retainers', 'Direct Client Access', 'Guaranteed Milestone Escrow'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#555555]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F36B21]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-[#EAE2DC]/80 flex items-center justify-between text-xs font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Collaborate with Teams */}
          <div
            onClick={() => navigateTo('projects')}
            className="wv-card bg-white p-7 rounded-2xl border border-[#EAE2DC] hover:border-[#F36B21]/60 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] group-hover:scale-105 group-hover:bg-[#F36B21] group-hover:text-white transition-all duration-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-[#999999] tracking-wider uppercase">03</span>
              </div>
              <h3 className="text-xl font-bold text-[#171717] tracking-tight mb-2 group-hover:text-[#F36B21] transition-colors">
                Collaborate with Teams
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-6 font-sans">
                Assemble multi-disciplinary squads, share context in real time, and align cross-functional workflows.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-[#EAE2DC]/80">
                {['Dedicated Team Spaces', 'Live Milestone Reviews', 'Role & Permission Controls'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#555555]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F36B21]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-[#EAE2DC]/80 flex items-center justify-between text-xs font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
              <span>Team Workspaces</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Manage Your Work */}
          <div
            onClick={() => navigateTo('projects')}
            className="wv-card bg-white p-7 rounded-2xl border border-[#EAE2DC] hover:border-[#F36B21]/60 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] group-hover:scale-105 group-hover:bg-[#F36B21] group-hover:text-white transition-all duration-300">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-[#999999] tracking-wider uppercase">04</span>
              </div>
              <h3 className="text-xl font-bold text-[#171717] tracking-tight mb-2 group-hover:text-[#F36B21] transition-colors">
                Manage Your Work
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-6 font-sans">
                Track delivery stages, automate billing, and keep deliverables transparent from inception to sign-off.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-[#EAE2DC]/80">
                {['Automated Invoicing', 'Deadline Tracking & Alerts', 'Auditable Deliverables'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#555555]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F36B21]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-6 border-t border-[#EAE2DC]/80 flex items-center justify-between text-xs font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
              <span>Projects Command Center</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. EXPLORE SERVICES
      ======================================================== */}
      <section className="section-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21] mb-3">
              Explore Services
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#171717]">
              High-Impact Capabilities for Every Stage
            </h2>
          </div>
          <button
            onClick={() => navigateTo('talent')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#F36B21] hover:text-[#d45512] transition-colors"
          >
            <span>All Categories (120+)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Code2,
              title: 'Full Stack & Web Development',
              desc: 'Production-ready Next.js, React, Node, microservices, and high-performance databases.',
              talents: '4,820+ Freelancers',
            },
            {
              icon: Palette,
              title: 'UI/UX & Design Systems',
              desc: 'High-fidelity Figma prototypes, design tokens, micro-interactions, and conversion-optimized web design.',
              talents: '3,140+ Freelancers',
            },
            {
              icon: Cpu,
              title: 'AI, LLMs & Machine Learning',
              desc: 'Autonomous agent frameworks, fine-tuning, RAG pipelines, and automated intelligence.',
              talents: '1,890+ Freelancers',
            },
            {
              icon: Cloud,
              title: 'Cloud Architecture & DevOps',
              desc: 'Kubernetes, Terraform, GCP/AWS infrastructure, CI/CD pipelines, and zero-downtime scalability.',
              talents: '1,420+ Freelancers',
            },
            {
              icon: Smartphone,
              title: 'Mobile App Engineering',
              desc: 'Native iOS and Android applications, React Native, cross-platform fluid experiences.',
              talents: '2,110+ Freelancers',
            },
            {
              icon: TrendingUp,
              title: 'Growth Marketing & Technical SEO',
              desc: 'Data analytics, automated acquisition funnels, retention loops, and technical search positioning.',
              talents: '1,120+ Freelancers',
            },
          ].map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                onClick={() => navigateTo('talent')}
                className="wv-card wv-card-interactive p-7 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] mb-5 group-hover:scale-110 group-hover:bg-[#F36B21] group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#171717] mb-2">
                    {srv.title}
                  </h3>
                  <p className="text-sm text-[#777777] leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-[#EAE2DC] flex items-center justify-between text-xs font-semibold text-[#777777] group-hover:text-[#F36B21]">
                  <span>{srv.talents}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          3. FEATURED FREELANCERS
      ======================================================== */}
      <section className="section-reveal bg-[#FFF3EC]/40 border-y border-[#EAE2DC] py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAE2DC] text-xs font-semibold text-[#F36B21] mb-3">
                Verified Talent
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#171717]">
                Featured Independent Builders
              </h2>
            </div>
            <button
              onClick={() => navigateTo('talent')}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#F36B21] hover:underline"
            >
              <span>Explore all verified builders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTalents.map((f) => (
              <div
                key={f.id}
                className="wv-card bg-white p-6 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Available
                    </span>
                    <button
                      onClick={(e) => handleToggleTalentBookmark(f.id, e)}
                      title={savedTalentIds.includes(f.id) ? 'Saved' : 'Save Specialist'}
                      className={`transition-colors cursor-pointer ${savedTalentIds.includes(f.id) ? 'text-[#F36B21]' : 'text-[#777777] hover:text-[#F36B21]'}`}
                    >
                      <svg className="w-5 h-5" fill={savedTalentIds.includes(f.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-center pb-4">
                    <img
                      src={f.avatar}
                      alt={f.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#FCE2D3] shadow-sm mb-3"
                    />
                    <div className="flex items-center justify-center gap-1.5">
                      <h4 className="text-base font-bold text-[#171717]">{f.name}</h4>
                      <CheckCircle2 className="w-4 h-4 text-[#F36B21] fill-[#FFF3EC]" />
                    </div>
                    <p className="text-xs text-[#777777] mt-0.5">{f.title}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-y border-[#EAE2DC] text-xs">
                    <div className="flex items-center gap-1 text-[#171717] font-semibold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{f.rating}</span>
                      <span className="text-[#777777] font-normal">({f.reviewsCount} reviews)</span>
                    </div>
                    <span className="text-sm font-bold text-[#171717]">${f.hourlyRate}/hr</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-4">
                    {f.skills.slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#777777]"
                      >
                        {s}
                      </span>
                    ))}
                    <span className="px-2 py-1 rounded-full bg-[#FFF3EC] text-xs text-[#F36B21] font-medium">
                      +2
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('profile', f)}
                  className="w-full py-2.5 rounded-full border border-[#F36B21] text-[#F36B21] hover:bg-[#F36B21] hover:text-white transition-all text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. HOW WORKVERSE WORKS
      ======================================================== */}
      <section className="section-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21] mb-3">
            Workflow Architecture
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-[#171717] mb-4">
            How Workverse Works
          </h2>
          <p className="text-sm sm:text-base text-[#777777]">
            From milestone scoping to verified delivery, collaborate with zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: '01',
              title: 'Discover or Post a Scope',
              desc: 'Search pre-vetted specialists or publish your technical brief to receive handpicked proposals within hours.',
            },
            {
              step: '02',
              title: 'Collaborate in Projects Hub',
              desc: 'Track milestones, review pull requests, exchange files, and hold sprint reviews in a clean unified dashboard.',
            },
            {
              step: '03',
              title: 'Protected Milestone Escrow',
              desc: 'Deposit funds safely into automated escrow. Payouts are released only after you inspect and approve deliverables.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="wv-card p-8 bg-white relative overflow-hidden flex flex-col justify-between"
            >
              <div className="text-5xl font-editorial font-bold text-[#FCE2D3] mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-[#171717] mb-3">{item.title}</h3>
              <p className="text-sm text-[#777777] leading-relaxed">{item.desc}</p>
              <div className="pt-6 mt-6 border-t border-[#EAE2DC]/60 flex items-center gap-2 text-xs font-semibold text-[#F36B21]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero platform friction</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          5. FEATURED PROJECTS
      ======================================================== */}
      <section className="section-reveal bg-[#FFF3EC]/40 border-y border-[#EAE2DC] py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAE2DC] text-xs font-semibold text-[#F36B21] mb-3">
                Live Opportunities
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#171717]">
                Featured Active Projects
              </h2>
            </div>
            <button
              onClick={() => navigateTo('work')}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#F36B21] hover:underline"
            >
              <span>Explore all active jobs (5.2K+)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {featuredProjects.map((p) => (
              <div
                key={p.id}
                className="wv-card p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#F36B21]/50 transition-all"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold">
                      {p.category}
                    </span>
                    <span className="text-xs text-[#777777]">• {p.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#171717]">{p.title}</h3>
                  <p className="text-sm text-[#777777] line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {p.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs text-[#777777]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#EAE2DC]">
                  <div>
                    <div className="text-lg font-bold text-[#171717]">{p.budget}</div>
                    <div className="text-xs text-[#777777] md:text-right">{p.budgetType}</div>
                  </div>
                  <button
                    onClick={() => navigateTo('work', p)}
                    className="px-5 py-2 rounded-full border border-[#F36B21] text-[#F36B21] hover:bg-[#F36B21] hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. WHY WORKVERSE
      ======================================================== */}
      <section className="section-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21] mb-4">
              The Workverse Standard
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl text-[#171717] leading-tight mb-6">
              Engineered for Visionaries, Built for High Performance.
            </h2>
            <p className="text-base text-[#777777] leading-relaxed mb-8">
              Legacy freelance sites are crowded with generic bids and opaque fees. Workverse is designed like a modern architectural atelier: curated talent, milestone transparency, and an intuitive, beautiful interface.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Top 3% Verified Specialists', desc: 'Every contractor passes portfolio review and code architecture benchmarks.' },
                { title: 'Safe Milestone Escrow', desc: 'Zero disputes or surprise payouts. Full financial protection for both sides.' },
                { title: 'Integrated Project Workspace', desc: 'Manage deadlines, team members, deliverables, and communication in one hub.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#171717]">{item.title}</h4>
                    <p className="text-xs text-[#777777] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-[#EAE2DC] shadow-xl aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              alt="Workverse Modern Architectural Workspace"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs uppercase tracking-widest text-[#FCE2D3] font-semibold mb-1">
                Spatial Design & Ergonomics
              </span>
              <p className="text-lg font-editorial">
                "Workverse gave our engineering team the elite frontend firepower we needed to ship ahead of our Series A."
              </p>
              <p className="text-xs opacity-80 mt-2">— VP Engineering at Hyperscale</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FINAL CALL TO ACTION BANNER
      ======================================================== */}
      <section className="section-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#171717] to-[#242424] text-white p-10 sm:p-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F36B21]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#FCE2D3]">
              <Sparkles className="w-3.5 h-3.5 text-[#F36B21]" />
              <span>Start Building Today</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-5xl leading-tight">
              Ready to Hire Freelancers and Build What's <span className="text-[#F36B21] italic">Next?</span>
            </h2>

            <p className="text-sm sm:text-base text-[#aaaaaa] leading-relaxed">
              Join over 50,000 top engineers, designers, and fast-growing startups on the premier freelance marketplace.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigateTo('talent')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-[#171717] bg-white hover:bg-[#FFF3EC] transition-all shadow-md"
              >
                <span>Find Talent</span>
                <ArrowRight className="w-4 h-4 text-[#F36B21]" />
              </button>

              <button
                onClick={() => navigateTo('work')}
                className="px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-transparent hover:bg-white/10 border border-white/30 transition-all"
              >
                Find Work
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
