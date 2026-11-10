import React, { useMemo, useState, useEffect } from 'react';
import {
  CalendarCheck,
  Check,
  Clock,
  AlertCircle,
  Save,
  Users,
  ChevronDown,
  Filter,
  CheckCircle2,
  Calendar,
  Search,
  RotateCcw,
  Zap,
  Shield,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, TrainingSession } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { formatIndonesianDate, ATTENDANCE_BADGES } from '../utils/formatters.ts';

interface AttendanceViewProps {
  initialSessionId?: string | null;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialSessionId }) => {
  const {
    sessions,
    players,
    activePlayers,
    attendanceRecords,
    teams,
    saveAttendanceBatch,
  } = useData();

  // Pick session to mark attendance
  const availableSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (initialSessionId && sessions.some((s) => s.id === initialSessionId)) {
      return initialSessionId;
    }
    return availableSessions[0]?.id || '';
  });

  // Keep in sync if initialSessionId changes from external navigation
  useEffect(() => {
    if (initialSessionId && sessions.some((s) => s.id === initialSessionId)) {
      setSelectedSessionId(initialSessionId);
    }
  }, [initialSessionId, sessions]);

  // Auto-select valid session when sessions load or change
  useEffect(() => {
    if (availableSessions.length > 0) {
      if (!selectedSessionId || !availableSessions.some((s) => s.id === selectedSessionId)) {
        if (initialSessionId && availableSessions.some((s) => s.id === initialSessionId)) {
          setSelectedSessionId(initialSessionId);
        } else {
          setSelectedSessionId(availableSessions[0].id);
        }
      }
    }
  }, [availableSessions, initialSessionId, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const sessionTeam = useMemo(
    () => teams.find((t) => t.id === selectedSession?.teamId),
    [teams, selectedSession]
  );

  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Players in this session's team, plus any players with existing attendance records for this session
  const sessionPlayers = useMemo(() => {
    if (!selectedSession) return [];

    const attendingPlayerIds = new Set(
      attendanceRecords.filter((a) => a.sessionId === selectedSession.id).map((a) => a.playerId)
    );

    if (showAllPlayers || !selectedSession.teamId || selectedSession.teamId === 'all') {
      return activePlayers;
    }

    const teamFiltered = activePlayers.filter((p) => p.teamId === selectedSession.teamId);
    const extraAttending = activePlayers.filter(
      (p) => attendingPlayerIds.has(p.id) && p.teamId !== selectedSession.teamId
    );

    const combined = [...teamFiltered, ...extraAttending];
    return combined.length > 0 ? combined : activePlayers;
  }, [activePlayers, selectedSession, attendanceRecords, showAllPlayers]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return sessionPlayers;
    const q = searchQuery.toLowerCase().trim();
    return sessionPlayers.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.nickname.toLowerCase().includes(q) ||
        p.primaryPosition.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [sessionPlayers, searchQuery]);

  // Attendance local form state for the selected session
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        actualMinutes: number;
        notes: string;
      }
    >
  >({});

  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state when selected session or sessionPlayers change
  // Note: DO NOT put attendanceRecords directly in deps to prevent wiping out isSaved
  useEffect(() => {
    if (!selectedSession) return;
    const initialMap: Record<
      string,
      { status: AttendanceStatus; actualMinutes: number; notes: string }
    > = {};

    sessionPlayers.forEach((p) => {
      const existing = attendanceRecords.find(
        (a) => a.sessionId === selectedSession.id && a.playerId === p.id
      );

      if (existing) {
        initialMap[p.id] = {
          status: existing.status,
          actualMinutes: existing.actualMinutes,
          notes: existing.notes || '',
        };
      } else {
        // Default to 'present' with planned duration
        initialMap[p.id] = {
          status: 'present',
          actualMinutes: selectedSession.actualDurationMinutes || 75,
          notes: '',
        };
      }
    });

    setFormData(initialMap);
  }, [selectedSession?.id, sessionPlayers.length]);

  const handleStatusChange = (playerId: string, status: AttendanceStatus) => {
    const defaultMins = selectedSession?.actualDurationMinutes || 75;
    let mins = defaultMins;

    if (status === 'absent' || status === 'sick' || status === 'excused') {
      mins = 0;
    } else if (status === 'late') {
      mins = Math.max(15, defaultMins - 20); // Default late deduction
    }

    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { notes: '' }),
        status,
        actualMinutes: mins,
      },
    }));
    setSaveError(null);
  };

  const handleMinutesChange = (playerId: string, minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { status: 'present', notes: '' }),
        actualMinutes: Math.max(0, minutes),
      },
    }));
    setSaveError(null);
  };

  const handleNotesChange = (playerId: string, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { status: 'present', actualMinutes: selectedSession?.actualDurationMinutes || 75 }),
        notes,
      },
    }));
    setSaveError(null);
  };

  const handleSetAllPresent = (minutes?: number) => {
    const defaultMins = minutes ?? (selectedSession?.actualDurationMinutes || 75);
    setFormData((prev) => {
      const updated = { ...prev };
      sessionPlayers.forEach((p) => {
        updated[p.id] = {
          ...(prev[p.id] || { notes: '' }),
          status: 'present',
          actualMinutes: defaultMins,
        };
      });
      return updated;
    });
    setSaveError(null);
  };

  const handleResetForm = () => {
    if (!selectedSession) return;
    const initialMap: Record<
      string,
      { status: AttendanceStatus; actualMinutes: number; notes: string }
    > = {};

    sessionPlayers.forEach((p) => {
      const existing = attendanceRecords.find(
        (a) => a.sessionId === selectedSession.id && a.playerId === p.id
      );

      if (existing) {
        initialMap[p.id] = {
          status: existing.status,
          actualMinutes: existing.actualMinutes,
          notes: existing.notes || '',
        };
      } else {
        initialMap[p.id] = {
          status: 'present',
          actualMinutes: selectedSession.actualDurationMinutes || 75,
          notes: '',
        };
      }
    });

    setFormData(initialMap);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const defaultMins = selectedSession.actualDurationMinutes || 75;
      const recordsToSave = sessionPlayers.map((p) => {
        const entry = formData[p.id] || {
          status: 'present',
          actualMinutes: defaultMins,
          notes: '',
        };

        const isAbsentOrSick = entry.status === 'absent' || entry.status === 'sick' || entry.status === 'excused';
        const cleanMinutes = isAbsentOrSick
          ? 0
          : typeof entry.actualMinutes === 'number' && !isNaN(entry.actualMinutes)
            ? Math.max(0, entry.actualMinutes)
            : defaultMins;

        return {
          playerId: p.id,
          status: entry.status,
          actualMinutes: cleanMinutes,
          notes: (entry.notes || '').trim(),
        };
      });

      await saveAttendanceBatch(selectedSession.id, recordsToSave);
      setSavedCount(recordsToSave.length);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 5000);
    } catch (err: any) {
      console.error('Error saving attendance batch:', err);
      setSaveError(err.message || 'Gagal menyimpan presensi ke basis data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick counts for current session
  const currentCounts = useMemo(() => {
    const counts = { present: 0, late: 0, excused: 0, sick: 0, absent: 0, totalMinutes: 0 };
    sessionPlayers.forEach((p) => {
      const val = formData[p.id];
      if (val) {
        if (counts[val.status] !== undefined) counts[val.status]++;
        counts.totalMinutes += Number(val.actualMinutes) || 0;
      } else {
        counts.present++;
        counts.totalMinutes += selectedSession?.actualDurationMinutes || 75;
      }
    });
    return counts;
  }, [formData, sessionPlayers, selectedSession]);

  const attendancePercentage = useMemo(() => {
    if (sessionPlayers.length === 0) return 0;
    const attended = currentCounts.present + currentCounts.late;
    return Math.round((attended / sessionPlayers.length) * 100);
  }, [sessionPlayers.length, currentCounts]);

  return (
    <div className="space-y-6">
      {/* Session Selector Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilih Sesi Latihan untuk Presensi:</span>
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setIsSaved(false);
                setSaveError(null);
              }}
              className="w-full sm:w-auto min-w-80 px-3.5 py-2 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {availableSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatIndonesianDate(s.date)} — {s.focus} ({s.time}) [{s.id}]
                </option>
              ))}
            </select>
          </div>

          {selectedSession && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllPresent()}
                className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title="Tandai semua pemain hadir dengan durasi penuh"
              >
                Set Semua Hadir
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                title="Muat ulang data presensi dari server"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || sessionPlayers.length === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Presensi ({sessionPlayers.length} Pemain)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {selectedSession && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span>Tim: <strong className="text-emerald-800 font-bold">{sessionTeam?.name || 'Seluruh Tim'}</strong></span>
              <span>•</span>
              <span>Fokus: <strong className="text-gray-900 font-bold">{selectedSession.focus}</strong></span>
              <span>•</span>
              <span>Durasi Rencana: <strong className="text-gray-900 font-bold">{selectedSession.actualDurationMinutes || 75} Menit</strong></span>
              <span>•</span>
              <span>Pelatih: <strong className="text-gray-900 font-bold">{selectedSession.coachName}</strong></span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {currentCounts.present} Hadir
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {currentCounts.late} Terlambat
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {currentCounts.excused} Izin
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                {currentCounts.sick} Sakit
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                {currentCounts.absent} Absen
              </span>
              <span className="text-gray-500 font-normal">
                ({attendancePercentage}% Kehadiran)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {isSaved && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span>Presensi untuk <strong>{savedCount} atlet</strong> pada sesi <strong>{selectedSession?.id}</strong> berhasil disimpan ke basis data!</span>
              <span className="block text-[11px] text-emerald-800 font-medium mt-0.5">
                Menit latihan telah disinkronkan otomatis ke modul Training Load RPE.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSaved(false)}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-200/70 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            <div>
              <span>{saveError}</span>
              <span className="block text-[11px] text-rose-800 font-medium mt-0.5">
                Silakan coba simpan kembali. Pastikan koneksi server aktif.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="px-2 py-1 text-xs text-rose-800 hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Bulk Toolbar & Search Filter */}
      {selectedSession && (
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-700 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Aksi Cepat Presensi:</span>
            </span>
            <button
              type="button"
              onClick={() => handleSetAllPresent(selectedSession.actualDurationMinutes || 75)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-gray-200 rounded text-xs font-semibold shadow-2xs"
            >
              Hadir ({selectedSession.actualDurationMinutes || 75}m)
            </button>
            <button
              type="button"
              onClick={() => handleSetAllPresent(60)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-gray-200 rounded text-xs font-semibold shadow-2xs"
            >
              Hadir (60m)
            </button>
            <button
              type="button"
              onClick={() => handleSetAllPresent(90)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-gray-200 rounded text-xs font-semibold shadow-2xs"
            >
              Hadir (90m)
            </button>
            <button
              type="button"
              onClick={() => setShowAllPlayers(!showAllPlayers)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                showAllPlayers
                  ? 'bg-emerald-800 text-white border-emerald-900'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {showAllPlayers ? 'Tampilkan Tim Ini Saja' : 'Sertakan Seluruh Skuad'}
            </button>
          </div>

          <div className="relative w-full md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari atlet / nomor punggung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Attendance Rapid Input List (Mobile-Optimized) */}
      {selectedSession ? (
        filteredPlayers.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center text-xs font-bold text-gray-700 uppercase tracking-wider gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Daftar Pemain ({filteredPlayers.length} dari {sessionPlayers.length} Atlet)</span>
              </div>
              <span className="text-[11px] text-gray-500 font-normal lowercase">
                klik status & periksa menit aktual jika terlambat/cedera
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredPlayers.map((player) => {
                const current = formData[player.id] || {
                  status: 'present',
                  actualMinutes: selectedSession.actualDurationMinutes || 75,
                  notes: '',
                };

                return (
                  <div
                    key={player.id}
                    className="p-3.5 sm:p-4 hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    {/* Player Info */}
                    <div className="flex items-center space-x-3 min-w-56">
                      <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                        {player.nickname ? player.nickname.charAt(0) : player.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                          <span>{player.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded font-normal">
                            {player.nickname}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {player.id} • {player.primaryPosition} • Lahir {player.birthYear || player.birthDate?.slice(0, 4)}
                        </div>
                      </div>
                    </div>

                    {/* Quick Status Buttons (Mobile Touch Friendly) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['present', 'late', 'excused', 'sick', 'absent'] as AttendanceStatus[]).map(
                        (st) => {
                          const isSelected = current.status === st;
                          const badge = ATTENDANCE_BADGES[st];
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(player.id, st)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                isSelected
                                  ? `${badge.bg} ring-2 ring-emerald-700 shadow-xs scale-102`
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {badge.label}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Actual Minutes & Note */}
                    <div className="flex items-center space-x-2 pt-1 md:pt-0">
                      <div className="flex items-center space-x-1">
                        <label className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                          Menit:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={current.actualMinutes}
                          onChange={(e) => handleMinutesChange(player.id, Number(e.target.value))}
                          disabled={current.status === 'absent' || current.status === 'sick' || current.status === 'excused'}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan kehadiran (opsional)..."
                        value={current.notes}
                        onChange={(e) => handleNotesChange(player.id, e.target.value)}
                        className="flex-1 md:w-48 px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <span>Total Menit Partisipasi Skuad: <strong>{currentCounts.totalMinutes} Menit</strong></span>
                <span className="hidden sm:inline"> • Presensi tersimpan langsung terhubung ke analisis beban latihan Foster.</span>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || sessionPlayers.length === 0}
                className="inline-flex items-center justify-center space-x-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan Presensi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Seluruh Presensi ({sessionPlayers.length} Pemain)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
            {searchQuery ? (
              <div>
                <p className="font-bold text-gray-700 mb-1">Tidak ada atlet yang cocok dengan kata kunci "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-emerald-700 hover:underline cursor-pointer"
                >
                  Hapus Filter Pencarian
                </button>
              </div>
            ) : (
              <div>
                Belum ada pemain aktif yang terdaftar di tim {sessionTeam?.name}. Silakan tambahkan pemain ke tim ini terlebih dahulu atau aktifkan toggle "Sertakan Seluruh Skuad".
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-400">
          <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-40 text-gray-500" />
          <p className="text-xs">Belum ada sesi latihan yang dibuat. Buat sesi latihan terlebih dahulu di menu Sesi Latihan.</p>
        </div>
      )}
    </div>
  );
};
