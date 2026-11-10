import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Plus,
  Calendar,
  User,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { LtadDomain, LtadGoal, LtadStatus } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { formatIndonesianDate, LTAD_STATUS_BADGES } from '../utils/formatters.ts';
import { LtadGoalModal } from '../components/ltad/LtadGoalModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';

export const LtadGoalsView: React.FC = () => {
  const { ltadGoals, players, activePlayers, deleteLtadGoal } = useData();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<LtadGoal | null>(null);

  const filteredGoals = useMemo(() => {
    return ltadGoals
      .filter((g) => {
        if (selectedPlayerId !== 'all' && g.playerId !== selectedPlayerId) return false;
        if (domainFilter !== 'all' && g.domain !== domainFilter) return false;
        if (statusFilter !== 'all' && g.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => b.setDate.localeCompare(a.setDate));
  }, [ltadGoals, selectedPlayerId, domainFilter, statusFilter]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteLtadGoal(deleteTargetId);
    setDeleteTargetId(null);
  };

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ltadGoals.forEach((g) => {
      counts[g.domain] = (counts[g.domain] || 0) + 1;
    });
    return counts;
  }, [ltadGoals]);

  return (
    <div className="space-y-6">
      {/* Educational Banner (Section 12) */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-xs text-emerald-950">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            Kerangka Long-Term Athlete Development (LTAD) Castindo Football Academy
          </div>
          <p className="text-emerald-900/90 leading-relaxed text-[11px]">
            LTAD memandu pembinaan jangka panjang berpusat pada anak (Child-Centered Development). Target ditetapkan per siklus 4–8 minggu
            di 6 domain: Motorik, Teknik, Taktik, Fisik, Pemahaman Permainan, dan Karakter Sosial, bukan semata skor sesaat.
          </p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter LTAD:
          </span>

          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Pemain ({ltadGoals.length} Target)</option>
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Domain</option>
            <option value="Teknik">Teknik</option>
            <option value="Taktik">Taktik</option>
            <option value="Pemahaman Permainan">Pemahaman Permainan</option>
            <option value="Motorik">Motorik</option>
            <option value="Fisik">Fisik</option>
            <option value="Sosial & Perilaku Belajar">Sosial & Perilaku</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="Berjalan">Berjalan</option>
            <option value="Berkembang">Berkembang</option>
            <option value="Tercapai">Tercapai</option>
            <option value="Perlu Ditinjau">Perlu Ditinjau</option>
            <option value="Belum Mulai">Belum Mulai</option>
          </select>
        </div>

        <button
          onClick={() => {
            setGoalToEdit(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tetapkan Target Baru</span>
        </button>
      </div>

      {/* Goals Card Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const player = players.find((p) => p.id === goal.playerId);
            return (
              <div
                key={goal.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 text-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {(player?.nickname || player?.fullName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {player?.fullName || goal.playerId}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {player?.id} • Domain: <strong className="text-emerald-800">{goal.domain}</strong>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      LTAD_STATUS_BADGES[goal.status] || 'bg-gray-100'
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>

                {/* Baseline vs Target */}
                <div className="space-y-2">
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200/80">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">
                      Kondisi Awal (Baseline):
                    </span>
                    <p className="text-gray-700 mt-0.5 leading-relaxed">{goal.baseline}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/80">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                      Target Perkembangan Terukur:
                    </span>
                    <p className="text-emerald-950 font-medium mt-0.5 leading-relaxed">
                      {goal.target}
                    </p>
                  </div>
                </div>

                {/* Indicators & Drills */}
                <div className="space-y-1.5 text-[11px] text-gray-600">
                  <div>
                    <strong>Indikator:</strong> {goal.indicator || '-'}
                  </div>
                  <div>
                    <strong>Drill Pendukung:</strong> {goal.supportingDrills || '-'}
                  </div>
                  {goal.evidenceNotes && (
                    <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-blue-900 mt-1">
                      <strong>Catatan Bukti Kemajuan:</strong> {goal.evidenceNotes}
                    </div>
                  )}
                  {goal.nextGoal && (
                    <div className="text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                      <ArrowRight className="w-3 h-3" />
                      <span>Target Lanjutan: {goal.nextGoal}</span>
                    </div>
                  )}
                </div>

                {/* Footer with dates & actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <div>
                    Ditetapkan: {formatIndonesianDate(goal.setDate)} • Review: {formatIndonesianDate(goal.reviewDate)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setGoalToEdit(goal);
                        setIsFormOpen(true);
                      }}
                      className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1 text-rose-700 hover:bg-rose-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Belum ada target LTAD terdaftar</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Tetapkan target perkembangan individual 4–8 minggu untuk mendukung pembinaan jangka panjang.
          </p>
          <button
            onClick={() => {
              setGoalToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tetapkan Target Pertama</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <LtadGoalModal
        isOpen={isFormOpen}
        goalToEdit={goalToEdit}
        defaultPlayerId={selectedPlayerId !== 'all' ? selectedPlayerId : null}
        onClose={() => {
          setIsFormOpen(false);
          setGoalToEdit(null);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Target LTAD"
        message="Apakah Anda yakin ingin menghapus target perkembangan individual LTAD ini?"
        confirmText="Ya, Hapus Target"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
