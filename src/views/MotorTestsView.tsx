import React, { useMemo, useState } from 'react';
import {
  Zap,
  Plus,
  Calendar,
  User,
  Trash2,
  Edit,
  TrendingUp,
  Filter,
  Info,
  Clock,
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { MotorTest, MotorTestResult } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { formatIndonesianDate } from '../utils/formatters.ts';
import { MotorResultModal } from '../components/motor/MotorResultModal.tsx';
import { MotorTestEditModal } from '../components/settings/MotorTestEditModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';

export const MotorTestsView: React.FC = () => {
  const {
    motorTests,
    motorTestResults,
    players,
    activePlayers,
    teams,
    deleteMotorTestResult,
    togglePublishMotorTestResult,
  } = useData();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [selectedTestId, setSelectedTestId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [resultToEdit, setResultToEdit] = useState<MotorTestResult | null>(null);

  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [protocolToEdit, setProtocolToEdit] = useState<MotorTest | null>(null);

  const filteredResults = useMemo(() => {
    return motorTestResults
      .filter((r) => {
        if (selectedPlayerId !== 'all' && r.playerId !== selectedPlayerId) return false;
        if (selectedTestId !== 'all' && r.testId !== selectedTestId) return false;

        const player = players.find((p) => p.id === r.playerId);
        if (selectedTeamId !== 'all' && player?.teamId !== selectedTeamId) return false;

        if (publishFilter === 'published' && r.publishedToParents === false) return false;
        if (publishFilter === 'draft' && r.publishedToParents !== false) return false;

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [motorTestResults, selectedPlayerId, selectedTestId, selectedTeamId, publishFilter, players]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Catatan Tes Fisik',
      message: 'Apakah Anda yakin ingin menghapus catatan hasil tes fisik ini secara permanen?',
      confirmText: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        await deleteMotorTestResult(id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTogglePublish = async (id: string, currentStatus?: boolean) => {
    const nextStatus = currentStatus === false;
    await togglePublishMotorTestResult(id, nextStatus);
  };

  const handleBatchPublishFiltered = () => {
    const draftIds = filteredResults
      .filter((r) => r.publishedToParents === false)
      .map((r) => r.id);

    if (draftIds.length === 0) {
      setInfoToast('Semua hasil tes dalam tampilan ini sudah dipublikasikan ke orang tua.');
      setTimeout(() => setInfoToast(null), 4000);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Publikasikan ke Dashboard Wali',
      message: `Publikasikan ${draftIds.length} hasil tes fisik ke akun orang tua/wali murid sekarang?`,
      confirmText: `Publikasikan (${draftIds.length} Hasil)`,
      variant: 'primary',
      onConfirm: async () => {
        for (const id of draftIds) {
          await togglePublishMotorTestResult(id, true);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setInfoToast(`Berhasil mempublikasikan ${draftIds.length} hasil tes fisik ke orang tua!`);
        setTimeout(() => setInfoToast(null), 4000);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Educational Guideline Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-xs text-emerald-950">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">
            Standar Pengujian Performa Fisik Sepak Bola Kelompok Umur
          </div>
          <p className="text-emerald-900/90 leading-relaxed text-[11px]">
            Pengukuran fisik mencakup kecepatan (Sprint 20m), akselerasi (Sprint 10m), kelincahan (Illinois Agility), daya ledak (Standing Broad Jump), daya tahan (Yo-Yo Test), dan kelentukan (Sit & Reach). Hasil tes baru berstatus draft internal sampai pelatih siap memublikasikannya ke orang tua.
          </p>
        </div>
      </div>

      {/* Protocol Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {motorTests.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTestId(selectedTestId === t.id ? 'all' : t.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1 relative group ${
              selectedTestId === t.id
                ? 'bg-emerald-900 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedTestId === t.id ? 'text-emerald-300' : 'text-gray-400'}`}>
                {t.category}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${selectedTestId === t.id ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                {t.unit}
              </span>
            </div>
            <div className="font-black text-xs leading-snug truncate">{t.name}</div>
          </div>
        ))}
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Atlet ({motorTestResults.length})</option>
            {activePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.id})
              </option>
            ))}
          </select>

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
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Status: Semua Publikasi</option>
            <option value="published">Hanya Dipublikasikan ke Wali</option>
            <option value="draft">Hanya Draft Internal Pelatih</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleBatchPublishFiltered}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors"
            title="Publikasikan semua hasil yang difilter ke orang tua"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Publikasikan ke Wali</span>
          </button>

          <button
            onClick={() => {
              setResultToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Tes Fisik Baru</span>
          </button>
        </div>
      </div>

      {/* Results History List */}
      {filteredResults.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
            <span>Riwayat Pengukuran Fisik Terstruktur</span>
            <span className="text-[11px] text-gray-400 font-normal">
              {filteredResults.length} Pengukuran Terekam
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredResults.map((result) => {
              const player = players.find((p) => p.id === result.playerId);
              const test = motorTests.find((t) => t.id === result.testId);
              const isPublished = result.publishedToParents !== false;

              // Check if player has an earlier result on this test to compute progress
              const previousResults = motorTestResults
                .filter(
                  (r) =>
                    r.playerId === result.playerId &&
                    r.testId === result.testId &&
                    r.date < result.date
                )
                .sort((a, b) => b.date.localeCompare(a.date));

              const baseline = previousResults[previousResults.length - 1]; // earliest
              let diffText = null;
              if (baseline) {
                const diff = result.numericValue - baseline.numericValue;
                const isImprovement = test?.higherIsBetter ? diff > 0 : diff < 0;
                diffText = {
                  val: Math.abs(diff).toFixed(2),
                  improved: isImprovement,
                };
              }

              return (
                <div
                  key={result.id}
                  className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Player & Test info */}
                  <div className="flex items-center space-x-3 min-w-56">
                    {player?.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player?.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {player?.nickname ? player.nickname.charAt(0).toUpperCase() : <User className="w-5 h-5 text-gray-400" />}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-xs sm:text-sm">
                        {player?.fullName || result.playerId}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {player?.id} · Lahir {player?.birthYear} · {player?.primaryPosition}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Test name and details */}
                  <div className="flex-1 min-w-48 space-y-0.5">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{test?.name || result.testId}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({test?.category})
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Tanggal: <strong>{formatIndonesianDate(result.date)}</strong> · Penguji: {result.testerName}
                    </div>
                    {result.notes && (
                      <p className="text-[11px] text-gray-600 italic">"{result.notes}"</p>
                    )}
                  </div>

                  {/* Right: Metric result, publication badge & Actions */}
                  <div className="flex items-center space-x-4">
                    {/* Publication Status Toggle Button */}
                    <button
                      onClick={() => handleTogglePublish(result.id, isPublished)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title="Klik untuk mengubah status publikasi ke orang tua"
                    >
                      {isPublished ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Publik ke Wali</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-amber-600" />
                          <span>Draft Internal</span>
                        </>
                      )}
                    </button>

                    <div className="text-right min-w-28">
                      <span className="text-base font-black text-gray-900 font-mono">
                        {result.numericValue} <span className="text-xs text-gray-500 font-bold">{result.unit}</span>
                      </span>

                      {diffText && (
                        <div
                          className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                            diffText.improved ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            {diffText.improved ? 'Kemajuan: ' : 'Selisih: '}
                            {diffText.val} {result.unit}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setResultToEdit(result);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg"
                        title="Edit Hasil"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg"
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
        </div>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
          <Zap className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold text-gray-800">Belum ada hasil tes fisik yang cocok dengan filter</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Pilih filter lain atau catat pengukuran tes fisik baru untuk atlet.
          </p>
          <button
            onClick={() => {
              setResultToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Hasil Tes Fisik</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      <MotorResultModal
        isOpen={isFormOpen}
        resultToEdit={resultToEdit}
        defaultPlayerId={selectedPlayerId !== 'all' ? selectedPlayerId : null}
        onClose={() => {
          setIsFormOpen(false);
          setResultToEdit(null);
        }}
      />

      {/* Protocol Edit Modal */}
      <MotorTestEditModal
        isOpen={isProtocolModalOpen}
        testToEdit={protocolToEdit}
        onClose={() => {
          setIsProtocolModalOpen(false);
          setProtocolToEdit(null);
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant || 'danger'}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {infoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{infoToast}</span>
        </div>
      )}
    </div>
  );
};
