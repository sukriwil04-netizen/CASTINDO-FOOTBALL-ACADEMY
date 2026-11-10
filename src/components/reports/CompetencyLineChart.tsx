import React from 'react';
import { Target, TrendingUp, CheckCircle2, Award } from 'lucide-react';
import { TechnicalTacticalEvaluation } from '../../types/database.ts';

interface CompetencyLineChartProps {
  dimensions: Array<{ label: string; score: number }>;
  history?: TechnicalTacticalEvaluation[];
  playerName?: string;
}

export const CompetencyLineChart: React.FC<CompetencyLineChartProps> = ({
  dimensions,
  history = [],
  playerName,
}) => {
  const width = 640;
  const height = 240;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 60;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxScore = 4.0;
  const minScore = 1.0;

  const getX = (idx: number) => padLeft + (idx / (dimensions.length - 1)) * plotW;
  const getY = (score: number) => {
    const clamped = Math.max(1, Math.min(4, score));
    return padTop + (1 - (clamped - minScore) / (maxScore - minScore)) * plotH;
  };

  const points = dimensions.map((d, idx) => ({
    ...d,
    x: getX(idx),
    y: getY(d.score),
  }));

  const linePathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    ''
  );

  const areaD = `${linePathD} L ${points[points.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <div>
          <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            Grafik Garis (Line Chart) 8 Dimensi Kompetensi Teknik & Taktik
          </h4>
          <p className="text-[11px] text-gray-500">
            Skala 1.0 (Bimbingan Penuh) hingga 4.0 (Mandiri & Konsisten)
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Profil Atlet Terkini
          </span>
          <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            <span className="w-3 h-0.5 bg-gray-400"></span> Garis Benchmark (4.0 Mahir)
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-[230px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Benchmark levels */}
          {[1.0, 2.0, 3.0, 4.0].map((lvl) => {
            const y = getY(lvl);
            const label =
              lvl === 4.0
                ? '4. Mahir'
                : lvl === 3.0
                ? '3. Baik'
                : lvl === 2.0
                ? '2. Cukup'
                : '1. Bimbingan';

            return (
              <g key={lvl}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={lvl === 4.0 ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={lvl === 4.0 ? '1.5' : '1'}
                  strokeDasharray={lvl === 4.0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="end"
                  fontWeight="bold"
                >
                  {lvl.toFixed(1)}
                </text>
                <text
                  x={width - padRight + 5}
                  y={y + 3}
                  fontSize="8"
                  fill="#94a3b8"
                  fontWeight="bold"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Fill under line */}
          <path d={areaD} fill="url(#compGradient)" />

          {/* Line Chart */}
          <path
            d={linePathD}
            fill="none"
            stroke="#047857"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nodes */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#ffffff"
                stroke="#047857"
                strokeWidth="2.5"
              />
              {/* Score badge above node */}
              <text
                x={pt.x}
                y={pt.y - 9}
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                fill="#065f46"
                textAnchor="middle"
              >
                {pt.score.toFixed(1)}
              </text>
              {/* Dimension label below axis */}
              <text
                x={pt.x}
                y={height - padBottom + 16}
                fontSize="9"
                fontWeight="bold"
                fill="#334155"
                textAnchor="middle"
                transform={`rotate(20, ${pt.x}, ${height - padBottom + 16})`}
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
        <span>Format 7v7 Usia Dini: Menekankan pemahaman ruang dan kemampuan 1v1</span>
        <span className="font-semibold text-emerald-800">
          Rata-rata Skor: {(dimensions.reduce((a, b) => a + b.score, 0) / dimensions.length).toFixed(2)} / 4.0
        </span>
      </div>
    </div>
  );
};
