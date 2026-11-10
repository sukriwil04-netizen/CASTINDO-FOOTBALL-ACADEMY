import React, { useMemo, useState } from 'react';
import {
  Award,
  Plus,
  Calendar,
  User,
  Trash2,
  Edit,
  Shield,
  Filter,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PromotionRecommendation, PromotionReview } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatIndonesianDate, PROMOTION_RECOMMENDATION_BADGES } from '../utils/formatters.ts';
import { PromotionReviewModal } from '../components/promotion/PromotionReviewModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';

export const PromotionReviewView: React.FC = () => {
  const { promotionReviews, players, activePlayers, deletePromotionReview } = useData();
  const { canFinalizePromotion } = useAuth();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<PromotionReview | null>(null);

  const filteredReviews = useMemo(() => {
    return promotionReviews
      .filter((r) => {
        if (selectedPlayerId !== 'all' && r.playerId !== selectedPlayerId) return false;
        if (recommendationFilter !== 'all' && r.recommendation !== recommendationFilter) return false;
        return true;
      })
      .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
  }, [promotionReviews, selectedPlayerId, recommendationFilter]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deletePromotionReview(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      {/* Safeguard & Policy Banner (Section 13) */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-xs text-emerald-950">
        <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            Protokol Evaluasi Kesiapan Promosi ke Tim A (Castindo Football Academy)
          </div>
          <p className="text-emerald-900/90 leading-relaxed text-[11px]">
            Promosi adalah langkah transisi perkembangan, bukan hadiah atau pemeringkatan kaku. Keputusan didasarkan pada musyawarah staf pelatih
            dengan bukti komprehensif: teknik dalam tekanan, pemahaman taktis 7v7 Tim A, kematangan motorik, dan sikap belajar anak.
          </p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Review:
          </span>

          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Pemain ({promotionReviews.length} Berkas)</option>
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

          <select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Rekomendasi</option>
            <option value="Siap Mengikuti Sesi Observasi Tim A">Siap Observasi Tim A</option>
            <option value="Direkomendasikan untuk Dibahas dengan Staf">Bahas dengan Staf</option>
            <option value="Perlu Target Perkembangan Lanjutan">Perlu Target Lanjutan</option>
            <option value="Ditinjau Ulang Periode Berikutnya">Ditinjau Periode Berikutnya</option>
          </select>
        </div>

        {canFinalizePromotion && (
          <button
            onClick={() => {
              setReviewToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Evaluasi Promosi</span>
          </button>
        )}
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const player = players.find((p) => p.id === review.playerId);
            return (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-4 text-xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {(player?.nickname || player?.fullName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {player?.fullName || review.playerId}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {player?.id} • Posisi: {player?.primaryPosition} • Lahir {player?.birthYear}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        PROMOTION_RECOMMENDATION_BADGES[review.recommendation] || 'bg-gray-100'
                      }`}
                    >
                      {review.recommendation}
                    </span>
                    <button
                      onClick={() => {
                        setReviewToEdit(review);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7 Dimensions Bar Metrics */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    7 Dimensi Penilaian Kesiapan (Skala 1–4):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
                    {[
                      { label: 'Teknik Under Pressure', val: review.techUnderPressure },
                      { label: 'Prinsip Taktik Tim A', val: review.tacticalPrinciplesTimA },
                      { label: 'Pengambilan Keputusan', val: review.decisionMaking },
                      { label: 'Kapasitas Lari/Fisik', val: review.motorDemands },
                      { label: 'Konsistensi Laga', val: review.performanceConsistency },
                      { label: 'Sikap Belajar', val: review.learningAttitude },
                      { label: 'Adaptasi Lingkungan', val: review.adaptabilityToIntensity },
                    ].map((item) => (
                      <div key={item.label} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-500 block truncate">{item.label}</span>
                        <span className="text-sm font-black text-emerald-800 block mt-0.5">
                          {item.val}/4
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualitative Evidence & Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                    <strong className="text-gray-700 block text-[11px] uppercase tracking-wider">
                      Bukti Observasi Nyata:
                    </strong>
                    <p className="text-gray-600 leading-relaxed">{review.observedEvidence}</p>
                    <div className="pt-2 text-[11px] space-y-0.5">
                      <div>
                        <strong className="text-emerald-800">Kekuatan:</strong> {review.playerStrengths}
                      </div>
                      <div>
                        <strong className="text-amber-800">Kebutuhan Lanjutan:</strong> {review.developmentNeeds}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2">
                    <div>
                      <strong className="text-emerald-950 block text-[11px] uppercase tracking-wider mb-1">
                        Rencana Tindak Lanjut:
                      </strong>
                      <p className="text-emerald-900 leading-relaxed font-medium">
                        {review.followUpPlan}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 flex items-center justify-between">
                      <span>Staf: {review.coachesInvolved.join(', ')}</span>
                      {review.nextReviewDate && (
                        <span>Review Lanjutan: {formatIndonesianDate(review.nextReviewDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 flex justify-between items-center pt-1 border-t border-gray-100">
                  <span>Tanggal Evaluasi: {formatIndonesianDate(review.reviewDate, 'full')}</span>
                  <span>ID: {review.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
          <Award className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Belum ada berkas review promosi</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Dokumentasikan diskusi evaluasi staf pelatih mengenai kesiapan pemain Tim B mengikuti tuntutan Tim A.
          </p>
          {canFinalizePromotion && (
            <button
              onClick={() => {
                setReviewToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Evaluasi Promosi Pertama</span>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <PromotionReviewModal
        isOpen={isFormOpen}
        reviewToEdit={reviewToEdit}
        defaultPlayerId={selectedPlayerId !== 'all' ? selectedPlayerId : null}
        onClose={() => {
          setIsFormOpen(false);
          setReviewToEdit(null);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Evaluasi Promosi"
        message="Apakah Anda yakin ingin menghapus berkas evaluasi kesiapan promosi ini?"
        confirmText="Ya, Hapus Berkas"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
