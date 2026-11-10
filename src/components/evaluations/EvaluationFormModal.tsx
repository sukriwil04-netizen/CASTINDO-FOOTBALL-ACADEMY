import React, { useState } from 'react';
import { X, Target, Save, Info, CheckCircle2 } from 'lucide-react';
import {
  ScaleScore,
  TechnicalTacticalEvaluation,
} from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { SCALE_4_DESCRIPTIONS } from '../../utils/formatters.ts';

interface EvaluationFormModalProps {
  evaluationToEdit?: TechnicalTacticalEvaluation | null;
  defaultPlayerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({
  evaluationToEdit,
  defaultPlayerId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activePlayers, saveEvaluation } = useData();
  const { currentUser } = useAuth();

  const isEditing = Boolean(evaluationToEdit);

  const [playerId, setPlayerId] = useState<string>(
    evaluationToEdit?.playerId || defaultPlayerId || activePlayers[0]?.id || ''
  );
  const [date, setDate] = useState<string>(
    evaluationToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [context, setContext] = useState<'Latihan' | 'Pertandingan 7v7' | 'Internal Game'>(
    evaluationToEdit?.context || 'Pertandingan 7v7'
  );
  const [evaluatorName, setEvaluatorName] = useState<string>(
    evaluationToEdit?.evaluatorName || currentUser?.name || 'Coach Rian Pratama'
  );

  // Technical scores
  const [dribblingScore, setDribblingScore] = useState<ScaleScore>(
    evaluationToEdit?.dribblingScore ?? 3
  );
  const [passingScore, setPassingScore] = useState<ScaleScore>(
    evaluationToEdit?.passingScore ?? 3
  );
  const [ballControlScore, setBallControlScore] = useState<ScaleScore>(
    evaluationToEdit?.ballControlScore ?? 3
  );
  const [firstTouchScore, setFirstTouchScore] = useState<ScaleScore>(
    evaluationToEdit?.firstTouchScore ?? 3
  );
  const [finishingScore, setFinishingScore] = useState<ScaleScore>(
    evaluationToEdit?.finishingScore ?? null
  );
  const [ballShieldingScore, setBallShieldingScore] = useState<ScaleScore>(
    evaluationToEdit?.ballShieldingScore ?? 2
  );
  const [oneVsOneScore, setOneVsOneScore] = useState<ScaleScore>(
    evaluationToEdit?.oneVsOneScore ?? 3
  );

  // Tactical scores
  const [bodyOrientationScore, setBodyOrientationScore] = useState<ScaleScore>(
    evaluationToEdit?.bodyOrientationScore ?? 2
  );
  const [supportAfterPassScore, setSupportAfterPassScore] = useState<ScaleScore>(
    evaluationToEdit?.supportAfterPassScore ?? 3
  );
  const [spaceUtilizationScore, setSpaceUtilizationScore] = useState<ScaleScore>(
    evaluationToEdit?.spaceUtilizationScore ?? 3
  );
  const [decisionMakingScore, setDecisionMakingScore] = useState<ScaleScore>(
    evaluationToEdit?.decisionMakingScore ?? 2
  );
  const [attackingPositionScore, setAttackingPositionScore] = useState<ScaleScore>(
    evaluationToEdit?.attackingPositionScore ?? 3
  );
  const [defendingPositionScore, setDefendingPositionScore] = useState<ScaleScore>(
    evaluationToEdit?.defendingPositionScore ?? 2
  );
  const [transitionScore, setTransitionScore] = useState<ScaleScore>(
    evaluationToEdit?.transitionScore ?? 3
  );
  const [understanding7v7Score, setUnderstanding7v7Score] = useState<ScaleScore>(
    evaluationToEdit?.understanding7v7Score ?? 3
  );

  // Narrative
  const [observedEvidence, setObservedEvidence] = useState<string>(
    evaluationToEdit?.observedEvidence || ''
  );
  const [strengths, setStrengths] = useState<string>(
    evaluationToEdit?.strengths || ''
  );
  const [improvementFocus, setImprovementFocus] = useState<string>(
    evaluationToEdit?.improvementFocus || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when opening modal or changing evaluationToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (evaluationToEdit) {
        setPlayerId(evaluationToEdit.playerId || '');
        setDate(evaluationToEdit.date || new Date().toISOString().split('T')[0]);
        setContext(evaluationToEdit.context || 'Pertandingan 7v7');
        setEvaluatorName(evaluationToEdit.evaluatorName || currentUser?.name || 'Pelatih');
        setDribblingScore(evaluationToEdit.dribblingScore ?? 3);
        setPassingScore(evaluationToEdit.passingScore ?? 3);
        setBallControlScore(evaluationToEdit.ballControlScore ?? 3);
        setFirstTouchScore(evaluationToEdit.firstTouchScore ?? 3);
        setFinishingScore(evaluationToEdit.finishingScore ?? null);
        setBallShieldingScore(evaluationToEdit.ballShieldingScore ?? 2);
        setOneVsOneScore(evaluationToEdit.oneVsOneScore ?? 3);
        setBodyOrientationScore(evaluationToEdit.bodyOrientationScore ?? 2);
        setSupportAfterPassScore(evaluationToEdit.supportAfterPassScore ?? 3);
        setSpaceUtilizationScore(evaluationToEdit.spaceUtilizationScore ?? 3);
        setDecisionMakingScore(evaluationToEdit.decisionMakingScore ?? 2);
        setAttackingPositionScore(evaluationToEdit.attackingPositionScore ?? 3);
        setDefendingPositionScore(evaluationToEdit.defendingPositionScore ?? 2);
        setTransitionScore(evaluationToEdit.transitionScore ?? 3);
        setUnderstanding7v7Score(evaluationToEdit.understanding7v7Score ?? 3);
        setObservedEvidence(evaluationToEdit.observedEvidence || '');
        setStrengths(evaluationToEdit.strengths || '');
        setImprovementFocus(evaluationToEdit.improvementFocus || '');
      } else {
        setPlayerId(defaultPlayerId || activePlayers[0]?.id || '');
        setDate(new Date().toISOString().split('T')[0]);
        setContext('Pertandingan 7v7');
        setEvaluatorName(currentUser?.name || 'Pelatih');
        setDribblingScore(3);
        setPassingScore(3);
        setBallControlScore(3);
        setFirstTouchScore(3);
        setFinishingScore(null);
        setBallShieldingScore(2);
        setOneVsOneScore(3);
        setBodyOrientationScore(2);
        setSupportAfterPassScore(3);
        setSpaceUtilizationScore(3);
        setDecisionMakingScore(2);
        setAttackingPositionScore(3);
        setDefendingPositionScore(2);
        setTransitionScore(3);
        setUnderstanding7v7Score(3);
        setObservedEvidence('');
        setStrengths('');
        setImprovementFocus('');
      }
      setError(null);
    }
  }, [isOpen, evaluationToEdit, defaultPlayerId, activePlayers, currentUser]);

