import React, { useMemo, useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Filter,
  Eye,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  Shield,
  LayoutGrid,
  List,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Player } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { formatIndonesianDate, calculateAge } from '../utils/formatters.ts';
import { PlayerFormModal } from '../components/players/PlayerFormModal.tsx';
import { PlayerDetailModal } from '../components/players/PlayerDetailModal.tsx';
import { PlayerCsvImportModal } from '../components/players/PlayerCsvImportModal.tsx';
import { BackupRestoreModal } from '../components/database/BackupRestoreModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import { safeStorage } from '../utils/safeStorage.ts';

interface PlayersViewProps {
  initialSelectedPlayerId?: string | null;
  onNavigateToVerification?: () => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  initialSelectedPlayerId,
  onNavigateToVerification,
}) => {
  const {
    database,
    players,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    archivePlayer,
    deletePlayer,
    isLoading,
    error,
    refreshData,
    resetData,
    pendingRegistrationsCount,
    syncClientDataToServer,
    restoreAllData,
    restoreOfficial20Players,
    deleteTestPlayers,
  } = useData();

  const { canManagePlayers, isAdmin, reloadUsers } = useAuth();

  // Local cache detection for data recovery
  const [hasLocalCacheToSync, setHasLocalCacheToSync] = useState(false);
  const [cachedPlayersCount, setCachedPlayersCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoringAllData, setIsRestoringAllData] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cachedStr = safeStorage.getItem('cfa_database_cache');
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        // Automatically purge old dummy data cache if present
        if (Array.isArray(parsed.players) && parsed.players.some((p: any) => p && p.id === 'CFA-2026-001')) {
          safeStorage.removeItem('cfa_database_cache');
          setHasLocalCacheToSync(false);
        } else if (Array.isArray(parsed.players) && parsed.players.length > players.length) {
          setHasLocalCacheToSync(true);
          setCachedPlayersCount(parsed.players.length);
        } else {
          setHasLocalCacheToSync(false);
        }
      }
    } catch {
      // ignore
    }
  }, [players.length]);

  const handleDownloadDatabaseJson = () => {
    try {
      const jsonStr = JSON.stringify(database, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `castindo_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSyncSuccessMsg('Berkas cadangan database (.JSON) berhasil diunduh.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (e: any) {
      setSyncErrorMsg(`Gagal mengunduh cadangan: ${e.message}`);
      setTimeout(() => setSyncErrorMsg(null), 4000);
    }
  };

  const handleRecoverCache = async () => {
    setIsSyncing(true);
    setSyncErrorMsg(null);
    try {
      const res = await syncClientDataToServer();
      setSyncSuccessMsg(`Berhasil memulihkan ${res.restoredPlayersCount || 0} pemain ke database server!`);
      setHasLocalCacheToSync(false);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      setSyncErrorMsg(`Gagal menyinkronkan data: ${err.message}`);
      setTimeout(() => setSyncErrorMsg(null), 6000);
    } finally {
      setIsSyncing(false);
    }
  };

  // In-app confirm modal state (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    variant: 'danger',
    onConfirm: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const handleConfirmAction = async () => {
    setIsConfirmLoading(true);
    try {
      await confirmState.onConfirm();
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      setSyncSuccessMsg(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleRestoreAllData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Pulihkan Riwayat Data Tersimpan?',
      message: (
        <div className="space-y-2.5">
          <p className="font-semibold text-gray-800">
            Apakah Anda yakin ingin memulihkan riwayat data yang pernah terdaftar di akademi?
          </p>
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
            <p className="font-bold">Data yang akan dipulihkan dari cadangan riwayat:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Seluruh data pemain & atlet akademi yang sebelumnya pernah terdaftar</li>
              <li>Seluruh akun pengguna / wali murid yang pernah login atau mendaftar</li>
              <li>Akun staf pelatih, nomor pendaftaran resmi, serta keterhubungan atlet</li>
            </ul>
          </div>
          <p className="text-gray-500 text-[11px]">
            Data riwayat akan disinkronkan langsung ke server dan seluruh sesi akun pengguna akan aktif kembali.
          </p>
        </div>
      ),
      confirmText: 'Ya, Pulihkan Riwayat Data',
      variant: 'primary',
      onConfirm: async () => {
        setIsRestoringAllData(true);
        try {
          const res = await restoreAllData();
          await reloadUsers();
          setSyncSuccessMsg(
            `Berhasil memulihkan riwayat data! (${res?.restoredPlayersCount || 0} Pemain, ${res?.restoredUsersCount || 0} Akun Pengguna / Wali Murid).`
          );
          setTimeout(() => setSyncSuccessMsg(null), 6000);
        } catch (err: any) {
          setSyncSuccessMsg(`Gagal memulihkan data: ${err.message}`);
        } finally {
          setIsRestoringAllData(false);
        }
      },
    });
  };

  const hasTestDummyPlayers = useMemo(() => {
    return players.some(
      (p) => p.fullName === 'Ahmad Rizky Pratama' || p.fullName === 'Dimas Maulana'
    );
  }, [players]);

  const handleDeleteTestPlayers = () => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Data Percobaan?',
      message: 'Hapus 2 data pemain uji coba (Ahmad Rizky Pratama & Dimas Maulana) yang sebelumnya terbuat?',
      confirmText: 'Ya, Hapus Data Percobaan',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteTestPlayers();
        setSyncSuccessMsg(`Berhasil membersihkan ${res.count} data pemain uji coba.`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      },
    });
  };

  const handleWipeAllData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Kosongkan Seluruh Data Aplikasi?',
      message: (
        <div className="space-y-2">
          <p className="font-bold text-rose-800">
            PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATA pada aplikasi ini? Seluruh data pemain, pendaftaran wali, dan catatan sesi latihan akan dihapus bersih.
          </p>
          <p className="text-gray-500 text-[11px]">
            Akun Administrator Utama tetap aman. Anda dapat memasukkan kembali berkas cadangan (.JSON) kapan saja.
          </p>
        </div>
      ),
      confirmText: 'Ya, Kosongkan Semua Data',
      variant: 'danger',
      onConfirm: async () => {
        await resetData();
        setSyncSuccessMsg('Seluruh data aplikasi telah berhasil dikosongkan.');
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      },
    });
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [birthYearFilter, setBirthYearFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'birth_desc' | 'id_asc'>('name_asc');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(() => {
    if (initialSelectedPlayerId) {
      return players.find((p) => p.id === initialSelectedPlayerId) || null;
    }
    return null;
  });
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        // Status filter
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        // Team filter
        if (selectedTeamId !== 'all' && p.teamId !== selectedTeamId) return false;
        // Birth year
        if (birthYearFilter !== 'all' && String(p.birthYear) !== birthYearFilter) return false;
        // Position
        if (positionFilter !== 'all' && p.primaryPosition !== positionFilter) return false;
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = p.fullName.toLowerCase().includes(q);
          const matchNick = p.nickname.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          if (!matchName && !matchNick && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
        if (sortBy === 'name_desc') return b.fullName.localeCompare(a.fullName);
        if (sortBy === 'birth_desc') return b.birthDate.localeCompare(a.birthDate);
        return a.id.localeCompare(b.id);
      });
  }, [
    players,
    statusFilter,
    selectedTeamId,
    birthYearFilter,
    positionFilter,
    searchTerm,
    sortBy,
  ]);

  const handleExportCsv = () => {
    if (filteredPlayers.length === 0) return;

    const headers = [
      'Player ID',
      'Nama Lengkap',
      'Nama Panggilan',
      'Tanggal Lahir',
      'Tahun Lahir',
      'Kelompok Tim',
      'Posisi Utama',
      'Posisi Alternatif',
      'Kaki Dominan',
      'Nama Wali',
      'Kontak Wali',
      'Status',
      'Tanggal Bergabung',
    ];

    const rows = filteredPlayers.map((p) => [
      p.id,
      `"${p.fullName}"`,
      `"${p.nickname}"`,
      p.birthDate,
      p.birthYear,
      p.teamId,
      `"${p.primaryPosition}"`,
      `"${p.secondaryPosition || ''}"`,
      p.dominantFoot,
      `"${p.guardianName}"`,
      `"${p.guardianContact}"`,
      p.status,
      p.joinDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `castindo_players_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Permanen Pemain?',
      message: (
        <div className="space-y-2">
          <p>
            Yakin ingin menghapus permanen pemain <strong>{name}</strong> (<span className="font-mono text-rose-700 font-bold">{id}</span>)?
          </p>
          <p className="text-gray-500 text-[11px]">
            Seluruh catatan riwayat presensi, beban latihan, dan evaluasi motorik yang terkait dengan pemain ini juga akan dibersihkan dari server.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus Pemain',
      variant: 'danger',
      onConfirm: async () => {
        await deletePlayer(id);
        setSyncSuccessMsg(`Pemain ${name} (${id}) berhasil dihapus.`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      },
    });
  };

  const handleArchive = async (id: string, currentStatus: string) => {
    const isArchiving = currentStatus === 'active';
    await archivePlayer(id, isArchiving);
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Gagal menyinkronkan data dari server</p>
              <p className="text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Local Cache Recovery Banner */}
      {hasLocalCacheToSync && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Terdeteksi {cachedPlayersCount} Data Pemain Tersimpan di Cache Browser Ini</p>
              <p className="text-amber-700 mt-0.5">
                Data pemain dari sesi sebelumnya dapat dipulihkan dan disinkronkan ke server sekarang tanpa perlu pendaftaran ulang.
              </p>
            </div>
          </div>
          <button
            onClick={handleRecoverCache}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 shrink-0"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Memulihkan Data...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Pulihkan & Simpan ke Server
              </>
            )}
          </button>
        </div>
      )}

      {/* Sync Success Notification */}
      {syncSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{syncSuccessMsg}</span>
        </div>
      )}

      {/* Sync Error Notification */}
      {syncErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold">{syncErrorMsg}</span>
          </div>
          <button type="button" onClick={() => setSyncErrorMsg(null)} className="text-rose-600 hover:text-rose-800 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Pending Registrations Notification for Admins */}
      {pendingRegistrationsCount > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold">
                Terdapat {pendingRegistrationsCount} formulir pendaftaran atlet menunggu verifikasi admin
              </p>
              <p className="text-blue-700 mt-0.5">
                Orang tua telah mengisi pendaftaran atlet. Setelah disetujui di menu Verifikasi Pemain, atlet akan otomatis terbit di database resmi ini.
              </p>
            </div>
          </div>
          {onNavigateToVerification && (
            <button
              onClick={onNavigateToVerification}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <span>Buka Menu Verifikasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Active Filter Helper Banner */}
      {players.length > 0 &&
        (selectedTeamId !== 'all' ||
          birthYearFilter !== 'all' ||
          positionFilter !== 'all' ||
          statusFilter !== 'all' ||
          searchTerm.trim()) && (
          <div className="px-3.5 py-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Menampilkan <strong>{filteredPlayers.length}</strong> dari total <strong>{players.length}</strong> atlet di database.
                {selectedTeamId !== 'all' && (
                  <span className="ml-1 text-emerald-800 font-semibold">
                    (Kelompok: {teams.find((t) => t.id === selectedTeamId)?.name || selectedTeamId})
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedTeamId('all');
                setStatusFilter('active');
                setBirthYearFilter('all');
                setPositionFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
            >
              Reset & Tampilkan Semua Tim ({players.length})
            </button>
          </div>
        )}

      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama lengkap, panggilan, atau Player ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={handleDownloadDatabaseJson}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
              title="Unduh seluruh database akademi saat ini sebagai file cadangan JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Cadangan (.JSON)</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
              title="Memasukkan / Mengunggah berkas cadangan data (.JSON)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-300" />
              <span>Masukkan Cadangan (.JSON)</span>
            </button>
          )}

          {canManagePlayers && (
            <>
              <button
                onClick={() => setIsCsvImportOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
                title="Impor pemain dalam format CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Impor CSV</span>
              </button>

              <button
                onClick={() => {
                  setPlayerToEdit(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pemain</span>
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={handleWipeAllData}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Kosongkan seluruh data pemain, pendaftaran, dan catatan di aplikasi"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Data</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={filteredPlayers.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
            title="Unduh data pemain terfilter sebagai CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Grid vs Table view toggle */}
          <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 text-xs ${
                viewMode === 'table' ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-gray-500'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 text-xs ${
                viewMode === 'grid' ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-gray-500'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Status Tab */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Aktif ({players.filter((p) => p.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'archived' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Arsip ({players.filter((p) => p.status === 'archived').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Semua ({players.length})
            </button>
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold"
          >
            <option value="all">Semua Tim</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Birth Year */}
          <select
            value={birthYearFilter}
            onChange={(e) => setBirthYearFilter(e.target.value)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Kelahiran</option>
            <option value="2016">2016 (U-9)</option>
            <option value="2017">2017 (U-8)</option>
            <option value="2015">2015</option>
          </select>

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium"
          >
            <option value="all">Semua Posisi 7v7</option>
            <option value="Kiper">Kiper</option>
            <option value="Bek Tengah">Bek Tengah</option>
            <option value="Bek Sayap Kanan">Bek Sayap Kanan</option>
            <option value="Bek Sayap Kiri">Bek Sayap Kiri</option>
            <option value="Gelandang">Gelandang</option>
            <option value="Penyerang Sayap">Penyerang Sayap</option>
            <option value="Penyerang Tengah">Penyerang Tengah</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-gray-400">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium"
          >
            <option value="name_asc">Nama (A-Z)</option>
            <option value="name_desc">Nama (Z-A)</option>
            <option value="birth_desc">Tahun Lahir (Termuda)</option>
            <option value="id_asc">Player ID</option>
          </select>
        </div>
      </div>

      {/* Players Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-2xs">
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-bold text-gray-800">Menyinkronkan Database Pemain dari Server...</p>
            <p className="text-xs text-gray-500">Memuat profil atlet dan rekam jejak akademi secara aman.</p>
          </div>
          <div className="space-y-2.5 animate-pulse pt-4 border-t border-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
            ))}
          </div>
        </div>
      ) : filteredPlayers.length > 0 ? (
        viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Player ID</th>
                    <th className="px-4 py-3">Nama Lengkap & Panggilan</th>
                    <th className="px-4 py-3">Kelahiran (Usia)</th>
                    <th className="px-4 py-3">Tim & Posisi 7v7</th>
                    <th className="px-4 py-3">Kaki</th>
                    <th className="px-4 py-3">Wali / Kontak</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPlayers.map((player) => {
                    const age = calculateAge(player.birthDate);
                    const team = teams.find((t) => t.id === player.teamId);
                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPlayerForDetail(player)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {player.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {player.photoUrl ? (
                              <img
                                src={player.photoUrl}
                                alt={player.fullName}
                                className="w-8 h-8 rounded-xl object-cover border border-emerald-500/50 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {player.nickname ? player.nickname.charAt(0).toUpperCase() : player.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900">{player.fullName}</span>
                                {player.jerseyNumber !== undefined && (
                                  <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded text-[10px] font-mono font-black border border-emerald-300">
                                    #{player.jerseyNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500">"{player.nickname}"</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-gray-800">{player.birthYear}</div>
                          <div className="text-[11px] text-gray-500">{age.text}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-gray-800">{player.primaryPosition}</div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            {team?.code === 'TIM_B' ? 'Tim B' : 'Tim A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              player.dominantFoot === 'Kiri'
                                ? 'bg-purple-100 text-purple-800'
                                : player.dominantFoot === 'Keduanya'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {player.dominantFoot}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-gray-800 font-medium">{player.guardianName}</div>
                          <div className="text-[10px] text-gray-400">({player.guardianRelation})</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              player.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {player.status === 'active' ? 'Aktif' : 'Arsip'}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right whitespace-nowrap space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedPlayerForDetail(player)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100"
                            title="Lihat Profil Komprehensif"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManagePlayers && (
                            <>
                              <button
                                onClick={() => {
                                  setPlayerToEdit(player);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100"
                                title="Edit Pemain"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchive(player.id, player.status)}
                                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100"
                                title={player.status === 'active' ? 'Arsipkan Pemain' : 'Pulihkan'}
                              >
                                {player.status === 'active' ? (
                                  <Archive className="w-3.5 h-3.5" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(player.id, player.fullName)}
                                className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100"
                                title="Hapus Permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => {
              const age = calculateAge(player.birthDate);
              const team = teams.find((t) => t.id === player.teamId);
              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayerForDetail(player)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {(player.nickname || player.fullName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-sm">{player.fullName}</span>
                          {player.jerseyNumber !== undefined && (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded text-[10px] font-mono font-black border border-emerald-300">
                              #{player.jerseyNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {player.id} • "{player.nickname}"
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        player.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {player.status === 'active' ? 'Aktif' : 'Arsip'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Posisi 7v7</span>
                      <span className="font-bold text-gray-800">{player.primaryPosition}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Kelahiran (Usia)</span>
                      <span className="font-bold text-gray-800">
                        {player.birthYear} ({age.years} thn)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Kelompok Tim</span>
                      <span className="font-bold text-emerald-800">{team?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Kaki Dominan</span>
                      <span className="font-bold text-gray-800">{player.dominantFoot}</span>
                    </div>
                  </div>

                  {player.individualTarget && (
                    <div className="p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 line-clamp-2">
                      <strong className="text-gray-700">Target:</strong> {player.individualTarget}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">Bergabung: {formatIndonesianDate(player.joinDate)}</span>
                    <div className="flex items-center gap-1">
                      {canManagePlayers && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayerToEdit(player);
                              setIsFormOpen(true);
                            }}
                            className="p-1 rounded text-blue-700 hover:bg-blue-50"
                            title="Edit Pemain"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(player.id, player.status);
                            }}
                            className="p-1 rounded text-amber-700 hover:bg-amber-50"
                            title={player.status === 'active' ? 'Arsipkan Pemain' : 'Pulihkan'}
                          >
                            {player.status === 'active' ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(player.id, player.fullName);
                            }}
                            className="p-1 rounded text-rose-700 hover:bg-rose-50"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlayerForDetail(player);
                        }}
                        className="font-bold text-emerald-700 hover:text-emerald-800 ml-1"
                      >
                        Lihat Rapor →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-2xs">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">
            {players.length === 0 ? 'Database Pemain Belum Terisi' : 'Tidak Ada Pemain yang Sesuai Filter'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
            {players.length === 0
              ? 'Belum ada data pemain resmi di database server. Pemain baru dapat ditambahkan melalui verifikasi formulir pendaftaran orang tua, penambahan manual, atau impor CSV.'
              : `Terdapat ${players.length} atlet di database, tetapi tidak ada yang cocok dengan kriteria filter saat ini.`}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {players.length > 0 ? (
              <button
                onClick={() => {
                  setSelectedTeamId('all');
                  setStatusFilter('active');
                  setBirthYearFilter('all');
                  setPositionFilter('all');
                  setSearchTerm('');
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan Seluruh {players.length} Pemain</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setPlayerToEdit(null);
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pemain Baru</span>
                </button>
                <button
                  onClick={() => setIsCsvImportOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 border border-gray-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Impor CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <PlayerFormModal
        isOpen={isFormOpen}
        playerToEdit={playerToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setPlayerToEdit(null);
        }}
        onSaved={(saved) => {
          setSelectedPlayerForDetail(saved);
        }}
      />

      <PlayerDetailModal
        player={selectedPlayerForDetail}
        isOpen={Boolean(selectedPlayerForDetail)}
        onClose={() => setSelectedPlayerForDetail(null)}
        onEdit={(p) => {
          setSelectedPlayerForDetail(null);
          setPlayerToEdit(p);
          setIsFormOpen(true);
        }}
      />

      <PlayerCsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={() => setSyncSuccessMsg('Data cadangan berhasil dipulihkan ke aplikasi!')}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        isLoading={isConfirmLoading}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
