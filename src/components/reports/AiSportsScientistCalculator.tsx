import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  TrendingUp,
  Activity,
  Heart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Copy,
  Check,
  Code2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Utensils,
  Dumbbell,
  Stethoscope,
} from 'lucide-react';
import { Player, Team } from '../../types/database.ts';
import {
  AiSportsScientistResult,
  AI_SPORTS_SCIENTIST_PROMPT,
} from '../../types/sportsScience.ts';
import { api } from '../../services/api.ts';
import { RPE_DESCRIPTIONS } from '../../utils/formatters.ts';

interface AiSportsScientistCalculatorProps {
  player: Player | null;
  team?: Team | null;
  age: number;
  initialDuration?: number;
  initialRpe?: number;
  onCalculationDone?: (result: AiSportsScientistResult) => void;
}

export const AiSportsScientistCalculator: React.FC<AiSportsScientistCalculatorProps> = ({
  player,
  team,
  age,
  initialDuration = 75,
  initialRpe = 6,
  onCalculationDone,
}) => {
  // Form input state
  const [duration, setDuration] = useState<number>(initialDuration);
  const [rpe, setRpe] = useState<number>(initialRpe);
  const [avgHr, setAvgHr] = useState<string>('152');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<AiSportsScientistResult | null>(null);

  // Prompt & JSON views
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Hovered day tooltip on the line chart
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Formula details
  const hrMaxEstimate = Math.round(208 - 0.7 * age);

  // Perform calculation via API
  const handleCalculate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const parsedAvgHr = avgHr.trim() ? Number(avgHr) : null;
      const res = await api.calculateAiSportsScientist({
        nama: player?.fullName || 'Pemain Muda CFA',
        usia: age,
        cluster: team ? `${team.name} (${team.ageGroup})` : 'U-8 / U-9 (Kelahiran 2016-2017)',
        durationMinutes: duration,
        rpe,
        avgHr: parsedAvgHr && !isNaN(parsedAvgHr) ? parsedAvgHr : null,
      });
      setResult(res);
      if (onCalculationDone) {
        onCalculationDone(res);
      }
    } catch (err: any) {
      console.error('Error running AI calculator:', err);
      setErrorMessage(err.message || 'Gagal menjalankan kalkulasi AI Sports Scientist');
    } finally {
      setIsLoading(false);
    }
  };

  // Run calculation on initial load or player change
  useEffect(() => {
    handleCalculate();
  }, [player?.id]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_SPORTS_SCIENTIST_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  const handleCopyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  // Coordinates for the SVG line chart
  const lineChartData = useMemo(() => {
    if (!result || !result.grafik_garis_tren_beban?.titik_data) return null;
    const points = result.grafik_garis_tren_beban.titik_data;
    if (points.length === 0) return null;

    const width = 640;
    const height = 220;
    const padLeft = 45;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 45;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxVal = Math.max(
      650,
      Math.ceil((Math.max(...points.map((p) => p.skor_beban), 400) * 1.15) / 100) * 100
    );

    const getX = (idx: number) => padLeft + (idx / (points.length - 1)) * plotW;
    const getY = (val: number) => padTop + (1 - Math.max(0, val) / maxVal) * plotH;

    const coords = points.map((p, idx) => ({
      ...p,
      x: getX(idx),
      y: getY(p.skor_beban),
    }));

    // SVG line path
    const pathD = coords.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ''
    );

    // SVG area path (fill)
    const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

    // Reference lines
    const yRingan = getY(250);
    const yOptimal = getY(500);

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      maxVal,
      coords,
      pathD,
      areaD,
      yRingan,
      yOptimal,
    };
  }, [result]);

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 shadow-sm overflow-hidden space-y-6 p-4 sm:p-6 animate-in fade-in break-inside-avoid print-avoid-break">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-emerald-800 text-white rounded-lg shadow-2xs">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="font-black text-sm text-emerald-950 uppercase tracking-wide">
              Mesin Kalkulator AI Sports Scientist
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-1 border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Formula sRPE & hrTSS Usia 6–14 Tahun
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Perhitungan matematis beban latihan aktual, estimasi beban kardiovaskular, dan visualisasi grafik garis mingguan instan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto print:hidden">
          <button
            type="button"
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Lihat Prompt AI</span>
            {showPromptDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Menghitung...' : 'Hitung Ulang'}</span>
          </button>
        </div>
      </div>

      {/* Accordion: Prompt Tersimpan & Aktif (Hidden in Print) */}
      {showPromptDetails && (
        <div className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs space-y-3 border border-gray-700 animate-in fade-in print:hidden">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Prompt Sistem AI Sports Scientist (Aktif di Laporan Perkembangan)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold border border-gray-600 transition"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Prompt</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap bg-gray-950 p-3 rounded-lg border border-gray-800 text-gray-300">
            {AI_SPORTS_SCIENTIST_PROMPT}
          </pre>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Model: Gemini 3.8 Flash (Server-Side Proxy) • Standar JSON Bersih</span>
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-emerald-400 hover:underline font-semibold"
            >
              {showRawJson ? 'Sembunyikan Output JSON' : 'Lihat Output JSON Hasil Kalkulasi'}
            </button>
          </div>
          {showRawJson && result && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-mono">Payload JSON Response:</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'JSON Tersalin' : 'Salin JSON'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono bg-black p-3 rounded-lg overflow-x-auto text-emerald-300 border border-emerald-950 max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Input Form Bar (Hidden in Print) */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-700" />
            Parameter Sesi Latihan Atlet: {player?.fullName || 'Atlet Terpilih'} ({age} Tahun)
          </span>
          <span className="text-[11px] text-gray-500 font-semibold">
            Cluster: <strong className="text-emerald-900">{team?.name || 'U-8 / U-9'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Duration Input */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" /> Durasi Latihan:
              </span>
              <span className="font-mono text-emerald-900 font-extrabold">{duration} Menit</span>
            </label>
            <div className="flex items-center gap-1">
              {[45, 60, 75, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    duration === m
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* RPE Selector */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-600" /> Skala Usaha RPE (1–10):
              </span>
              <span className="font-extrabold text-amber-900">
                Skala {rpe} • {RPE_DESCRIPTIONS[rpe]?.label || 'Sedang'}
              </span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const isSelected = rpe === score;
                const colorClass =
                  score <= 3
                    ? isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : score <= 6
                    ? isSelected
                      ? 'bg-teal-600 text-white border-teal-700'
                      : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    : score <= 8
                    ? isSelected
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : isSelected
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100';

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRpe(score)}
                    className={`py-1 rounded-md text-xs font-black border transition cursor-pointer ${colorClass}`}
                    title={RPE_DESCRIPTIONS[score]?.label}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Avg Heart Rate */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-600" /> Avg HR (bpm):
              </span>
              <span className="text-[10px] text-gray-400 font-mono">HRmax: ~{hrMaxEstimate}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="220"
                value={avgHr}
                onChange={(e) => setAvgHr(e.target.value)}
                placeholder="cth. 155"
                className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold">bpm</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Print-Only Parameter Summary Strip */}
      <div className="hidden print:block p-3.5 bg-gray-50 border border-gray-300 rounded-xl text-xs break-inside-avoid print-avoid-break">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-gray-900">
            Parameter Sesi: <strong>{duration} Menit</strong> · Skala RPE: <strong>{rpe}/10 ({RPE_DESCRIPTIONS[rpe]?.label})</strong>
          </span>
          <span className="text-gray-700 font-mono">
            Avg HR: <strong>{avgHr ? `${avgHr} bpm` : '-'}</strong> · Estimasi HRmax Anak: <strong>{hrMaxEstimate} bpm</strong>
          </span>
        </div>
      </div>

      {/* Key Result Summary Cards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: sRPE Load */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  sRPE Load Score
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-950 text-[10px] font-bold rounded">
                  Durasi × RPE
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-950 font-mono">
                {result.hasil_kalkulasi.srpe_load_score}{' '}
                <span className="text-sm font-bold text-emerald-700">AU</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Formula: {duration}m × Skala {rpe} = {result.hasil_kalkulasi.srpe_load_score} AU
              </p>
            </div>

            {/* Card 2: Estimasi hrTSS */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Estimasi hrTSS
                </span>
                <span className="px-1.5 py-0.5 bg-blue-200 text-blue-950 text-[10px] font-bold rounded">
                  Kardiovaskular
                </span>
              </div>
              <div className="text-3xl font-black text-blue-950 font-mono">
                {result.hasil_kalkulasi.estimasi_hrtss !== null ? (
                  <>
                    {result.hasil_kalkulasi.estimasi_hrtss}{' '}
                    <span className="text-sm font-bold text-blue-700">TSS</span>
                  </>
                ) : (
                  <span className="text-base text-gray-400 font-sans italic font-normal">
                    (Avg HR Kosong)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-800">
                {avgHr ? `Estimasi HRmax: 208 - (0.7 × ${age}) = ${hrMaxEstimate} bpm` : 'Isi Avg HR untuk kalkulasi hrTSS'}
              </p>
            </div>

            {/* Card 3: Status Beban */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Status Beban Sesi
                </span>
                <span className="text-[10px] text-gray-400 font-bold">Zona Fisiologis</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`px-3 py-1 text-sm font-black rounded-lg uppercase tracking-wide border shadow-2xs ${
                    result.hasil_kalkulasi.status_beban === 'Ringan'
                      ? 'bg-teal-100 text-teal-900 border-teal-300'
                      : result.hasil_kalkulasi.status_beban === 'Optimal'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  {result.hasil_kalkulasi.status_beban}
                </span>
                <span className="text-xs text-gray-600 font-medium">
                  {result.hasil_kalkulasi.status_beban === 'Optimal'
                    ? 'Zona Ideal Perkembangan'
                    : result.hasil_kalkulasi.status_beban === 'Ringan'
                    ? 'Pemulihan Aerobik'
                    : 'Kelelahan Akut Tinggi'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 pt-0.5">
                Target LTAD usia {age} th: 250–500 AU / sesi
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* GRAFIK GARIS (LINE CHART): TREN BEBAN MINGGUAN (sRPE LOAD) */}
          {/* ======================================================== */}
          {lineChartData && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs break-inside-avoid print-avoid-break">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    {result.grafik_garis_tren_beban.judul_grafik}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Sumbu X: {result.grafik_garis_tren_beban.sumbu_x_label} (Senin–Minggu) • Sumbu Y: {result.grafik_garis_tren_beban.sumbu_y_label}
                  </p>
                </div>

                {/* Reference Legend */}
                <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                  <span className="flex items-center gap-1 text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span> Ringan (&lt;250 AU)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Optimal (250–500 AU)
                  </span>
                  <span className="flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Berat (&gt;500 AU)
                  </span>
                </div>
              </div>

              {/* The Responsive SVG Line Chart */}
              <div className="relative w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`}
                  className="w-full min-w-[540px] print:min-w-0 h-[210px] overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="srpeLineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#047857" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0d9488" />
                      <stop offset="70%" stopColor="#047857" />
                      <stop offset="100%" stopColor="#065f46" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {[0, 200, 400, 600].map((gridVal) => {
                    const y =
                      lineChartData.padTop +
                      (1 - gridVal / lineChartData.maxVal) * lineChartData.plotH;
                    return (
                      <g key={gridVal}>
                        <line
                          x1={lineChartData.padLeft}
                          y1={y}
                          x2={lineChartData.width - lineChartData.padRight}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={lineChartData.padLeft - 8}
                          y={y + 3}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="end"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {gridVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Optimal Zone Benchmark Band (250 - 500 AU) */}
                  <rect
                    x={lineChartData.padLeft}
                    y={lineChartData.yOptimal}
                    width={lineChartData.plotW}
                    height={Math.max(0, lineChartData.yRingan - lineChartData.yOptimal)}
                    fill="rgba(16, 185, 129, 0.05)"
                  />

                  {/* Shaded Area Under Line */}
                  <path d={lineChartData.areaD} fill="url(#srpeLineGradient)" />

                  {/* The Main Line Chart Path */}
                  <path
                    d={lineChartData.pathD}
                    fill="none"
                    stroke="url(#strokeGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points (Circles) */}
                  {lineChartData.coords.map((pt, idx) => {
                    const isHovered = hoveredPointIdx === idx;
                    const isLast = idx === lineChartData.coords.length - 1;
                    const ptColor =
                      pt.skor_beban > 500
                        ? '#e11d48'
                        : pt.skor_beban >= 250
                        ? '#059669'
                        : '#0d9488';

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPointIdx(idx)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                      >
                        {/* Glow halo on hover or last node */}
                        {(isHovered || isLast) && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 11 : 8}
                            fill={ptColor}
                            fillOpacity="0.2"
                            className="animate-pulse"
                          />
                        )}

                        {/* Outer border circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4.5}
                          fill="#ffffff"
                          stroke={ptColor}
                          strokeWidth="2.5"
                        />

                        {/* Top Label Value */}
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          fill={isHovered ? '#047857' : '#334155'}
                          textAnchor="middle"
                        >
                          {pt.skor_beban}
                        </text>

                        {/* Day Label (X Axis) */}
                        <text
                          x={pt.x}
                          y={lineChartData.height - 12}
                          fontSize="10"
                          fontWeight={isLast ? '800' : '600'}
                          fill={isLast ? '#047857' : '#64748b'}
                          textAnchor="middle"
                        >
                          {pt.hari}
                        </text>
                        {isLast && (
                          <text
                            x={pt.x}
                            y={lineChartData.height - 2}
                            fontSize="8"
                            fontWeight="800"
                            fill="#047857"
                            textAnchor="middle"
                          >
                            (Sesi Ini)
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Details Card */}
                {hoveredPointIdx !== null && lineChartData.coords[hoveredPointIdx] && (
                  <div className="absolute top-2 right-4 bg-gray-900 text-white text-[11px] rounded-lg p-2.5 shadow-lg border border-gray-700 pointer-events-none animate-in fade-in">
                    <div className="font-bold text-emerald-400">
                      Hari: {lineChartData.coords[hoveredPointIdx].hari}
                    </div>
                    <div className="flex justify-between gap-4 text-gray-300 mt-0.5">
                      <span>Akumulasi Beban:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {lineChartData.coords[hoveredPointIdx].skor_beban} AU
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* REPORT PELATIH AI (SPORTS SCIENCE COACHING RECOMMENDATION) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 break-inside-avoid print-avoid-break">
            {/* 1. Analisis Fisiologis */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 break-inside-avoid print-avoid-break">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-950 uppercase tracking-wide">
                <Stethoscope className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Analisis Fisiologis</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {result.report_pelatih.analisis_fisiologis}
              </p>
            </div>

            {/* 2. Rekomendasi Nutrisi & Hidrasi */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2 break-inside-avoid print-avoid-break">
              <div className="flex items-center gap-2 text-xs font-black text-teal-950 uppercase tracking-wide">
                <Utensils className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Rekomendasi Nutrisi & Hidrasi</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {result.report_pelatih.rekomendasi_nutrisi_hidrasi}
              </p>
            </div>

            {/* 3. Rencana Sesi Besok */}
            <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2 break-inside-avoid print-avoid-break">
              <div className="flex items-center gap-2 text-xs font-black text-sky-950 uppercase tracking-wide">
                <Dumbbell className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Rencana Sesi Besok</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {result.report_pelatih.rencana_sesi_besok}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
