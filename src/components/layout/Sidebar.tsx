import {
  BookOpen,
  Bot,
  FolderKanban,
  GraduationCap,
  Home,
  Library,
  Orbit,
  Settings,
  X,
} from 'lucide-react';
import type { Language } from '../../types/knowledge';
import { TRANSLATIONS } from '../../i18n/translations';

export type NavSection =
  | 'home'
  | 'universe'
  | 'categories'
  | 'notes'
  | 'learning'
  | 'resources'
  | 'ai'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  language: Language;
  totalNotes: number;
  completedTopics: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  language,
  totalNotes,
  completedTopics,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const t = TRANSLATIONS[language];

  const navItems: Array<{ id: NavSection; label: string; icon: typeof Home }> = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'universe', label: t.nav.universe, icon: Orbit },
    { id: 'categories', label: t.nav.categories, icon: FolderKanban },
    { id: 'notes', label: t.nav.notes, icon: BookOpen },
    { id: 'learning', label: t.nav.learning, icon: GraduationCap },
    { id: 'resources', label: t.nav.resources, icon: Library },
    { id: 'ai', label: t.nav.ai, icon: Bot },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const navBody = (isMobileDrawer = false) => (
    <div
      className={`flex h-full flex-col justify-between liquid-glass px-4 py-5 ${
        isMobileDrawer ? 'rounded-r-2xl border-l-0' : 'rounded-2xl'
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-white/[0.10]">
          <button
            type="button"
            onClick={() => {
              onSelectSection('home');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#E5B85C] rounded-xl transition-transform active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5B85C]/15 border border-[#E5B85C]/35 text-[#E5B85C] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <Orbit className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-sm font-medium tracking-tight text-[#F5F5F7] whitespace-nowrap">
                {t.brandTitle}
              </span>
              <span className="block text-[11px] text-[#A1A1AA] truncate">
                {t.brandSubtitle}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-2 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary Navigation" className="mt-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#E5B85C] active:scale-[0.98] ${
                  active
                    ? 'bg-white/[0.11] text-[#F5F5F7] border border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                    : 'text-[#A1A1AA] hover:bg-white/[0.05] hover:text-[#F5F5F7] border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active ? 'text-[#E5B85C]' : 'text-[#A1A1AA]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/[0.10] px-2 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
          <span>{t.dashboard.totalNotes}</span>
          <span className="font-mono tabular-nums text-[#F5F5F7]">{totalNotes}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
          <span>{t.dashboard.completedTopics}</span>
          <span className="font-mono tabular-nums text-[#E5B85C]">{completedTopics}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[16.75rem] shrink-0 h-screen sticky top-0 p-3 pr-0">
        {navBody(false)}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">{navBody(true)}</aside>
        </div>
      )}
    </>
  );
}
