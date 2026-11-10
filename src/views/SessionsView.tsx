import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CalendarCheck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { SessionStatus, TrainingFocus, TrainingSession } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatIndonesianDate } from '../utils/formatters.ts';
import { SessionFormModal } from '../components/sessions/SessionFormModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import { NavTab } from '../components/navigation/Sidebar.tsx';

interface SessionsViewProps {
  onNavigateToAttendance?: (sessionId: string) => void;
  onNavigateToTrainingLoad?: (sessionId: string) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  onNavigateToAttendance,
  onNavigateToTrainingLoad,
}) => {
  const {
    sessions,
    teams,
    attendanceRecords,
    trainingLoads,
    selectedTeamId,
    setSelectedTeamId,
    deleteSession,
    error,
    refreshData,
  } = useData();

  const { canManageSessions, logout } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all');
  const [focusFilter, setFocusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<TrainingSession | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        if (selectedTeamId !== 'all' && s.teamId !== selectedTeamId) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (focusFilter !== 'all' && s.focus !== focusFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, selectedTeamId, statusFilter, focusFilter]);

  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const handleDelete = (id: string) => {
    setSessionToDelete(id);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeletingSession(true);
    try {
      await deleteSession(sessionToDelete);
      setSessionToDelete(null);
    } finally {
      setIsDeletingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {savedSessionId && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Sesi latihan <strong>{savedSessionId}</strong> berhasil disimpan ke basis data!</span>
          </div>
          <button
            onClick={() => setSavedSessionId(null)}
            className="text-xs text-emerald-800 hover:underline font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => refreshData()}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
            {(error.toLowerCase().includes('autentikasi') || error.toLowerCase().includes('login') || error.toLowerCase().includes('unauthorized')) && (
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Login Ulang
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Sesi:
          </span>

          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Tim</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai ({sessions.filter((s) => s.status === 'completed').length})</option>
            <option value="scheduled">Terjadwal ({sessions.filter((s) => s.status === 'scheduled').length})</option>
            <option value="cancelled">Dibatalkan ({sessions.filter((s) => s.status === 'cancelled').length})</option>
          </select>

          <select
            value={focusFilter}
            onChange={(e) => setFocusFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Fokus Kurikulum</option>
            <option value="Dribbling">Dribbling</option>
            <option value="Passing & Kontrol Bola">Passing & Kontrol</option>
            <option value="Situasi 1v1">Situasi 1v1</option>
            <option value="Small-Sided Games (SSG)">SSG</option>
            <option value="Permainan 7v7">Permainan 7v7</option>
            <option value="Finishing">Finishing</option>
            <option value="Transisi Menyerang & Bertahan">Transisi</option>
          </select>
        </div>

        {canManageSessions && (
          <button
            onClick={() => {
              setSessionToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Latihan</span>
          </button>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const team = teams.find((t) => t.id === session.teamId);
            const sessionAtts = attendanceRecords.filter((a) => a.sessionId === session.id);
            const presentCount = sessionAtts.filter((a) => a.status === 'present' || a.status === 'late').length;
            const sessionLoads = trainingLoads.filter((tl) => tl.sessionId === session.id && tl.trainingLoad !== null);

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {session.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        session.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {session.status === 'completed' ? 'Selesai' : session.status === 'scheduled' ? 'Terjadwal' : 'Dibatalkan'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {team?.name || session.teamId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">
                      {session.focus}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                      {session.objective}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      {formatIndonesianDate(session.date, 'full')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {session.time} ({session.actualDurationMinutes}m aktual)
                    </span>
                    <span>Pelatih: <strong className="text-gray-700">{session.coachName}</strong></span>
                    <span>Alat: <strong className="text-gray-700">{session.equipment}</strong></span>
                  </div>

                  {session.drillDescription && (
                    <div className="p-2.5 bg-gray-50 rounded-lg text-[11px] text-gray-600 font-mono">
                      {session.drillDescription}
                    </div>
                  )}
                </div>

                {/* Right: Quick Attendance & Load Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500 text-[11px]">
                      Presensi:{' '}
                      <strong className="text-emerald-800 font-bold">
                        {presentCount} Hadir
                      </strong>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 text-[11px]">
                      Load:{' '}
                      <strong className="text-amber-800 font-bold">
                        {sessionLoads.length} Terisi
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {onNavigateToAttendance && (
                      <button
                        onClick={() => onNavigateToAttendance(session.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Presensi</span>
                      </button>
                    )}

                    {onNavigateToTrainingLoad && (
                      <button
                        onClick={() => onNavigateToTrainingLoad(session.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5 text-amber-700" />
                        <span>RPE Load</span>
                      </button>
                    )}

                    {canManageSessions && (
                      <>
                        <button
                          onClick={() => {
                            setSessionToEdit(session);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                          title="Edit Sesi"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Tidak ada sesi latihan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Belum ada sesi latihan yang dibuat sesuai filter terpilih.
          </p>
          {canManageSessions && (
            <button
              onClick={() => {
                setSessionToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Sesi Latihan Baru</span>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <SessionFormModal
        isOpen={isFormOpen}
        sessionToEdit={sessionToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setSessionToEdit(null);
        }}
        onSaved={(saved) => {
          setSavedSessionId(saved.id);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        title="Hapus Sesi Latihan?"
        message={
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin menghapus sesi latihan <code className="bg-gray-100 px-1 py-0.5 rounded text-rose-700 font-bold">{sessionToDelete}</code>?
            </p>
            <p className="text-gray-500 text-[11px]">
              Catatan presensi kehadiran dan beban latihan (RPE) yang telah diinput untuk sesi ini juga akan dibersihkan.
            </p>
          </div>
        }
        confirmText="Ya, Hapus Sesi"
        variant="danger"
        isLoading={isDeletingSession}
        onConfirm={handleConfirmDeleteSession}
        onClose={() => setSessionToDelete(null)}
      />
    </div>
  );
};
