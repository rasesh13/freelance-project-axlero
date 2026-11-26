import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Star, MapPin, Briefcase, Award, Heart, Share2, Send, ExternalLink, Calendar, MessageSquare, Shield, Clock, ChevronRight, X } from 'lucide-react';
import { createContract, sendMessage, toggleBookmark, fetchBookmarks, getAuthToken, uploadProfilePhoto } from '../api/client';

export default function FreelancerProfilePage({ freelancer, setCurrentPage, isLoggedIn = false, currentUser, setCurrentUser, setSelectedFreelancer }) {
  const currentFreelancer = freelancer;
  const isOwnProfile = Boolean(isLoggedIn && currentUser?.id && currentFreelancer?.userId === currentUser.id);
  const [coverFailed, setCoverFailed] = useState(false);
  const [actionError, setActionError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState('');
  const coverImage = !coverFailed && currentFreelancer?.coverImage && !currentFreelancer.coverImage.includes('images.unsplash.com')
    ? currentFreelancer.coverImage : '/images/pricing-bg.jpg';

  useEffect(() => setCoverFailed(false), [currentFreelancer?.id]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'portfolio' | 'history' | 'reviews'
  const [isSaved, setIsSaved] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hireMilestone, setHireMilestone] = useState('');
  const [hireBudget, setHireBudget] = useState('');
  const [hireHiredSuccess, setHireHiredSuccess] = useState(false);

  // Direct Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('Project Collaboration Opportunity');
  const [messageBody, setMessageBody] = useState('');
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  // Quick Inquiry Form State
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySentSuccess, setInquirySentSuccess] = useState(false);

  useEffect(() => {
    if (currentFreelancer) {
      setMessageBody(
        `Hi ${currentFreelancer.name}, I came across your Workverse profile and would love to discuss an upcoming project with you. Are you available for a quick chat?`
      );
      if (!isLoggedIn || !getAuthToken()) {
        setIsSaved(false);
        return;
      }
      fetchBookmarks('talent')
        .then((rows) => {
          if (Array.isArray(rows)) {
            setIsSaved(rows.some((r) => r.itemId === currentFreelancer.id));
          }
        })
        .catch(() => { });
    }
  }, [currentFreelancer?.id, isLoggedIn]);

  if (!currentFreelancer) {
    return (
      <div className="w-full min-h-screen bg-[#FFF9F5] flex items-center justify-center p-8">
        <div className="text-center space-y-3"><p className="font-semibold">Select a freelancer from Find Talent to view their profile.</p><button onClick={() => setCurrentPage('talent')} className="text-[#F36B21] font-bold underline">Browse talent</button></div>
      </div>
    );
  }

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !isOwnProfile) return;
    setPhotoUploading(true);
    setActionError('');
    setPhotoSuccess('');
    try {
      const result = await uploadProfilePhoto(file);
      setCurrentUser(result.user);
      setSelectedFreelancer((previous) => previous?.userId === result.user.id
        ? { ...previous, avatar: result.user.avatar }
        : previous);
      setPhotoSuccess('Profile photo updated.');
    } catch (error) {
      setActionError(error.message || 'Could not upload your photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: 'Sign in to save freelancer profiles.', returnTo: 'profile' });
      return;
    }
    setActionError('');
    try {
      const res = await toggleBookmark('talent', currentFreelancer.id);
      if (typeof res?.saved === 'boolean') setIsSaved(res.saved);
    } catch (err) {
      setActionError(err.message || 'Could not update your saved profiles.');
    }
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await createContract({
        title: hireMilestone,
        freelancerId: currentFreelancer.userId || currentFreelancer.id,
        freelancerName: currentFreelancer.name,
        budget: hireBudget,
      });
      setHireHiredSuccess(true);
      setTimeout(() => {
        setHireHiredSuccess(false);
        setIsHireModalOpen(false);
        setCurrentPage('projects');
      }, 1500);
    } catch (err) {
      setActionError(err.message || 'Could not create the contract offer.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await sendMessage({
        recipientId: currentFreelancer.userId || currentFreelancer.id,
        recipientName: currentFreelancer.name,
        recipientRole: currentFreelancer.title,
        recipientAvatar: currentFreelancer.avatar,
        project: messageSubject || 'Direct Message',
        text: messageBody,
      });
      setMessageSentSuccess(true);
      setTimeout(() => {
        setMessageSentSuccess(false);
        setIsMessageModalOpen(false);
      }, 1400);
    } catch (err) {
      setActionError(err.message || 'Could not send the message.');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !getAuthToken()) {
      setCurrentPage('auth', { notice: `Sign in to send an inquiry to ${currentFreelancer.name}.`, returnTo: 'profile' });
      return;
    }
    if (inquiryText.trim()) {
      try {
        await sendMessage({
          recipientId: currentFreelancer.userId || currentFreelancer.id,
          recipientName: currentFreelancer.name,
          recipientRole: currentFreelancer.title,
          recipientAvatar: currentFreelancer.avatar,
          project: 'Quick Inquiry',
          text: inquiryText.trim(),
        });
        setInquirySentSuccess(true);
        setTimeout(() => {
          setInquirySentSuccess(false);
          setInquiryText('');
        }, 2500);
      } catch (err) {
        setActionError(err.message || 'Could not send the inquiry.');
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24">
      {/* ========================================================
          ARCHITECTURAL COVER IMAGE (REFERENCE IMAGE 8)
      ======================================================== */}
      <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-[#171717] overflow-hidden">
        <img
          src={coverImage}
          onError={() => setCoverFailed(true)}
          alt="Warm architectural profile cover"
          className="w-full h-full object-cover opacity-85"
        />
        {/* Warm Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F5] via-transparent to-black/30" />
      </div>

      {/* ========================================================
          PROFILE HEADER CARD (OVERLAPPING COVER)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 relative z-10">
        <div className="wv-card bg-white p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative">
                <img
                  src={currentFreelancer.avatar}
                  alt={currentFreelancer.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-xl -mt-16 sm:-mt-20 bg-[#FFF3EC]"
                />
                {currentFreelancer.available && <span className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white absolute bottom-1 right-2" />}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
                    {currentFreelancer.name}
                  </h1>
                  {currentFreelancer.verified && <CheckCircle2 aria-label="Verified" className="w-5 h-5 text-[#F36B21] fill-[#FFF3EC]" />}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    • {currentFreelancer.available ? 'Available for Hire' : 'Not currently available'}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-medium text-[#777777]">
                  {currentFreelancer.role || currentFreelancer.title}
                </p>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#777777] pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#F36B21]" />
                    {currentFreelancer.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#F36B21]" />
                    {currentFreelancer.experience}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-[#171717]">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {currentFreelancer.reviewsCount ? currentFreelancer.rating : 'New'} ({currentFreelancer.reviewsCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Owners manage their photo; visitors can save, contact, or hire. */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[#EAE2DC]">
              {isOwnProfile ? (
                <>
                  <label htmlFor="public-profile-photo-upload" className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-colors">
                    <Camera className="w-4 h-4" />
                    {photoUploading ? 'Uploading Photo…' : 'Change Profile Photo'}
                  </label>
                  <input id="public-profile-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelected} disabled={photoUploading} className="sr-only" />
                  <button type="button" onClick={() => setCurrentPage('projects', { tab: 'settings' })} className="px-5 py-3 rounded-full border border-[#EAE2DC] text-[#171717] hover:bg-[#FFF3EC] hover:border-[#F36B21] text-xs font-semibold transition-colors">
                    Edit Profile
                  </button>
                  {photoSuccess && <span role="status" className="w-full text-center sm:text-right text-xs font-semibold text-emerald-700">{photoSuccess}</span>}
                </>
              ) : (
                <>
              <button
                onClick={handleToggleSave}
                className={`w-11 h-11 rounded-full border border-[#EAE2DC] flex items-center justify-center hover:bg-[#FFF3EC] transition-colors ${isSaved ? 'text-[#F36B21] border-[#F36B21]' : 'text-[#777777]'
                  }`}
                title="Save Profile"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#F36B21]' : 'stroke-current'}`} />
              </button>

              <button
                onClick={() => {
                  if (!isLoggedIn || !getAuthToken()) {
                    setCurrentPage('auth', {
                      notice: `Sign in to send a direct message to ${currentFreelancer.name}.`,
                      returnTo: 'profile',
                    });
                    return;
                  }
                  setIsMessageModalOpen(true);
                }}
                className="px-5 py-3 rounded-full border border-[#EAE2DC] text-[#171717] hover:bg-[#FFF3EC] hover:border-[#F36B21] transition-all text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-[#777777]" />
                <span>Message</span>
              </button>

              <button
                onClick={() => {
                  if (!isLoggedIn || !getAuthToken()) {
                    setCurrentPage('auth', {
                      notice: `Sign in as a client to hire or fund a contract with ${currentFreelancer.name}.`,
                      returnTo: 'profile',
                    });
                    return;
                  }
                  setIsHireModalOpen(true);
                }}
                className="px-7 py-3 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>Hire Me</span>
                <Send className="w-4 h-4" />
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          MAIN PROFILE CONTENT (2-COLUMN: BIO & SIDEBAR)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {actionError && <p role="alert" className="mb-5 p-4 bg-red-50 text-red-700 rounded-2xl text-sm">{actionError}</p>}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[#EAE2DC] pb-2 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'overview', label: 'Overview & Bio' },
                { id: 'portfolio', label: `Portfolio (${currentFreelancer.portfolio?.length || 0})` },
                { id: 'history', label: 'Work Experience' },
                { id: 'reviews', label: `Reviews (${currentFreelancer.reviewsCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-2 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36B21]/40 ${activeTab === tab.id
                      ? 'bg-[#FFF3EC] text-[#F36B21] border-[#F36B21]/25 font-bold shadow-sm'
                      : 'border-transparent text-[#777777] hover:bg-[#FFF9F5] hover:text-[#171717] hover:border-[#EAE2DC]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview & About Me */}
            {(activeTab === 'overview' || activeTab === 'portfolio') && (
              <div className="wv-card bg-white p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#171717] mb-3">About Me</h3>
                  <p className="text-sm text-[#777777] leading-relaxed">
                    {currentFreelancer.about}
                  </p>
                </div>

                {/* Skills Grid */}
                <div className="pt-4 border-t border-[#EAE2DC]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] mb-3">
                    Skills & Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(currentFreelancer.skills || []).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-medium text-[#171717] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F36B21]/40 hover:bg-[#FFF3EC] hover:shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Metrics Chips */}
                <div className="pt-4 border-t border-[#EAE2DC] grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                    <span className="text-xl font-bold text-[#171717]">
                      {currentFreelancer.jobSuccess}
                    </span>
                    <p className="text-[10px] text-[#777777] mt-0.5">Job Success</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                    <span className="text-xl font-bold text-[#171717]">
                      {currentFreelancer.completedProjects}
                    </span>
                    <p className="text-[10px] text-[#777777] mt-0.5">Projects Done</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC]">
                    <span className="text-xl font-bold text-[#171717]">
                      {currentFreelancer.reviewsCount ? currentFreelancer.rating : 'New'}
                    </span>
                    <p className="text-[10px] text-[#777777] mt-0.5">Rating Score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Featured Portfolio Projects */}
            {activeTab === 'portfolio' && <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#171717]">Featured Portfolio Projects</h3>

              {!currentFreelancer.portfolio?.length && <p className="text-sm text-[#777777]">No portfolio projects have been added yet.</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(currentFreelancer.portfolio || []).map((item) => (
                  <div
                    key={item.id}
                    className="wv-card bg-white p-5 space-y-3 hover:border-[#F36B21]/50 hover:shadow-md transition-all group"
                  >
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-[#FFF3EC] border border-[#EAE2DC]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <span className="text-[10px] uppercase font-bold text-[#F36B21] tracking-wider">
                      {item.category}
                    </span>

                    <h4 className="text-base font-bold text-[#171717]">{item.title}</h4>
                    <p className="text-xs text-[#777777] leading-relaxed">{item.description}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {(item.tech || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FFF9F5] border border-[#EAE2DC] text-[10px] text-[#777777]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Tab 3: Work History & Timeline */}
            {activeTab === 'history' && <div className="wv-card bg-white p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-[#171717]">Work Experience</h3>
              {!currentFreelancer.workHistory?.length && <p className="text-sm text-[#777777]">No work experience has been added yet.</p>}

              <div className="space-y-6 relative border-l-2 border-[#EAE2DC] ml-2 pl-6">
                {(currentFreelancer.workHistory || []).map((exp, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <span className="w-3 h-3 rounded-full bg-[#F36B21] absolute -left-[31px] top-1.5 ring-4 ring-white" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#171717]">{exp.role}</h4>
                      <span className="text-xs font-semibold text-[#F36B21] px-2.5 py-0.5 rounded-full bg-[#FFF3EC]">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#777777]">{exp.company}</p>
                    <p className="text-xs text-[#777777] leading-relaxed pt-1">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>}

            {/* Tab 4: Client Reviews */}
            {activeTab === 'reviews' && <div className="wv-card bg-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#171717]">Client Reviews</h3>
                <span className="flex items-center gap-1 text-xs font-bold text-[#171717]">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {currentFreelancer.reviewsCount ? `${currentFreelancer.rating} / 5.0` : 'No rating yet'}
                </span>
              </div>

              <div className="space-y-4">
                {!currentFreelancer.reviews?.length && <p className="text-sm text-[#777777]">No client reviews yet.</p>}
                {(currentFreelancer.reviews || []).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.avatar}
                          alt={rev.client}
                          className="w-9 h-9 rounded-full object-cover border border-[#EAE2DC]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#171717]">{rev.client}</p>
                          <p className="text-[10px] text-[#777777]">{rev.company}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#777777]">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>

                    <p className="text-xs text-[#777777] leading-relaxed italic">
                      "{rev.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>}
          </div>

          {/* Right Sticky Sidebar (Rate, Inquiry Form, Badges, Socials) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            {/* Rate & Booking Card */}
            <div className="wv-card p-6 bg-white space-y-5">
              <div className="flex items-baseline justify-between pb-4 border-b border-[#EAE2DC]">
                <div>
                  <span className="text-3xl font-bold text-[#171717]">
                    ${currentFreelancer.hourlyRate}
                  </span>
                  <span className="text-xs text-[#777777]"> / hour</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  • {currentFreelancer.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#777777]">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-semibold text-[#171717]">Not measured</span>
                </div>
                <div className="flex justify-between">
                  <span>Milestone Escrow:</span>
                  <span className="font-semibold text-[#777777]">Funding not integrated</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Contracts:</span>
                  <span className="font-semibold text-[#171717]">
                    {currentFreelancer.completedProjects}
                  </span>
                </div>
              </div>

              {isOwnProfile ? (
                <button onClick={() => setCurrentPage('projects', { tab: 'settings' })} className="w-full py-3.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20">
                  Edit My Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn || !getAuthToken()) return setCurrentPage('auth', { notice: 'Sign in as a client to create a contract offer.', returnTo: 'profile' });
                    setIsHireModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20"
                >
                  Hire {currentFreelancer.name}
                </button>
              )}
            </div>

            {/* Quick Inquiry Form */}
            {!isOwnProfile && <div className="wv-card p-6 bg-white space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Quick Project Inquiry
              </h4>
              <p className="text-xs text-[#777777]">
                Need a scoped proposal? Send a brief directly to {currentFreelancer.name}.
              </p>

              {inquirySentSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Inquiry Delivered!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    You can continue the conversation in your Projects Hub.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <textarea
                    rows={3}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    required
                    placeholder="Describe your project, timeline, and key requirements..."
                    className="w-full p-3 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs focus:outline-none focus:border-[#F36B21]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full border border-[#F36B21] text-[#F36B21] hover:bg-[#F36B21] hover:text-white transition-all text-xs font-semibold"
                  >
                    Send Inquiry
                  </button>
                </form>
              )}
            </div>}

            {/* Verification Credentials */}
            <div className="wv-card p-6 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Verifications & Badges
              </h4>
              <div className="space-y-2">
                {(currentFreelancer.verified ? ['Identity verified'] : []).map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#171717]">
                    <CheckCircle2 className="w-4 h-4 text-[#F36B21]" />
                    <span>{b}</span>
                  </div>
                ))}
                {!currentFreelancer.verified && <p className="text-xs text-[#777777]">No verification badge has been issued.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Message Modal */}
      {isMessageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsMessageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentFreelancer.avatar}
                  alt={currentFreelancer.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#EAE2DC]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-[#171717]">
                      {currentFreelancer.name}
                    </h3>
                    {currentFreelancer.verified && <CheckCircle2 className="w-4 h-4 text-[#F36B21]" />}
                  </div>
                  <p className="text-xs text-[#777777]">
                    ${currentFreelancer.hourlyRate}/hr • {currentFreelancer.available ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSentSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-800">
                  Message Sent to {currentFreelancer.name}!
                </h4>
                <p className="text-xs text-emerald-700">
                  Your message has been initiated. You can view and manage conversation threads in your Projects Hub.
                </p>
                <button
                  onClick={() => {
                    setIsMessageModalOpen(false);
                    setCurrentPage('projects');
                  }}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Go to Messages Hub
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                {/* Quick Subject Chips */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Topic / Subject
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'Project Collaboration',
                      'Technical Consultation',
                      'Immediate Availability',
                    ].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setMessageSubject(topic)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${messageSubject === topic
                            ? 'bg-[#FCE2D3] text-[#F36B21] border border-[#F36B21]'
                            : 'bg-[#FFF9F5] text-[#777777] border border-[#EAE2DC] hover:text-[#171717]'
                          }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs focus:outline-none focus:border-[#F36B21] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#777777] hover:text-[#171717]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <span>Send Direct Message</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hire Modal */}
      {isHireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-semibold">
                  Contract Agreement
                </span>
                <h3 className="text-lg font-bold text-[#171717] mt-1">
                  Hire {currentFreelancer.name}
                </h3>
              </div>
              <button
                onClick={() => setIsHireModalOpen(false)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {hireHiredSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-800">
                  Contract Offer Created!
                </h4>
                <p className="text-xs text-emerald-700">
                  Your offer was sent to {currentFreelancer.name}. No payment has been collected. Redirecting to your Projects Hub...
                </p>
              </div>
            ) : (
              <form onSubmit={handleHireSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1">
                    First Milestone Name
                  </label>
                  <input
                    type="text"
                    value={hireMilestone}
                    onChange={(e) => setHireMilestone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#171717] mb-1">
                    Proposed Milestone Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={hireBudget}
                    min="1"
                    onChange={(e) => setHireBudget(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF9F5] border border-[#EAE2DC] text-xs font-semibold focus:outline-none focus:border-[#F36B21]"
                  />
                  <p className="text-[10px] text-[#777777] mt-1">
                    This creates an offer only. No funds will be charged or held.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHireModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#777777]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#F36B21] hover:bg-[#e05e16] text-white text-xs font-semibold shadow-md shadow-orange-500/20"
                  >
                    Send Contract Offer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

