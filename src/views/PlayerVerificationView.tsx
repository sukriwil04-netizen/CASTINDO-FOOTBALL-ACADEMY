import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
  Eye,
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { PlayerRegistration, RegistrationStatus } from '../types/database.ts';
import { RegistrationDetailModal } from '../components/registration/RegistrationDetailModal.tsx';
import { calculateAgeGroup } from '../utils/ageGroup.ts';

interface PlayerVerificationViewProps {
  onOpenRegistrationForm?: () => void;
}

export const PlayerVerificationView: React.FC<PlayerVerificationViewProps> = ({
  onOpenRegistrationForm,
}) => {
  const { registrations, refreshData, isLoading, approveRegistration } = useData();

  const [activeTab, setActiveTab] = useState<RegistrationStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<PlayerRegistration | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickApprove = async (e: React.MouseEvent, reg: PlayerRegistration) => {
    e.stopPropagation();
    setApprovingId(reg.id);
    setErrorMessage(null);
    try {
      const ageCalc = reg.birthDate ? calculateAgeGroup(reg.birthDate) : null;
      const teamId = reg.assignedTeamId || ageCalc?.recommendedTeamId || 'team-b';
      await approveRegistration(reg.id, {
        teamId,
        adminNotes: 'Terverifikasi memenuhi kriteria kelompok usia akademi CFA',
        reviewerName: 'Mohammad Wildan Kemal Pasha',
        overrideDuplicate: true,
      });
      await refreshData();
      setSuccessToast(`Pemain "${reg.fullName}" berhasil diverifikasi memenuhi kriteria dan Player ID resmi telah diterbitkan!`);
      setTimeout(() => setSuccessToast(null), 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memverifikasi pemain');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setApprovingId(null);
    }
  };

  // Registration URL to share
  const registrationUrl = typeof window !== 'undefined' ? `${window.location.origin}/?tab=registration` : '/?tab=registration';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Counts
  const counts = useMemo(() => {
    return {
      all: registrations.length,
      pending: registrations.filter((r) => r.status === 'pending').length,
      needs_revision: registrations.filter((r) => r.status === 'needs_revision').length,
      approved: registrations.filter((r) => r.status === 'approved').length,
      rejected: registrations.filter((r) => r.status === 'rejected').length,
    };
  }, [registrations]);

  // Filtered registrations
  const filteredList = useMemo(() => {
    return registrations.filter((reg) => {
      // Status filter
      if (activeTab !== 'all' && reg.status !== activeTab) {
        return false;
      }
      // Position filter
      if (selectedPosition !== 'all' && reg.primaryPosition !== selectedPosition) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = reg.fullName.toLowerCase().includes(q);
        const matchNick = reg.nickname?.toLowerCase().includes(q);
        const matchNum = reg.registrationNumber?.toLowerCase().includes(q);
        const matchSchool = reg.school?.toLowerCase().includes(q);
        const matchPos = reg.primaryPosition?.toLowerCase().includes(q);
        return matchName || matchNick || matchNum || matchSchool || matchPos;
      }
      return true;
    });
  }, [registrations, activeTab, selectedPosition, searchQuery]);

  // List of unique positions
  const positions = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      if (r.primaryPosition) set.add(r.primaryPosition);
    });
    return Array.from(set);
  }, [registrations]);

  const handleOpenDetail = (reg: PlayerRegistration) => {
    setSelectedRegistration(reg);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Manajemen Pendaftaran Mandiri
            </span>
            {counts.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 animate-pulse">
                {counts.pending} Perlu Diverifikasi
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
            Verifikasi Data Pemain
          </h1>
          <p className="text-emerald-100/90 text-sm max-w-2xl mt-1">
            Tinjau formulir pendaftaran mandiri yang diisi oleh calon pemain, lakukan pengecekan data ganda, dan terbitkan Player ID resmi untuk masuk ke Tim A atau Tim B.
          </p>
        </div>

        {/* Share Public Form Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs border border-white/20 transition flex items-center justify-center gap-2 shadow-xs"
            title="Salin tautan formulir pendaftaran mandiri untuk dibagikan ke calon pemain atau orang tua"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-200" />}
            {isCopied ? 'Tautan Disalin!' : 'Salin Tautan Formulir HP'}
          </button>

          {onOpenRegistrationForm && (
            <button
              onClick={onOpenRegistrationForm}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Formulir Pemain
            </button>
          )}

          <button
            onClick={() => refreshData()}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-300 shadow-md'
              : 'bg-white border-gray-200 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Menunggu Verifikasi</span>
            <span className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{counts.pending}</div>
          <p className="text-[11px] text-blue-600 mt-0.5">Antrean pengajuan baru</p>
        </div>

        <div
          onClick={() => setActiveTab('needs_revision')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'needs_revision'
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-md'
              : 'bg-white border-gray-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Perlu Perbaikan</span>
            <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{counts.needs_revision}</div>
          <p className="text-[11px] text-amber-600 mt-0.5">Menunggu revisi pemain</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300 shadow-md'
              : 'bg-white border-gray-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Disetujui</span>
            <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{counts.approved}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Aktif di database utama</p>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-red-50/90 border-red-400 ring-2 ring-red-300 shadow-md'
              : 'bg-white border-gray-200 hover:border-red-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800">Ditolak</span>
            <span className="p-1.5 bg-red-100 rounded-lg text-red-700">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-red-950 mt-2">{counts.rejected}</div>
          <p className="text-[11px] text-red-600 mt-0.5">Tidak memenuhi syarat</p>
        </div>
      </div>

      {/* Notification Toast Banners */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-900 font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-red-900 font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-950 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Filter Tabs and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-4">
        {/* Navigation Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semua Pengajuan
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'all' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-blue-50'
            }`}
          >
            Menunggu Verifikasi
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'pending' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('needs_revision')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'needs_revision'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            Perlu Perbaikan
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'needs_revision' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {counts.needs_revision}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-emerald-50'
            }`}
          >
            Disetujui
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-red-50'
            }`}
          >
            Ditolak
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'rejected' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'}`}>
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Search & Position Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama lengkap, panggilan, nomor registrasi, atau sekolah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Posisi</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Registrations List */}
        {isLoading ? (
          <div className="py-12 px-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
            <div className="flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-gray-800">Memuat berkas pendaftaran atlet dari server...</p>
              <p className="text-xs text-gray-500">Memverifikasi pengajuan pendaftaran mandiri orang tua/wali murid.</p>
            </div>
            <div className="space-y-3 animate-pulse pt-6 mt-4 border-t border-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl w-full" />
              ))}
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">Tidak ada data pendaftaran</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `Tidak ditemukan pendaftaran yang cocok dengan "${searchQuery}".`
                : activeTab === 'pending'
                ? 'Bagus sekali! Tidak ada pengajuan baru yang menunggu verifikasi saat ini.'
                : 'Belum ada data pendaftaran pada kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden">
            {filteredList.map((reg) => (
              <div
                key={reg.id}
                onClick={() => handleOpenDetail(reg)}
                className="p-4 hover:bg-gray-50 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Player Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-sm shrink-0 overflow-hidden shadow-2xs">
                    {reg.photoUrl ? (
                      <img src={reg.photoUrl} alt={reg.fullName} className="w-full h-full object-cover" />
                    ) : (
                      reg.nickname?.substring(0, 2).toUpperCase() || 'PL'
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 truncate">
                        {reg.fullName}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        ({reg.nickname})
                      </span>
                      <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {reg.registrationNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>Lahir: <strong className="text-gray-700">{reg.birthDate}</strong> ({reg.birthYear})</span>
                      <span>•</span>
                      <span>Posisi: <strong className="text-emerald-700">{reg.primaryPosition}</strong> ({reg.dominantFoot})</span>
                      <span>•</span>
                      <span>Sekolah: <strong className="text-gray-700">{reg.school}</strong></span>
                    </div>

                    {/* Duplicate Indicator */}
                    {reg.duplicateWarning?.isDuplicate && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Potensi Data Ganda: ID {reg.duplicateWarning.matchedPlayerId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status & Action Button */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-right">
                    {reg.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Disetujui ({reg.approvedPlayerId})
                      </span>
                    )}
                    {reg.status === 'needs_revision' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Perlu Perbaikan
                      </span>
                    )}
                    {reg.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <XCircle className="w-3.5 h-3.5" />
                        Ditolak
                      </span>
                    )}
                    {reg.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu Verifikasi
                      </span>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(reg.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(reg.status === 'pending' || reg.status === 'needs_revision') && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickApprove(e, reg)}
                        disabled={approvingId === reg.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        title="Verifikasi langsung bahwa pemain memenuhi kriteria dan terbitkan Player ID"
                      >
                        {approvingId === reg.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verifikasi Pemain</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(reg);
                      }}
                      className="p-2 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition"
                      title="Buka Formulir Lengkap"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail & Verification Modal */}
      <RegistrationDetailModal
        registration={selectedRegistration}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRegistration(null);
        }}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
};
