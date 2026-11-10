import React, { useMemo, useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  User,
  Trash2,
  Edit,
  TrendingUp,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { TechnicalTacticalEvaluation } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { formatIndonesianDate, SCALE_4_DESCRIPTIONS } from '../utils/formatters.ts';
import { EvaluationFormModal } from '../components/evaluations/EvaluationFormModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';

export const EvaluationsView: React.FC = () => {
  const { evaluations, players, activePlayers, deleteEvaluation } = useData();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [evalToEdit, setEvalToEdit] = useState<TechnicalTacticalEvaluation | null>(null);

  const filteredEvaluations = useMemo(() => {
    return evaluations
      .filter((e) => {
        if (selectedPlayerId !== 'all' && e.playerId !== selectedPlayerId) return false;
        if (contextFilter !== 'all' && e.context !== contextFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [evaluations, selectedPlayerId, contextFilter]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteEvaluation(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Observasi:
          </span>

          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Pemain ({evaluations.length} Evaluasi)</option>
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

          <select
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Konteks</option>
            <option value="Pertandingan 7v7">Pertandingan 7v7</option>
            <option value="Internal Game">Internal Game</option>
            <option value="Latihan">Latihan</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEvalToEdit(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Input Observasi Baru</span>
        </button>
      </div>

      {/* Evaluations List */}
      {filteredEvaluations.length > 0 ? (
        <div className="space-y-4">
          {filteredEvaluations.map((item) => {
            const player = players.find((p) => p.id === item.playerId);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {(player?.nickname || player?.fullName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {player?.fullName || item.playerId}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {player?.id} • Posisi: {player?.primaryPosition} • Tim B 7v7
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                      {item.context}
                    </span>
                    <span className="text-gray-500 font-medium">
                      {formatIndonesianDate(item.date, 'full')}
                    </span>
                    <button
                      onClick={() => {
                        setEvalToEdit(item);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score Rubrics Matrix */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Skor Aspek Teknik & Taktik (1–4):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
                    {[
                      { label: 'Dribbling', val: item.dribblingScore },
                      { label: 'Passing', val: item.passingScore },
                      { label: 'Kontrol Bola', val: item.ballControlScore },
                      { label: '1v1 Attack', val: item.oneVsOneScore },
                      { label: 'Scanning', val: item.bodyOrientationScore },
                      { label: 'Cari Ruang', val: item.spaceUtilizationScore },
                      { label: 'Keputusan', val: item.decisionMakingScore },
                      { label: 'Format 7v7', val: item.understanding7v7Score },
                    ].map((aspect) => (
                      <div
                        key={aspect.label}
                        className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center"
                      >
                        <span className="text-[10px] text-gray-500 block truncate">
                          {aspect.label}
                        </span>
                        <span
                          className={`text-sm font-black block mt-0.5 ${
                            aspect.val === 4
                              ? 'text-emerald-700'
                              : aspect.val === 3
                              ? 'text-blue-700'
                              : aspect.val === 2
                              ? 'text-amber-700'
                              : aspect.val === 1
                              ? 'text-rose-700'
                              : 'text-gray-400 italic text-[11px]'
                          }`}
                        >
                          {aspect.val !== null ? `${aspect.val}/4` : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualitative Observations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <strong className="text-gray-700 block text-[11px] uppercase tracking-wider mb-1">
                      Bukti Observasi:
                    </strong>
                    <p className="text-gray-600 leading-relaxed">{item.observedEvidence}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <strong className="text-emerald-900 block text-[11px] uppercase tracking-wider mb-1">
                      Kekuatan Pemain:
                    </strong>
                    <p className="text-emerald-950 leading-relaxed">{item.strengths}</p>
                  </div>
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                    <strong className="text-amber-900 block text-[11px] uppercase tracking-wider mb-1">
                      Fokus Perbaikan:
                    </strong>
                    <p className="text-amber-950 leading-relaxed">{item.improvementFocus}</p>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 flex justify-between items-center pt-1 border-t border-gray-100">
                  <span>Evaluator: <strong>{item.evaluatorName}</strong></span>
                  <span className="text-gray-400">ID: {item.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Belum ada evaluasi teknik & taktik</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Catat pengamatan perkembangan pemain setelah sesi latihan atau pertandingan 7v7.
          </p>
          <button
            onClick={() => {
              setEvalToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Observasi Pertama</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      <EvaluationFormModal
        isOpen={isFormOpen}
        evaluationToEdit={evalToEdit}
        defaultPlayerId={selectedPlayerId !== 'all' ? selectedPlayerId : null}
        onClose={() => {
          setIsFormOpen(false);
          setEvalToEdit(null);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Evaluasi Observasi"
        message="Apakah Anda yakin ingin menghapus berkas evaluasi observasi teknis/taktis ini?"
        confirmText="Ya, Hapus Observasi"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
