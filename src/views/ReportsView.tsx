import React, { useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  User,
  Shield,
  CalendarCheck,
  Activity,
  Target,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  FileDown,
  Loader2,
} from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { exportReportToPdf } from '../utils/pdfExport.ts';
import {
  TrainingLoadRpeDualLineChart,
  TrainingLoadViewMode,
} from '../components/reports/TrainingLoadRpeDualLineChart.tsx';
import { TssLoadMonitoringCard } from '../components/reports/TssLoadMonitoringCard.tsx';
import { AiSportsScientistCalculator } from '../components/reports/AiSportsScientistCalculator.tsx';
import { CompetencyLineChart } from '../components/reports/CompetencyLineChart.tsx';
import {
  formatIndonesianDate,
  calculateAge,
  RPE_DESCRIPTIONS,
  SCALE_4_DESCRIPTIONS,
  LTAD_STATUS_BADGES,
} from '../utils/formatters.ts';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    players,
    activePlayers,
    teams,
    trainingLoads,
    evaluations,
    motorTests,
    motorTestResults,
    ltadGoals,
    promotionReviews,
    getPlayerAttendanceStats,
    getPlayerTrainingLoadStats,
  } = useData();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    return activePlayers[0]?.id || '';
  });

  const [competencyViewMode, setCompetencyViewMode] = useState<'line' | 'radar'>('line');
  const [loadChartMode, setLoadChartMode] = useState<'all' | 'ai_calculator' | 'tss_pmc' | 'foster_srpe'>('all');
  const [fosterViewMode, setFosterViewMode] = useState<TrainingLoadViewMode>('both');

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) || null,
    [players, selectedPlayerId]
  );

  const playerTeam = useMemo(
    () => teams.find((t) => t.id === selectedPlayer?.teamId),
    [teams, selectedPlayer]
  );

  const ageInfo = useMemo(
    () => (selectedPlayer ? calculateAge(selectedPlayer.birthDate) : null),
    [selectedPlayer]
  );

  const attStats = useMemo(
    () => (selectedPlayer ? getPlayerAttendanceStats(selectedPlayer.id) : null),
    [selectedPlayer, getPlayerAttendanceStats]
  );

  const loadStats = useMemo(
    () => (selectedPlayer ? getPlayerTrainingLoadStats(selectedPlayer.id) : null),
    [selectedPlayer, getPlayerTrainingLoadStats]
  );

  const playerLoads = useMemo(
    () => (selectedPlayer ? trainingLoads.filter((tl) => tl.playerId === selectedPlayer.id) : []),
    [selectedPlayer, trainingLoads]
  );

  const playerEvals = useMemo(
    () =>
      selectedPlayer
        ? evaluations
            .filter((e) => e.playerId === selectedPlayer.id)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        : [],
    [selectedPlayer, evaluations]
  );

  const latestEval = playerEvals[0] || null;

  const playerMotorResults = useMemo(
    () =>
      selectedPlayer
        ? motorTestResults
            .filter((r) => r.playerId === selectedPlayer.id)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        : [],
    [selectedPlayer, motorTestResults]
  );

  const playerLtad = useMemo(
    () =>
      selectedPlayer
        ? ltadGoals.filter((g) => g.playerId === selectedPlayer.id)
        : [],
    [selectedPlayer, ltadGoals]
  );

  const playerPromReviews = useMemo(
    () =>
      selectedPlayer
        ? promotionReviews.filter((r) => r.playerId === selectedPlayer.id)
        : [],
    [selectedPlayer, promotionReviews]
  );

  // ==========================================
  // RADAR CHART METRICS (8 CORE DIMENSIONS)
  // ==========================================
  const radarDimensions = useMemo(() => {
    if (!latestEval) {
      return [
        { label: 'Dribbling', score: 2.5 },
        { label: 'Passing', score: 2.5 },
        { label: 'Kontrol Bola', score: 2.5 },
        { label: 'First Touch', score: 2.5 },
        { label: 'Finishing', score: 2.5 },
        { label: 'Lindungi Bola', score: 2.5 },
        { label: 'Situasi 1v1', score: 2.5 },
        { label: 'Pemahaman 7v7', score: 2.5 },
      ];
    }

    return [
      { label: 'Dribbling', score: latestEval.dribblingScore || 2 },
      { label: 'Passing', score: latestEval.passingScore || 2 },
      { label: 'Kontrol Bola', score: latestEval.ballControlScore || 2 },
      { label: 'First Touch', score: latestEval.firstTouchScore || 2 },
      { label: 'Finishing', score: latestEval.finishingScore || 2 },
      { label: 'Lindungi Bola', score: latestEval.ballShieldingScore || 2 },
      { label: 'Situasi 1v1', score: latestEval.oneVsOneScore || 2 },
      { label: 'Pemahaman 7v7', score: latestEval.understanding7v7Score || 2 },
    ];
  }, [latestEval]);

  // Radar points geometry
  const radarPoints = useMemo(() => {
    const cx = 150;
    const cy = 150;
    const maxR = 95;
    const total = radarDimensions.length;

    return radarDimensions.map((dim, i) => {
      const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
      const normalized = Math.max(0.5, Math.min(4, dim.score)) / 4;
      const r = normalized * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      // Label coords (slightly pushed out)
      const labelR = maxR + 25;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);

      return { ...dim, x, y, lx, ly, angle };
    });
  }, [radarDimensions]);

  const radarPolygonString = useMemo(() => {
    return radarPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }, [radarPoints]);

  // Technical & Tactical Category Averages
  const technicalAverage = useMemo(() => {
    if (!latestEval) return 0;
    const rawScores = [
      latestEval.dribblingScore,
      latestEval.passingScore,
      latestEval.ballControlScore,
      latestEval.firstTouchScore,
      latestEval.finishingScore,
      latestEval.ballShieldingScore,
      latestEval.oneVsOneScore,
    ];
    const validScores = rawScores.filter((s): s is 1 | 2 | 3 | 4 => typeof s === 'number' && s > 0);
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validScores.length).toFixed(1));
  }, [latestEval]);

  const tacticalAverage = useMemo(() => {
    if (!latestEval) return 0;
    const rawScores = [
      latestEval.bodyOrientationScore,
      latestEval.supportAfterPassScore,
      latestEval.spaceUtilizationScore,
      latestEval.decisionMakingScore,
      latestEval.attackingPositionScore,
      latestEval.defendingPositionScore,
      latestEval.transitionScore,
      latestEval.understanding7v7Score,
    ];
    const validScores = rawScores.filter((s): s is 1 | 2 | 3 | 4 => typeof s === 'number' && s > 0);
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validScores.length).toFixed(1));
  }, [latestEval]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedMotorChartId, setSelectedMotorChartId] = useState<string>('t-sprint10m');

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!selectedPlayer) return;
    setIsExportingPdf(true);
    try {
      const cleanNickname = (selectedPlayer.nickname || selectedPlayer.fullName || 'Pemain')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Rapor_${cleanNickname}_${selectedPlayer.id}_CFA`;
      await exportReportToPdf({
        filename,
        elementId: 'printable-report',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsvReport = () => {
    if (!selectedPlayer) return;

    const rows = [
      ['RAPOR PERKEMBANGAN PEMAIN - CASTINDO FOOTBALL ACADEMY'],
      ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')],
      [''],
      ['IDENTITAS PEMAIN'],
      ['Player ID', selectedPlayer.id],
      ['Nama Lengkap', selectedPlayer.fullName],
      ['Nama Panggilan', selectedPlayer.nickname],
      ['Tanggal Lahir', selectedPlayer.birthDate],
      ['Tahun Lahir', selectedPlayer.birthYear],
      ['Kelompok Tim', playerTeam?.name || selectedPlayer.teamId],
      ['Posisi Utama', selectedPlayer.primaryPosition],
      ['Kaki Dominan', selectedPlayer.dominantFoot],
      [''],
      ['RINGKASAN KEHADIRAN & TRAINING LOAD'],
      ['Persentase Kehadiran', `${attStats?.percentage || 0}%`],
      ['Total Sesi Diikuti', `${attStats?.attended || 0} Sesi`],
      ['Total Menit Bermain', `${attStats?.totalMinutes || 0} Menit`],
      ['Total Beban Latihan', `${loadStats?.totalLoad || 0} AU`],
      ['Rata-rata Beban/Sesi', `${loadStats?.averageLoad || 0} AU`],
      [''],
      ['EVALUASI TERAKHIR'],
      ['Rata-rata Teknik', `${technicalAverage} / 4.0`],
      ['Rata-rata Taktik', `${tacticalAverage} / 4.0`],
      [''],
      ['TARGET LTAD'],
      ...playerLtad.map((g) => [g.domain, g.target, g.status, g.baseline]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rapor_${selectedPlayer.nickname.toLowerCase()}_${selectedPlayer.id}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden during print) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider">
            Pilih Rapor Pemain:
          </span>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-bold min-w-64"
          >
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id} • {p.primaryPosition})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCsvReport}
            disabled={!selectedPlayer}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
            title="Unduh data rapor dalam format spreadsheet CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!selectedPlayer || isExportingPdf}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
            title="Download file PDF resmi ke perangkat"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyiapkan PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unduh File PDF (.pdf)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            disabled={!selectedPlayer}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            title="Buka dialog cetak browser / Simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Raport ke PDF</span>
          </button>
        </div>
      </div>

      {/* Rapor Dokumen Resmi dengan Visual Graphics */}
      {selectedPlayer ? (
        <div
          id="printable-report"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-8 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none"
        >
          {/* Header Kop Resmi */}
          <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-18 h-18 rounded-xl bg-white p-1 shadow-sm border border-emerald-800/30 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo Castindo Football Academy"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-emerald-950 tracking-wider uppercase leading-tight">
                  CASTINDO FOOTBALL ACADEMY
                </h2>
                <div className="text-xs text-emerald-800 font-bold tracking-wide">
                  Laporan Evaluasi & Pemantauan Perkembangan Pemain Usia Dini (Visual Report)
                </div>
                <div className="text-[11px] text-gray-500">
                  Kurikulum Pembinaan 7v7 • Berbasis Long-Term Athlete Development (LTAD) • Format RPE 1–10
                </div>
              </div>
            </div>

            <div className="text-right text-[11px]">
              <span className="font-bold text-gray-800 block">Diterbitkan:</span>
              <span className="text-gray-500 font-medium">
                {formatIndonesianDate(new Date().toISOString(), 'full')}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                Rapor Resmi CFA
              </span>
            </div>
          </div>

          {/* Player Identity Summary with Photo */}
          <div className="bg-gray-50/90 p-4 sm:p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xs shrink-0 bg-white">
              {selectedPlayer.photoUrl ? (
                <img
                  src={selectedPlayer.photoUrl}
                  alt={selectedPlayer.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-900 text-white font-black text-2xl">
                  {(selectedPlayer.nickname || selectedPlayer.fullName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Player ID</span>
                <span className="font-mono font-bold text-emerald-900">{selectedPlayer.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Nama Lengkap</span>
                <span className="font-bold text-gray-900">{selectedPlayer.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Panggilan</span>
                <span className="font-bold text-gray-900">"{selectedPlayer.nickname}"</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Kelahiran (Usia)</span>
                <span className="font-bold text-gray-900">
                  {formatIndonesianDate(selectedPlayer.birthDate)} ({ageInfo?.text})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Kelompok Tim</span>
                <span className="font-bold text-emerald-800">{playerTeam?.name} ({playerTeam?.ageGroup})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Posisi Utama (7v7)</span>
                <span className="font-bold text-gray-900">{selectedPlayer.primaryPosition}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Kaki Dominan</span>
                <span className="font-bold text-gray-900">{selectedPlayer.dominantFoot}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Status Pembinaan</span>
                <span className="font-bold text-emerald-700 uppercase">Aktif Terdaftar</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: PROFIL KOMPETENSI TEKNIK & TAKTIK (LINE / RADAR) */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 gap-2">
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-700" />
                  1. Profil Kompetensi Teknik & Taktik (Skala 1–4)
                </h3>
                <span className="text-[10px] text-gray-500 font-semibold">
                  8 Dimensi Perkembangan Sepak Bola Usia Dini Berbasis Standar LTAD
                </span>
              </div>

              {/* View Switcher: Line Chart vs Radar */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCompetencyViewMode('line')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    competencyViewMode === 'line'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Grafik Garis (Line Chart)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompetencyViewMode('radar')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    competencyViewMode === 'radar'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Radar Spider Web</span>
                </button>
              </div>
            </div>

            {competencyViewMode === 'line' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7">
                  <CompetencyLineChart
                    dimensions={radarDimensions}
                    history={playerEvals}
                    playerName={selectedPlayer.fullName}
                  />
                </div>
                {/* Dimension Scores & Category Summary */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-emerald-950">Indeks Kemahiran Teknikal:</span>
                      <span className="font-black text-emerald-800 text-sm">{technicalAverage} / 4.0</span>
                    </div>
                    {/* Line Scale Indicator */}
                    <div className="relative pt-1 pb-1">
                      <div className="h-1 bg-emerald-200 rounded-full w-full" />
                      <div
                        className="h-1 bg-emerald-700 rounded-full absolute top-1 left-0 transition-all"
                        style={{ width: `${(technicalAverage / 4) * 100}%` }}
                      />
                      <div className="flex justify-between text-[9px] font-bold text-emerald-800 pt-1.5">
                        <span>1. Bimbingan</span>
                        <span>2. Cukup</span>
                        <span>3. Baik</span>
                        <span>4. Mahir</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="font-extrabold text-emerald-950">Pemahaman Taktik 7v7:</span>
                      <span className="font-black text-emerald-800 text-sm">{tacticalAverage} / 4.0</span>
                    </div>
                    {/* Line Scale Indicator */}
                    <div className="relative pt-1 pb-1">
                      <div className="h-1 bg-emerald-200 rounded-full w-full" />
                      <div
                        className="h-1 bg-emerald-700 rounded-full absolute top-1 left-0 transition-all"
                        style={{ width: `${(tacticalAverage / 4) * 100}%` }}
                      />
                      <div className="flex justify-between text-[9px] font-bold text-emerald-800 pt-1.5">
                        <span>1. Posisi</span>
                        <span>2. Ruang</span>
                        <span>3. Transisi</span>
                        <span>4. Mandiri 7v7</span>
                      </div>
                    </div>
                  </div>

                  {latestEval ? (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                      <div className="font-bold text-gray-800 flex items-center justify-between">
                        <span>Evaluasi: {formatIndonesianDate(latestEval.date)}</span>
                        <span className="text-[10px] text-gray-500">{latestEval.context}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        <strong className="text-emerald-800">Kekuatan:</strong> {latestEval.strengths}
                      </p>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        <strong className="text-amber-800">Fokus Lanjutan:</strong> {latestEval.improvementFocus}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Belum ada evaluasi berkala yang tersimpan.</p>
                  )}
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Radar SVG Graphic */}
              <div className="md:col-span-7 flex flex-col items-center justify-center p-3 bg-gray-50/70 rounded-2xl border border-gray-200">
                <svg
                  viewBox="0 0 300 300"
                  className="w-full max-w-[280px] h-[280px] overflow-visible select-none"
                >
                  {/* Concentric webs (scale 1 to 4) */}
                  {[1, 2, 3, 4].map((level) => {
                    const r = (level / 4) * 95;
                    const points = radarDimensions
                      .map((_, i) => {
                        const a = (i * 2 * Math.PI) / radarDimensions.length - Math.PI / 2;
                        return `${(150 + r * Math.cos(a)).toFixed(1)},${(150 + r * Math.sin(a)).toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <g key={level}>
                        <polygon
                          points={points}
                          fill={level % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'none'}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                          strokeDasharray={level === 4 ? 'none' : '3 3'}
                        />
                        <text
                          x={152}
                          y={150 - r + 8}
                          fontSize="8"
                          fill="#94a3b8"
                          fontWeight="bold"
                        >
                          {level}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axes lines */}
                  {radarPoints.map((p, idx) => (
                    <line
                      key={idx}
                      x1="150"
                      y1="150"
                      x2={p.lx}
                      y2={p.ly}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Data Polygon Fill & Stroke */}
                  <polygon
                    points={radarPolygonString}
                    fill="rgba(16, 185, 129, 0.28)"
                    stroke="#047857"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Vertices & Badges */}
                  {radarPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#065f46"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      {/* Label Text */}
                      <text
                        x={p.lx}
                        y={p.ly}
                        fontSize="8.5"
                        fontWeight="bold"
                        fill="#1e293b"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {p.label} ({p.score})
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Area Profil Pemain
                  </span>
                  <span>Skala: 1 (Bimbingan Penuh) s/d 4 (Mandiri & Konsisten)</span>
                </div>
              </div>

              {/* Dimension Scores & Category Summary */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-emerald-950">Indeks Kemahiran Teknikal:</span>
                    <span className="font-black text-emerald-800 text-sm">{technicalAverage} / 4.0</span>
                  </div>
                  {/* Line Scale Indicator */}
                  <div className="relative pt-1 pb-1">
                    <div className="h-1 bg-emerald-200 rounded-full w-full" />
                    <div
                      className="h-1 bg-emerald-700 rounded-full absolute top-1 left-0 transition-all"
                      style={{ width: `${(technicalAverage / 4) * 100}%` }}
                    />
                    <div className="flex justify-between text-[9px] font-bold text-emerald-800 pt-1.5">
                      <span>1. Bimbingan</span>
                      <span>2. Cukup</span>
                      <span>3. Baik</span>
                      <span>4. Mahir</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-extrabold text-emerald-950">Pemahaman Taktik 7v7:</span>
                    <span className="font-black text-emerald-800 text-sm">{tacticalAverage} / 4.0</span>
                  </div>
                  {/* Line Scale Indicator */}
                  <div className="relative pt-1 pb-1">
                    <div className="h-1 bg-emerald-200 rounded-full w-full" />
                    <div
                      className="h-1 bg-emerald-700 rounded-full absolute top-1 left-0 transition-all"
                      style={{ width: `${(tacticalAverage / 4) * 100}%` }}
                    />
                    <div className="flex justify-between text-[9px] font-bold text-emerald-800 pt-1.5">
                      <span>1. Posisi</span>
                      <span>2. Ruang</span>
                      <span>3. Transisi</span>
                      <span>4. Mandiri 7v7</span>
                    </div>
                  </div>
                </div>

                {latestEval ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                    <div className="font-bold text-gray-800 flex items-center justify-between">
                      <span>Evaluasi: {formatIndonesianDate(latestEval.date)}</span>
                      <span className="text-[10px] text-gray-500">{latestEval.context}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      <strong className="text-emerald-800">Kekuatan:</strong> {latestEval.strengths}
                    </p>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      <strong className="text-amber-800">Fokus Lanjutan:</strong> {latestEval.improvementFocus}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada evaluasi berkala yang tersimpan.</p>
                )}
              </div>
            </div>
          )}
        </div>

          {/* ======================================================== */}
          {/* SECTION 2: GRAFIK BEBAN LATIHAN & PRESENSI (RPE 1-10)    */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 gap-2">
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  2. Sistem Training Load Monitoring & AI Sports Scientist
                </h3>
                <span className="text-[10px] text-gray-500 font-semibold">
                  Kalkulasi Matematis sRPE Load, hrTSS, Kurva Kebugaran (CTL, ATL, TSB), & Grafik Garis Mingguan
                </span>
              </div>

              {/* View Switcher: All vs AI Calculator vs TSS PMC vs Foster sRPE */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold self-start sm:self-auto flex-wrap gap-1 print:hidden">
                <button
                  type="button"
                  onClick={() => setLoadChartMode('all')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    loadChartMode === 'all'
                      ? 'bg-emerald-800 text-white shadow-2xs font-extrabold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tampilkan seluruh grafik lengkap untuk dicetak atau disimpan sebagai PDF"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Semua Grafik (Lengkap / Siap Cetak)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoadChartMode('ai_calculator')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    loadChartMode === 'ai_calculator'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Kalkulator AI & Grafik Garis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoadChartMode('tss_pmc')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    loadChartMode === 'tss_pmc'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>Kurva Garis PMC (CTL, ATL, TSB)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoadChartMode('foster_srpe')}
                  className={`px-3 py-1 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1.5 ${
                    loadChartMode === 'foster_srpe'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-3 h-3 text-emerald-600" />
                  <span>Grafik Garis Foster sRPE</span>
                </button>
              </div>
            </div>

            {/* Attendance & Volume Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center break-inside-avoid print-avoid-break">
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Kehadiran Latihan</span>
                <span className="text-xl font-black text-emerald-900">{attStats?.percentage}%</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {attStats?.attended} Hadir / {attStats?.totalSessions} Sesi
                </span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Menit Bermain Aktual</span>
                <span className="text-xl font-black text-gray-900">{attStats?.totalMinutes}m</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Partisipasi lapangan</span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Total Beban Foster (AU)</span>
                <span className="text-xl font-black text-amber-900">{loadStats?.totalLoad || 0} AU</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Durasi × RPE (1–10)</span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Rata-Rata Beban/Sesi</span>
                <span className="text-xl font-black text-amber-900">{loadStats?.averageLoad || 0} AU</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Zona Optimal</span>
              </div>
            </div>

            {/* CHARTS CONTAINER */}
            {loadChartMode === 'all' ? (
              <div className="space-y-6">
                {/* 1. Kalkulator AI Sports Scientist */}
                <div className="space-y-2 break-inside-avoid print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      2.A. Kalkulator AI Sports Scientist & Grafik Garis Tren Mingguan
                    </h4>
                  </div>
                  <AiSportsScientistCalculator
                    player={selectedPlayer}
                    team={playerTeam}
                    age={ageInfo?.years || 9}
                    initialDuration={playerLoads[0]?.actualDurationMinutes || 75}
                    initialRpe={playerLoads[0]?.rpe || 6}
                  />
                </div>

                {/* 2. Kurva Garis PMC */}
                <div className="space-y-2 break-inside-avoid print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      2.B. Kurva Garis Performa PMC (CTL Fitness, ATL Fatigue, & TSB Form)
                    </h4>
                  </div>
                  <TssLoadMonitoringCard loads={playerLoads} playerName={selectedPlayer?.fullName} />
                </div>

                {/* 3. Grafik Garis Foster sRPE */}
                {loadStats && loadStats.recentLoads.length > 0 ? (
                  <div className="space-y-3 break-inside-avoid print-avoid-break">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          2.C. Grafik Garis Perkembangan Beban Latihan (Metode Foster sRPE)
                        </h4>
                      </div>

                      {/* Quick Sub-Toggles for Foster Mode */}
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-[10px] font-bold text-gray-700 print:hidden">
                        <span className="text-[9px] text-gray-500 uppercase px-1">Tampilan Garis:</span>
                        <button
                          type="button"
                          onClick={() => setFosterViewMode('both')}
                          className={`px-2.5 py-1 rounded cursor-pointer transition ${
                            fosterViewMode === 'both' ? 'bg-white text-emerald-900 shadow-2xs' : 'hover:text-gray-900'
                          }`}
                        >
                          Kedua Grafik (Beban & RPE)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFosterViewMode('load-only')}
                          className={`px-2.5 py-1 rounded cursor-pointer transition ${
                            fosterViewMode === 'load-only' ? 'bg-white text-emerald-900 shadow-2xs' : 'hover:text-gray-900'
                          }`}
                        >
                          Hanya Load (AU)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFosterViewMode('rpe-only')}
                          className={`px-2.5 py-1 rounded cursor-pointer transition ${
                            fosterViewMode === 'rpe-only' ? 'bg-white text-indigo-900 shadow-2xs' : 'hover:text-gray-900'
                          }`}
                        >
                          Hanya RPE (1–10)
                        </button>
                      </div>
                    </div>

                    <TrainingLoadRpeDualLineChart
                      loads={loadStats.recentLoads}
                      viewMode={fosterViewMode}
                      onViewModeChange={setFosterViewMode}
                      title="Grafik Perkembangan Beban Latihan (AU) & Respon Kelelahan (RPE 1–10)"
                      subtitle="Sinkronisasi visual tren beban latihan aktual (Metode Foster) bersama persepsi usaha & adaptasi atlet"
                    />

                    {/* Detailed Session Progression List with Line Indicators */}
                    <div className="space-y-2 pt-1 break-inside-avoid print-avoid-break">
                      <span className="text-[11px] font-bold text-gray-700 block">
                        Rincian Beban Per Sesi Latihan:
                      </span>
                      {loadStats.recentLoads.slice(-5).map((item, idx) => {
                        const rpeInfo = item.rpe ? RPE_DESCRIPTIONS[item.rpe] : null;
                        const isHigh = item.load > 500;
                        const isLow = item.load < 200;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isHigh ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                                }`}
                              />
                              <span className="font-bold text-gray-800">
                                {formatIndonesianDate(item.date)} ({item.minutes} Menit Aktual)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              {rpeInfo && <span className="text-sm">{rpeInfo.emoji}</span>}
                              <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-800">
                                RPE {item.rpe || '-'}/10 • {rpeInfo?.label || 'Sesi Tercatat'}
                              </span>
                              <span className="font-black text-emerald-900 font-mono text-xs">
                                {item.load} AU
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHigh
                                    ? 'bg-rose-100 text-rose-800'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isHigh ? 'Beban Tinggi' : isLow ? 'Pemulihan' : 'Optimal'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : loadChartMode === 'ai_calculator' ? (
              /* Mode 1: AI Sports Scientist Calculator with Line Chart & Prompt */
              <AiSportsScientistCalculator
                player={selectedPlayer}
                team={playerTeam}
                age={ageInfo?.years || 9}
                initialDuration={playerLoads[0]?.actualDurationMinutes || 75}
                initialRpe={playerLoads[0]?.rpe || 6}
              />
            ) : loadChartMode === 'tss_pmc' ? (
              /* Mode 2: Full TSS / CTL / ATL / TSB Sports Science Card */
              <TssLoadMonitoringCard loads={playerLoads} playerName={selectedPlayer?.fullName} />
            ) : (
              /* Mode 3: Foster sRPE Dual Line Chart */
              loadStats && loadStats.recentLoads.length > 0 ? (
                <div className="space-y-4 break-inside-avoid print-avoid-break">
                  <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
                    <span className="text-xs font-bold text-gray-600">Pilih Mode Tampilan Garis:</span>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-[10px] font-bold text-gray-700">
                      <button
                        type="button"
                        onClick={() => setFosterViewMode('both')}
                        className={`px-2.5 py-1 rounded cursor-pointer transition ${
                          fosterViewMode === 'both' ? 'bg-white text-emerald-900 shadow-2xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Kedua Grafik (Beban & RPE)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFosterViewMode('load-only')}
                        className={`px-2.5 py-1 rounded cursor-pointer transition ${
                          fosterViewMode === 'load-only' ? 'bg-white text-emerald-900 shadow-2xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Hanya Load (AU)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFosterViewMode('rpe-only')}
                        className={`px-2.5 py-1 rounded cursor-pointer transition ${
                          fosterViewMode === 'rpe-only' ? 'bg-white text-indigo-900 shadow-2xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Hanya RPE (1–10)
                      </button>
                    </div>
                  </div>

                  <TrainingLoadRpeDualLineChart
                    loads={loadStats.recentLoads}
                    viewMode={fosterViewMode}
                    onViewModeChange={setFosterViewMode}
                    title="Grafik Perkembangan Beban Latihan (AU) & Respon Kelelahan (RPE 1–10)"
                    subtitle="Sinkronisasi visual tren beban latihan aktual (Metode Foster) bersama persepsi usaha & adaptasi atlet"
                  />

                  {/* Detailed Session Progression List with Line Indicators */}
                  <div className="space-y-2 pt-1 break-inside-avoid print-avoid-break">
                    <span className="text-[11px] font-bold text-gray-700 block">
                      Rincian Beban Per Sesi Latihan:
                    </span>
                    {loadStats.recentLoads.slice(-5).map((item, idx) => {
                      const rpeInfo = item.rpe ? RPE_DESCRIPTIONS[item.rpe] : null;
                      const isHigh = item.load > 500;
                      const isLow = item.load < 200;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isHigh ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                            />
                            <span className="font-bold text-gray-800">
                              {formatIndonesianDate(item.date)} ({item.minutes} Menit Aktual)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            {rpeInfo && <span className="text-sm">{rpeInfo.emoji}</span>}
                            <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-800">
                              RPE {item.rpe || '-'}/10 • {rpeInfo?.label || 'Sesi Tercatat'}
                            </span>
                            <span className="font-black text-emerald-900 font-mono text-xs">
                              {item.load} AU
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isHigh ? 'Beban Tinggi' : isLow ? 'Pemulihan' : 'Optimal'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Belum ada riwayat beban latihan individual terekam.</p>
              )
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: HASIL PENGUKURAN MOTORIK & FISIK              */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-emerald-950 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-700" />
              3. Hasil Tes Motorik & Kebugaran Fisik Usia Dini
            </h3>

            {playerMotorResults.length > 0 ? (
              <div className="space-y-4">
                {/* SVG Visual Line Chart for Motor Test Progression */}
                {(() => {
                  const availableTestIds = Array.from(new Set(playerMotorResults.map((r) => r.testId)));
                  const activeTestId = availableTestIds.includes(selectedMotorChartId)
                    ? selectedMotorChartId
                    : availableTestIds[0];
                  const testRecords = playerMotorResults
                    .filter((r) => r.testId === activeTestId)
                    .sort((a, b) => a.date.localeCompare(b.date));
                  const testObj = motorTests.find((t) => t.id === activeTestId);

                  if (testRecords.length > 0) {
                    const width = 640;
                    const height = 180;
                    const padLeft = 60;
                    const padRight = 40;
                    const padTop = 25;
                    const padBottom = 40;
                    const plotW = width - padLeft - padRight;
                    const plotH = height - padTop - padBottom;

                    const nums = testRecords.map((r) => r.numericValue);
                    const minVal = Math.min(...nums);
                    const maxVal = Math.max(...nums);
                    const valPadding = (maxVal - minVal) * 0.25 || (minVal * 0.1) || 1;
                    const yMin = Math.max(0, minVal - valPadding);
                    const yMax = maxVal + valPadding;

                    const getY = (val: number) => {
                      if (yMax === yMin) return padTop + plotH / 2;
                      return padTop + (1 - (val - yMin) / (yMax - yMin)) * plotH;
                    };

                    const getX = (idx: number) => {
                      if (testRecords.length <= 1) return padLeft + plotW / 2;
                      return padLeft + (idx / (testRecords.length - 1)) * plotW;
                    };

                    const points = testRecords.map((r, idx) => ({
                      x: getX(idx),
                      y: getY(r.numericValue),
                      ...r,
                    }));

                    const pathD = points.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
                      ''
                    );

                    const areaD =
                      points.length > 0
                        ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
                        : '';

                    const firstVal = testRecords[0].numericValue;
                    const latestVal = testRecords[testRecords.length - 1].numericValue;
                    const diff = latestVal - firstVal;
                    const lowerIsBetter = testObj ? !testObj.higherIsBetter : false;
                    const isImproved = lowerIsBetter ? diff < 0 : diff > 0;

                    return (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                              Grafik Garis Perkembangan: {testObj?.name || activeTestId}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              ({testRecords[0].unit})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {testRecords.length > 1 && diff !== 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isImproved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                Tren: {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {testRecords[0].unit}{' '}
                                ({isImproved ? 'Meningkat' : 'Evaluasi'})
                              </span>
                            )}
                            <select
                              value={activeTestId}
                              onChange={(e) => setSelectedMotorChartId(e.target.value)}
                              className="px-2 py-1 text-[11px] font-bold bg-gray-50 border border-gray-300 rounded-lg text-gray-800 print:hidden"
                            >
                              {availableTestIds.map((tId) => {
                                const t = motorTests.find((x) => x.id === tId);
                                return (
                                  <option key={tId} value={tId}>
                                    {t?.name || tId}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full min-w-[500px] h-38 select-none overflow-visible"
                          >
                            <defs>
                              <linearGradient id="motorLineGradRep" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal guide lines */}
                            {[0.25, 0.5, 0.75].map((pct, idx) => {
                              const gy = padTop + plotH * pct;
                              const gVal = (yMax - pct * (yMax - yMin)).toFixed(1);
                              return (
                                <g key={idx}>
                                  <line
                                    x1={padLeft}
                                    y1={gy}
                                    x2={padLeft + plotW}
                                    y2={gy}
                                    stroke="#e2e8f0"
                                    strokeWidth="1"
                                    strokeDasharray="2 2"
                                  />
                                  <text
                                    x={padLeft - 6}
                                    y={gy + 3}
                                    fontSize="8.5"
                                    fill="#94a3b8"
                                    textAnchor="end"
                                  >
                                    {gVal}
                                  </text>
                                </g>
                              );
                            })}

                            <line
                              x1={padLeft}
                              y1={padTop + plotH}
                              x2={padLeft + plotW}
                              y2={padTop + plotH}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                            />

                            {/* Area fill */}
                            {points.length > 1 && <path d={areaD} fill="url(#motorLineGradRep)" />}

                            {/* Trend Line */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#059669"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Points and value tags */}
                            {points.map((pt, idx) => (
                              <g key={idx}>
                                <line
                                  x1={pt.x}
                                  y1={pt.y}
                                  x2={pt.x}
                                  y2={padTop + plotH}
                                  stroke="#cbd5e1"
                                  strokeWidth="1"
                                  strokeDasharray="2 2"
                                />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill="#059669"
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                />
                                <rect
                                  x={pt.x - 22}
                                  y={pt.y - 21}
                                  width="44"
                                  height="15"
                                  rx="3"
                                  fill="#ffffff"
                                  stroke="#059669"
                                  strokeWidth="1"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 10}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fill="#065f46"
                                  fontFamily="monospace"
                                >
                                  {pt.numericValue} {pt.unit}
                                </text>
                                <text
                                  x={pt.x}
                                  y={padTop + plotH + 15}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fill="#334155"
                                >
                                  Pengujian #{idx + 1}
                                </text>
                                <text
                                  x={pt.x}
                                  y={padTop + plotH + 27}
                                  textAnchor="middle"
                                  fontSize="8.5"
                                  fill="#64748b"
                                >
                                  {formatIndonesianDate(pt.date)}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Individual Cards without Bar Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {playerMotorResults.map((res) => {
                    const test = motorTests.find((t) => t.id === res.testId);
                    return (
                      <div
                        key={res.id}
                        className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-gray-900 block text-xs">
                              {test?.name || res.testId}
                            </strong>
                            <span className="text-gray-500 text-[10px]">
                              {formatIndonesianDate(res.date)} • Kondisi: {res.executionCondition}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-800 text-base block">
                              {res.numericValue} <span className="text-xs font-semibold">{res.unit}</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                              Tercatat Resmi
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/70 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Protokol Standar CFA
                          </span>
                          <span>Pelatih: {res.testerName || 'Tim Pelatih'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-2">Belum ada hasil tes fisik/motorik yang tercatat.</p>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: TARGET LTAD (LONG-TERM ATHLETE DEVELOPMENT)   */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-emerald-950 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              4. Target Perkembangan Jangka Panjang (LTAD) & Karakter
            </h3>

            {/* LTAD Visual Pathway */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tahap Pembinaan: <strong>Active Start & FUNdamentals (Kelahiran 2016–2017)</strong>
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                Format 7v7 LTAD
              </span>
            </div>

            {playerLtad.length > 0 ? (
              <div className="space-y-2">
                {playerLtad.map((g) => (
                  <div key={g.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">
                        Domain: {g.domain} (Target Evaluasi: {formatIndonesianDate(g.reviewDate)})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {g.status}
                      </span>
                    </div>
                    <p className="text-gray-600"><strong>Target:</strong> {g.target}</p>
                    {g.evidenceNotes && (
                      <p className="text-emerald-900 text-[11px]"><strong>Bukti Perkembangan:</strong> {g.evidenceNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-2">Belum ada target LTAD individual terdaftar.</p>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: KESIAPAN PROMOSI TIM A (JIKA ADA)             */}
          {/* ======================================================== */}
          {playerPromReviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-emerald-950 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                5. Status Evaluasi Kesiapan Promosi Tim A
              </h3>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950">
                    Keputusan Staf Pelatih: {playerPromReviews[0].recommendation}
                  </span>
                  <span className="text-emerald-800 text-[11px]">
                    Tanggal: {formatIndonesianDate(playerPromReviews[0].reviewDate)}
                  </span>
                </div>
                <p className="text-emerald-900">
                  <strong>Tindak Lanjut:</strong> {playerPromReviews[0].followUpPlan}
                </p>
                <div className="text-[10px] text-emerald-700 pt-1">
                  Staf Terlibat: {playerPromReviews[0].coachesInvolved.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Tanda Tangan & Legalisasi */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 text-center text-xs print-signature-block print-avoid-break">
            <div>
              <div className="text-gray-500 mb-12">Pelatih Pembina Tim</div>
              <div className="font-bold text-gray-900 border-t border-gray-400 inline-block px-8 pt-1">
                {currentUser?.name || 'Staf Pelatih'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-12">Direktur Teknik / Admin Akademi</div>
              <div className="font-bold text-gray-900 border-t border-gray-400 inline-block px-8 pt-1">
                Mohammad Wildan Kemal Pasha
              </div>
            </div>
          </div>

          {/* Legalitas & Verifikasi Dokumen */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 print:pt-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="CFA Seal" crossOrigin="anonymous" className="w-4 h-4 object-contain opacity-75" />
              <span>Dokumen resmi hasil evaluasi berkala Castindo Football Academy. Dicetak dari Sistem Manajemen CFA.</span>
            </div>
            <span className="font-mono">ID: CFA-REP-{selectedPlayer.id}</span>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center shadow-2xs">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Pilih pemain untuk menampilkan rapor visual perkembangan</h3>
        </div>
      )}
    </div>
  );
};
