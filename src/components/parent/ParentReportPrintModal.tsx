import React, { useState } from 'react';
import {
  X,
  Printer,
  Shield,
  CheckCircle2,
  Calendar,
  Award,
  User,
  Clock,
  FileText,
  FileDown,
  Loader2,
  Activity,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Player, Team } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { exportReportToPdf } from '../../utils/pdfExport.ts';
import {
  TrainingLoadRpeDualLineChart,
  TrainingLoadViewMode,
} from '../reports/TrainingLoadRpeDualLineChart.tsx';
import { TssLoadMonitoringCard } from '../reports/TssLoadMonitoringCard.tsx';
import { AiSportsScientistCalculator } from '../reports/AiSportsScientistCalculator.tsx';
import { calculateTssMetrics } from '../../utils/tssEngine.ts';
import { calculateAge } from '../../utils/formatters.ts';
import { Sparkles, BarChart3 } from 'lucide-react';

interface ParentReportPrintModalProps {
  player: Player;
  team?: Team;
  isOpen: boolean;
  onClose: () => void;
}

export const ParentReportPrintModal: React.FC<ParentReportPrintModalProps> = ({
  player,
  team,
  isOpen,
  onClose,
}) => {
  const {
    getPlayerAttendanceStats,
    getPlayerTrainingLoadStats,
    evaluations,
    motorTestResults,
    motorTests,
    ltadGoals,
    database,
  } = useData();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [fosterViewMode, setFosterViewMode] = useState<TrainingLoadViewMode>('both');
  const [includePmcCurve, setIncludePmcCurve] = useState<boolean>(true);
  const [includeFosterChart, setIncludeFosterChart] = useState<boolean>(true);
  const [includeAiCalculator, setIncludeAiCalculator] = useState<boolean>(true);

  if (!isOpen) return null;

  const attendanceStats = getPlayerAttendanceStats(player.id);
  const trainingLoadStats = getPlayerTrainingLoadStats(player.id);
  const playerLoads = database?.trainingLoadRecords?.filter((tl) => tl.playerId === player.id) || [];
  const tssMetrics = calculateTssMetrics(playerLoads, { days: 28 });
  const playerAge = calculateAge(player.birthDate).years || 9;

  // Latest published technical/tactical evaluation
  const playerEvals = evaluations
    .filter((e) => e.playerId === player.id && e.publishedToParents !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestEval = playerEvals[0];

  // Motor test results
  const playerMotorResults = motorTestResults
    .filter((m) => m.playerId === player.id && m.publishedToParents !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // LTAD goals
  const playerLtad = ltadGoals
    .filter((g) => g.playerId === player.id && g.publishedToParents !== false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const cleanNickname = (player.nickname || player.fullName || 'Pemain')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Rapor_CFA_${cleanNickname}_${player.id}`;
      await exportReportToPdf({
        filename,
        elementId: 'printable-parent-report',
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-container">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[96vh] print-modal-card">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Pratinjau Raport Perkembangan Atlet</h2>
              <p className="text-xs text-emerald-300">Format Resmi Dokumen Castindo Football Academy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all border border-emerald-600 disabled:opacity-50 cursor-pointer"
              title="Unduh file PDF langsung ke perangkat"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Unduh File PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              title="Cetak melalui dialog printer / Simpan sebagai PDF browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Raport ke PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors ml-1 cursor-pointer"
              aria-label="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Toolbar (Hidden in Print) */}
        <div className="bg-emerald-900/90 text-white px-6 py-2.5 border-b border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-emerald-200">Mode Grafik Beban:</span>
            <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-700">
              <button
                type="button"
                onClick={() => setFosterViewMode('both')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  fosterViewMode === 'both' ? 'bg-white text-emerald-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Kedua Grafik (Beban & RPE)
              </button>
              <button
                type="button"
                onClick={() => setFosterViewMode('load-only')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  fosterViewMode === 'load-only' ? 'bg-white text-emerald-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Hanya Load (AU)
              </button>
              <button
                type="button"
                onClick={() => setFosterViewMode('rpe-only')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  fosterViewMode === 'rpe-only' ? 'bg-white text-indigo-950 shadow-xs' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Hanya RPE (1–10)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-emerald-200 flex-wrap">
            <span className="font-bold text-white">Sertakan di Dokumen:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFosterChart}
                onChange={(e) => setIncludeFosterChart(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>Grafik Foster sRPE</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePmcCurve}
                onChange={(e) => setIncludePmcCurve(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>Kurva Garis PMC</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAiCalculator}
                onChange={(e) => setIncludeAiCalculator(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>Kalkulator AI & Grafik</span>
            </label>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-parent-report"
          className="p-6 sm:p-10 overflow-y-auto space-y-6 print:p-6 print:space-y-4 text-gray-900 bg-white"
        >
          {/* Academy Letterhead (KOP) */}
          <div className="border-b-2 border-emerald-900 pb-5 flex items-center justify-between print-avoid-break">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md border border-emerald-800/30 shrink-0">
                <img
                  src="/logo.png"
                  alt="Castindo Football Academy"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-wider leading-tight">
                  Castindo Football Academy
                </h1>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                  Pusat Pembinaan Sepak Bola Usia Dini & Long-Term Athlete Development
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Surabaya, Jawa Timur • Email: academy@castindo.ac.id • Web: castindo.ac.id
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black uppercase rounded tracking-wider border border-emerald-300">
                Laporan Perkembangan
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">
                No. Dok: CFA-REP/{player.id}/{new Date().getFullYear()}
              </div>
              <div className="text-[11px] text-gray-600">
                Tanggal Cetak: <span className="font-semibold">{today}</span>
              </div>
            </div>
          </div>

          {/* Player Identity Banner */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center print-avoid-break">
            <div className="flex items-center gap-3 sm:col-span-2">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.fullName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-600 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-gray-300 text-gray-500 flex flex-col items-center justify-center font-black text-xl shrink-0">
                  {player.nickname ? player.nickname.charAt(0).toUpperCase() : <User className="w-7 h-7 text-gray-400" />}
                </div>
              )}
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{player.fullName}</h3>
                <p className="text-xs text-gray-600">
                  Nama Panggilan: <span className="font-bold text-gray-900">{player.nickname || '-'}</span> • ID: <span className="font-mono font-bold text-emerald-700">{player.id}</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Tahun Lahir: <span className="font-semibold">{player.birthYear} ({player.birthDate})</span> • Kaki: <span className="font-semibold">{player.dominantFoot}</span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Kelompok Tim</p>
              <p className="text-sm font-black text-emerald-800">{team?.name || 'Castindo Football Academy'}</p>
              <p className="text-[11px] text-gray-600 font-medium">{team?.ageGroup || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Posisi Bermain</p>
              <p className="text-sm font-bold text-gray-900">{player.primaryPosition}</p>
              {player.secondaryPosition && (
                <p className="text-[11px] text-gray-500">Alternatif: {player.secondaryPosition}</p>
              )}
            </div>
          </div>

          {/* Section A: Kehadiran & Partisipasi Latihan */}
          <div className="space-y-2 print-avoid-break">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>A. Ringkasan Kehadiran & Partisipasi Latihan</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-center">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Tingkat Kehadiran</p>
                <p className="text-2xl font-black text-emerald-700">{attendanceStats.percentage}%</p>
                <p className="text-[10px] text-emerald-600 font-medium">Konsistensi Disiplin</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Sesi Diikuti</p>
                <p className="text-2xl font-black text-gray-900">{attendanceStats.attended + attendanceStats.late} / {attendanceStats.totalSessions}</p>
                <p className="text-[10px] text-gray-500">Total Sesi Terjadwal</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Durasi Partisipasi</p>
                <p className="text-2xl font-black text-gray-900">{attendanceStats.totalMinutes}</p>
                <p className="text-[10px] text-gray-500">Menit di Lapangan</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Izin / Sakit</p>
                <p className="text-2xl font-black text-amber-700">{attendanceStats.excused + attendanceStats.sick}</p>
                <p className="text-[10px] text-gray-500">Ketidakhadiran Wajar</p>
              </div>
            </div>

            {/* TSS Load Monitoring Summary Strip (CTL, ATL, TSB) for Official Report */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2 break-inside-avoid print-avoid-break">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sistem Monitoring Beban TSS (Sports Science)</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tssMetrics.status.badgeBg} ${tssMetrics.status.badgeText} ${tssMetrics.status.badgeBorder}`}
                >
                  Form: {tssMetrics.status.shortLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Daily TSS</span>
                  <span className="text-base font-black text-slate-900">{tssMetrics.avgDailyTSS}</span>
                  <span className="text-[9px] text-slate-400 block">Rata-rata Harian</span>
                </div>
                <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold block uppercase">CTL (Fitness)</span>
                  <span className="text-base font-black text-blue-950">{tssMetrics.currentCTL}</span>
                  <span className="text-[9px] text-blue-600 block">Kebugaran Kronis (42d)</span>
                </div>
                <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">ATL (Fatigue)</span>
                  <span className="text-base font-black text-amber-950">{tssMetrics.currentATL}</span>
                  <span className="text-[9px] text-amber-700 block">Kelelahan Akut (7d)</span>
                </div>
                <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">TSB (Form)</span>
                  <span className="text-base font-black text-emerald-950">
                    {tssMetrics.currentTSB > 0 ? `+${tssMetrics.currentTSB}` : tssMetrics.currentTSB}
                  </span>
                  <span className="text-[9px] text-emerald-700 block">Kesiapan Tanding</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-600 leading-tight">
                <strong>Catatan Pelatih:</strong> {tssMetrics.status.coachingAdvice}
              </p>
            </div>

            {/* 1. Kurva Garis Performa PMC (CTL, ATL, TSB, Daily TSS) */}
            {includePmcCurve && (
              <div className="space-y-2 pt-2 break-inside-avoid print-avoid-break">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Kurva Garis Performa PMC (CTL Kebugaran, ATL Kelelahan, & TSB Form)
                  </h5>
                </div>
                <TssLoadMonitoringCard loads={playerLoads} playerName={player.fullName} />
              </div>
            )}

            {/* 2. Visual Dual Line Graph: Training Load (AU) & Session RPE (1-10) with ViewMode */}
            {includeFosterChart && trainingLoadStats && trainingLoadStats.recentLoads.length > 0 && (
              <div className="space-y-2 pt-2 break-inside-avoid print-avoid-break">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Grafik Garis Perkembangan Beban Latihan (Metode Foster sRPE)
                    </h5>
                  </div>
                  <div className="text-[10px] font-bold text-gray-600">
                    Mode: <span className="text-emerald-800">{fosterViewMode === 'both' ? 'Kedua Grafik (Beban & RPE)' : fosterViewMode === 'load-only' ? 'Hanya Load (AU)' : 'Hanya RPE (1–10)'}</span>
                  </div>
                </div>
                <TrainingLoadRpeDualLineChart
                  loads={trainingLoadStats.recentLoads}
                  viewMode={fosterViewMode}
                  onViewModeChange={setFosterViewMode}
                  title="Grafik Perkembangan: Beban Latihan (AU) & Respon RPE (1–10)"
                  subtitle="Sinkronisasi visual ritme beban latihan aktual dan persepsi kelelahan atlet"
                />
              </div>
            )}

            {/* 3. Kalkulator AI Sports Scientist & Grafik Garis Akumulasi Beban Mingguan */}
            {includeAiCalculator && (
              <div className="space-y-2 pt-2 break-inside-avoid print-avoid-break">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Kalkulator AI Sports Scientist & Grafik Garis Tren Beban Mingguan
                  </h5>
                </div>
                <AiSportsScientistCalculator
                  player={player}
                  team={team}
                  age={playerAge}
                  initialDuration={playerLoads[0]?.actualDurationMinutes || 75}
                  initialRpe={playerLoads[0]?.rpe || 6}
                />
              </div>
            )}
          </div>

          {/* Section B: Evaluasi Kemampuan Teknik & Taktik */}
          <div className="space-y-2 print-avoid-break">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>B. Evaluasi Keterampilan Teknik & Taktik (Skala 1 - 4)</span>
            </h4>
            {latestEval ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Dribbling & Ball Feeling</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.dribblingScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Passing (Akurasi & Bobot)</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.passingScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">First Touch & Kontrol Bola</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.firstTouchScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Finishing / Shooting</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.finishingScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Pengambilan Keputusan (1v1)</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.decisionMakingScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Orientasi Tubuh Sebelum Bola</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.bodyOrientationScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Pemanfaatan Ruang 7v7</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.spaceUtilizationScore || '-'}/4</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[11px] text-gray-600 block">Transisi Menyerang-Bertahan</span>
                    <span className="font-black text-emerald-800 text-base">{latestEval.transitionScore || '-'}/4</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <div>
                    <span className="font-bold text-emerald-950 block mb-0.5">Kekuatan Utama yang Menonjol:</span>
                    <p className="text-gray-700 italic">{latestEval.strengths || 'Pemain menunjukkan semangat tinggi dalam latihan serta penguasaan bola yang konsisten.'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block mb-0.5">Fokus Pengembangan Selanjutnya:</span>
                    <p className="text-gray-700 italic">{latestEval.improvementFocus || 'Meningkatkan keberanian sentuhan pertama dengan kaki non-dominan.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded border border-gray-200">
                Belum ada evaluasi teknik & taktik resmi yang dipublikasikan pada periode ini.
              </p>
            )}
          </div>

          {/* Section C: Hasil Tes Motorik & Fisik */}
          <div className="space-y-2 print-avoid-break">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>C. Hasil Pengukuran Tes Motorik & Kebugaran Fisik</span>
            </h4>
            {playerMotorResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Nama Parameter Tes</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Nilai Tercatat</th>
                      <th className="py-2 px-3">Tanggal Tes</th>
                      <th className="py-2 px-3">Catatan Pelatih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {playerMotorResults.slice(0, 5).map((r) => {
                      const testObj = motorTests.find((t) => t.id === r.testId);
                      return (
                        <tr key={r.id}>
                          <td className="py-2 px-3 font-semibold">{testObj?.name || r.testId}</td>
                          <td className="py-2 px-3 text-gray-500">{testObj?.category || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">
                            {r.numericValue} {r.unit}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{r.date}</td>
                          <td className="py-2 px-3 text-gray-600 italic">{r.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded border border-gray-200">
                Hasil tes motorik resmi akan diperbarui pada jadwal pengukuran berkala akademi.
              </p>
            )}
          </div>

          {/* Section D: Target LTAD & Catatan Orang Tua */}
          <div className="space-y-2 print-avoid-break">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>D. Rekomendasi & Catatan Pelatih untuk Orang Tua/Wali</span>
            </h4>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 space-y-2 text-xs">
              <div>
                <span className="font-bold text-emerald-950 block">Pesan Pembinaan & Apresiasi:</span>
                <p className="text-gray-800 leading-relaxed mt-0.5">
                  {player.coachNotesForParent ||
                    'Ananda menunjukkan antusiasme yang sangat baik di setiap sesi latihan. Disiplin hadir tepat waktu dan sikap respek terhadap teman tim menjadi modal utama perkembangan karakternya.'}
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-200/80">
                <span className="font-bold text-emerald-950 block">Rekomendasi Latihan Mandiri di Rumah:</span>
                <p className="text-gray-800 leading-relaxed mt-0.5">
                  {player.parentRecommendations ||
                    'Disarankan melakukan latihan koordinasi ringan 15 menit per hari di rumah (juggling santai dan kontrol sentuhan bola dinding) serta memastikan asupan cairan dan istirahat yang cukup pasca latihan.'}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs text-gray-700 print-signature-block print-avoid-break">
            <div>
              <p className="text-gray-500">Orang Tua / Wali Murid</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-gray-400"></div>
              </div>
              <p className="font-bold mt-1">({player.guardianName || 'Wali Pemain'})</p>
            </div>
            <div>
              <p className="text-gray-500">Pelatih Kepala (Head Coach)</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-gray-400"></div>
              </div>
              <p className="font-bold mt-1">Coach Castindo FA</p>
            </div>
            <div>
              <p className="text-gray-500">Direktur / Admin Akademi</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-gray-400"></div>
              </div>
              <p className="font-bold mt-1">Mohammad Wildan K. P.</p>
            </div>
          </div>

          {/* Legalitas & Verifikasi Dokumen */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 print:pt-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="CFA Seal" crossOrigin="anonymous" className="w-4 h-4 object-contain opacity-80" />
              <span>Dokumen resmi hasil evaluasi berkala Castindo Football Academy. Dicetak dari Sistem Manajemen CFA.</span>
            </div>
            <span className="font-mono">ID: CFA-REP-{player.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
