import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Activity,
  Award,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  Printer,
  Edit2,
  UserPlus,
  Shield,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Heart,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart2,
  HelpCircle,
  Plus,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { Player, Team, MotorTestResult } from '../../types/database.ts';
import { ParentReportPrintModal } from '../../components/parent/ParentReportPrintModal.tsx';
import { ParentChildEditModal } from './ParentChildEditModal.tsx';
import { ParentLinkChildModal } from './ParentLinkChildModal.tsx';
import { ParentAddAthleteModal } from './ParentAddAthleteModal.tsx';
import { calculateAgeGroup } from '../../utils/ageGroup.ts';

interface ParentDashboardViewProps {
  onNavigateToRegistration?: () => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  onNavigateToRegistration,
}) => {
  const { currentUser } = useAuth();
  const {
    players,
    activePlayers,
    teams,
    evaluations,
    motorTests,
    motorTestResults,
    ltadGoals,
    sessions,
    attendanceRecords,
    getPlayerAttendanceStats,
    getPlayerTrainingLoadStats,
  } = useData();

  // Find linked children for the current logged in parent
  const linkedIds = currentUser?.linkedPlayerIds || [];
  const linkedChildren = useMemo(() => {
    const pool = (players && players.length > 0) ? players : (activePlayers || []);
    return pool.filter((p) => p && linkedIds.includes(p.id));
  }, [players, activePlayers, linkedIds]);

  // Active selected child
  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return linkedChildren[0]?.id || '';
  });

  // Always resolve activeChild safely without assuming selectedChildId is valid
  const activeChild = useMemo(() => {
    if (selectedChildId) {
      const match = linkedChildren.find((c) => c && c.id === selectedChildId);
      if (match) return match;
    }
    return linkedChildren[0] || null;
  }, [linkedChildren, selectedChildId]);

  // Sync if selected child is not in list
  React.useEffect(() => {
    if (linkedChildren.length > 0 && (!selectedChildId || !linkedChildren.some((c) => c && c.id === selectedChildId))) {
      setSelectedChildId(linkedChildren[0].id);
    }
  }, [linkedChildren, selectedChildId]);

  const activeTeam = useMemo(() => {
    if (!activeChild?.teamId) return null;
    return (teams || []).find((t) => t && t.id === activeChild.teamId) || null;
  }, [teams, activeChild?.teamId]);

  const childAgeCalc = activeChild?.birthDate ? calculateAgeGroup(activeChild.birthDate) : null;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'physical' | 'charts' | 'history' | 'attendance' | 'evaluations'>('physical');

  // Selected test protocol for detail chart
  const [selectedChartTestId, setSelectedChartTestId] = useState<string>('t-sprint10m');

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAddAthleteModalOpen, setIsAddAthleteModalOpen] = useState(false);

  // If parent has no linked child yet
  if (linkedChildren.length === 0 || !activeChild) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Portal Orang Tua / Wali Murid
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Datang, {currentUser?.name || 'Wali Murid'}!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Pantau perkembangan fisik dan sepak bola ananda secara transparan: hasil tes fisik resmi, grafik perkembangan, dan laporan pelatih.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Belum Ada Profil Atlet yang Terhubung</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Akun Anda belum terhubung dengan data atlet di Castindo Football Academy. Anda dapat mendaftarkan atlet baru atau memasukkan Kode Undangan resmi dari akademi.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => setIsAddAthleteModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Atlet Baru</span>
            </button>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Gunakan Kode Undangan</span>
            </button>
          </div>
        </div>

        <ParentLinkChildModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          onLinked={() => setIsLinkModalOpen(false)}
        />
        <ParentAddAthleteModal
          isOpen={isAddAthleteModalOpen}
          onClose={() => setIsAddAthleteModalOpen(false)}
          onAdded={(newId) => setSelectedChildId(newId)}
        />
      </div>
    );
  }

  // Attendance stats for active child (safe against null/undefined)
  const attendanceStats = activeChild
    ? getPlayerAttendanceStats(activeChild.id) || {
        totalSessions: 0,
        attended: 0,
        late: 0,
        excused: 0,
        sick: 0,
        absent: 0,
        percentage: 0,
        totalMinutes: 0,
      }
    : {
        totalSessions: 0,
        attended: 0,
        late: 0,
        excused: 0,
        sick: 0,
        absent: 0,
        percentage: 0,
        totalMinutes: 0,
      };

  const trainingLoadStats = activeChild
    ? getPlayerTrainingLoadStats(activeChild.id) || {
        totalLoad: 0,
        averageLoad: 0,
        completedSessionsCount: 0,
        weeklyAverages: [],
        recentLoads: [],
      }
    : {
        totalLoad: 0,
        averageLoad: 0,
        completedSessionsCount: 0,
        weeklyAverages: [],
        recentLoads: [],
      };

  // STRICT REQUIREMENT: Only published test results for parents!
  // Filter out any results that are marked draft / publishedToParents === false
  const childPublishedMotorResults = activeChild
    ? (motorTestResults || [])
        .filter((m) => m && m.playerId === activeChild.id && m.publishedToParents !== false)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Group published test results by testId
  const testResultsByProtocol = useMemo(() => {
    const map: Record<string, MotorTestResult[]> = {};
    childPublishedMotorResults.forEach((r) => {
      if (!map[r.testId]) map[r.testId] = [];
      map[r.testId].push(r);
    });
    return map;
  }, [childPublishedMotorResults]);

  // Key Physical Test Definitions to monitor
  const physicalProtocols = [
    {
      id: 't-sprint10m',
      title: 'Akselerasi (10m Sprint)',
      category: 'Akselerasi',
      unit: 'detik',
      lowerIsBetter: true,
      description: 'Daya ledak start eksplosif lari lurus 10 meter.',
    },
    {
      id: 't-sprint20m',
      title: 'Kecepatan Puncak (20m Sprint)',
      category: 'Kecepatan',
      unit: 'detik',
      lowerIsBetter: true,
      description: 'Kecepatan lari maksimal (top speed).',
    },
    {
      id: 't-illinois',
      title: 'Kelincahan (Illinois Agility)',
      category: 'Kelincahan',
      unit: 'detik',
      lowerIsBetter: true,
      description: 'Kemampuan mengubah arah dan orientasi tubuh cepat.',
    },
    {
      id: 't-broadjump',
      title: 'Daya Ledak (Standing Broad Jump)',
      category: 'Daya Ledak',
      unit: 'cm',
      lowerIsBetter: false,
      description: 'Daya ledak horizontal otot tungkai dan tumpuan melompat.',
    },
    {
      id: 't-yoyo',
      title: 'Daya Tahan (Yo-Yo Intermittent)',
      category: 'Daya Tahan',
      unit: 'meter',
      lowerIsBetter: false,
      description: 'Kapasitas daya tahan aerobik dan pemulihan berulang.',
    },
    {
      id: 't-sitreach',
      title: 'Kelentukan (Sit & Reach)',
      category: 'Kekuatan & Mobilitas',
      unit: 'cm',
      lowerIsBetter: false,
      description: 'Fleksibilitas otot paha belakang (hamstring) & punggung bawah.',
    },
    {
      id: 't-slalom',
      title: 'Kontrol Bola (Slalom Dribble)',
      category: 'Keterampilan Bola',
      unit: 'detik',
      lowerIsBetter: true,
      description: 'Kelincahan dan kontrol sentuhan bola melewati cone.',
    },
  ];

  // Report status determination
  const hasPublishedTests = childPublishedMotorResults.length > 0;
  const childEvals = activeChild
    ? (evaluations || []).filter(
        (e) => e && e.playerId === activeChild.id && e.publishedToParents !== false
      )
    : [];
  const reportStatus: 'ready' | 'evaluating' | 'none' =
    hasPublishedTests || childEvals.length > 0
      ? 'ready'
      : (attendanceStats?.totalSessions || 0) > 0
      ? 'evaluating'
      : 'none';

  return (
    <div className={`space-y-6 max-w-7xl mx-auto ${isPrintModalOpen ? 'print:hidden' : ''}`}>
      {/* Top Banner & Child Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-emerald-400">Portal Orang Tua / Wali Murid</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Wali: <strong className="text-white">{currentUser?.name}</strong></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Monitoring & Analisis Fisik Atlet
            </h1>
            <p className="text-xs text-slate-400">
              Hasil pengukuran fisik objektif yang dicatat dan dipublikasikan resmi oleh staf pelatih.
            </p>
          </div>

          {/* Child Switcher Dropdown / Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Pilih Atlet:</span>
            {linkedChildren.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {child.photoUrl ? (
                    <img
                      src={child.photoUrl}
                      alt={child.fullName}
                      className="w-5 h-5 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-emerald-400 flex items-center justify-center font-bold text-[9px] border border-white/10">
                      {(child.nickname || child.fullName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{child.nickname || (child.fullName ? child.fullName.split(' ')[0] : 'Atlet')}</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsAddAthleteModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
              title="Tambah Atlet Baru ke Akun"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ATHLETE PROFILE CARD (Req 4.A) */}
      {activeChild && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {activeChild.photoUrl ? (
                <img
                  src={activeChild.photoUrl}
                  alt={activeChild.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shadow-2xs">
                  <User className="w-7 h-7 text-gray-400 mb-0.5" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Kosong</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                title="Perbarui Foto Profil"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                  {activeChild.fullName}
                </h2>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeChild.id}
                </span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {activeTeam?.name || 'Castindo Tim B'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                {activeChild.jerseyNumber !== undefined && (
                  <>
                    <span>No. Jersey: <strong className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">#{activeChild.jerseyNumber}</strong></span>
                    <span>·</span>
                  </>
                )}
                <span>Panggilan: <strong className="text-gray-900">{activeChild.nickname}</strong></span>
                <span>·</span>
                <span>Tgl Lahir: <strong className="text-gray-900">{activeChild.birthDate}</strong></span>
                <span>·</span>
                <span>Kelompok Umur: <strong className="text-emerald-700">{childAgeCalc?.ageGroupCode || `U-${activeChild.birthYear ? 2026 - activeChild.birthYear : 9}`}</strong></span>
                <span>·</span>
                <span>Posisi: <strong className="text-gray-900">{activeChild.primaryPosition}</strong></span>
                <span>·</span>
                <span>Kaki: <strong className="text-gray-900">{activeChild.dominantFoot}</strong></span>
              </div>

              <div className="text-[11px] text-gray-400">
                Sekolah: <span className="text-gray-700">{activeChild.school || '-'} ({activeChild.schoolGrade || '-'})</span> · Domisili: <span className="text-gray-700">{activeChild.address || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-initial px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Koreksi Data Dasar</span>
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Raport ke PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* REPORT STATUS BADGE & PROGRESSION (Req 4.E) */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Status Laporan Perkembangan:</span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  reportStatus === 'ready'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : reportStatus === 'evaluating'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-gray-50 text-gray-600 border-gray-300'
                }`}
              >
                {reportStatus === 'ready'
                  ? 'Laporan Tersedia'
                  : reportStatus === 'evaluating'
                  ? 'Menunggu Evaluasi Pelatih'
                  : 'Belum Ada Hasil Tes'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {reportStatus === 'ready'
                ? `Tersedia ${childPublishedMotorResults.length} hasil pengukuran fisik dan ${childEvals.length} evaluasi teknik yang telah diverifikasi pelatih.`
                : 'Staf pelatih akan menginput hasil tes resmi setelah sesi pengukuran fisik berkala.'}
            </p>
          </div>
        </div>

        {reportStatus === 'ready' && (
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 flex items-center gap-1"
          >
            <span>Unduh & Cetak PDF</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* DASHBOARD TAB NAVIGATION */}
      <div className="flex flex-wrap border-b border-gray-200 gap-1 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('physical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'physical'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>B. Ringkasan Performa Fisik</span>
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'charts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>C. Grafik Perkembangan</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>D. Riwayat Tes Lengkap</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Kehadiran & Beban Latihan</span>
        </button>
      </div>

      {/* SECTION B: RINGKASAN PERFORMA FISIK (Req 4.B) */}
      {activeTab === 'physical' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Ringkasan Hasil Tes Fisik Sepak Bola
              </h3>
              <p className="text-xs text-gray-500">
                Hanya menampilkan metrik yang benar-benar telah diuji dan dipublikasikan resmi oleh pelatih.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Total Tes Tercatat: <strong>{childPublishedMotorResults.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicalProtocols.map((proto) => {
              const results = testResultsByProtocol[proto.id] || [];
              const latest = results[results.length - 1];
              const prior = results.length > 1 ? results[results.length - 2] : null;

              // Compute delta if prior exists
              let deltaStr: string | null = null;
              let isImprovement = false;
              if (latest && prior) {
                const diff = latest.numericValue - prior.numericValue;
                if (diff !== 0) {
                  deltaStr = diff > 0 ? `+${diff.toFixed(2)}` : `${diff.toFixed(2)}`;
                  isImprovement = proto.lowerIsBetter ? diff < 0 : diff > 0;
                }
              }

              return (
                <div
                  key={proto.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    latest
                      ? 'bg-white border-gray-200 shadow-xs'
                      : 'bg-gray-50/70 border-dashed border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        {proto.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">
                        {proto.title}
                      </h4>
                    </div>

                    {latest && deltaStr && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full ${
                          isImprovement
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                        title="Perubahan dibanding pengukuran sebelumnya"
                      >
                        {isImprovement ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {deltaStr} {proto.unit}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3">{proto.description}</p>

                  {latest ? (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-gray-900 font-mono">
                            {latest.numericValue}
                          </span>
                          <span className="text-xs font-bold text-gray-500">{proto.unit}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Tgl: {latest.date}
                        </span>
                      </div>

                      {latest.notes && (
                        <p className="text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                          Catatan: {latest.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>Penguji: {latest.testerName || 'Staf Pelatih'}</span>
                        <button
                          onClick={() => {
                            setSelectedChartTestId(proto.id);
                            setActiveTab('charts');
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          Lihat Grafik →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200/60 text-center py-2">
                      <p className="text-xs text-gray-400 italic">Belum ada hasil tes tercatat</p>
                      <span className="text-[10px] text-gray-400">
                        Akan diuji pada jadwal tes fisik berikutnya
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION C: GRAFIK PERKEMBANGAN (Req 4.C) */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Grafik Perkembangan Tes dari Waktu ke Waktu
              </h3>
              <p className="text-xs text-gray-500">
                Membandingkan tes secara konsisten antar tanggal pelaksanaan dengan satuan protokol yang setara.
              </p>
            </div>

            {/* Test Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Pilih Parameter Tes:</span>
              <select
                value={selectedChartTestId}
                onChange={(e) => setSelectedChartTestId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-emerald-500"
              >
                {physicalProtocols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Display Area */}
          {(() => {
            const currentProto = physicalProtocols.find((p) => p.id === selectedChartTestId);
            const records = testResultsByProtocol[selectedChartTestId] || [];

            if (records.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Belum Ada Data Tes untuk {currentProto?.title}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Pelatih belum mencatat dan memublikasikan hasil tes untuk protokol ini pada profil ananda.
                  </p>
                </div>
              );
            }

            // Find min and max for scaling
            const values = records.map((r) => r.numericValue);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = maxVal - minVal || 1;

            return (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <h4 className="text-base font-black text-gray-900">{currentProto?.title}</h4>
                    <p className="text-xs text-gray-500">
                      Satuan: <strong className="text-gray-800">{currentProto?.unit}</strong> · Arah Lebih Baik:{' '}
                      <strong className="text-emerald-700">
                        {currentProto?.lowerIsBetter ? 'Lebih Rendah / Lebih Cepat' : 'Lebih Tinggi'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-gray-500">
                      Total Pengujian: <strong className="text-gray-900">{records.length} Kali</strong>
                    </span>
                    <span className="text-gray-500">
                      Terakhir:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {records[records.length - 1].numericValue} {currentProto?.unit}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* SVG Visual Line Progression Chart */}
                <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5 text-xs">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Grafik Garis Perkembangan (Line Chart): {currentProto?.title}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Satuan: {currentProto?.unit}
                    </span>
                  </div>

                  {(() => {
                    const width = 640;
                    const height = 180;
                    const padLeft = 55;
                    const padRight = 35;
                    const padTop = 25;
                    const padBottom = 40;
                    const plotW = width - padLeft - padRight;
                    const plotH = height - padTop - padBottom;

                    const nums = records.map((r) => r.numericValue);
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
                      if (records.length <= 1) return padLeft + plotW / 2;
                      return padLeft + (idx / (records.length - 1)) * plotW;
                    };

                    const points = records.map((r, idx) => ({
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

                    return (
                      <div className="w-full overflow-x-auto">
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="w-full min-w-[500px] h-38 select-none overflow-visible"
                        >
                          <defs>
                            <linearGradient id="parentMotorLineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal guides */}
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

                          {points.length > 1 && <path d={areaD} fill="url(#parentMotorLineGrad)" />}

                          <path
                            d={pathD}
                            fill="none"
                            stroke="#059669"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

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
                                Tes #{idx + 1}
                              </text>
                              <text
                                x={pt.x}
                                y={padTop + plotH + 27}
                                textAnchor="middle"
                                fontSize="8.5"
                                fill="#64748b"
                              >
                                {pt.date}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* Riwayat Pengukuran Kronologis */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Rincian Pengujian Kronologis:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {records.map((rec, idx) => {
                      const priorRec = idx > 0 ? records[idx - 1] : null;
                      const diff = priorRec ? rec.numericValue - priorRec.numericValue : null;
                      const improved = diff !== null && (currentProto?.lowerIsBetter ? diff < 0 : diff > 0);

                      return (
                        <div
                          key={rec.id}
                          className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between text-gray-500">
                            <span className="font-semibold">Tes #{idx + 1}</span>
                            <span className="font-mono">{rec.date}</span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-gray-900 font-mono">
                                {rec.numericValue}
                              </span>
                              <span className="text-xs text-gray-500 font-bold">{rec.unit}</span>
                            </div>

                            {diff !== null && (
                              <span
                                className={`text-[11px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                                  improved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {rec.notes ? (
                            <p className="text-[11px] text-gray-600 italic bg-white p-2 rounded border border-gray-100">
                              {rec.notes}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">
                              Kondisi: {rec.executionCondition || 'Sesi latihan reguler'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SECTION D: RIWAYAT TES LENGKAP (Req 4.D) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Semua Riwayat Tes Fisik yang Dipublikasikan
              </h3>
              <p className="text-xs text-gray-500">
                Daftar lengkap hasil pengujian fisik, tanggal, satuan, dan catatan pelatih.
              </p>
            </div>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Raport ke PDF</span>
            </button>
          </div>

          {childPublishedMotorResults.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Tanggal Tes</th>
                      <th className="py-3 px-4">Nama Tes Fisik</th>
                      <th className="py-3 px-4">Hasil Pengukuran</th>
                      <th className="py-3 px-4">Kondisi Lapangan</th>
                      <th className="py-3 px-4">Penguji</th>
                      <th className="py-3 px-4">Catatan Pelatih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {childPublishedMotorResults.map((result) => {
                      const testDef = motorTests.find((t) => t.id === result.testId);
                      return (
                        <tr key={result.id} className="hover:bg-gray-50/80">
                          <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                            {result.date}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">
                              {testDef?.name || result.testId}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {testDef?.category || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              {result.numericValue}
                            </span>{' '}
                            <span className="text-gray-500 font-bold">{result.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {result.executionCondition || 'Lapangan Rumput'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {result.testerName || 'Staf Pelatih'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 italic">
                            {result.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500 italic">
              Belum ada riwayat tes fisik yang dipublikasikan oleh pelatih untuk atlet ini.
            </div>
          )}
        </div>
      )}

      {/* SECTION E: KEHADIRAN & BEBAN LATIHAN */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-gray-200">
              <span className="text-xs text-gray-500 font-bold uppercase">Persentase Hadir</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {attendanceStats.percentage}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {attendanceStats.attended + attendanceStats.late} dari {attendanceStats.totalSessions} sesi
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200">
              <span className="text-xs text-gray-500 font-bold uppercase">Waktu di Lapangan</span>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {attendanceStats.totalMinutes} Menit
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total durasi aktif latihan</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200">
              <span className="text-xs text-gray-500 font-bold uppercase">Beban Latihan (RPE)</span>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {trainingLoadStats.totalLoad} AU
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Akumulasi volume & intensitas</p>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeChild && (
        <>
          <ParentChildEditModal
            player={activeChild}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />

          <ParentReportPrintModal
            player={activeChild}
            team={activeTeam || undefined}
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
          />
        </>
      )}

      <ParentLinkChildModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLinked={() => setIsLinkModalOpen(false)}
      />

      <ParentAddAthleteModal
        isOpen={isAddAthleteModalOpen}
        onClose={() => setIsAddAthleteModalOpen(false)}
        onAdded={(newId) => setSelectedChildId(newId)}
      />
    </div>
  );
};
