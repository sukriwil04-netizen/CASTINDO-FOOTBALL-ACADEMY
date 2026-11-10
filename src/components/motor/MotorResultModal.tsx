import React, { useState } from 'react';
import { X, Zap, Save, Info } from 'lucide-react';
import { MotorTest, MotorTestResult } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface MotorResultModalProps {
  resultToEdit?: MotorTestResult | null;
  defaultPlayerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const MotorResultModal: React.FC<MotorResultModalProps> = ({
  resultToEdit,
  defaultPlayerId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activePlayers, motorTests, saveMotorTestResult } = useData();
  const { currentUser } = useAuth();

  const isEditing = Boolean(resultToEdit);

  const [playerId, setPlayerId] = useState<string>(
    resultToEdit?.playerId || defaultPlayerId || activePlayers[0]?.id || ''
  );
  const [testId, setTestId] = useState<string>(
    resultToEdit?.testId || motorTests[0]?.id || ''
  );
  const [date, setDate] = useState<string>(
    resultToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [numericValue, setNumericValue] = useState<number | ''>(
    resultToEdit?.numericValue ?? ''
  );
  const [executionCondition, setExecutionCondition] = useState<string>(
    resultToEdit?.executionCondition || 'Lapangan rumput kering, bola standar 7v7 ukuran 4'
  );
  const [notes, setNotes] = useState<string>(resultToEdit?.notes || '');
  const [testerName, setTesterName] = useState<string>(
    resultToEdit?.testerName || currentUser?.name || 'Coach Doni Saputra'
  );
  const [publishedToParents, setPublishedToParents] = useState<boolean>(
    resultToEdit?.publishedToParents ?? false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when opening modal or changing resultToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (resultToEdit) {
        setPlayerId(resultToEdit.playerId || '');
        setTestId(resultToEdit.testId || motorTests[0]?.id || '');
        setDate(resultToEdit.date || new Date().toISOString().split('T')[0]);
        setNumericValue(resultToEdit.numericValue ?? '');
        setExecutionCondition(
          resultToEdit.executionCondition || 'Lapangan rumput kering, bola standar 7v7 ukuran 4'
        );
        setNotes(resultToEdit.notes || '');
        setTesterName(resultToEdit.testerName || currentUser?.name || 'Asisten Pelatih Tim B');
        setPublishedToParents(resultToEdit.publishedToParents ?? false);
      } else {
        setPlayerId(defaultPlayerId || activePlayers[0]?.id || '');
        setTestId(motorTests[0]?.id || '');
        setDate(new Date().toISOString().split('T')[0]);
        setNumericValue('');
        setExecutionCondition('Lapangan rumput kering, bola standar 7v7 ukuran 4');
        setNotes('');
        setTesterName(currentUser?.name || 'Asisten Pelatih Tim B');
        setPublishedToParents(false); // Default to draft internal
      }
      setError(null);
    }
  }, [isOpen, resultToEdit, defaultPlayerId, activePlayers, motorTests, currentUser]);

  if (!isOpen) return null;

  const selectedTest = motorTests.find((t) => t.id === testId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Pilih pemain.');
      return;
    }
    if (!testId) {
      setError('Pilih jenis tes motorik/fisik.');
      return;
    }
    if (numericValue === '' || isNaN(Number(numericValue))) {
      setError('Nilai hasil pengukuran angka wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveMotorTestResult(
        {
          playerId,
          testId,
          date,
          numericValue: Number(numericValue),
          unit: selectedTest?.unit || 'detik',
          executionCondition: executionCondition.trim(),
          notes: notes.trim(),
          testerName: testerName.trim(),
          publishedToParents,
        },
        resultToEdit?.id
      );

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan hasil tes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Hasil Tes Fisik/Motorik' : 'Catat Pengukuran Tes Motorik & Fisik'}
              </h2>
              <p className="text-xs text-emerald-200">
                Peralatan Lapangan: Bola & Marker • Pengukuran Baseline & Follow-up
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
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Tes *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Pilih Jenis Tes (Bola & Marker) *</label>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-semibold text-gray-900"
            >
              {motorTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category} • Satuan: {t.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedTest && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-emerald-950">
              <div className="font-bold text-[11px]">Tujuan & Protokol Pelaksanaan:</div>
              <p className="text-[11px] text-emerald-900">{selectedTest.objective}</p>
              <p className="text-[10px] text-gray-600 italic mt-1 font-mono">
                Protokol: {selectedTest.protocol}
              </p>
              <div className="text-[10px] text-emerald-800 font-semibold pt-1">
                Alat: {selectedTest.equipment} • {selectedTest.higherIsBetter ? 'Angka lebih tinggi lebih baik' : 'Waktu lebih cepat (kecil) lebih baik'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Hasil Angka ({selectedTest?.unit || 'nilai'}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Contoh: 2.18"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-black text-emerald-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nama Penguji / Coach</label>
              <input
                type="text"
                required
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Kondisi Pelaksanaan</label>
            <input
              type="text"
              placeholder="Contoh: Lapangan rumput kering, sepatu sepak bola standar, pagi hari..."
              value={executionCondition}
              onChange={(e) => setExecutionCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Catatan Tambahan Penguji</label>
            <textarea
              rows={2}
              placeholder="Contoh: Terlihat frekuensi langkah lebih rapat saat dribble slalom; tidak ada tanda keluhan fisik..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Publication to Parents Toggle */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={publishedToParents}
                onChange={(e) => setPublishedToParents(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-950 block">
                  Publikasikan Hasil ke Dashboard Orang Tua / Wali Murid
                </span>
                <span className="text-gray-600 leading-relaxed block">
                  Jika tidak dicentang, hasil pengukuran ini disimpan sebagai draft internal pelatih dan belum terlihat oleh orang tua.
                </span>
              </div>
            </label>
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Pengukuran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
