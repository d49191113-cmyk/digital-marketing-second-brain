import { useMemo } from 'react';
import type { Category, Topic, TopicConnection } from '../../types/knowledge';
import { calculateOrbitalPositions } from '../../utils/knowledgeLogic';

interface Universe2DProps {
  categories: Category[];
  topics: Topic[];
  connections: TopicConnection[];
  selectedCategoryId: string | null;
  selectedTopicId: string | null;
  highlightQuery: string;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectTopic: (topicId: string | null) => void;
}

export function Universe2D({
  categories,
  topics,
  connections,
  selectedCategoryId,
  selectedTopicId,
  highlightQuery,
  onSelectCategory,
  onSelectTopic,
}: Universe2DProps) {
  const { planets, nodes } = useMemo(
    () => calculateOrbitalPositions(categories, topics),
    [categories, topics]
  );

  const scale = 6.2;
  const cx = 500;
  const cy = 380;
  const q = highlightQuery.trim().toLowerCase();

  return (
    <div
      className="absolute inset-0 overflow-auto bg-[#05070d] flex items-center justify-center p-4"
      data-testid="universe-2d-fallback"
    >
      <svg
        viewBox="0 0 1000 760"
        className="w-full h-full max-w-[1160px] max-h-[820px]"
        role="img"
        aria-label="2D Orbital Knowledge Map"
      >
        <defs>
          <radialGradient id="coreGlow2D" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF2B8" stopOpacity="1" />
            <stop offset="45%" stopColor="#E5B85C" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#E5B85C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Orbit Rings */}
        {categories.map((cat) => (
          <circle
            key={`orbit-${cat.id}`}
            cx={cx}
            cy={cy}
            r={cat.orbitRadius * scale}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Cross-topic Connections */}
        {connections.map((conn) => {
          const a = nodes.get(conn.sourceTopicId);
          const b = nodes.get(conn.targetTopicId);
          if (!a || !b) return null;
          return (
            <line
              key={conn.id}
              x1={cx + a.x * scale}
              y1={cy + a.z * scale}
              x2={cx + b.x * scale}
              y2={cy + b.z * scale}
              stroke="rgba(229, 184, 92, 0.45)"
              strokeWidth={1.2}
            />
          );
        })}

        {/* Central Black Hole Core */}
        <circle cx={cx} cy={cy} r={38} fill="url(#coreGlow2D)" />
        <circle cx={cx} cy={cy} r={16} fill="#05070D" stroke="#E5B85C" strokeWidth={2.5} />
        <text
          x={cx}
          y={cy + 34}
          textAnchor="middle"
          fill="#F6D98B"
          fontSize="10"
          fontWeight="600"
          letterSpacing="1.5"
        >
          DIGITAL MARKETING
        </text>

        {/* Planet-to-Topic Tethers & Topic Nodes */}
        {topics.map((topic) => {
          const n = nodes.get(topic.id);
          const p = planets.get(topic.categoryId);
          if (!n || !p) return null;
          const cat = categories.find((c) => c.id === topic.categoryId);
          const matchesQuery = q
            ? `${topic.title} ${topic.shortDefinition} ${topic.tags.join(' ')}`
                .toLowerCase()
                .includes(q)
            : false;
          const isSelected = selectedTopicId === topic.id;
          const dimmed =
            (selectedCategoryId && selectedCategoryId !== topic.categoryId) ||
            (q && !matchesQuery);

          const nx = cx + n.x * scale;
          const ny = cy + n.z * scale;
          const px = cx + p.x * scale;
          const py = cy + p.z * scale;

          return (
            <g
              key={topic.id}
              opacity={dimmed ? 0.2 : 1}
              className="cursor-pointer"
              onClick={() => onSelectTopic(topic.id)}
            >
              <line
                x1={px}
                y1={py}
                x2={nx}
                y2={ny}
                stroke={cat?.color || '#5EA2EF'}
                strokeOpacity={0.28}
                strokeWidth={0.9}
              />
              <circle
                cx={nx}
                cy={ny}
                r={isSelected || matchesQuery ? 6 : 3.5}
                fill={
                  topic.status === 'completed'
                    ? '#34D399'
                    : topic.status === 'learning'
                      ? '#E5B85C'
                      : cat?.color || '#94A3B8'
                }
                stroke={isSelected ? '#FFFFFF' : 'none'}
                strokeWidth={1.5}
              />
              {(isSelected || matchesQuery || selectedCategoryId === topic.categoryId) && (() => {
                const angle = Math.atan2(ny - py, nx - px);
                const lx = nx + Math.cos(angle) * 10;
                const ly = ny + Math.sin(angle) * 10 + 3;
                const anchor = Math.cos(angle) >= 0 ? 'start' : 'end';
                return (
                  <text x={lx} y={ly} textAnchor={anchor} fill="#E2E8F0" fontSize="9.5">
                    {topic.title}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* Planets */}
        {categories.map((cat) => {
          const p = planets.get(cat.id);
          if (!p) return null;
          const px = cx + p.x * scale;
          const py = cy + p.z * scale;
          const isSelected = selectedCategoryId === cat.id;
          const dimmed = Boolean(selectedCategoryId && !isSelected);

          return (
            <g
              key={cat.id}
              opacity={dimmed ? 0.35 : 1}
              className="cursor-pointer"
              onClick={() => onSelectCategory(cat.id)}
            >
              <circle
                cx={px}
                cy={py}
                r={isSelected ? 15 : 12}
                fill={cat.color}
                stroke={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isSelected ? 2.5 : 1}
              />
              <text
                x={px}
                y={py - 17}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="10"
                fontWeight="600"
              >
                {cat.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
