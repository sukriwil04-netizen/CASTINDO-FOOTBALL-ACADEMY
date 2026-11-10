import React, { useState } from 'react';
import { Activity, TrendingUp, Sparkles, Info, Eye } from 'lucide-react';
import { formatIndonesianDate, RPE_DESCRIPTIONS } from '../../utils/formatters.ts';

export interface RecentLoadItem {
  sessionId?: string;
  date: string;
  minutes: number;
  rpe?: number | null;
  load: number;
}

export type TrainingLoadViewMode = 'both' | 'load-only' | 'rpe-only';

export interface TrainingLoadRpeDualLineChartProps {
  loads: RecentLoadItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  viewMode?: TrainingLoadViewMode;
  onViewModeChange?: (mode: TrainingLoadViewMode) => void;
  hideControls?: boolean;
}

export const TrainingLoadRpeDualLineChart: React.FC<TrainingLoadRpeDualLineChartProps> = ({
  loads,
  title = 'Grafik Visual Sinkronisasi Beban Latihan (AU) & Respons RPE (1–10)',
  subtitle = 'Korelasi respon kelelahan subjektif (Session-RPE) terhadap volume beban latihan aktual',
  className = '',
  viewMode: controlledViewMode,
  onViewModeChange,
  hideControls = false,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<TrainingLoadViewMode>('both');
  const activeViewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;

  const handleModeChange = (mode: TrainingLoadViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    setInternalViewMode(mode);
  };

  const viewMode = activeViewMode;

  if (!loads || loads.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 text-center text-xs text-gray-400 italic break-inside-avoid print-avoid-break">
        Belum ada riwayat beban latihan individual terekam.
      </div>
    );
  }

  const items = loads.slice(-8);

  // Dimension setup
  const width = 660;
  const height = 230;
  const padLeft = 55;
  const padRight = 55;
  const padTop = 32;
  const padBottom = 48;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Scales
  const maxAu = 700;
  const maxRpe = 10;

  const getYLoad = (val: number) => {
    const clamped = Math.max(0, Math.min(maxAu, val));
    return padTop + (1 - clamped / maxAu) * plotH;
  };

  const getYRpe = (rpe: number) => {
    const clamped = Math.max(0, Math.min(maxRpe, rpe));
    return padTop + (1 - clamped / maxRpe) * plotH;
  };

  const getX = (idx: number) => {
    if (items.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (items.length - 1)) * plotW;
  };

  const points = items.map((item, idx) => ({
    x: getX(idx),
    yLoad: getYLoad(item.load),
    yRpe: getYRpe(item.rpe || 0),
    ...item,
  }));

  // Path for Load line
  const loadPathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yLoad.toFixed(1)}`,
    ''
  );

  const loadAreaD =
    points.length > 0
      ? `${loadPathD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  // Path for RPE line
  const rpePathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yRpe.toFixed(1)}`,
    ''
  );

  const rpeAreaD =
    points.length > 0
      ? `${rpePathD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  // Optimal zone: 200 AU to 500 AU
  const optTop = getYLoad(500);
  const optBottom = getYLoad(200);
  const optHeight = optBottom - optTop;
  const baselineY = getYLoad(350);

  // Averages
  const totalLoadSum = items.reduce((acc, curr) => acc + curr.load, 0);
  const avgLoad = Math.round(totalLoadSum / items.length);

  const validRpes = items.map((i) => i.rpe || 0).filter((r) => r > 0);
  const avgRpe =
    validRpes.length > 0 ? (validRpes.reduce((a, b) => a + b, 0) / validRpes.length).toFixed(1) : '-';

  return (
    <div className={`bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 break-inside-avoid print-avoid-break ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">
              {title}
            </h4>
            <p className="text-[11px] text-gray-500">
              {subtitle}
            </p>
          </div>
        </div>

        {/* View mode indicator for print */}
        <div className="hidden print:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-bold">
          <span>Mode Tampilan:</span>
          <span className="font-mono">
            {viewMode === 'both' ? 'Kedua Grafik (Beban AU & RPE)' : viewMode === 'load-only' ? 'Hanya Beban (AU)' : 'Hanya RPE (1–10)'}
          </span>
        </div>

        {/* View toggles (interactive, hidden during print) */}
        {!hideControls && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-[10px] font-bold text-gray-600 print:hidden">
            <button
              onClick={() => handleModeChange('both')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'both' ? 'bg-white text-emerald-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              Kedua Grafik (Dual Line)
            </button>
            <button
              onClick={() => handleModeChange('load-only')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'load-only' ? 'bg-white text-emerald-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              Hanya Load (AU)
            </button>
            <button
              onClick={() => handleModeChange('rpe-only')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'rpe-only' ? 'bg-white text-indigo-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              Hanya RPE (1–10)
            </button>
          </div>
        )}
      </div>

      {/* Legend & Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          {(viewMode === 'both' || viewMode === 'load-only') && (
            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <span className="w-3 h-1 bg-emerald-600 rounded-full" />
              <span>Beban Latihan (AU) • Sumbu Kiri</span>
            </span>
          )}

          {(viewMode === 'both' || viewMode === 'rpe-only') && (
            <span className="flex items-center gap-1.5 text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
              <span className="w-3 h-1 bg-indigo-600 rounded-full" />
              <span>Respons Kelelahan (RPE 1–10) • Sumbu Kanan</span>
            </span>
          )}

          <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600/20 border border-emerald-600/40" />
            <span>Zona Optimal (200–500 AU)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">
            Rata-rata: <strong className="text-emerald-800 font-mono">{avgLoad} AU</strong> · RPE:{' '}
            <strong className="text-indigo-800 font-mono">{avgRpe}/10</strong>
          </span>
        </div>
      </div>

      {/* Main Dual-Axis SVG Graphic */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[560px] print:min-w-0 h-52 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="dualLoadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dualRpeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Shaded Optimal Zone (200 - 500 AU) */}
          <rect
            x={padLeft}
            y={optTop}
            width={plotW}
            height={optHeight}
            fill="#10b981"
            fillOpacity="0.07"
            rx="4"
          />
          <text
            x={padLeft + plotW - 10}
            y={optTop + 14}
            fontSize="8.5"
            fontWeight="bold"
            fill="#059669"
            textAnchor="end"
          >
            Zona Performa Optimal (200–500 AU)
          </text>

          {/* Left Y-Axis (AU) & Horizontal Grid Lines */}
          {[
            { val: 600, label: '600 AU', rpeLabel: '8.5' },
            { val: 500, label: '500 AU', rpeLabel: '7.1' },
            { val: 350, label: '350 AU', rpeLabel: '5.0', isBaseline: true },
            { val: 200, label: '200 AU', rpeLabel: '2.9' },
            { val: 0, label: '0 AU', rpeLabel: '0' },
          ].map((grid, gIdx) => {
            const gy = getYLoad(grid.val);
            return (
              <g key={gIdx}>
                {/* Horizontal grid line */}
                <line
                  x1={padLeft}
                  y1={gy}
                  x2={padLeft + plotW}
                  y2={gy}
                  stroke={grid.isBaseline ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={grid.isBaseline ? '1.2' : '1'}
                  strokeDasharray={grid.isBaseline ? '4 3' : grid.val === 0 ? 'none' : '2 2'}
                />

                {/* Left Axis label (AU) */}
                <text
                  x={padLeft - 8}
                  y={gy + 3.5}
                  fontSize="8.5"
                  fontWeight={grid.isBaseline ? 'bold' : '500'}
                  fill={grid.isBaseline ? '#047857' : '#059669'}
                  textAnchor="end"
                >
                  {grid.label}
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis Labels: Skala RPE 1–10 */}
          {[
            { rpe: 10, label: '10 (Maks)' },
            { rpe: 8, label: '8 (S. Keras)' },
            { rpe: 6, label: '6 (Keras)' },
            { rpe: 4, label: '4 (Sedang)' },
            { rpe: 2, label: '2 (Ringan)' },
          ].map((rGrid, rIdx) => {
            const ry = getYRpe(rGrid.rpe);
            return (
              <g key={rIdx}>
                <text
                  x={padLeft + plotW + 8}
                  y={ry + 3.5}
                  fontSize="8"
                  fontWeight="600"
                  fill="#4338ca"
                  textAnchor="start"
                >
                  RPE {rGrid.label}
                </text>
              </g>
            );
          })}

          {/* Baseline annotation text */}
          <text
            x={padLeft + 8}
            y={baselineY - 4}
            fontSize="8.5"
            fontWeight="bold"
            fill="#64748b"
          >
            Acuan Ideal Skuad (~350 AU · RPE ~5.0)
          </text>

          {/* Axis Header Titles on Top Corners */}
          <text
            x={padLeft - 8}
            y={padTop - 12}
            fontSize="8.5"
            fontWeight="bold"
            fill="#047857"
            textAnchor="end"
          >
            ▲ Beban (AU)
          </text>
          <text
            x={padLeft + plotW + 8}
            y={padTop - 12}
            fontSize="8.5"
            fontWeight="bold"
            fill="#4338ca"
            textAnchor="start"
          >
            ▲ Skala RPE (1–10)
          </text>

          {/* 1. TRAINING LOAD LINE & AREA (GREEN) */}
          {(viewMode === 'both' || viewMode === 'load-only') && (
            <>
              {points.length > 1 && <path d={loadAreaD} fill="url(#dualLoadGrad)" />}

              <path
                d={loadPathD}
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* 2. RPE LINE & AREA (INDIGO) */}
          {(viewMode === 'both' || viewMode === 'rpe-only') && (
            <>
              {points.length > 1 && viewMode === 'rpe-only' && (
                <path d={rpeAreaD} fill="url(#dualRpeGrad)" />
              )}

              <path
                d={rpePathD}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeDasharray={viewMode === 'both' ? '6 3' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Guidelines & Interactive Points */}
          {points.map((pt, pIdx) => {
            const isHighLoad = pt.load > 500;
            const isLowLoad = pt.load < 200;
            const loadPointColor = isHighLoad ? '#e11d48' : isLowLoad ? '#d97706' : '#059669';
            const rpeInfo = pt.rpe ? RPE_DESCRIPTIONS[pt.rpe] : null;

            return (
              <g key={pIdx}>
                {/* Vertical session timeline guide */}
                <line
                  x1={pt.x}
                  y1={padTop}
                  x2={pt.x}
                  y2={padTop + plotH}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.5"
                />

                {/* Load Point & Tag */}
                {(viewMode === 'both' || viewMode === 'load-only') && (
                  <g>
                    <circle
                      cx={pt.x}
                      cy={pt.yLoad}
                      r="5"
                      fill={loadPointColor}
                      stroke="#ffffff"
                      strokeWidth="2.2"
                    />

                    {/* Value badge callout for Load */}
                    <rect
                      x={pt.x - 22}
                      y={pt.yLoad - 20}
                      width="44"
                      height="15"
                      rx="3.5"
                      fill="#ffffff"
                      stroke={loadPointColor}
                      strokeWidth="1.2"
                    />
                    <text
                      x={pt.x}
                      y={pt.yLoad - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="900"
                      fill={loadPointColor}
                      fontFamily="monospace"
                    >
                      {pt.load} AU
                    </text>
                  </g>
                )}

                {/* RPE Point & Tag */}
                {(viewMode === 'both' || viewMode === 'rpe-only') && (
                  <g>
                    {/* Diamond or Circle for RPE */}
                    <circle
                      cx={pt.x}
                      cy={pt.yRpe}
                      r="4.5"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Value badge for RPE */}
                    <rect
                      x={pt.x - 17}
                      y={pt.yRpe + 6}
                      width="34"
                      height="14"
                      rx="3"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={pt.yRpe + 16.5}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="bold"
                      fill="#ffffff"
                      fontFamily="monospace"
                    >
                      RPE {pt.rpe}
                    </text>
                  </g>
                )}

                {/* X-axis Session Date & Minutes */}
                <text
                  x={pt.x}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="#1e293b"
                >
                  {formatIndonesianDate(pt.date).split(' ').slice(0, 2).join(' ')}
                </text>
                <text
                  x={pt.x}
                  y={padTop + plotH + 28}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#64748b"
                >
                  {pt.minutes}m • {rpeInfo?.emoji || '⚽'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Explanatory Sports Science Footer Note */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>
            <strong>Interpretasi Pelatih:</strong> Jika garis RPE meningkat drastis sementara menit latihan konstan, atlet mungkin mengalami akumulasi kelelahan atau dehidrasi.
          </span>
        </div>
        <span className="font-semibold text-emerald-800 shrink-0">
          Formula Foster: Durasi (Menit) × RPE = Beban (AU)
        </span>
      </div>
    </div>
  );
};
