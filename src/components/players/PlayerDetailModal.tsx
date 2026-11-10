import React, { useState } from 'react';
import {
  X,
  User,
  Activity,
  CalendarCheck,
  Target,
  Zap,
  TrendingUp,
  Award,
  Phone,
  Shield,
  Edit,
  Archive,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Printer,
} from 'lucide-react';
import { Player } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ParentReportPrintModal } from '../parent/ParentReportPrintModal.tsx';
import {
  formatIndonesianDate,
  calculateAge,
  RPE_DESCRIPTIONS,
  SCALE_4_DESCRIPTIONS,
  ATTENDANCE_BADGES,
  LTAD_STATUS_BADGES,
  PROMOTION_RECOMMENDATION_BADGES,
} from '../../utils/formatters.ts';

interface PlayerDetailModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (player: Player) => void;
}

type ProfileTab =
  | 'overview'
  | 'sessions'
  | 'attendance'
  | 'training_load'
  | 'evaluations'
  | 'motor_tests'
  | 'ltad'
  | 'promotion';

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
  onEdit,
}) => {
  const {
    teams,
    sessions,
    attendanceRecords,
    trainingLoads,
    evaluations,
    motorTests,
    motorTestResults,
    ltadGoals,
    promotionReviews,
    archivePlayer,
    getPlayerAttendanceStats,
    getPlayerTrainingLoadStats,
  } = useData();

  const { canManagePlayers, canViewGuardianContact } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  if (!isOpen || !player) return null;

  const team = teams.find((t) => t.id === player.teamId);
  const ageInfo = calculateAge(player.birthDate);
  const attStats = getPlayerAttendanceStats(player.id);
  const loadStats = getPlayerTrainingLoadStats(player.id);

  // Player's evaluations
  const playerEvals = evaluations
    .filter((e) => e.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Player's motor test results
  const playerMotorResults = motorTestResults
    .filter((r) => r.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Player's LTAD goals
  const playerLtad = ltadGoals
    .filter((g) => g.playerId === player.id)
    .sort((a, b) => b.setDate.localeCompare(a.setDate));

  // Player's promotion reviews
  const playerPromReviews = promotionReviews
    .filter((r) => r.playerId === player.id)
    .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));

  // Sessions where player participated
  const playerSessionRecords = attendanceRecords
    .filter((a) => a.playerId === player.id)
    .map((a) => {
      const sess = sessions.find((s) => s.id === a.sessionId);
      const tl = trainingLoads.find(
        (t) => t.sessionId === a.sessionId && t.playerId === player.id
      );
      return { attendance: a, session: sess, load: tl };
    })
    .sort((a, b) => {
      const dateA = a.session?.date || '';
      const dateB = b.session?.date || '';
      return dateB.localeCompare(dateA);
    });

  const handleArchiveToggle = async () => {
    const isArchived = player.status === 'archived';
    await archivePlayer(player.id, !isArchived);
  };

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'sessions', label: 'Riwayat Sesi', count: playerSessionRecords.length },
    { id: 'attendance', label: 'Kehadiran' },
    { id: 'training_load', label: 'Training Load' },
    { id: 'evaluations', label: 'Teknik & Taktik', count: playerEvals.length },
    { id: 'motor_tests', label: 'Tes Fisik', count: playerMotorResults.length },
    { id: 'ltad', label: 'Target LTAD', count: playerLtad.length },
    { id: 'promotion', label: 'Evaluasi Promosi', count: playerPromReviews.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header Hero */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-900 text-white relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 border-2 border-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-md">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.fullName}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  (player.nickname || player.fullName || 'P').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {player.fullName}
                  </h2>
                  {player.jerseyNumber !== undefined && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-amber-400 text-gray-950 border border-amber-300 shadow-xs">
                      #{player.jerseyNumber}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    {player.id}
                  </span>
                  {player.status === 'archived' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-500 text-white">
                      Nonaktif / Arsip
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-200 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-medium">
                  {player.jerseyNumber !== undefined && (
                    <>
                      <span>No. Jersey: <strong className="text-amber-300">#{player.jerseyNumber}</strong></span>
                      <span>•</span>
                    </>
                  )}
                  <span>Panggilan: <strong>"{player.nickname}"</strong></span>
                  <span>•</span>
                  <span>Usia: <strong>{ageInfo.text} ({player.birthYear})</strong></span>
                  <span>•</span>
                  <span>Tim: <strong>{team?.name || player.teamId}</strong></span>
                  <span>•</span>
                  <span>Posisi: <strong>{player.primaryPosition}</strong></span>
                  <span>•</span>
                  <span>Kaki: <strong>{player.dominantFoot}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPrintReportOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                title="Cetak Raport Perkembangan Atlet ke PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rapor</span>
              </button>

              {canManagePlayers && (
                <>
                  <button
                    onClick={() => onEdit(player)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold border border-emerald-600 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleArchiveToggle}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      player.status === 'archived'
                        ? 'bg-blue-800 hover:bg-blue-700 text-white'
                        : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800'
                    }`}
                  >
                    {player.status === 'archived' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Pulihkan</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Arsipkan</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-4 bg-gray-50/90 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === t.id
                  ? 'border-emerald-700 text-emerald-900 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Kehadiran Sesi
                  </span>
                  <div className="text-xl font-black text-emerald-950 mt-1">
                    {attStats.percentage}%
                  </div>
                  <span className="text-[10px] text-emerald-700">
                    {attStats.attended + attStats.late} dari {attStats.totalSessions} sesi
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Rata Beban / Sesi
                  </span>
                  <div className="text-xl font-black text-amber-950 mt-1">
                    {loadStats.averageLoad} AU
                  </div>
                  <span className="text-[10px] text-amber-700">
                    Total: {loadStats.totalLoad} AU
                  </span>
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Evaluasi Terakhir
                  </span>
                  <div className="text-sm font-bold text-blue-950 mt-1 truncate">
                    {playerEvals[0] ? formatIndonesianDate(playerEvals[0].date) : 'Belum Ada'}
                  </div>
                  <span className="text-[10px] text-blue-700">
                    {playerEvals.length} catatan observasi
                  </span>
                </div>

                <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                    Target LTAD
                  </span>
                  <div className="text-xl font-black text-purple-950 mt-1">
                    {playerLtad.filter((g) => g.status === 'Tercapai').length} / {playerLtad.length}
                  </div>
                  <span className="text-[10px] text-purple-700">
                    Target tercapai
                  </span>
                </div>
              </div>

              {/* Individual Target & Coach Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-700" />
                    Target Perkembangan Individual
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {player.individualTarget || 'Belum ada target individual spesifik yang dicatat.'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-700" />
                    Catatan Pelatih & Respon Anak
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {player.coachNotes || 'Belum ada catatan pelatih.'}
                  </p>
                </div>
              </div>

              {/* Data Orang Tua & Wali (Section 16: Protected Access) */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  Informasi Wali & Kontak (Akses Terbatas)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nama Wali:</span>
                    <span className="font-bold text-gray-800">{player.guardianName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Hubungan:</span>
                    <span className="font-bold text-gray-800">{player.guardianRelation}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nomor Kontak:</span>
                    {canViewGuardianContact ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {player.guardianContact}
                      </span>
                    ) : (
                      <span className="italic text-gray-400">Dirahasiakan (Hanya Admin / Head Coach)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & RIWAYAT LATIHAN */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Riwayat Sesi Latihan Pemain
              </h4>
              {playerSessionRecords.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {playerSessionRecords.map(({ session, attendance, load }) => (
                    <div key={attendance.id} className="p-3.5 hover:bg-gray-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">
                          {session ? session.focus : 'Sesi Latihan'}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formatIndonesianDate(session?.date)} • {session?.time} • Pelatih: {session?.coachName}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ATTENDANCE_BADGES[attendance.status]?.bg || 'bg-gray-100'
                            }`}
                          >
                            {ATTENDANCE_BADGES[attendance.status]?.label || attendance.status}
                          </span>
                          <span className="block text-[10px] text-gray-500 mt-0.5">
                            {attendance.actualMinutes} Menit
                          </span>
                        </div>
                        {load && load.trainingLoad !== null && (
                          <div className="p-1.5 bg-amber-50 rounded-lg text-amber-900 font-bold border border-amber-200 text-[11px] min-w-16 text-center">
                            {load.trainingLoad} AU
                            <span className="block text-[9px] font-normal text-amber-700">
                              RPE {load.rpe}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">
                  Belum ada riwayat sesi latihan tercatat untuk pemain ini.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: KEHADIRAN */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-lg font-black text-emerald-900">{attStats.attended}</div>
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase">Hadir</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-lg font-black text-amber-900">{attStats.late}</div>
                  <div className="text-[10px] text-amber-800 font-semibold uppercase">Terlambat</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-lg font-black text-blue-900">{attStats.excused}</div>
                  <div className="text-[10px] text-blue-800 font-semibold uppercase">Izin</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-lg font-black text-purple-900">{attStats.sick}</div>
                  <div className="text-[10px] text-purple-800 font-semibold uppercase">Sakit</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-lg font-black text-rose-900">{attStats.absent}</div>
                  <div className="text-[10px] text-rose-800 font-semibold uppercase">Absen</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Persentase Kehadiran Aktual</span>
                  <span className="font-black text-emerald-800">{attStats.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${attStats.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  * Dihitung berdasarkan sesi yang benar-benar terselenggara. Sesi yang dibatalkan tidak dianggap sebagai ketidakhadiran.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TRAINING LOAD */}
          {activeTab === 'training_load' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Metode Pemantauan: Session-RPE (Foster et al.)</strong>
                <p className="mt-1 text-[11px] text-amber-800">
                  Beban Latihan (AU) = Durasi Partisipasi Aktual (menit) × Session RPE (Skala 1–10).
                  Beban latihan adalah indikator tren beban internal, bukan diagnosis langsung risiko cedera.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Beban Akumulasi</span>
                  <div className="text-xl font-black text-gray-900 mt-1">{loadStats.totalLoad} AU</div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Rata-rata per Sesi</span>
                  <div className="text-xl font-black text-gray-900 mt-1">{loadStats.averageLoad} AU</div>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Sesi Terekam Lengkap</span>
                  <div className="text-xl font-black text-gray-900 mt-1">{loadStats.completedSessionsCount} Sesi</div>
                </div>
              </div>

              {/* Recent Load History */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Riwayat Sesi Beban:
                </h5>
                {loadStats.recentLoads.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden text-xs">
                    {loadStats.recentLoads.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <span className="font-bold text-gray-900">{formatIndonesianDate(item.date)}</span>
                          <span className="text-gray-500 text-[11px] ml-2">
                            ({item.minutes} menit)
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-[11px] font-semibold text-gray-600">
                            RPE: {item.rpe} ({RPE_DESCRIPTIONS[item.rpe || 3]?.label})
                          </span>
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200">
                            {item.load} AU
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic py-4 text-center">
                    Belum ada catatan RPE yang diisi untuk pemain ini.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EVALUASI TEKNIK & TAKTIK */}
          {activeTab === 'evaluations' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Observasi Teknik & Taktik (Skala Perkembangan 1–4)
              </h4>
              {playerEvals.length > 0 ? (
                <div className="space-y-4">
                  {playerEvals.map((e) => (
                    <div key={e.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div>
                          <span className="font-bold text-gray-900 text-xs">
                            {formatIndonesianDate(e.date, 'full')} • Konteks: {e.context}
                          </span>
                          <span className="block text-[11px] text-gray-500">
                            Evaluator: {e.evaluatorName}
                          </span>
                        </div>
                      </div>

                      {/* Score Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Dribbling</span>
                          <span className="font-bold text-emerald-800">{e.dribblingScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Passing</span>
                          <span className="font-bold text-emerald-800">{e.passingScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Kontrol & First Touch</span>
                          <span className="font-bold text-emerald-800">{e.firstTouchScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Situasi 1v1</span>
                          <span className="font-bold text-emerald-800">{e.oneVsOneScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Orientasi Tubuh</span>
                          <span className="font-bold text-emerald-800">{e.bodyOrientationScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Mencari Ruang</span>
                          <span className="font-bold text-emerald-800">{e.spaceUtilizationScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Keputusan Bermain</span>
                          <span className="font-bold text-emerald-800">{e.decisionMakingScore || 'Belum Dinilai'}</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 block">Pemahaman 7v7</span>
                          <span className="font-bold text-emerald-800">{e.understanding7v7Score || 'Belum Dinilai'}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5 pt-1">
                        <div>
                          <strong className="text-gray-700">Bukti Observasi:</strong>{' '}
                          <span className="text-gray-600">{e.observedEvidence}</span>
                        </div>
                        <div>
                          <strong className="text-emerald-800">Kekuatan:</strong>{' '}
                          <span className="text-gray-600">{e.strengths}</span>
                        </div>
                        <div>
                          <strong className="text-amber-800">Fokus Perbaikan:</strong>{' '}
                          <span className="text-gray-600">{e.improvementFocus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center italic">
                  Belum ada evaluasi teknik dan taktik untuk pemain ini.
                </p>
              )}
            </div>
          )}

          {/* TAB 6: TES MOTORIK & FISIK */}
          {activeTab === 'motor_tests' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Hasil Tes Motorik & Fisik (Alat: Bola & Marker)
              </h4>
              {playerMotorResults.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                  {playerMotorResults.map((r) => {
                    const test = motorTests.find((t) => t.id === r.testId);
                    return (
                      <div key={r.id} className="p-3.5 hover:bg-gray-50 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900">{test?.name || r.testId}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {formatIndonesianDate(r.date)} • Kondisi: {r.executionCondition} • Penguji: {r.testerName}
                          </div>
                          {r.notes && (
                            <div className="text-[11px] text-gray-600 mt-1 italic">
                              "{r.notes}"
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-800">
                            {r.numericValue} {r.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center italic">
                  Belum ada data tes fisik/motorik untuk pemain ini.
                </p>
              )}
            </div>
          )}

          {/* TAB 7: TARGET LTAD */}
          {activeTab === 'ltad' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Target Long-Term Athlete Development (LTAD)
              </h4>
              {playerLtad.length > 0 ? (
                <div className="space-y-3">
                  {playerLtad.map((g) => (
                    <div key={g.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          Domain: {g.domain}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            LTAD_STATUS_BADGES[g.status] || 'bg-gray-100'
                          }`}
                        >
                          {g.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <strong className="text-gray-500">Kondisi Awal (Baseline):</strong>
                          <p className="text-gray-800 mt-0.5">{g.baseline}</p>
                        </div>
                        <div>
                          <strong className="text-emerald-800">Target Individual:</strong>
                          <p className="text-gray-800 mt-0.5">{g.target}</p>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600 border-t border-gray-200/60 pt-2">
                        <span>Indikator: <strong>{g.indicator}</strong></span> •{' '}
                        <span>Drill Pendukung: <strong>{g.supportingDrills}</strong></span>
                      </div>
                      {g.evidenceNotes && (
                        <div className="text-[11px] text-blue-800 bg-blue-50/60 p-2 rounded border border-blue-100">
                          Bukti Perkembangan: {g.evidenceNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center italic">
                  Belum ada target LTAD individual terdaftar.
                </p>
              )}
            </div>
          )}

          {/* TAB 8: EVALUASI PROMOSI TIM A */}
          {activeTab === 'promotion' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Riwayat Evaluasi Kesiapan Promosi ke Tim A
              </h4>
              {playerPromReviews.length > 0 ? (
                <div className="space-y-4">
                  {playerPromReviews.map((r) => (
                    <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div>
                          <span className="font-bold text-gray-900">
                            Tanggal Review: {formatIndonesianDate(r.reviewDate, 'full')}
                          </span>
                          <span className="block text-[11px] text-gray-500">
                            Staf Pelatih: {r.coachesInvolved.join(', ')}
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                            PROMOTION_RECOMMENDATION_BADGES[r.recommendation] || 'bg-gray-100'
                          }`}
                        >
                          {r.recommendation}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded border">
                          <span className="text-[10px] text-gray-400 block">Teknik Under Pressure</span>
                          <span className="font-bold text-emerald-800">{r.techUnderPressure}/4</span>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <span className="text-[10px] text-gray-400 block">Taktik Tim A</span>
                          <span className="font-bold text-emerald-800">{r.tacticalPrinciplesTimA}/4</span>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <span className="text-[10px] text-gray-400 block">Pengambilan Keputusan</span>
                          <span className="font-bold text-emerald-800">{r.decisionMaking}/4</span>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <span className="text-[10px] text-gray-400 block">Sikap Belajar</span>
                          <span className="font-bold text-emerald-800">{r.learningAttitude}/4</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p><strong className="text-gray-700">Bukti Observasi:</strong> {r.observedEvidence}</p>
                        <p><strong className="text-emerald-800">Kekuatan:</strong> {r.playerStrengths}</p>
                        <p><strong className="text-amber-800">Kebutuhan Lanjutan:</strong> {r.developmentNeeds}</p>
                        <p className="bg-emerald-50/80 p-2 rounded text-emerald-950 font-medium">
                          <strong>Rencana Tindak Lanjut:</strong> {r.followUpPlan}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center italic">
                  Belum ada berkas review kesiapan promosi Tim A untuk pemain ini.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ParentReportPrintModal
        player={player}
        team={team}
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
      />
    </div>
  );
};
