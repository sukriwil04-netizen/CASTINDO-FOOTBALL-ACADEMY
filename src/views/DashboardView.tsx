import React, { useMemo, useState } from 'react';
import {
  Users,
  CalendarCheck,
  Activity,
  ClipboardList,
  Target,
  Zap,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Shield,
  CheckCircle2,
  HelpCircle,
  Trophy,
  Swords,
} from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  formatIndonesianDate,
  RPE_DESCRIPTIONS,
  SCALE_4_DESCRIPTIONS,
} from '../utils/formatters.ts';
import { NavTab } from '../components/navigation/Sidebar.tsx';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenPlayerDetail?: (playerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenPlayerDetail,
}) => {
  const {
    players,
    activePlayers,
    sessions,
    attendanceRecords,
    trainingLoads,
    evaluations,
    motorTests,
    motorTestResults,
    ltadGoals,
    promotionReviews,
    matches,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    selectedBirthYear,
    setSelectedBirthYear,
    selectedDateRange,
    setSelectedDateRange,
    isLoading,
  } = useData();

  const { canManagePlayers, canManageSessions } = useAuth();
  const [individualPlayerId, setIndividualPlayerId] = useState<string>('all');

  // Filter players based on selected team & birth year
  const filteredPlayers = useMemo(() => {
    return activePlayers.filter((p) => {
      if (selectedTeamId !== 'all' && p.teamId !== selectedTeamId) return false;
      if (selectedBirthYear !== 'all' && String(p.birthYear) !== selectedBirthYear) return false;
      if (individualPlayerId !== 'all' && p.id !== individualPlayerId) return false;
      return true;
    });
  }, [activePlayers, selectedTeamId, selectedBirthYear, individualPlayerId]);

  // Filter completed sessions based on selected team
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedTeamId !== 'all' && s.teamId !== selectedTeamId) return false;
      return true;
    });
  }, [sessions, selectedTeamId]);

  const completedSessions = useMemo(
    () => filteredSessions.filter((s) => s.status === 'completed'),
    [filteredSessions]
  );

  // Filter matches based on selected team
  const filteredMatches = useMemo(() => {
    return (matches || [])
      .filter((m) => {
        if (!m) return false;
        if (selectedTeamId !== 'all' && m.teamId !== selectedTeamId) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [matches, selectedTeamId]);

  // Next scheduled training session
  const nextSession = useMemo(() => {
    const scheduled = sessions.filter((s) => {
      if (!s) return false;
      if (selectedTeamId !== 'all' && s.teamId !== selectedTeamId) return false;
      return s.status === 'scheduled';
    });
    return scheduled.sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0] || null;
  }, [sessions, selectedTeamId]);

  // Overall attendance rate across filtered players & completed sessions
  const attendanceRate = useMemo(() => {
    if (filteredPlayers.length === 0 || completedSessions.length === 0) return 0;
    const sessionIds = new Set(completedSessions.map((s) => s.id));
    const playerIds = new Set(filteredPlayers.map((p) => p.id));

    const records = attendanceRecords.filter(
      (a) => sessionIds.has(a.sessionId) && playerIds.has(a.playerId)
    );

    if (records.length === 0) return 0;
    const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    return Math.round((attended / records.length) * 100);
  }, [filteredPlayers, completedSessions, attendanceRecords]);

  // Weekly Training Load sum (last 7 days or current sessions)
  const trainingLoadSummary = useMemo(() => {
    const playerIds = new Set(filteredPlayers.map((p) => p.id));
    const relevantLoads = trainingLoads.filter(
      (tl) => playerIds.has(tl.playerId) && tl.trainingLoad !== null && tl.trainingLoad > 0
    );

    const totalAu = relevantLoads.reduce((sum, tl) => sum + (tl.trainingLoad || 0), 0);
    const avgAuPerSession = relevantLoads.length > 0 ? Math.round(totalAu / relevantLoads.length) : 0;

    return { totalAu, avgAuPerSession, count: relevantLoads.length };
  }, [filteredPlayers, trainingLoads]);

  // Players needing evaluation (> 30 days without evaluation or never evaluated)
  const pendingEvaluationPlayers = useMemo(() => {
    const now = new Date().getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return filteredPlayers.filter((p) => {
      const playerEvals = evaluations.filter((e) => e.playerId === p.id);
      if (playerEvals.length === 0) return true;
      const latest = Math.max(...playerEvals.map((e) => new Date(e.date).getTime()));
      return latest < thirtyDaysAgo;
    });
  }, [filteredPlayers, evaluations]);

  // LTAD counts
  const ltadSummary = useMemo(() => {
    const playerIds = new Set(filteredPlayers.map((p) => p.id));
    const relevant = ltadGoals.filter((g) => playerIds.has(g.playerId));

    const inProgress = relevant.filter((g) => g.status === 'Berjalan' || g.status === 'Berkembang').length;
    const achieved = relevant.filter((g) => g.status === 'Tercapai').length;
    const needsReview = relevant.filter((g) => g.status === 'Perlu Ditinjau').length;
    const notStarted = relevant.filter((g) => g.status === 'Belum Mulai').length;

    return { total: relevant.length, inProgress, achieved, needsReview, notStarted };
  }, [filteredPlayers, ltadGoals]);

  // Promotion Readiness candidates
  const promotionSummary = useMemo(() => {
    const playerIds = new Set(filteredPlayers.map((p) => p.id));
    const reviews = promotionReviews.filter((r) => playerIds.has(r.playerId));
    const readyForObservation = reviews.filter((r) => r.recommendation === 'Siap Mengikuti Sesi Observasi Tim A');
    const discussStaff = reviews.filter((r) => r.recommendation === 'Direkomendasikan untuk Dibahas dengan Staf');
    return {
      totalReviewed: reviews.length,
      readyCount: readyForObservation.length,
      discussCount: discussStaff.length,
      recentCandidates: reviews.slice(0, 3),
    };
  }, [filteredPlayers, promotionReviews]);

  // Average Technical & Tactical scores
  const evalDomainAverages = useMemo(() => {
    const playerIds = new Set(filteredPlayers.map((p) => p.id));
    const evals = evaluations.filter((e) => playerIds.has(e.playerId));
    if (evals.length === 0) return null;

    const calcAvg = (getter: (e: (typeof evals)[0]) => number | null) => {
      const valid = evals.map(getter).filter((val): val is number => val !== null);
      if (valid.length === 0) return null;
      return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
    };

    return {
      dribbling: calcAvg((e) => e.dribblingScore),
      passing: calcAvg((e) => e.passingScore),
      control: calcAvg((e) => e.ballControlScore),
      oneVsOne: calcAvg((e) => e.oneVsOneScore),
      space: calcAvg((e) => e.spaceUtilizationScore),
      decision: calcAvg((e) => e.decisionMakingScore),
      bodyOrientation: calcAvg((e) => e.bodyOrientationScore),
      understanding7v7: calcAvg((e) => e.understanding7v7Score),
    };
  }, [filteredPlayers, evaluations]);

  // Empty state handling
  const isEmptyDatabase = players.length === 0;

  return (
    <div className="space-y-6">
      {/* Empty State Banner if no players exist */}
      {isEmptyDatabase && (
        <div className="p-6 bg-gradient-to-br from-emerald-900 to-green-950 text-white rounded-2xl shadow-lg border border-emerald-700/60 flex items-start gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-md shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="CFA" className="w-full h-full object-contain" />
          </div>
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-800/80 rounded-full text-xs font-semibold text-emerald-200">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sistem Siap Digunakan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Selamat Datang di CASTINDO FOOTBALL ACADEMY
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Basis data siap untuk pencatatan pemain dan program latihan nyata. Anda dapat
              memasukkan data pemain awal Tim B dan membuat sesi latihan pertama.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('players')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pemain Pertama</span>
              </button>
              <button
                onClick={() => onNavigate('sessions')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors border border-emerald-600"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Buat Sesi Latihan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Filter Data:
          </span>

          {/* Team Filter */}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="all">Semua Kelompok Tim</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Birth Year Filter */}
          <select
            value={selectedBirthYear}
            onChange={(e) => setSelectedBirthYear(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="all">Semua Tahun Lahir</option>
            <option value="2016">Kelahiran 2016 (U-9)</option>
            <option value="2017">Kelahiran 2017 (U-8)</option>
            <option value="2015">Kelahiran 2015</option>
          </select>

          {/* Individual Player Filter */}
          <select
            value={individualPlayerId}
            onChange={(e) => setIndividualPlayerId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="all">Semua Pemain Individual</option>
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

          {/* Date range preset */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="all">Seluruh Periode</option>
            <option value="last_30">30 Hari Terakhir</option>
            <option value="last_90">90 Hari Terakhir</option>
          </select>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Menampilkan <span className="font-bold text-gray-800">{filteredPlayers.length}</span> pemain aktif
        </div>
      </div>

      {/* KPI Statistic Cards (Section 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemain Aktif */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Pemain Aktif
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {filteredPlayers.length}
          </div>
          <div className="mt-1 flex items-center text-xs text-gray-500 justify-between">
            <span>2016: {filteredPlayers.filter((p) => p.birthYear === 2016).length} pemain</span>
            <span>2017: {filteredPlayers.filter((p) => p.birthYear === 2017).length} pemain</span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Kehadiran */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Rata-rata Presensi
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {attendanceRate}%
            </span>
            <span className="text-xs font-medium text-gray-500">
              dari {completedSessions.length} sesi selesai
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                attendanceRate >= 80 ? 'bg-emerald-600' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Training Load Terakumulasi */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Akumulasi Beban (AU)
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {trainingLoadSummary.totalAu.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-gray-500">AU</span>
          </div>
          <div className="mt-1 text-xs text-gray-500 truncate">
            Rata-rata: <span className="font-semibold text-gray-700">{trainingLoadSummary.avgAuPerSession} AU</span> / sesi
          </div>
        </div>

        {/* Card 4: Target LTAD Berjalan */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Progress LTAD
            </span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {ltadSummary.achieved}
            </span>
            <span className="text-xs font-medium text-gray-500">
              / {ltadSummary.total} target tercapai
            </span>
          </div>
          <div className="mt-1 text-xs text-purple-700 font-medium">
            {ltadSummary.inProgress} target sedang berkembang
          </div>
        </div>
      </div>

      {/* Row 2: Next Training Session & Promotion Readiness Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Training Session Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Jadwal Latihan Berikutnya
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                Format 7v7
              </span>
            </div>

            {nextSession ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-sm font-bold text-emerald-950">
                    {nextSession.focus}
                  </div>
                  <div className="mt-1 flex items-center text-xs text-emerald-800 gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatIndonesianDate(nextSession.date, 'full')} • {nextSession.time}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                    {nextSession.objective}
                  </p>
                </div>
                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <span>Pelatih: <strong className="text-gray-700">{nextSession.coachName}</strong></span>
                  <span>Alat: <strong className="text-gray-700">{nextSession.equipment}</strong></span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-500" />
                <p className="text-xs">Belum ada sesi latihan terjadwal.</p>
                {canManageSessions && (
                  <button
                    onClick={() => onNavigate('sessions')}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    + Buat Sesi Baru
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => onNavigate('sessions')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Lihat Seluruh Sesi <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Evaluasi Promosi Tim A Summary */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                Ringkasan Kesiapan Promosi ke Tim A
              </h3>
              <span className="text-xs text-gray-500">
                Evaluasi Multi-Faset Berbasis Bukti
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500">Total Direview</div>
                <div className="text-xl font-bold text-gray-800">
                  {promotionSummary.totalReviewed} pemain
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold">Siap Observasi Tim A</div>
                <div className="text-xl font-black text-emerald-900">
                  {promotionSummary.readyCount} pemain
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <div className="text-xs text-indigo-800 font-semibold">Bahas dengan Staf</div>
                <div className="text-xl font-black text-indigo-900">
                  {promotionSummary.discussCount} pemain
                </div>
              </div>
            </div>

            {promotionSummary.recentCandidates.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Review Terbaru:
                </span>
                {promotionSummary.recentCandidates.map((r) => {
                  const p = players.find((item) => item.id === r.playerId);
                  return (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px]">
                          {p?.nickname?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-800">{p?.fullName || r.playerId}</span>
                          <span className="text-gray-400 text-[11px] ml-2">({p?.primaryPosition})</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-100 text-emerald-800 truncate max-w-xs">
                        {r.recommendation}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-2">
                Belum ada berkas review kesiapan promosi. Pelatih dapat mendokumentasikan observasi pemain di menu Evaluasi Promosi Tim A.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => onNavigate('promotion')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Buka Panel Evaluasi Promosi <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2.5: Hasil & Jadwal Pertandingan Resmi (Format 7v7 Grassroots) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              Pertandingan & Uji Tanding Resmi (Format 7v7)
            </h3>
            <p className="text-[11px] text-gray-500">
              Hasil pertandingan persahabatan, skor, pencetak gol, statistik tim, dan jadwal laga berikutnya
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {filteredMatches.length} Laga Tercatat
          </span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            <Trophy className="w-8 h-8 mx-auto text-gray-400 mb-2 stroke-1" />
            <p className="text-xs font-semibold text-gray-700">Belum Ada Pertandingan Tercatat</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Pertandingan dan uji coba resmi yang dijadwalkan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredMatches.map((m) => {
            const team = teams.find((t) => t.id === m.teamId);
            const isCompleted = m.status === 'completed';
            const isWin = isCompleted && m.homeScore > m.awayScore;
            const isDraw = isCompleted && m.homeScore === m.awayScore;

            return (
              <div
                key={m.id}
                className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-400 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500 mb-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      {team?.code === 'TIM_B' ? 'TIM B' : 'TIM A'} • {m.format}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isCompleted
                          ? isWin
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDraw
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isCompleted ? (isWin ? 'Menang' : isDraw ? 'Seri' : 'Kalah') : 'Terjadwal'}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-gray-900 truncate">
                    vs {m.opponentName}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-0.5">
                    {formatIndonesianDate(m.date, 'full')} • {m.time}
                  </div>

                  {/* Scoreboard display */}
                  <div className="my-2.5 p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center gap-3">
                    <span className="font-bold text-xs text-gray-800">CFA</span>
                    <span className="font-mono text-base font-black px-2 py-0.5 bg-gray-900 text-white rounded">
                      {isCompleted ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                    </span>
                    <span className="font-bold text-xs text-gray-700 truncate max-w-[80px]">
                      {(m.opponentName || 'Lawan').split(' ')[0]}
                    </span>
                  </div>

                  {/* Scorers */}
                  {m.scorers && m.scorers.length > 0 && (
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <span className="font-semibold text-gray-500 block">Pencetak Gol CFA:</span>
                      {m.scorers.map((sc, i) => (
                        <div key={i} className="text-emerald-800 font-medium truncate">
                          ⚽ {sc}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Basic Stats if completed */}
                  {m.teamStats && (
                    <div className="mt-2 pt-2 border-t border-gray-200/80 grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                      <div>Shots On Target: <strong className="text-gray-800">{m.teamStats.shotsOnTarget}</strong></div>
                      <div>Penguasaan: <strong className="text-gray-800">{m.teamStats.possession}%</strong></div>
                      <div>Sepak Pojok: <strong className="text-gray-800">{m.teamStats.corners}</strong></div>
                      <div>Penyelamatan: <strong className="text-gray-800">{m.teamStats.saves}</strong></div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                  {m.mvpPlayerName ? (
                    <div>
                      <span className="font-semibold text-amber-700">⭐ MVP:</span>{' '}
                      <span className="text-gray-800 font-bold">{m.mvpPlayerName}</span>
                    </div>
                  ) : (
                    <span className="italic truncate block">{m.venue}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Row 3: Technical-Tactical Development Radar / Bars & Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical & Tactical Development Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-700" />
                Perkembangan Teknik & Taktik (Skala 1–4)
              </h3>
              <p className="text-[11px] text-gray-500">
                Rata-rata observasi kurikulum Tim B dalam game situasi nyata
              </p>
            </div>
            <button
              onClick={() => onNavigate('evaluations')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              + Input Observasi
            </button>
          </div>

          {evalDomainAverages ? (
            <div className="space-y-3">
              {[
                { label: 'Dribbling & Ball Mastery', val: evalDomainAverages.dribbling },
                { label: 'Passing & First Touch', val: evalDomainAverages.passing },
                { label: 'Kemampuan 1v1', val: evalDomainAverages.oneVsOne },
                { label: 'Pengambilan Keputusan', val: evalDomainAverages.decision },
                { label: 'Mencari & Menggunakan Ruang', val: evalDomainAverages.space },
                { label: 'Pemahaman Prinsip 7v7', val: evalDomainAverages.understanding7v7 },
              ].map((item) => {
                const num = Number(item.val || 0);
                const pct = (num / 4) * 100;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{item.label}</span>
                      <span className="font-black text-emerald-800">
                        {item.val ? `${item.val} / 4.0` : 'Belum Ada Data'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 mt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                <span>1: Perlu Bantuan</span>
                <span>2: Berkembang</span>
                <span>3: Cukup Konsisten</span>
                <span>4: Adaptif & Mandiri</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-500" />
              <p className="text-xs">Belum ada evaluasi teknik/taktik untuk filter ini.</p>
              <button
                onClick={() => onNavigate('evaluations')}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                Catat evaluasi latihan pertama
              </button>
            </div>
          )}
        </div>

        {/* Pemain yang Belum Dievaluasi (> 30 Hari) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Pemain Perlu Peninjauan Evaluasi
                </h3>
                <p className="text-[11px] text-gray-500">
                  Pemain yang belum memiliki catatan observasi dalam 30 hari terakhir
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                {pendingEvaluationPlayers.length} Pemain
              </span>
            </div>

            {pendingEvaluationPlayers.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                {pendingEvaluationPlayers.slice(0, 5).map((p) => {
                  const pEvals = evaluations.filter((e) => e.playerId === p.id);
                  const lastEval = pEvals.length > 0 ? pEvals[pEvals.length - 1].date : null;
                  return (
                    <div
                      key={p.id}
                      className="py-2.5 flex items-center justify-between hover:bg-gray-50/80 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 font-bold text-gray-700 flex items-center justify-center text-xs">
                          {(p.nickname || p.fullName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{p.fullName}</div>
                          <div className="text-[11px] text-gray-500">
                            {p.id} • {p.primaryPosition} • Lahir {p.birthYear}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] block text-amber-700 font-medium">
                          {lastEval ? `Terakhir: ${formatIndonesianDate(lastEval)}` : 'Belum pernah dinilai'}
                        </span>
                        <button
                          onClick={() => {
                            if (onOpenPlayerDetail) onOpenPlayerDetail(p.id);
                            else onNavigate('evaluations');
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          Evaluasi Sekarang →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-emerald-700">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold">Semua pemain aktif telah dievaluasi dalam 30 hari terakhir!</p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center text-xs">
            <span className="text-gray-400 text-[11px]">Siklus review ideal: setiap 4 minggu</span>
            <button
              onClick={() => onNavigate('players')}
              className="font-bold text-emerald-700 hover:text-emerald-800"
            >
              Lihat Database Pemain →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