  if (!isOpen) return null;

  const renderRubricPicker = (
    label: string,
    currentVal: ScaleScore,
    setter: (val: ScaleScore) => void
  ) => (
    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 text-xs">
      <div className="flex justify-between items-center">
        <span className="font-bold text-gray-800">{label}</span>
        <span className="text-[11px] font-semibold text-emerald-800">
          {currentVal !== null ? `Skor: ${currentVal}/4` : 'Belum Dinilai'}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        {([1, 2, 3, 4] as const).map((score) => {
          const isSelected = currentVal === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => setter(score)}
              className={`flex-1 py-1 rounded text-center font-bold text-xs transition-colors ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
              }`}
            >
              {score}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setter(null)}
          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
            currentVal === null
              ? 'bg-gray-700 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
          }`}
          title="Tidak diamati dalam sesi ini"
        >
          N/A
        </button>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Pilih pemain yang diobservasi.');
      return;
    }
    if (!observedEvidence.trim()) {
      setError('Bukti observasi yang terlihat di lapangan wajib dicatat.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveEvaluation(
        {
          playerId,
          date,
          context,
          evaluatorName: evaluatorName.trim(),
          dribblingScore,
          passingScore,
          ballControlScore,
          firstTouchScore,
          finishingScore,
          ballShieldingScore,
          oneVsOneScore,
          bodyOrientationScore,
          supportAfterPassScore,
          spaceUtilizationScore,
          decisionMakingScore,
          attackingPositionScore,
          defendingPositionScore,
          transitionScore,
          understanding7v7Score,
          observedEvidence: observedEvidence.trim(),
          strengths: strengths.trim(),
          improvementFocus: improvementFocus.trim(),
        },
        evaluationToEdit?.id
      );

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan evaluasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Evaluasi Teknik & Taktik' : 'Catat Observasi Teknik & Taktik'}
              </h2>
              <p className="text-xs text-emerald-200">
                Skala Perkembangan 1–4 Berbasis Bukti Nyata Permainan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:bg-emerald-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rubric Guide Banner */}
        <div className="px-6 py-2 bg-emerald-50/80 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
          <span><strong>1</strong>: Memerlukan banyak dukungan</span>
          <span><strong>2</strong>: Mulai berkembang</span>
          <span><strong>3</strong>: Cukup konsisten</span>
          <span><strong>4</strong>: Konsisten & adaptif</span>
          <span className="text-gray-500 italic">N/A: Belum diamati</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Pemain *</label>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
              >
                {activePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id} • {p.primaryPosition})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Observasi *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Konteks</label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="Pertandingan 7v7">Pertandingan 7v7</option>
                <option value="Internal Game">Internal Game</option>
                <option value="Latihan">Latihan Rutin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nama Pelatih / Evaluator</label>
            <input
              type="text"
              required
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Aspek Teknik */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="font-bold uppercase tracking-wider text-emerald-900 text-xs">
              A. Aspek Teknik (Keterampilan Bola)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {renderRubricPicker('Dribbling', dribblingScore, setDribblingScore)}
              {renderRubricPicker('Passing (Push Pass)', passingScore, setPassingScore)}
              {renderRubricPicker('Kontrol Bola', ballControlScore, setBallControlScore)}
              {renderRubricPicker('First Touch Terarah', firstTouchScore, setFirstTouchScore)}
              {renderRubricPicker('Finishing / Menembak', finishingScore, setFinishingScore)}
              {renderRubricPicker('Proteksi Bola (Shielding)', ballShieldingScore, setBallShieldingScore)}
              {renderRubricPicker('Kemampuan Duel 1v1', oneVsOneScore, setOneVsOneScore)}
            </div>
          </div>

          {/* Aspek Taktik */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="font-bold uppercase tracking-wider text-emerald-900 text-xs">
              B. Aspek Taktik & Pemahaman Situasi 7v7
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {renderRubricPicker('Orientasi Tubuh (Scanning)', bodyOrientationScore, setBodyOrientationScore)}
              {renderRubricPicker('Dukungan Pasca Passing', supportAfterPassScore, setSupportAfterPassScore)}
              {renderRubricPicker('Mencari & Pakai Ruang', spaceUtilizationScore, setSpaceUtilizationScore)}
              {renderRubricPicker('Pengambilan Keputusan', decisionMakingScore, setDecisionMakingScore)}
              {renderRubricPicker('Posisi Saat Menyerang', attackingPositionScore, setAttackingPositionScore)}
              {renderRubricPicker('Posisi Saat Bertahan', defendingPositionScore, setDefendingPositionScore)}
              {renderRubricPicker('Reaksi Transisi A/D', transitionScore, setTransitionScore)}
              {renderRubricPicker('Pemahaman Formasi 7v7', understanding7v7Score, setUnderstanding7v7Score)}
            </div>
          </div>

          {/* Catatan Observasi & Bukti */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Bukti Observasi yang Terlihat di Lapangan *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Terlihat 3 kali melakukan cut-back passing setelah melewati bek sayap lawan; orientasi tubuh terbuka menerima bola dari kiper..."
                value={observedEvidence}
                onChange={(e) => setObservedEvidence(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">
                  Kekuatan Pemain yang Teramati
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kecepatan tinggi saat membawa bola, berani mengambil risiko menyerang..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Fokus Perbaikan Berikutnya
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kebiasaan menoleh leher (scanning) sebelum menerima bola dan operan kaki kiri..."
                  value={improvementFocus}
                  onChange={(e) => setImprovementFocus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Observasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
