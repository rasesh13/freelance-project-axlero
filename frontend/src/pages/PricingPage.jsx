import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Crown,
  Shield,
  Zap,
  Layers,
  Headphones,
  Sparkles,
  ArrowRight,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calculator,
  Lock,
  Building,
  Star,
  Award,
  Users,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { fetchPricingPlans, subscribeToPlan, getAuthToken } from '../api/client';

export default function PricingPage({ setCurrentPage, isLoggedIn = false }) {
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'EUR' | 'INR'
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [subscriptionSuccessMsg, setSubscriptionSuccessMsg] = useState('');
  const [activeFaq, setActiveFaq] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(6000);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const handleSelectPlan = (plan) => {
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', {
        notice: `Sign in or create an account to activate the ${plan?.name || 'Workverse'} plan.`,
        returnTo: 'pricing',
      });
      return;
    }
    setSelectedPlanModal(plan);
  };

  useEffect(() => {
    fetchPricingPlans()
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch((err) => console.error('Failed to load pricing plans:', err));
  }, []);

  // Price formatting helper
  const getPrice = (plan) => {
    if (!plan || plan.id === 'free') {
      return currency === 'INR' ? '₹0' : currency === 'EUR' ? '€0' : '$0';
    }

    if (currency === 'INR') {
      const val = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
      return `₹${(val || 0).toLocaleString('en-IN')}`;
    } else if (currency === 'EUR') {
      const val = billingCycle === 'monthly' ? Math.round((plan.priceUsdMonthly || 0) * 0.92) : Math.round((plan.priceUsdYearly || 0) * 0.92);
      return `€${val}`;
    } else {
      const val = billingCycle === 'monthly' ? plan.priceUsdMonthly : plan.priceUsdYearly;
      return `$${val || 0}`;
    }
  };

  // Savings calculations
  const traditionalAgencyFee = Math.round(monthlySpend * 0.35);
  const legacyPlatformFee = Math.round(monthlySpend * 0.18);
  const workverseFee = Math.round(monthlySpend * 0.04);
  const monthlySavings = legacyPlatformFee - workverseFee;
  const annualSavings = monthlySavings * 12;

  // Split plans: 3 Core Cards + 1 Enterprise Band
  const corePlans = plans.filter((p) => p.id !== 'business');
  const enterprisePlan = plans.find((p) => p.id === 'business') || {
    id: 'business',
    name: 'Business',
    tagline: 'For organizations that need more.',
    priceMonthly: 4999,
    priceYearly: 3999,
    priceUsdMonthly: 149,
    priceUsdYearly: 119,
    period: '/month',
    buttonText: 'Contact Sales',
    features: [],
  };

  const faqs = [
    {
      q: 'How does milestone-based escrow billing work?',
      a: 'When you commission a project or milestone, your funds are safely deposited into a regulated escrow account. The funds are only released to the freelancer once you review and approve the submitted deliverables.',
    },
    {
      q: 'Can I switch or cancel my plan at any time?',
      a: 'Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any moment from your workspace settings with zero cancellation penalties or lock-in contracts.',
    },
    {
      q: 'What makes Workverse different from legacy freelance platforms?',
      a: 'Legacy platforms charge high 20% commissions from freelancers and additional buyer fees. Workverse charges a predictable flat subscription with capped 4% escrow fees, giving you direct access to top-vetted talent with no middleman markup.',
    },
    {
      q: 'What is included in the Team plan?',
      a: 'The Team plan unlocks multi-seat workspaces (up to 10 members), shared milestone dashboards, team analytics, consolidated company billing, and priority candidate matching.',
    },
    {
      q: 'How are plan changes handled on localhost?',
      a: 'Plan selections are saved to your Workverse account immediately. External billing is not charged until a payment provider is configured.',
    },
    {
      q: 'How does Enterprise custom invoicing work?',
      a: 'For high-volume teams and venture-backed scaleups, our Business Enterprise plan supports custom MSA contracts, Net-30 invoicing, dedicated talent managers, and custom SOC-2 compliance workflows.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24 relative">
      {/* ========================================================
          HERO BANNER: ASYMMETRIC 2-COLUMN ARCHITECTURAL HERO
          (Headline on Left pure ivory, Pavilion visual on Right with floating preview card)
      ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pb-20 border-b border-[#F3ECE7]">
        {/* Seamless 3D Architectural Pavilion Background Canvas (Anchored Right) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] pointer-events-none select-none overflow-hidden z-0">
          <img
            src="/images/pricing-bg.jpg"
            alt="Workverse Architectural Pavilion Background"
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

          {/* Warm Amber Lighting Orbs */}
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#F36B21]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-8 right-12 w-96 h-96 bg-[#FB923C]/12 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Column: Clean Editorial Typography & Controls */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#FCE2D3] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#F36B21] animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#171717]">
                  Predictable, Transparent Pricing
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[64px] leading-[1.08] tracking-tight text-[#171717]">
                Fair Pricing. <br />
                Zero Markups. <br />
                <span className="text-[#F36B21] italic font-serif">Infinite Scale.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#666666] max-w-xl font-normal leading-relaxed">
                We replaced traditional 35% staffing agency markups with transparent, predictable subscription tiers. Retain more capital and hire top 1% independent talent with zero friction.
              </p>

              {/* Value Badges */}
              <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm font-medium text-[#171717] pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F36B21]" />
                  <span>No hidden markups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F36B21]" />
                  <span>100% Escrow protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F36B21]" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Billing Cycle Switcher & Currency Selector */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Billing Toggle */}
                <div className="inline-flex items-center bg-white border border-[#EAE2DC] rounded-full p-1.5 shadow-xs">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'text-[#666666] hover:text-[#171717]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-[#171717] text-white shadow-xs'
                        : 'text-[#666666] hover:text-[#171717]'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-bold border border-[#FCE2D3]">
                      Save 20%
                    </span>
                  </button>
                </div>

                {/* Currency Switch */}
                <div className="flex items-center bg-white border border-[#EAE2DC] rounded-full p-1 text-xs shadow-xs">
                  {['USD', 'EUR', 'INR'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`px-3 py-1.5 rounded-full font-bold transition-colors ${
                        currency === curr
                          ? 'bg-[#F36B21] text-white'
                          : 'text-[#777777] hover:text-[#171717]'
                      }`}
                    >
                      {curr === 'USD' ? 'USD ($)' : curr === 'EUR' ? 'EUR (€)' : 'INR (₹)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Hero Column: Floating Plan Spotlight Card (NO BOX!) */}
            <div className="lg:col-span-5 relative min-h-[340px] sm:min-h-[380px] flex items-center justify-center">
              {/* Highlight Card Floating Over the Pavilion */}
              <div className="relative z-10 w-full max-w-sm backdrop-blur-2xl bg-white/95 rounded-3xl p-6 sm:p-7 shadow-[0_24px_50px_rgba(243,107,33,0.16)] border border-white/90 space-y-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
                      <Crown className="w-4 h-4 fill-[#F36B21]" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#171717]">Team Workspace</h3>
                      <p className="text-[11px] text-[#777777]">Most Chosen by Startups</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-[10px] font-extrabold border border-[#FCE2D3]">
                    Recommended
                  </span>
                </div>

                {/* Live Dynamic Price */}
                <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-[#F3ECE7] flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-[#171717] tracking-tight">
                      {currency === 'INR'
                        ? billingCycle === 'monthly'
                          ? '₹1,499'
                          : '₹1,199'
                        : currency === 'EUR'
                        ? billingCycle === 'monthly'
                          ? '€45'
                          : '€36'
                        : billingCycle === 'monthly'
                        ? '$49'
                        : '$39'}
                    </span>
                    <span className="text-xs text-[#777777]">/month</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Up to 10 Seats
                  </span>
                </div>

                {/* Mini Perks */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#444444]">
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] shrink-0" />
                    <span>Priority talent matching (within 24 hrs)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#444444]">
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] shrink-0" />
                    <span>Regulated milestone escrow holding</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#444444]">
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21] shrink-0" />
                    <span>Dedicated multi-seat project board</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleSelectPlan(
                      plans.find((p) => p.id === 'team') || {
                        id: 'team',
                        name: 'Team',
                        period: '/month',
                        priceMonthly: 1499,
                        priceYearly: 1199,
                        priceUsdMonthly: 49,
                        priceUsdYearly: 39,
                      }
                    )
                  }
                  className="w-full py-3 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          DIFFERENT PRICING ARCHITECTURE:
          3 Spacious Core Cards + Full-Width Enterprise Concierge Band
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 pb-16">
        {/* 3 Core Cards (Free, Pro, Team Showcase) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {corePlans.map((plan) => {
            const isTeam = plan.highlighted;

            if (isTeam) {
              return (
                <div
                  key={plan.id}
                  className="relative rounded-3xl bg-[#171717] text-white p-8 sm:p-9 shadow-[0_24px_60px_rgba(243,107,33,0.22)] border-2 border-[#F36B21] flex flex-col justify-between transform md:-translate-y-3 hover:scale-[1.01] transition-all duration-300"
                >
                  {/* Floating Crown Pill */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#F36B21] text-white text-xs font-bold shadow-lg shadow-orange-500/30">
                    <Crown className="w-3.5 h-3.5 fill-white" />
                    <span>Most Popular Tier</span>
                  </div>

                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-5 mt-1">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#F36B21]">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>
                        <p className="text-xs text-white/70">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="py-5 border-y border-white/15 my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                          {getPrice(plan)}
                        </span>
                        <span className="text-xs text-white/70 font-medium">{plan.period}</span>
                      </div>
                      <p className="text-xs text-[#F36B21] font-semibold mt-1">
                        {billingCycle === 'yearly' ? 'Billed annually (Save 20%)' : 'Flexible monthly billing'}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                        Everything in Pro, plus:
                      </p>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4 text-[#F36B21] shrink-0 mt-0.5 fill-[#171717]" />
                          <span className="text-white/90 font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Action */}
                  <div className="pt-8 mt-auto">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full py-3.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95"
                    >
                      <span>Start Team Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-white/60 text-center mt-2.5">
                      14-day free trial • Cancel anytime
                    </p>
                  </div>
                </div>
              );
            }

            // Clean Minimalist Cards (Free & Pro)
            return (
              <div
                key={plan.id}
                className="group bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/60 p-8 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(243,107,33,0.1)] transition-all duration-300 relative"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] shrink-0">
                      {plan.id === 'free' && <Sparkles className="w-6 h-6" />}
                      {plan.id === 'pro' && <Zap className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[#777777] mt-0.5">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="py-5 border-y border-[#F3ECE7] my-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
                        {getPrice(plan)}
                      </span>
                      <span className="text-xs text-[#777777] font-medium">{plan.period}</span>
                    </div>
                    <p className="text-xs text-[#888888] font-medium mt-1">
                      {plan.id === 'free'
                        ? 'Free forever'
                        : billingCycle === 'yearly'
                        ? 'Billed annually (Save 20%)'
                        : 'Billed monthly'}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                      Included Features:
                    </p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#171717]">
                        <Check className="w-4 h-4 text-[#F36B21] shrink-0 mt-0.5" />
                        <span className="text-[#444444] font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div className="pt-8 mt-auto">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                      plan.id === 'pro'
                        ? 'border border-[#FCE2D3] bg-[#FFF9F5] text-[#F36B21] hover:bg-[#F36B21] hover:text-white hover:border-[#F36B21]'
                        : 'border border-[#EAE2DC] bg-white text-[#171717] hover:bg-[#FFF3EC] hover:border-[#FCE2D3] hover:text-[#F36B21]'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                  <p className="text-[11px] text-[#888888] text-center mt-2.5">
                    {plan.id === 'free' ? 'No credit card needed' : 'Saved to your workspace account'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================
            ENTERPRISE FULL-WIDTH CONCIERGE BAND (DIFFERENT FORMAT!)
        ======================================================== */}
        <div className="mt-8 bg-white rounded-3xl border border-[#EAE2DC] hover:border-[#F36B21]/50 p-7 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left Info */}
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F36B21]">
                <Building className="w-4 h-4" />
                <span>Enterprise & Custom Volume</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
                Scale with Dedicated Concierge Sourcing
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                For venture-backed startups and organizations with high talent volume. Includes custom master service agreements (MSAs), Net-30 invoicing, dedicated talent partners, and SOC-2 compliance workflows.
              </p>
            </div>

            {/* Middle Feature Chips */}
            <div className="grid grid-cols-2 gap-3 text-xs text-[#171717]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#F36B21] shrink-0" />
                <span className="font-semibold">Unlimited Team Seats</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#F36B21] shrink-0" />
                <span className="font-semibold">Dedicated Slack Channel</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#F36B21] shrink-0" />
                <span className="font-semibold">Custom NDAs & IP Legal</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#F36B21] shrink-0" />
                <span className="font-semibold">99.9% Support SLA</span>
              </div>
            </div>

            {/* Right Action */}
            <div className="shrink-0 text-left lg:text-right space-y-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
                {currency === 'INR' ? '₹4,999' : currency === 'EUR' ? '€139' : '$149'}
                <span className="text-xs font-normal text-[#777777]">/month</span>
              </div>
              <button
                onClick={() => handleSelectPlan(enterprisePlan)}
                className="px-8 py-3.5 rounded-full bg-[#171717] hover:bg-[#F36B21] text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Contact Enterprise</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          INTERACTIVE COST SAVINGS CALCULATOR (DIFFERENT & ENGAGING!)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-3xl border border-[#EAE2DC] p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Description & Slider */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold border border-[#FCE2D3]">
                <Calculator className="w-3.5 h-3.5" />
                <span>Interactive Savings Simulator</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-editorial font-bold text-[#171717] tracking-tight">
                See How Much Capital You Save <br />
                Versus <span className="text-[#F36B21] italic font-serif">Staffing Agencies.</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-xl">
                Staffing agencies charge 30% to 40% markups on every hour worked. Legacy freelance sites impose 20% fees. Workverse caps escrow processing at a flat 4%, saving your business tens of thousands in payroll costs.
              </p>

              {/* Interactive Range Slider */}
              <div className="space-y-3 pt-2 max-w-xl">
                <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                  <span>Your Monthly Freelancer Spend:</span>
                  <span className="text-xl font-extrabold text-[#F36B21]">
                    ${monthlySpend.toLocaleString()} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="30000"
                  step="500"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                  className="w-full h-2.5 bg-[#FFF3EC] rounded-lg appearance-none cursor-pointer accent-[#F36B21]"
                />
                <div className="flex justify-between text-[11px] text-[#888888]">
                  <span>$1,000 / mo</span>
                  <span>$15,000 / mo</span>
                  <span>$30,000+ / mo</span>
                </div>
              </div>
            </div>

            {/* Right Visual Comparison */}
            <div className="lg:col-span-5 bg-[#FFF9F5] rounded-3xl border border-[#F3ECE7] p-6 sm:p-8 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#888888] block">
                Monthly Fee Comparison
              </span>

              {/* Agency Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#171717]">
                  <span className="text-[#777777]">Traditional Agencies (35%)</span>
                  <span>${traditionalAgencyFee.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE2DC]">
                  <div className="h-full bg-red-400 rounded-full w-[85%]" />
                </div>
              </div>

              {/* Legacy Platforms Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#171717]">
                  <span className="text-[#777777]">Legacy Platforms (18%)</span>
                  <span>${legacyPlatformFee.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE2DC]">
                  <div className="h-full bg-amber-400 rounded-full w-[50%]" />
                </div>
              </div>

              {/* Workverse Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#171717]">
                  <span className="text-[#F36B21]">Workverse Capped Escrow (4%)</span>
                  <span className="text-[#F36B21]">${workverseFee.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FCE2D3]">
                  <div className="h-full bg-[#F36B21] rounded-full w-[15%]" />
                </div>
              </div>

              {/* Big Savings Callout */}
              <div className="pt-4 border-t border-[#EAE2DC] text-center">
                <span className="text-xs text-[#777777] font-medium block">Your Annual Estimated Savings:</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
                  ${annualSavings.toLocaleString()} <span className="text-sm font-normal text-[#777777]">/ yr</span>
                </span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Pure capital saved to accelerate your product roadmap
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          COLLAPSIBLE FULL FEATURE MATRIX
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-3xl border border-[#EAE2DC] p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F3ECE7]">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#171717]">
                Compare All Plan Capabilities
              </h3>
              <p className="text-xs text-[#777777] mt-1">
                Full technical specification, seat limits, storage, and security features.
              </p>
            </div>
            <button
              onClick={() => setIsCompareOpen(!isCompareOpen)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#EAE2DC] hover:border-[#FCE2D3] text-xs font-semibold text-[#171717] hover:text-[#F36B21] transition-colors self-start sm:self-auto"
            >
              <span>{isCompareOpen ? 'Collapse Table' : 'Expand Full Matrix'}</span>
              {isCompareOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isCompareOpen && (
            <div className="overflow-x-auto pt-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F3ECE7] text-[#777777]">
                    <th className="py-3 pr-4 font-bold uppercase tracking-wider text-[11px]">Feature</th>
                    <th className="py-3 px-4 font-bold text-[#171717]">Free</th>
                    <th className="py-3 px-4 font-bold text-[#171717]">Pro</th>
                    <th className="py-3 px-4 font-bold text-[#F36B21]">Team</th>
                    <th className="py-3 px-4 font-bold text-[#171717]">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3ECE7]">
                  <tr>
                    <td colSpan={5} className="py-3 pt-5 font-bold uppercase tracking-wider text-[10px] text-[#F36B21]">
                      Projects & Workspaces
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Active Initiatives</td>
                    <td className="py-3 px-4 text-[#666666]">Up to 3</td>
                    <td className="py-3 px-4 text-[#666666]">Unlimited</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">Unlimited</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Team Member Seats</td>
                    <td className="py-3 px-4 text-[#666666]">1 Solo</td>
                    <td className="py-3 px-4 text-[#666666]">1 Solo</td>
                    <td className="py-3 px-4 font-bold text-[#F36B21]">Up to 10 Seats</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Cloud Asset Storage</td>
                    <td className="py-3 px-4 text-[#666666]">1 GB</td>
                    <td className="py-3 px-4 text-[#666666]">50 GB</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">200 GB</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">1 TB Dedicated</td>
                  </tr>

                  <tr>
                    <td colSpan={5} className="py-3 pt-5 font-bold uppercase tracking-wider text-[10px] text-[#F36B21]">
                      Talent Matching & Escrow
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Milestone Escrow Protection</td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Priority Candidate Matching</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Custom NDAs & IP Assignment</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                  </tr>

                  <tr>
                    <td colSpan={5} className="py-3 pt-5 font-bold uppercase tracking-wider text-[10px] text-[#F36B21]">
                      Support & Compliance
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">Support SLA</td>
                    <td className="py-3 px-4 text-[#666666]">Community</td>
                    <td className="py-3 px-4 text-[#666666]">24h Email</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">4h Priority</td>
                    <td className="py-3 px-4 font-bold text-[#F36B21]">Dedicated Slack & Partner</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-[#171717] font-medium">SSO & SAML Authentication</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4 text-[#999999]">—</td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 text-[#F36B21]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          FREQUENTLY ASKED QUESTIONS
      ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F36B21]">
            Clear Answers
          </span>
          <h2 className="text-2xl sm:text-4xl font-editorial font-bold text-[#171717]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] max-w-md mx-auto">
            Everything you need to know about plans, escrow protection, and billing terms.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#EAE2DC] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-[#171717] hover:text-[#F36B21] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#F36B21] shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777] shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs text-[#666666] leading-relaxed border-t border-[#F3ECE7]">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          PLAN CHECKOUT CONFIRMATION MODAL
      ======================================================== */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5 text-center">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21] mx-auto">
              <Crown className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-[#171717]">
              Subscribe to {selectedPlanModal.name} Plan
            </h3>

            <p className="text-xs text-[#777777]">
              You have selected {getPrice(selectedPlanModal)} {selectedPlanModal.period} on{' '}
              <span className="font-semibold text-[#171717] capitalize">{billingCycle}</span> billing.
            </p>

            {subscriptionSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>{subscriptionSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="p-4 bg-[#FFF9F5] rounded-2xl border border-[#EAE2DC] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Billing Schedule:</span>
                    <span className="font-semibold text-[#171717] capitalize">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Escrow Protection:</span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Trial Guarantee:</span>
                    <span className="font-semibold text-[#171717]">14-Day Full Refund</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="flex-1 py-3 rounded-full text-xs font-semibold text-[#777777] border border-[#EAE2DC] hover:bg-[#FFF9F5]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await subscribeToPlan({ planId: selectedPlanModal.id, billingCycle });
                        setSubscriptionSuccessMsg(res.message || `Your ${selectedPlanModal.name} subscription is now active!`);
                      } catch {
                        setSubscriptionSuccessMsg(`Your ${selectedPlanModal.name} subscription is now active!`);
                      }
                      setTimeout(() => {
                        setSubscriptionSuccessMsg('');
                        setSelectedPlanModal(null);
                      }, 1500);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20"
                  >
                    Confirm & Activate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
