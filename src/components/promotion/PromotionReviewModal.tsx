import React, { useState } from 'react';
import { X, Award, Save, Shield, Info } from 'lucide-react';
import {
  PromotionRecommendation,
  PromotionReview,
} from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PROMOTION_RECOMMENDATION_BADGES } from '../../utils/formatters.ts';

interface PromotionReviewModalProps {
  reviewToEdit?: PromotionReview | null;
  defaultPlayerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const RECOMMENDATIONS: PromotionRecommendation[] = [
  'Belum Ditinjau',
  'Perlu Target Perkembangan Lanjutan',
  'Siap Mengikuti Sesi Observasi Tim A',
  'Direkomendasikan untuk Dibahas dengan Staf',
  'Ditinjau Ulang Periode Berikutnya',
];

export const PromotionReviewModal: React.FC<PromotionReviewModalProps> = ({
  reviewToEdit,
  defaultPlayerId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activePlayers, savePromotionReview } = useData();
  const { currentUser } = useAuth();

  const isEditing = Boolean(reviewToEdit);

  const [playerId, setPlayerId] = useState<string>(
    reviewToEdit?.playerId || defaultPlayerId || activePlayers[0]?.id || ''
  );
  const [reviewDate, setReviewDate] = useState<string>(
    reviewToEdit?.reviewDate || new Date().toISOString().split('T')[0]
  );
  const [coachesInput, setCoachesInput] = useState<string>(
    reviewToEdit?.coachesInvolved.join(', ') ||
      `${currentUser?.name || 'Coach Rian Pratama'}, Coach Doni Saputra`
  );

  // 7 Dimensions (1-4)
  const [techUnderPressure, setTechUnderPressure] = useState<number>(
    reviewToEdit?.techUnderPressure || 3
  );
  const [tacticalPrinciplesTimA, setTacticalPrinciplesTimA] = useState<number>(
    reviewToEdit?.tacticalPrinciplesTimA || 3
  );
  const [decisionMaking, setDecisionMaking] = useState<number>(
    reviewToEdit?.decisionMaking || 3
  );
  const [motorDemands, setMotorDemands] = useState<number>(
    reviewToEdit?.motorDemands || 3
  );
  const [performanceConsistency, setPerformanceConsistency] = useState<number>(
    reviewToEdit?.performanceConsistency || 3
  );
  const [learningAttitude, setLearningAttitude] = useState<number>(
    reviewToEdit?.learningAttitude || 4
  );
  const [adaptabilityToIntensity, setAdaptabilityToIntensity] = useState<number>(
    reviewToEdit?.adaptabilityToIntensity || 3
  );

  // Qualitative notes & human decision
  const [observedEvidence, setObservedEvidence] = useState<string>(
    reviewToEdit?.observedEvidence || ''
  );
  const [playerStrengths, setPlayerStrengths] = useState<string>(
    reviewToEdit?.playerStrengths || ''
  );
  const [developmentNeeds, setDevelopmentNeeds] = useState<string>(
    reviewToEdit?.developmentNeeds || ''
  );
  const [recommendation, setRecommendation] = useState<PromotionRecommendation>(
    reviewToEdit?.recommendation || 'Siap Mengikuti Sesi Observasi Tim A'
  );
  const [followUpPlan, setFollowUpPlan] = useState<string>(
    reviewToEdit?.followUpPlan || ''
  );
  const [nextReviewDate, setNextReviewDate] = useState<string>(
    reviewToEdit?.nextReviewDate || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when opening modal or changing reviewToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (reviewToEdit) {
        setPlayerId(reviewToEdit.playerId || '');
        setReviewDate(reviewToEdit.reviewDate || new Date().toISOString().split('T')[0]);
        setCoachesInput(reviewToEdit.coachesInvolved.join(', '));
        setTechUnderPressure(reviewToEdit.techUnderPressure ?? 3);
        setTacticalPrinciplesTimA(reviewToEdit.tacticalPrinciplesTimA ?? 3);
        setDecisionMaking(reviewToEdit.decisionMaking ?? 3);
        setMotorDemands(reviewToEdit.motorDemands ?? 3);
        setPerformanceConsistency(reviewToEdit.performanceConsistency ?? 3);
        setLearningAttitude(reviewToEdit.learningAttitude ?? 4);
        setAdaptabilityToIntensity(reviewToEdit.adaptabilityToIntensity ?? 3);
        setObservedEvidence(reviewToEdit.observedEvidence || '');
        setPlayerStrengths(reviewToEdit.playerStrengths || '');
        setDevelopmentNeeds(reviewToEdit.developmentNeeds || '');
        setRecommendation(reviewToEdit.recommendation || 'Siap Mengikuti Sesi Observasi Tim A');
        setFollowUpPlan(reviewToEdit.followUpPlan || '');
        setNextReviewDate(reviewToEdit.nextReviewDate || '');
      } else {
        setPlayerId(defaultPlayerId || activePlayers[0]?.id || '');
        setReviewDate(new Date().toISOString().split('T')[0]);
        setCoachesInput(currentUser?.name || 'Pelatih Tim B');
        setTechUnderPressure(3);
        setTacticalPrinciplesTimA(3);
        setDecisionMaking(3);
        setMotorDemands(3);
        setPerformanceConsistency(3);
        setLearningAttitude(4);
        setAdaptabilityToIntensity(3);
        setObservedEvidence('');
        setPlayerStrengths('');
        setDevelopmentNeeds('');
        setRecommendation('Siap Mengikuti Sesi Observasi Tim A');
        setFollowUpPlan('');
        setNextReviewDate('');
      }
      setError(null);
    }
  }, [isOpen, reviewToEdit, defaultPlayerId, activePlayers, currentUser]);

  if (!isOpen) return null;

  const renderAspectPicker = (
    label: string,
    value: number,
    setter: (val: number) => void
  ) => (
    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 text-xs">
      <div className="flex justify-between items-center">
        <span className="font-bold text-gray-800">{label}</span>
        <span className="text-[11px] font-black text-emerald-800">{value}/4</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {([1, 2, 3, 4] as const).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setter(num)}
            className={`py-1 rounded font-bold text-xs transition-colors ${
              value === num
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Pilih pemain.');
      return;
    }
    if (!observedEvidence.trim() || !followUpPlan.trim()) {
      setError('Bukti observasi dan rencana tindak lanjut wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const coachesList = coachesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      await savePromotionReview(
        {
          playerId,
          reviewDate,
          coachesInvolved: coachesList,
          techUnderPressure,
          tacticalPrinciplesTimA,
          decisionMaking,
          motorDemands,
          performanceConsistency,
          learningAttitude,
          adaptabilityToIntensity,
          observedEvidence: observedEvidence.trim(),
          playerStrengths: playerStrengths.trim(),
          developmentNeeds: developmentNeeds.trim(),
          recommendation,
          followUpPlan: followUpPlan.trim(),
          nextReviewDate: nextReviewDate || undefined,
        },
        reviewToEdit?.id
      );

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan evaluasi promosi');
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
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Edit Evaluasi Kesiapan Promosi' : 'Formulir Evaluasi Kesiapan Promosi Tim A'}
              </h2>
              <p className="text-xs text-emerald-200">
                Keputusan Berbasis Staf Pelatih & Bukti Nyata Pertandingan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:bg-emerald-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Safeguard Banner */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center space-x-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong>Prinsip Penting:</strong> Keputusan promosi ke Tim A merupakan pertimbangan manusia (staf pelatih)
            berdasarkan bukti multi-dimensi, bukan keputusan otomatis berdasarkan usia, kehadiran, atau angka tes tunggal.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pemain Tim B *</label>
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
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Peninjauan *</label>
              <input
                type="date"
                required
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tanggal Peninjauan Lanjutan</label>
              <input
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Staf Pelatih yang Terlibat *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Coach Rian Pratama, Coach Doni Saputra, Head of Academy"
              value={coachesInput}
              onChange={(e) => setCoachesInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* 7 Core Dimensions */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="font-bold uppercase tracking-wider text-emerald-900 text-xs">
              7 Dimensi Kesiapan Mengikuti Tuntutan Tim A (1: Perlu Dukungan s/d 4: Konsisten/Adaptif)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {renderAspectPicker('1. Teknik Under Pressure', techUnderPressure, setTechUnderPressure)}
              {renderAspectPicker('2. Taktik Permainan Tim A', tacticalPrinciplesTimA, setTacticalPrinciplesTimA)}
              {renderAspectPicker('3. Pengambilan Keputusan', decisionMaking, setDecisionMaking)}
              {renderAspectPicker('4. Kapasitas Motorik/Lari', motorDemands, setMotorDemands)}
              {renderAspectPicker('5. Konsistensi Performa', performanceConsistency, setPerformanceConsistency)}
              {renderAspectPicker('6. Sikap & Respon Belajar', learningAttitude, setLearningAttitude)}
              {renderAspectPicker('7. Adaptasi Intensitas', adaptabilityToIntensity, setAdaptabilityToIntensity)}
            </div>
          </div>

          {/* Narrative observations */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Bukti Observasi Nyata (Latihan & Match 7v7) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Pemain menunjukkan ketenangan saat di-pressing dua pemain; kecepatan transisi kembali ke formasi sangat cepat..."
                value={observedEvidence}
                onChange={(e) => setObservedEvidence(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">
                  Kekuatan Utama Pemain
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Daya juang tinggi, operan tajam, komunikasi positif..."
                  value={playerStrengths}
                  onChange={(e) => setPlayerStrengths(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Kebutuhan Perkembangan Lanjutan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ketenangan clearance di kotak penalti, stamina di 10 menit akhir..."
                  value={developmentNeeds}
                  onChange={(e) => setDevelopmentNeeds(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Decision Recommendation */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <label className="block font-bold text-emerald-950 uppercase tracking-wider text-xs">
                Rekomendasi Staf Pelatih *
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as PromotionRecommendation)}
                className="w-full px-3 py-2 text-xs font-black text-emerald-950 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {RECOMMENDATIONS.map((rec) => (
                  <option key={rec} value={rec}>
                    {rec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Rencana Tindak Lanjut Konkret *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Mengikuti sesi observasi gabungan dengan Tim A selama 2 pekan (Senin & Rabu) didampingi Head Coach Tim B..."
                value={followUpPlan}
                onChange={(e) => setFollowUpPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Keputusan Evaluasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
