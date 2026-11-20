import { useEffect, useState } from 'react';
import { Check, Copy, Database, KeyRound, LogOut, User } from 'lucide-react';
import type { Language, UserProfile } from '../../types/knowledge';
import { api } from '../../services/api';

interface SettingsViewProps {
  profile: UserProfile;
  supabaseConfigured: boolean;
  aiConfigured: boolean;
  onUpdateSettings: (updates: Partial<UserProfile>) => Promise<void>;
  onAuthChanged: () => Promise<void>;
}

export function SettingsView({
  profile,
  supabaseConfigured,
  aiConfigured,
  onUpdateSettings,
  onAuthChanged,
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [language, setLanguage] = useState<Language>(profile.language);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [prefer2D, setPrefer2D] = useState(profile.prefer2DUniverse);
  const [savedMsg, setSavedMsg] = useState('');

  // Auth form
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [sqlSchema, setSqlSchema] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setRoleTitle(profile.roleTitle);
    setLanguage(profile.language);
    setDailyGoal(profile.dailyGoal);
    setPrefer2D(profile.prefer2DUniverse);
  }, [profile]);

  useEffect(() => {
    api.getSupabaseSchema().then((d) => setSqlSchema(d.sql)).catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      displayName,
      roleTitle,
      language,
      dailyGoal,
      prefer2DUniverse: prefer2D,
    });
    setSavedMsg('Workspace preferences saved.');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      if (authMode === 'register') {
        await api.register(email, password, regName);
      } else {
        await api.login(email, password);
      }
      setEmail('');
      setPassword('');
      await onAuthChanged();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    await onAuthChanged();
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-white">Settings & Workspace</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage your profile, bilingual interface, 3D rendering mode, authentication, and database sync.
        </p>
      </div>

      {/* Workspace Preferences */}
      <form
        onSubmit={handleSaveProfile}
        className="liquid-glass rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-medium text-[#F5F5F7] flex items-center gap-2">
            <User className="h-4 w-4 text-[#E5B85C]" />
            <span>Profile & Learning Preferences</span>
          </h3>
          {savedMsg && <span className="text-xs text-emerald-400">{savedMsg}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pref-name" className="block text-xs text-[#A1A1AA] mb-1">
              Display Name
            </label>
            <input
              id="pref-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="pref-role" className="block text-xs text-[#A1A1AA] mb-1">
              Role / Focus
            </label>
            <input
              id="pref-role"
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="pref-lang" className="block text-xs text-[#A1A1AA] mb-1">
              Interface Language
            </label>
            <select
              id="pref-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm bg-[#0C101B]"
            >
              <option value="en">English</option>
              <option value="km">ភាសាខ្មែរ (Khmer + EN Marketing Terms)</option>
            </select>
          </div>
          <div>
            <label htmlFor="pref-goal" className="block text-xs text-[#A1A1AA] mb-1">
              Daily Learning Goal ({dailyGoal} actions/day)
            </label>
            <input
              id="pref-goal"
              type="range"
              min={1}
              max={10}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full accent-[#E5B85C] mt-2"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[#F5F5F7] pt-1">
          <input
            type="checkbox"
            checked={prefer2D}
            onChange={(e) => setPrefer2D(e.target.checked)}
            className="h-4 w-4 accent-[#E5B85C]"
          />
          <span>Default Knowledge Universe to lightweight 2D Orbital Map</span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            className="liquid-btn-primary rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Account Authentication */}
      <section className="liquid-glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-medium text-[#F5F5F7] flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#5EA2EF]" />
            <span>Account & Authentication</span>
          </h3>
          <span className="text-xs text-slate-400">
            Active account: <strong className="text-slate-200">{profile.email}</strong>{' '}
            {profile.isDemo ? '(Demo Workspace)' : '(Personal Account)'}
          </span>
        </div>

        {!profile.isDemo ? (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="text-sm text-slate-200">
              Signed in as <span className="font-medium text-white">{profile.displayName}</span> ({profile.email})
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out to Demo Mode</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  authMode === 'login' ? 'bg-white/15 text-white' : 'text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  authMode === 'register' ? 'bg-white/15 text-white' : 'text-slate-400'
                }`}
              >
                Create Personal Account
              </button>
            </div>

            {authError && <p className="text-xs text-rose-400">{authError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {authMode === 'register' && (
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your Name"
                  aria-label="Your Name"
                  className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                />
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                aria-label="Password"
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={authBusy}
              className="rounded-lg bg-[#5EA2EF] px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-[#77b3f5]"
            >
              {authBusy ? 'Processing...' : authMode === 'register' ? 'Create Account & Seed Universe' : 'Sign In'}
            </button>
          </form>
        )}
      </section>

      {/* Database & Supabase Setup Guide */}
      <section className="liquid-glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-medium text-[#F5F5F7] flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <span>Database Persistence & Supabase Migration</span>
          </h3>
          <div className="text-xs text-slate-400">
            SQLite Persistence: <span className="text-emerald-400">Active</span> · Supabase:{' '}
            <span className={supabaseConfigured ? 'text-emerald-400' : 'text-amber-300'}>
              {supabaseConfigured ? 'Connected' : 'Local Demo Persistence Mode'}
            </span>{' '}
            · Gemini AI:{' '}
            <span className={aiConfigured ? 'text-emerald-400' : 'text-amber-300'}>
              {aiConfigured ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          All notes, categories, connections, flashcards, quiz logs, and resources persist automatically
          in the relational SQLite database (<code className="font-mono">data/second_brain.db</code>). To
          connect external Supabase PostgreSQL, configure{' '}
          <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your environment and run the
          13-table schema migration below in the Supabase SQL Editor.
        </p>

        {sqlSchema && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">
                supabase/migrations/001_initial_schema.sql
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchema);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:text-white"
              >
                {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? 'Copied SQL' : 'Copy Migration SQL'}</span>
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-slate-300">
              {sqlSchema}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
