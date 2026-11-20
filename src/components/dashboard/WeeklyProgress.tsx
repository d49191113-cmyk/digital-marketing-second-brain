import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language, StudyLog } from '../../types/knowledge';
import { computeWeeklyPointsSeries } from '../../utils/knowledgeLogic';
import { TRANSLATIONS } from '../../i18n/translations';

interface WeeklyProgressProps {
  studyLogs: StudyLog[];
  language: Language;
}

export function WeeklyProgress({ studyLogs, language }: WeeklyProgressProps) {
  const t = TRANSLATIONS[language];

  const weekly = useMemo(() => computeWeeklyPointsSeries(studyLogs), [studyLogs]);

  return (
    <section
      aria-label={t.dashboard.weeklyProgressTitle}
      className="liquid-glass rounded-2xl p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-medium text-[#F5F5F7] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#E5B85C]" />
            <span>{t.dashboard.weeklyProgressTitle}</span>
          </h3>
          <p className="mt-0.5 text-xs text-[#A1A1AA]">{t.dashboard.weeklyProgressSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
          <span className="font-mono text-[#E5B85C] tabular-nums">
            {weekly.totalWeeklyPoints} {language === 'km' ? 'ពិន្ទុសរុប' : 'pts total'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[#F5F5F7]/85 tabular-nums">
            {weekly.dailyAveragePoints} {language === 'km' ? 'ពិន្ទុ/ថ្ងៃ' : 'pts/day avg'}
          </span>
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekly.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="day"
              stroke="#71717A"
              tick={{ fill: '#A1A1AA', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#71717A"
              tick={{ fill: '#A1A1AA', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                backgroundColor: 'rgba(15, 20, 32, 0.90)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#F5F5F7',
                boxShadow: '0 12px 28px -8px rgba(0,0,0,0.7)',
              }}
              labelFormatter={(label, payload) => {
                const entry = payload?.[0]?.payload as { date?: string; isToday?: boolean } | undefined;
                if (!entry?.date) return String(label);
                return entry.isToday ? `${label} (${entry.date} · Today)` : `${label} (${entry.date})`;
              }}
              formatter={(value: unknown, _name, item) => {
                const actions = (item?.payload as { actions?: number } | undefined)?.actions ?? 0;
                return [`${value} pts · ${actions} session${actions === 1 ? '' : 's'}`, 'Earned'];
              }}
            />
            <Bar dataKey="points" radius={[6, 6, 0, 0]} maxBarSize={34} isAnimationActive={false}>
              {weekly.series.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.isToday ? '#E5B85C' : '#5EA2EF'}
                  fillOpacity={entry.points > 0 ? 0.9 : 0.22}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
