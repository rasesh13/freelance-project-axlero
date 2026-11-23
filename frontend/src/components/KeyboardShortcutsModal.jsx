import React, { useEffect } from 'react';
import { Command, X, ArrowRight, Sparkles, Compass, FolderKanban, ShieldCheck, DollarSign } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    category: 'Global Platform',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Global Search', desc: 'Find talent, active projects, guides & articles' },
      { keys: ['Shift', '?'], label: 'Hotkeys Guide', desc: 'Open or close this shortcuts reference modal' },
      { keys: ['Esc'], label: 'Dismiss Dialogs', desc: 'Close any active modal, popover, or drawer' },
    ],
  },
  {
    category: 'Instant Navigation',
    items: [
      { keys: ['Alt', '1'], label: 'Home Page', desc: 'Return to platform home & marketplace feed' },
      { keys: ['Alt', '2'], label: 'Find Talent', desc: 'Browse verified independent specialists' },
      { keys: ['Alt', '3'], label: 'Find Work', desc: 'Explore funded contracts and RFPs' },
      { keys: ['Alt', '4'], label: 'Projects Hub', desc: 'Open client hub or contractor workspace' },
      { keys: ['Alt', '5'], label: 'Pricing Plans', desc: 'Review Workverse platform membership tiers' },
    ],
  },
  {
    category: 'Workspace Actions',
    items: [
      { keys: ['Alt', 'N'], label: 'New Project', desc: 'Open 3-step project commissioning wizard' },
      { keys: ['Alt', 'E'], label: 'Export Ledger', desc: 'Download CSV statement of escrow & wallet' },
      { keys: ['Alt', 'S'], label: 'Settings', desc: 'Access workspace security & profile preferences' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose, navigateTo }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotkeys-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#EAE2DC] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3ECE7] bg-[#FFF9F5]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] border border-[#FCE2D3] flex items-center justify-center text-[#F36B21]">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 id="hotkeys-modal-title" className="text-base sm:text-lg font-bold text-[#171717] flex items-center gap-2">
                Workverse Keyboard Shortcuts
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE2D3] text-[#F36B21] uppercase tracking-wide">
                  Pro Hotkeys
                </span>
              </h3>
              <p className="text-xs text-[#777777]">Power-user key combinations for fluid workspace navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="w-8 h-8 rounded-full border border-[#EAE2DC] hover:border-[#F36B21] flex items-center justify-center text-[#777777] hover:text-[#171717] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#999999] px-1">
                {group.category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F5]/40 border border-[#F3ECE7] hover:border-[#FCE2D3] transition-colors"
                  >
                    <div className="pr-2">
                      <div className="text-xs font-bold text-[#171717]">{item.label}</div>
                      <div className="text-[11px] text-[#777777] line-clamp-1">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg bg-white border border-[#EAE2DC] text-[#171717] shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F3ECE7] bg-[#FFF9F5]/60 flex items-center justify-between text-xs text-[#777777]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] rounded bg-white border border-[#EAE2DC]">?</kbd> anywhere to toggle this guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#171717] text-white font-semibold text-xs hover:bg-[#333333] transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
