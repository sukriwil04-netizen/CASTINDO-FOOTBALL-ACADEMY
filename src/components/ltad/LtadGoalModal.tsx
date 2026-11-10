import React, { useState } from 'react';
import { X, TrendingUp, Save, Info } from 'lucide-react';
import { LtadDomain, LtadGoal, LtadStatus } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';

interface LtadGoalModalProps {
  goalToEdit?: LtadGoal | null;
  defaultPlayerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const DOMAINS: LtadDomain[] = [
  'Motorik',
  'Teknik',
  'Taktik',
  'Fisik',
  'Pemahaman Permainan',
  'Sosial & Perilaku Belajar',
];

const STATUSES: LtadStatus[] = [
  'Belum Mulai',
  'Berjalan',
  'Berkembang',
  'Tercapai',
  'Perlu Ditinjau',
];

export const LtadGoalModal: React.FC<LtadGoalModalProps> = ({
  goalToEdit,
  defaultPlayerId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activePlayers, saveLtadGoal } = useData();

  const isEditing = Boolean(goalToEdit);

  const [playerId, setPlayerId] = useState<string>(
    goalToEdit?.playerId || defaultPlayerId || activePlayers[0]?.id || ''
  );
  const [domain, setDomain] = useState<LtadDomain>(
    goalToEdit?.domain || 'Teknik'
  );
  const [setDate, setSetDate] = useState<string>(
    goalToEdit?.setDate || new Date().toISOString().split('T')[0]
  );
  const [reviewDate, setReviewDate] = useState<string>(() => {
    if (goalToEdit?.reviewDate) return goalToEdit.reviewDate;
    // Default 6 weeks in future
    const d = new Date();
    d.setDate(d.getDate() + 42);
    return d.toISOString().split('T')[0];
  });

  const [baseline, setBaseline] = useState<string>(goalToEdit?.baseline || '');
  const [target, setTarget] = useState<string>(goalToEdit?.target || '');
  const [indicator, setIndicator] = useState<string>(goalToEdit?.indicator || '');
  const [supportingDrills, setSupportingDrills] = useState<string>(
    goalToEdit?.supportingDrills || ''
  );
  const [status, setStatus] = useState<LtadStatus>(
    goalToEdit?.status || 'Berjalan'
  );
  const [evidenceNotes, setEvidenceNotes] = useState<string>(
    goalToEdit?.evidenceNotes || ''
  );
  const [nextGoal, setNextGoal] = useState<string>(goalToEdit?.nextGoal || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when opening modal or changing goalToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setPlayerId(goalToEdit.playerId || '');
        setDomain(goalToEdit.domain || 'Teknik');
        setSetDate(goalToEdit.setDate || new Date().toISOString().split('T')[0]);
        setReviewDate(goalToEdit.reviewDate || new Date().toISOString().split('T')[0]);
        setBaseline(goalToEdit.baseline || '');
        setTarget(goalToEdit.target || '');
        setIndicator(goalToEdit.indicator || '');
        setSupportingDrills(goalToEdit.supportingDrills || '');
        setStatus(goalToEdit.status || 'Berjalan');
        setEvidenceNotes(goalToEdit.evidenceNotes || '');
        setNextGoal(goalToEdit.nextGoal || '');
      } else {
        setPlayerId(defaultPlayerId || activePlayers[0]?.id || '');
        setDomain('Teknik');
        setSetDate(new Date().toISOString().split('T')[0]);
        const d = new Date();
        d.setDate(d.getDate() + 42);
        setReviewDate(d.toISOString().split('T')[0]);
        setBaseline('');
        setTarget('');
        setIndicator('');
        setSupportingDrills('');
        setStatus('Berjalan');
        setEvidenceNotes('');
        setNextGoal('');
      }
      setError(null);
    }
  }, [isOpen, goalToEdit, defaultPlayerId, activePlayers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Pilih pemain.');
      return;
    }
    if (!baseline.trim() || !target.trim()) {
      setError('Kondisi awal (baseline) dan target perkembangan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveLtadGoal(
        {
          playerId,
          domain,
          setDate,
          reviewDate,
          baseline: baseline.trim(),
          target: target.trim(),
          indicator: indicator.trim(),
          supportingDrills: supportingDrills.trim(),
          status,
          evidenceNotes: evidenceNotes.trim(),
          nextGoal: nextGoal.trim(),
        },
        goalToEdit?.id
      );

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan target LTAD');
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
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Target Perkembangan LTAD' : 'Tetapkan Target LTAD Baru'}
              </h2>
              <p className="text-xs text-emerald-200">
                Long-Term Athlete Development • Siklus Evaluasi 4–8 Minggu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:bg-emerald-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pemain *</label>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
              >
                {activePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Domain Perkembangan *</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as LtadDomain)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-semibold"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Penetapan *</label>
              <input
                type="date"
                required
                value={setDate}
                onChange={(e) => setSetDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Tanggal Review *</label>
              <input
                type="date"
                required
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-semibold text-emerald-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status Target</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LtadStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Kondisi Awal (Baseline) *</label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Pemain hanya nyaman menendang dengan kaki kanan, enggan mencoba kaki kiri dalam pertandingan..."
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-emerald-900 mb-1">Target Perkembangan Individual *</label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Mampu melakukan minimal 3 passing mendatar kaki kiri yang akurat dalam situasi internal game 7v7..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Indikator Keberhasilan Terukur</label>
              <input
                type="text"
                placeholder="Contoh: Frekuensi operan sukses kaki kiri terlihat dalam evaluasi pelatih..."
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Aktivitas Latihan Pendukung (Drill)</label>
              <input
                type="text"
                placeholder="Contoh: Passing wall-kick 10 menit, rondo wajib 2 sentuhan..."
                value={supportingDrills}
                onChange={(e) => setSupportingDrills(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Bukti Perkembangan (Catatan Review)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Pada sesi tanggal 30 Sep, Alif berhasil mengumpan dengan kaki kiri 2 kali di bawah tekanan lawan..."
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Target Lanjutan (Setelah Tercapai)</label>
            <input
              type="text"
              placeholder="Contoh: Dribble slalom marker menggunakan kaki kiri secara stabil..."
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Target LTAD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
