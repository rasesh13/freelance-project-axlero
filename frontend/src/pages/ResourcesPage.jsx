import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Sparkles, Clock, ArrowRight, ChevronDown, ChevronUp, FileText, CheckCircle2, Share2, Bookmark, X } from 'lucide-react';
import { fetchResources, fetchBookmarks, toggleBookmark, getAuthToken } from '../api/client';

export default function ResourcesPage({ setCurrentPage, isLoggedIn = false }) {
  const [articles, setArticles] = useState([]);
  const [resourcesError, setResourcesError] = useState('');
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [savedArticleIds, setSavedArticleIds] = useState([]);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    fetchResources()
      .then((data) => {
        if (Array.isArray(data)) {
          setArticles(data);
          const sharedId = new URLSearchParams(window.location.search).get('article');
          if (sharedId) setActiveArticleModal(data.find((item) => item.id === sharedId) || null);
        }
      })
      .catch((err) => setResourcesError(err.message || 'Could not load resources.'))
      .finally(() => setResourcesLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !getAuthToken()) {
      setSavedArticleIds([]);
      return;
    }
    fetchBookmarks('resource')
      .then((rows) => {
        if (Array.isArray(rows)) setSavedArticleIds(rows.map((r) => r.itemId));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const handleToggleSaveArticle = async (id) => {
    if (!isLoggedIn || !getAuthToken()) {
      setActiveArticleModal(null);
      if (setCurrentPage) {
        setCurrentPage('auth', { notice: 'Sign in to bookmark articles and guides.', returnTo: 'resources' });
      }
      return;
    }
    try {
      const res = await toggleBookmark('resource', id);
      if (res?.ids) setSavedArticleIds(res.ids);
    } catch (err) {
      setResourcesError(err.message || 'Could not save this resource.');
    }
  };

  const handleShareArticle = async (article) => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('article', article.id);
    shareUrl.hash = 'resources';
    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setResourcesError('Unable to copy the resource link.');
    }
  };

  const categories = ['All', 'Getting Started', 'Tutorials', 'Guides', 'Best Practices', 'FAQs'];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const featuredArticle = articles.find((a) => a.featured) || articles[0];

  const faqs = [
    {
      q: 'How does Workverse protect freelancer and client payments?',
      a: 'Workverse tracks contract and milestone status. Real project funding and payouts are not connected; pricing payments are simulations only.',
    },
    {
      q: 'What are the platform commission fees on Workverse?',
      a: 'The plan prices are illustrative demo tiers. No real project payment or commission is collected on this local instance.',
    },
    {
      q: 'How do talent verifications work?',
      a: 'The directory shows the verification status stored on each account. New freelancers are not automatically marked verified.',
    },
    {
      q: 'Can clients hire full distributed engineering teams?',
      a: 'Clients can invite registered users into project teams and manage work in the Projects Hub. Consolidated real billing is not available.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FFF9F5] text-[#171717] pb-24">
      {/* ========================================================
          HERO HEADER
      ======================================================== */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21]">
            — Knowledge Base & Guides
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[62px] leading-[1.1] tracking-tight text-[#171717]">
            Workverse <span className="text-[#F36B21] italic">Resources Hub</span>
          </h1>

          <p className="text-base sm:text-lg text-[#777777] max-w-xl mx-auto">
            Practical playbooks, architectural tutorials, and career guides written by top engineers and design directors.
          </p>

          {/* Big Search Bar */}
          <div className="relative max-w-xl mx-auto flex items-center bg-white rounded-full border border-[#EAE2DC] p-2 shadow-sm focus-within:border-[#F36B21] transition-all">
            <Search className="w-5 h-5 text-[#777777] ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, tutorials, best practices..."
              className="w-full px-3 py-2 text-sm text-[#171717] placeholder:text-[#999999] focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FCE2D3] text-[#171717] shadow-xs'
                    : 'bg-white hover:bg-[#FFF3EC] text-[#777777] border border-[#EAE2DC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {resourcesError && <p role="alert" className="max-w-7xl mx-auto px-4 text-sm text-red-700">{resourcesError}</p>}
      {resourcesLoading && <p className="max-w-7xl mx-auto px-4 text-sm text-[#777777]">Loading resources…</p>}

      {/* ========================================================
          FEATURED RESOURCE BANNER
      ======================================================== */}
      {selectedCategory === 'All' && !searchQuery && featuredArticle && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div
            onClick={() => setActiveArticleModal(featuredArticle)}
            className="wv-card bg-white p-6 sm:p-10 border border-[#EAE2DC] hover:border-[#F36B21]/50 cursor-pointer group transition-all"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-bold uppercase tracking-wider">
                    Featured Guide
                  </span>
                  <span className="text-xs text-[#777777] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredArticle.readTime}
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-4xl text-[#171717] leading-snug group-hover:text-[#F36B21] transition-colors">
                  {featuredArticle.title}
                </h2>

                <p className="text-sm sm:text-base text-[#777777] leading-relaxed">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[#EAE2DC]">
                  <div className="flex items-center gap-3">
                    <img
                      src={featuredArticle.author.avatar}
                      alt={featuredArticle.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EAE2DC]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#171717]">
                        {featuredArticle.author.name}
                      </span>
                      <p className="text-[10px] text-[#777777]">{featuredArticle.date}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#F36B21] group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[16/10] bg-[#FFF3EC] border border-[#EAE2DC]">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          LATEST ARTICLES GRID
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#171717]">Latest Playbooks & Guides</h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Showing {filteredArticles.length} curated resources
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setActiveArticleModal(art)}
              className="wv-card bg-white p-6 flex flex-col justify-between hover:border-[#F36B21]/50 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div>
                <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-4 border border-[#EAE2DC] bg-[#FFF3EC]">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#777777] mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#F36B21] font-semibold text-[11px]">
                    {art.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {art.readTime}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#171717] group-hover:text-[#F36B21] transition-colors leading-snug mb-2">
                  {art.title}
                </h4>

                <p className="text-xs text-[#777777] line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#EAE2DC] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={art.author.avatar}
                    alt={art.author.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-[#171717] font-medium">{art.author.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#777777] group-hover:text-[#F36B21] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          FREQUENTLY ASKED QUESTIONS SECTION
      ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FCE2D3] text-xs font-semibold text-[#F36B21]">
            Help & Answers
          </div>
          <h3 className="font-editorial text-3xl sm:text-4xl text-[#171717]">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="wv-card bg-white p-5 transition-all"
              >
                <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : idx)} className="w-full flex items-center justify-between text-left">
                  <h4 className="text-sm sm:text-base font-bold text-[#171717] pr-4">
                    {faq.q}
                  </h4>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#F36B21] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#777777] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs sm:text-sm text-[#777777] leading-relaxed pt-3 border-t border-[#EAE2DC] mt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Article Reader Modal */}
      {activeArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#EAE2DC] p-6 sm:p-10 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#FFF3EC] text-[#F36B21] text-xs font-bold uppercase">
                {activeArticleModal.category}
              </span>
              <button
                onClick={() => setActiveArticleModal(null)}
                className="p-1 rounded-full text-[#777777] hover:text-[#171717] hover:bg-[#FFF3EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="font-editorial text-2xl sm:text-4xl text-[#171717] leading-tight">
                {activeArticleModal.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#777777]">
                <span>By {activeArticleModal.author.name}</span>
                <span>•</span>
                <span>{activeArticleModal.date}</span>
                <span>•</span>
                <span>{activeArticleModal.readTime}</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-[16/9] border border-[#EAE2DC]">
              <img
                src={activeArticleModal.image}
                alt={activeArticleModal.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-sm sm:text-base text-[#171717]/80 leading-relaxed font-sans">
              <p className="font-medium text-[#171717]">{activeArticleModal.excerpt}</p>
              <p>{activeArticleModal.content || 'The full guide has not been published yet.'}</p>
            </div>

            <div className="pt-6 border-t border-[#EAE2DC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSaveArticle(activeArticleModal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors cursor-pointer ${
                    savedArticleIds.includes(activeArticleModal.id)
                      ? 'border-[#F36B21] bg-[#FFF3EC] text-[#F36B21] font-semibold'
                      : 'border-[#EAE2DC] text-[#777777] hover:text-[#171717]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(activeArticleModal.id) ? 'fill-[#F36B21]' : ''}`} />
                  <span>{savedArticleIds.includes(activeArticleModal.id) ? 'Saved' : 'Save for Later'}</span>
                </button>
                <button
                  onClick={() => handleShareArticle(activeArticleModal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAE2DC] text-xs text-[#777777] hover:text-[#171717] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              <button
                onClick={() => setActiveArticleModal(null)}
                className="px-5 py-2 rounded-full bg-[#171717] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

