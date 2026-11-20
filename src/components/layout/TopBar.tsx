import { Globe, Menu, Plus, Search } from 'lucide-react';
import type { Language } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';
import type { NavSection } from './Sidebar';

interface TopBarProps {
  activeSection: NavSection;
  language: Language;
  onToggleLanguage: () => void;
  onOpenSearch: () => void;
  onOpenNewTopic: () => void;
  onOpenMobileNav: () => void;
}

export function TopBar({
  activeSection,
  language,
  onToggleLanguage,
  onOpenSearch,
  onOpenNewTopic,
  onOpenMobileNav,
}: TopBarProps) {
  const t = TRANSLATIONS[language];
  const sectionTitleMap: Record<NavSection, string> = {
    home: t.nav.home,
    universe: t.nav.universe,
    categories: t.nav.categories,
    notes: t.nav.notes,
    learning: t.nav.learning,
    resources: t.nav.resources,
    ai: t.nav.ai,
    settings: t.nav.settings,
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 liquid-glass-topbar px-4 sm:px-6 lg:px-8 h-16 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-xl hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-base sm:text-lg font-medium tracking-tight text-[#F5F5F7] truncate">
          {sectionTitleMap[activeSection]}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Global Search"
          className="liquid-btn-glass flex items-center gap-2.5 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] whitespace-nowrap"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#A1A1AA]" />
          <span className="hidden md:inline max-w-[195px] truncate text-left">{t.actions.searchPlaceholder}</span>
          <span className="hidden sm:inline md:hidden">Search</span>
          <kbd className="hidden md:inline shrink-0 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[#A1A1AA]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onToggleLanguage}
          aria-label={language === 'en' ? 'Switch language to Khmer' : 'Switch language to English'}
          className="liquid-btn-glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[#F5F5F7] whitespace-nowrap shrink-0"
        >
          <Globe className="h-3.5 w-3.5 text-[#5EA2EF]" />
          <span>{language === 'en' ? 'EN' : 'ខ្មែរ'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewTopic}
          className="liquid-btn-primary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.actions.newTopic}</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
}
