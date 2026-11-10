import React, { useState } from 'react';
import { X, ClipboardList, Calendar, Clock, Save, Shield } from 'lucide-react';
import { SessionStatus, TrainingFocus, TrainingSession } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface SessionFormModalProps {
  sessionToEdit?: TrainingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (session: TrainingSession) => void;
}

const FOCUS_OPTIONS: TrainingFocus[] = [
  'Koordinasi & Keterampilan Gerak',
  'Dribbling',
  'Passing & Kontrol Bola',
  'Finishing',
  'Situasi 1v1',
  'Small-Sided Games (SSG)',
  'Pemahaman Taktik',
  'Permainan 7v7',
  'Transisi Menyerang & Bertahan',
  'Pemulihan & Intensitas Rendah',
];

const DEFAULT_OBJECTIVES: Record<TrainingFocus, string> = {
  'Koordinasi & Keterampilan Gerak': 'Mengembangkan kelincahan gerak kaki, keseimbangan dinamis, dan kesadaran spasial.',
  'Dribbling': 'Penguasaan sentuhan bola dekat, perubahan arah cepat, dan dribble 1v1 dengan percaya diri.',
  'Passing & Kontrol Bola': 'Akurasi umpan mendatar kaki dalam dan first touch mengarah ke ruang bebas.',
  'Finishing': 'Teknik penempatan bola ke gawang, ketenangan saat peluang, dan shooting akurat.',
  'Situasi 1v1': 'Keberanian duel 1v1 menyerang dan posisi bertahan menunda pergerakan lawan.',
  'Small-Sided Games (SSG)': 'Aplikasi keterampilan teknik dalam permainan mini intensif dengan sentuhan bola maksimal.',
  'Pemahaman Taktik': 'Pemahaman formasi dasar 2-3-1, transisi bermain, dan komunikasi antarlini.',
  'Permainan 7v7': 'Penerapan formasi 2-3-1 pada format 7v7, menjaga jarak antarpemain, dan transisi cepat.',
  'Transisi Menyerang & Bertahan': 'Reaksi cepat saat kehilangan bola dan reorganisasi lini serang saat merebut bola.',
  'Pemulihan & Intensitas Rendah': 'Regenerasi fisik, permainan santai fun game, dan pemulihan kebugaran.',
};

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
  sessionToEdit,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { teams, createSession, updateSession } = useData();
  const { currentUser, logout } = useAuth();

  const isEditing = Boolean(sessionToEdit);

  const [date, setDate] = useState(
    sessionToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(sessionToEdit?.time || '16:00 - 17:15');
  const [teamId, setTeamId] = useState(sessionToEdit?.teamId || 'team-b');
  const [coachName, setCoachName] = useState(
    sessionToEdit?.coachName || currentUser?.name || 'Coach Wildan'
  );
  const [focus, setFocus] = useState<TrainingFocus>(
    sessionToEdit?.focus || 'Dribbling'
  );
  const [objective, setObjective] = useState(
    sessionToEdit?.objective || DEFAULT_OBJECTIVES['Dribbling']
  );
  const [drillDescription, setDrillDescription] = useState(
    sessionToEdit?.drillDescription || ''
  );
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState(
    sessionToEdit?.plannedDurationMinutes || 75
  );
  const [actualDurationMinutes, setActualDurationMinutes] = useState(
    sessionToEdit?.actualDurationMinutes || 75
  );
  const [equipment, setEquipment] = useState(
    sessionToEdit?.equipment || 'Bola (15), Marker (30)'
  );
  const [evaluationNotes, setEvaluationNotes] = useState(
    sessionToEdit?.evaluationNotes || ''
  );
  const [status, setStatus] = useState<SessionStatus>(
    sessionToEdit?.status || 'completed'
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize state when opening modal or changing sessionToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setDate(sessionToEdit.date || new Date().toISOString().split('T')[0]);
        setTime(sessionToEdit.time || '16:00 - 17:15');
        setTeamId(sessionToEdit.teamId || 'team-b');
        setCoachName(sessionToEdit.coachName || currentUser?.name || 'Coach CFA');
        setFocus(sessionToEdit.focus || 'Dribbling');
        setObjective(sessionToEdit.objective || DEFAULT_OBJECTIVES[sessionToEdit.focus || 'Dribbling']);
        setDrillDescription(sessionToEdit.drillDescription || '');
        setPlannedDurationMinutes(sessionToEdit.plannedDurationMinutes || 75);
        setActualDurationMinutes(sessionToEdit.actualDurationMinutes || 75);
        setEquipment(sessionToEdit.equipment || 'Bola (15), Marker (30)');
        setEvaluationNotes(sessionToEdit.evaluationNotes || '');
        setStatus(sessionToEdit.status || 'completed');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
        setTime('16:00 - 17:15');
        setTeamId('team-b');
        setCoachName(currentUser?.name || 'Coach CFA');
        setFocus('Dribbling');
        setObjective(DEFAULT_OBJECTIVES['Dribbling']);
        setDrillDescription('1. Rondo pemanasan (15m). 2. Slalom dribble cone (25m). 3. SSG 3v3 gerbang mini (30m).');
        setPlannedDurationMinutes(75);
        setActualDurationMinutes(75);
        setEquipment('Bola (15), Marker (30)');
        setEvaluationNotes('');
        setStatus('completed');
      }
      setError(null);
    }
  }, [isOpen, sessionToEdit, currentUser]);

  if (!isOpen) return null;

  const handleFocusChange = (newFocus: TrainingFocus) => {
    setFocus(newFocus);
    // If objective is currently empty or matches any default objective, update to new focus objective
    const isCurrentDefault = Object.values(DEFAULT_OBJECTIVES).includes(objective.trim());
    if (!objective.trim() || isCurrentDefault) {
      setObjective(DEFAULT_OBJECTIVES[newFocus] || `Pembinaan keterampilan materi ${newFocus}`);
    }
  };

  const handleApplyPresetTemplate = (type: 'dribble' | 'passing' | 'game7v7') => {
    if (type === 'dribble') {
      setFocus('Dribbling');
      setObjective(DEFAULT_OBJECTIVES['Dribbling']);
      setDrillDescription('1. Rondo pemanasan (15m). 2. Slalom dribble zig-zag 5 cone (25m). 3. SSG 3v3 gerbang mini (30m).');
      setEquipment('Bola (15), Marker (25)');
    } else if (type === 'passing') {
      setFocus('Passing & Kontrol Bola');
      setObjective(DEFAULT_OBJECTIVES['Passing & Kontrol Bola']);
      setDrillDescription('1. Kelincahan gerak kaki (15m). 2. Passing 2 sentuhan berpasangan 6m (25m). 3. Game 4v4 + netral (30m).');
      setEquipment('Bola (15), Marker (20)');
    } else if (type === 'game7v7') {
      setFocus('Permainan 7v7');
      setObjective(DEFAULT_OBJECTIVES['Permainan 7v7']);
      setDrillDescription('1. Pemanasan fun tag (10m). 2. Rotasi build-up 7v0 (20m). 3. Internal game 7v7 (40m).');
      setEquipment('Bola (15), Marker (30)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Tanggal sesi wajib diisi.');
      return;
    }

    const finalObjective = objective.trim() || DEFAULT_OBJECTIVES[focus] || `Pembinaan fokus ${focus} usia dini`;
    const finalCoach = coachName.trim() || currentUser?.name || 'Coach CFA';

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<TrainingSession> = {
        date,
        time: time.trim() || '16:00 - 17:15',
        teamId: teamId || 'team-b',
        coachName: finalCoach,
        focus,
        objective: finalObjective,
        drillDescription: drillDescription.trim(),
        plannedDurationMinutes: Number(plannedDurationMinutes) || 75,
        actualDurationMinutes: Number(actualDurationMinutes) || 75,
        equipment: equipment.trim() || 'Bola (15), Marker (30)',
        evaluationNotes: evaluationNotes.trim(),
        status,
      };

      let result: TrainingSession;
      if (isEditing && sessionToEdit) {
        result = await updateSession(sessionToEdit.id, payload);
      } else {
        result = await createSession(payload);
      }

      if (onSaved) onSaved(result);
      onClose();
    } catch (err: any) {
      console.error('Error saving session:', err);
      setError(err.message || 'Gagal menyimpan sesi latihan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? `Edit Sesi: ${sessionToEdit?.id}` : 'Buat Sesi Latihan Baru'}
              </h2>
              <p className="text-xs text-emerald-200">
                Format Pembinaan 7v7 • Frekuensi 3 Sesi Per Minggu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:bg-emerald-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Quick Actions */}
        {!isEditing && (
          <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-emerald-900">Template Cepat 7v7:</span>
            <button
              type="button"
              onClick={() => handleApplyPresetTemplate('dribble')}
              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium shadow-2xs"
            >
              + Sesi Dribble & 1v1
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetTemplate('passing')}
              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium shadow-2xs"
            >
              + Sesi Passing & Kontrol
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetTemplate('game7v7')}
              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium shadow-2xs"
            >
              + Sesi Game 7v7
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-medium">{error}</span>
              {(error.toLowerCase().includes('autentikasi') || error.toLowerCase().includes('login') || error.toLowerCase().includes('unauthorized')) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  Login Ulang
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Sesi *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Waktu Sesi</label>
              <input
                type="text"
                placeholder="16:00 - 17:15"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Kelompok Tim</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-semibold"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fokus Latihan (Kurikulum) *</label>
              <select
                value={focus}
                onChange={(e) => handleFocusChange(e.target.value as TrainingFocus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
              >
                {FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pelatih Penanggung Jawab</label>
              <input
                type="text"
                required
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tujuan Sesi (Objectives) *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Mengembangkan kontrol bola dekat dan passing mendatar akurat di bawah tekanan 1v1..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Materi & Deskripsi Aktivitas Drill</label>
            <textarea
              rows={3}
              placeholder="1. Pemanasan koordinasi (15m)... 2. Drill teknis berpasangan (25m)... 3. Game 7v7 bersyarat (30m)..."
              value={drillDescription}
              onChange={(e) => setDrillDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono text-[11px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Durasi Rencana (Menit)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={plannedDurationMinutes}
                onChange={(e) => setPlannedDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Durasi Aktual (Menit)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={actualDurationMinutes}
                onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status Sesi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
              >
                <option value="completed">Selesai (Completed)</option>
                <option value="scheduled">Terjadwal (Scheduled)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Peralatan Latihan (Bola & Marker)</label>
            <input
              type="text"
              placeholder="Contoh: Bola (15), Marker (30)"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Catatan Evaluasi Sesi oleh Pelatih</label>
            <textarea
              rows={2}
              placeholder="Contoh: Anak-anak sangat antusias. Transisi bertahan perlu diperkuat di sesi berikutnya..."
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Sesi Latihan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
