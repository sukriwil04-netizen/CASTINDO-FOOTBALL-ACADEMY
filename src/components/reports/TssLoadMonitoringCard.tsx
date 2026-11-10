import React, { useMemo, useState } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Info,
  Shield,
  HelpCircle,
  Calendar,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { TrainingLoadRecord } from '../../types/database.ts';
import {
  calculateTssMetrics,
  TssDailyDataPoint,
  TsbStatusInfo,
} from '../../utils/tssEngine.ts';

interface TssLoadMonitoringCardProps {
  loads: TrainingLoadRecord[];
  playerName?: string;
  isCompact?: boolean;
}

export const TssLoadMonitoringCard: React.FC<TssLoadMonitoringCardProps> = ({
  loads,
  playerName = 'Atlet',
  isCompact = false,
}) => {
  const [timeWindowDays, setTimeWindowDays] = useState<14 | 28 | 42>(28);
  const [hoveredPoint, setHoveredPoint] = useState<TssDailyDataPoint | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Calculate metrics based on selected time window
  const metrics = useMemo(() => {
    return calculateTssMetrics(loads, { days: timeWindowDays });
  }, [loads, timeWindowDays]);

  const {
    currentTSS,
    avgDailyTSS,
    totalTSS,
    currentCTL,
    currentATL,
    currentTSB,
    currentACWR,
    ctlTrend,
    atlTrend,
    status,
    acwrStatus,
    history,
    sessionsCount,
    totalDurationMinutes,
  } = metrics;

  // Chart dimensions & scaling for high-resolution responsive Line Chart
  const chartHeight = 240;
  const chartWidth = 680;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 24;
  const padBottom = 38;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    // Determine Y max and min
    const allValues = history.flatMap((p) => [p.ctl, p.atl, p.tsb, p.tss]);
    const maxVal = Math.max(70, Math.ceil((Math.max(...allValues, 60) + 10) / 10) * 10);
    const minVal = Math.min(-25, Math.floor((Math.min(...allValues, -10) - 5) / 10) * 10);
    const valRange = maxVal - minVal || 1;

    const getX = (idx: number) => padLeft + (idx / (history.length - 1 || 1)) * plotW;
    const getY = (val: number) => padTop + ((maxVal - val) / valRange) * plotH;

    const points = history.map((p, idx) => {
      const x = getX(idx);
      const yCtl = getY(p.ctl);
      const yAtl = getY(p.atl);
      const yTsb = getY(p.tsb);
      const yTss = getY(p.tss);
      const yZero = getY(0);

      return {
        ...p,
        x,
        yCtl,
        yAtl,
        yTsb,
        yTss,
        yZero,
      };
    });

    const ctlPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yCtl.toFixed(1)}`).join(' ');
    const atlPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yAtl.toFixed(1)}`).join(' ');
    const tsbPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yTsb.toFixed(1)}`).join(' ');
    const tssPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.yTss.toFixed(1)}`).join(' ');
    const zeroY = getY(0);

    // Generate grid line values
    const gridVals: number[] = [];
    const step = Math.max(15, Math.round(valRange / 5 / 5) * 5);
    for (let v = 0; v <= maxVal; v += step) {
      gridVals.push(v);
    }
    for (let v = -step; v >= minVal; v -= step) {
      gridVals.push(v);
    }
    gridVals.sort((a, b) => a - b);

    return {
      points,
      ctlPath,
      atlPath,
      tsbPath,
      tssPath,
      zeroY,
      maxVal,
      minVal,
      gridVals,
      chartWidth,
      chartHeight,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
    };
  }, [history]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden break-inside-avoid print-avoid-break">
      {/* Header Bar */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide">
                Monitoring Beban Latihan TSS (CTL, ATL, TSB)
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className="text-emerald-300/80 hover:text-emerald-200 transition-colors print:hidden"
                title="Buka panduan sains olahraga"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">
              Metrik Sports Science: Kebugaran Kronis (CTL), Kelelahan Akut (ATL), & Kesiapan Tanding (TSB)
            </p>
          </div>
        </div>

        {/* Window Selector (Interactive, Hidden in Print) */}
        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10 self-start sm:self-auto text-xs font-semibold print:hidden">
          <span className="text-[10px] text-gray-300 px-2 hidden sm:inline">Periode:</span>
          {(
            [
              { label: '14 Hari', val: 14 },
              { label: '28 Hari', val: 28 },
              { label: '42 Hari', val: 42 },
            ] as const
          ).map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setTimeWindowDays(item.val)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                timeWindowDays === item.val
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Print-Only Window Badge */}
        <div className="hidden print:inline-block text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
          Periode Analisis: {timeWindowDays} Hari
        </div>
      </div>

      {/* Formula & Explanation Accordion (Hidden in Print) */}
      {showFormulaInfo && (
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 text-xs text-emerald-950 animate-in fade-in duration-150 print:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Info className="w-4 h-4 text-emerald-700" />
                <span>Dasar Sains Olahraga & Formula Training Monitoring Load:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    <span>CTL (Chronic Training Load)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    <strong>Representasi: "Fitness / Kebugaran"</strong>. Rata-rata eksponensial beban latihan 42 hari terakhir. Menandakan fondasi fisik dan kapasitas kerja aerobik jangka panjang atlet.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                    <span>ATL (Acute Training Load)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    <strong>Representasi: "Fatigue / Kelelahan"</strong>. Rata-rata beban latihan 7 hari terakhir. Menunjukkan kelelahan akut dan stres fisik sesi terkini.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>TSB (Training Stress Balance)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    <strong>Representasi: "Form / Kesiapan Tanding"</strong>. Rumus: <code className="bg-emerald-100 px-1 py-0.5 rounded font-bold">TSB = CTL - ATL</code>. Menentukan apakah atlet sedang lelah, beradaptasi optimal, atau dalam kondisi prima siap tanding.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFormulaInfo(false)}
              className="text-xs text-emerald-800 hover:underline font-bold px-1"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Cards Grid */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Daily TSS */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Daily TSS
              </span>
              <span className="p-1 rounded-md bg-slate-200/60 text-slate-700">
                <Flame className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{currentTSS}</span>
              <span className="text-xs font-semibold text-slate-500">TSS / hari</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span>Rata-rata: <strong>{avgDailyTSS}</strong></span>
              <span>Total: <strong>{totalTSS}</strong></span>
            </div>
          </div>

          {/* Card 2: CTL (Fitness) */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                CTL (Fitness)
              </span>
              <span className="p-1 rounded-md bg-blue-200/60 text-blue-800">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-950">{currentCTL}</span>
              <span className="text-xs font-semibold text-blue-700">TSS (42d)</span>
              {ctlTrend === 'up' && (
                <span className="inline-flex items-center text-xs font-bold text-emerald-600 ml-auto">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Naik
                </span>
              )}
              {ctlTrend === 'down' && (
                <span className="inline-flex items-center text-xs font-bold text-amber-600 ml-auto">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Turun
                </span>
              )}
              {ctlTrend === 'neutral' && (
                <span className="inline-flex items-center text-xs font-bold text-gray-400 ml-auto">
                  <Minus className="w-3.5 h-3.5" /> Stabil
                </span>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200/60 text-[11px] text-blue-800 truncate">
              Kebugaran & daya tahan kronis
            </div>
          </div>

          {/* Card 3: ATL (Fatigue) */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                ATL (Fatigue)
              </span>
              <span className="p-1 rounded-md bg-amber-200/60 text-amber-800">
                <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-950">{currentATL}</span>
              <span className="text-xs font-semibold text-amber-800">TSS (7d)</span>
              {atlTrend === 'up' && (
                <span className="inline-flex items-center text-xs font-bold text-rose-600 ml-auto">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Naik
                </span>
              )}
              {atlTrend === 'down' && (
                <span className="inline-flex items-center text-xs font-bold text-emerald-600 ml-auto">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Turun
                </span>
              )}
              {atlTrend === 'neutral' && (
                <span className="inline-flex items-center text-xs font-bold text-gray-400 ml-auto">
                  <Minus className="w-3.5 h-3.5" /> Stabil
                </span>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 truncate">
              Stres & kelelahan akumulatif
            </div>
          </div>

          {/* Card 4: TSB (Form) */}
          <div className={`p-4 rounded-xl border shadow-2xs ${status.badgeBg} ${status.badgeBorder}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                TSB (Form)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${status.badgeBg} ${status.badgeText} ${status.badgeBorder}`}>
                {status.shortLabel}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black ${
                  currentTSB >= 0 ? 'text-emerald-800' : currentTSB >= -25 ? 'text-amber-800' : 'text-rose-800'
                }`}
              >
                {currentTSB > 0 ? `+${currentTSB}` : currentTSB}
              </span>
              <span className="text-xs font-semibold text-gray-600">TSS</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] font-semibold text-gray-700 truncate">
              {currentTSB >= 5 ? 'Siap tanding (Match Ready)' : currentTSB >= -10 ? 'Adaptasi optimal' : 'Fase pemulihan'}
            </div>
          </div>
        </div>

        {/* ACWR & Current Form Assessment Strip */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${status.dotColor} animate-pulse`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{status.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${acwrStatus.bg} ${acwrStatus.color} ${acwrStatus.border}`}>
                  ACWR: {currentACWR > 0 ? currentACWR.toFixed(2) : '-'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {status.description}
              </p>
            </div>
          </div>

          {/* ACWR Visual Indicator Bar */}
          <div className="shrink-0 min-w-56">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
              <span>Underload</span>
              <span className="text-emerald-700">Sweet Spot (0.8 - 1.3)</span>
              <span className="text-rose-700">Danger (&gt;1.5)</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
              <div className="w-[30%] bg-sky-300" title="Underload < 0.8" />
              <div className="w-[35%] bg-emerald-500" title="Sweet Spot 0.8 - 1.3" />
              <div className="w-[15%] bg-amber-400" title="Warning 1.3 - 1.5" />
              <div className="w-[20%] bg-rose-500" title="High Risk > 1.5" />
            </div>
          </div>
        </div>

        {/* Performance Management Line Chart (PMC) */}
        <div className="relative pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Grafik Garis Kurva Performa Atlet (PMC - Performance Line Chart)</span>
              </h4>
              <p className="text-[11px] text-gray-500">
                Visualisasi garis kontinu kebugaran (CTL), kelelahan (ATL), kesiapan bertanding (TSB), dan beban sesi harian ({sessionsCount} sesi, {totalDurationMinutes}m tercatat)
              </p>
            </div>

            {/* Legend - All Pure Lines */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                <span className="w-4 h-0.5 bg-blue-600 rounded-full inline-block" />
                <span>CTL (Kebugaran)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <span className="w-4 h-0.5 bg-amber-500 rounded-full inline-block" />
                <span>ATL (Kelelahan)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <span className="w-4 h-0.5 bg-emerald-600 rounded-full inline-block" />
                <span>TSB (Form / Kesiapan)</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                <span className="w-4 h-0.5 bg-purple-500 rounded-full inline-block border-b border-dashed border-purple-500" />
                <span>Daily TSS (Garis Sesi)</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas: Light, Pure Vector Line Chart */}
          <div className="relative w-full bg-white rounded-xl p-4 border border-gray-200 shadow-2xs overflow-hidden">
            {chartData && chartData.points.length > 0 ? (
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}
                  className="w-full min-w-[540px] print:min-w-0 h-[240px] overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="pmcTsbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines with Numeric Values */}
                  {chartData.gridVals.map((gridVal) => {
                    const y =
                      chartData.padTop +
                      ((chartData.maxVal - gridVal) / (chartData.maxVal - chartData.minVal)) *
                        chartData.plotH;
                    const isZero = gridVal === 0;

                    return (
                      <g key={gridVal}>
                        <line
                          x1={chartData.padLeft}
                          y1={y}
                          x2={chartData.chartWidth - chartData.padRight}
                          y2={y}
                          stroke={isZero ? '#10b981' : '#e2e8f0'}
                          strokeWidth={isZero ? '1.5' : '1'}
                          strokeDasharray={isZero ? '5 3' : '3 3'}
                        />
                        <text
                          x={chartData.padLeft - 8}
                          y={y + 3}
                          fontSize="9"
                          fill={isZero ? '#059669' : '#94a3b8'}
                          textAnchor="end"
                          fontFamily="monospace"
                          fontWeight={isZero ? 'bold' : '600'}
                        >
                          {gridVal > 0 ? `+${gridVal}` : gridVal}
                        </text>
                        {isZero && (
                          <text
                            x={chartData.chartWidth - chartData.padRight + 6}
                            y={y + 3}
                            fontSize="8"
                            fill="#059669"
                            fontWeight="bold"
                          >
                            TSB 0 (Net Form)
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* 1. Daily TSS Line Chart (Violet Dashed Line with Data Nodes) */}
                  <path
                    d={chartData.tssPath}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.75"
                  />
                  {chartData.points.map((p, idx) => (
                    p.tss > 0 && (
                      <circle
                        key={`tss-node-${idx}`}
                        cx={p.x}
                        cy={p.yTss}
                        r="3"
                        fill="#ffffff"
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                      />
                    )
                  ))}

                  {/* 2. CTL Line (Fitness - Deep Blue Solid) */}
                  <path
                    d={chartData.ctlPath}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* 3. ATL Line (Fatigue - Amber Solid) */}
                  <path
                    d={chartData.atlPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* 4. TSB Line (Form - Emerald Solid) */}
                  <path
                    d={chartData.tsbPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Crosshair & Nodes on Hover */}
                  {hoveredPoint && (
                    <g>
                      {(() => {
                        const pt = chartData.points.find((p) => p.date === hoveredPoint.date);
                        if (!pt) return null;
                        return (
                          <>
                            <line
                              x1={pt.x}
                              y1={chartData.padTop}
                              x2={pt.x}
                              y2={chartData.chartHeight - chartData.padBottom}
                              stroke="#64748b"
                              strokeWidth="1.2"
                              strokeDasharray="3 3"
                            />
                            {/* CTL node */}
                            <circle cx={pt.x} cy={pt.yCtl} r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                            {/* ATL node */}
                            <circle cx={pt.x} cy={pt.yAtl} r="4.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
                            {/* TSB node */}
                            <circle cx={pt.x} cy={pt.yTsb} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                            {/* TSS node */}
                            {pt.tss > 0 && (
                              <circle cx={pt.x} cy={pt.yTss} r="4" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                            )}
                          </>
                        );
                      })()}
                    </g>
                  )}
                </svg>

                {/* Touch/Mouse Hover Zones */}
                <div className="absolute inset-0 flex">
                  {chartData.points.map((p) => (
                    <div
                      key={p.date}
                      className="flex-1 h-full cursor-crosshair"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onClick={() => setHoveredPoint(p)}
                    />
                  ))}
                </div>

                {/* Tooltip Overlay */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-2 bg-gray-900 text-white border border-gray-700 p-2.5 rounded-xl text-[11px] shadow-lg pointer-events-none z-20 space-y-1 animate-in fade-in">
                    <div className="font-bold text-gray-200 border-b border-gray-800 pb-1 flex items-center justify-between gap-3">
                      <span>{hoveredPoint.dayName}, {hoveredPoint.dateLabel}</span>
                      <span className="text-purple-400 font-mono font-bold">Daily TSS: {hoveredPoint.tss}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                      <span className="text-blue-300">CTL (Fitness): <strong>{hoveredPoint.ctl}</strong></span>
                      <span className="text-amber-300">ATL (Fatigue): <strong>{hoveredPoint.atl}</strong></span>
                      <span className="text-emerald-300">TSB (Form): <strong>{hoveredPoint.tsb > 0 ? `+${hoveredPoint.tsb}` : hoveredPoint.tsb}</strong></span>
                      <span className="text-gray-300">ACWR: <strong>{hoveredPoint.acwr > 0 ? hoveredPoint.acwr.toFixed(2) : '-'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                Belum ada rekaman beban latihan RPE untuk menampilkan kurva garis performa.
              </div>
            )}

            {/* X-axis date labels */}
            {chartData && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-[10px] text-gray-500 px-3 font-semibold">
                <span>{chartData.points[0]?.dateLabel} ({chartData.points[0]?.dayName})</span>
                <span>{chartData.points[Math.floor(chartData.points.length / 2)]?.dateLabel}</span>
                <span className="text-emerald-700 font-bold">{chartData.points[chartData.points.length - 1]?.dateLabel} (Hari ini)</span>
              </div>
            )}
          </div>
        </div>

        {/* Coaching Recommendation Box */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-emerald-950">
              Rekomendasi Beban Latihan Pelatih untuk {playerName}:
            </h4>
            <p className="text-emerald-900 mt-1 leading-relaxed">
              {status.coachingAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
