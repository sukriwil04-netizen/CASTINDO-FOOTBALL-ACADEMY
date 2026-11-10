import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  User,
  Shield,
  Calendar,
  MapPin,
  School,
  Activity,
  Award,
  Clock,
  Edit3,
  Save,
} from 'lucide-react';
import { PlayerRegistration } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { calculateAgeGroup } from '../../utils/ageGroup.ts';

interface RegistrationDetailModalProps {
  registration: PlayerRegistration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationDetailModal: React.FC<RegistrationDetailModalProps> = ({
  registration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { teams, approveRegistration, rejectRegistration, requestRevisionRegistration, updateRegistration } = useData();
  const { currentUser } = useAuth();

  // Mode: 'view' | 'edit' | 'approve' | 'revision' | 'reject'
  const [activeAction, setActiveAction] = useState<'none' | 'approve' | 'revision' | 'reject' | 'edit'>('none');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-b');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [overrideDuplicate, setOverrideDuplicate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: '',
    nickname: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    address: '',
    school: '',
    schoolGrade: '',
    primaryPosition: '',
    secondaryPosition: '',
    dominantFoot: 'Kanan' as 'Kanan' | 'Kiri' | 'Keduanya',
    playingExperience: '',
    previousClub: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (registration) {
      setEditForm({
        fullName: registration.fullName || '',
        nickname: registration.nickname || '',
        birthPlace: registration.birthPlace || '',
        birthDate: registration.birthDate || '',
        gender: registration.gender || 'Laki-laki',
        address: registration.address || '',
        school: registration.school || '',
        schoolGrade: registration.schoolGrade || '',
        primaryPosition: registration.primaryPosition || '',
        secondaryPosition: registration.secondaryPosition || '',
        dominantFoot: registration.dominantFoot || 'Kanan',
        playingExperience: registration.playingExperience || '',
        previousClub: registration.previousClub || '',
        additionalNotes: registration.additionalNotes || '',
      });
      const recTeamId = registration.assignedTeamId || (registration.birthDate ? calculateAgeGroup(registration.birthDate)?.recommendedTeamId : undefined) || 'team-b';
      setSelectedTeamId(recTeamId);
      setAdminNotes(registration.adminNotes || 'Terverifikasi memenuhi kriteria kelompok usia akademi CFA');
      setActiveAction('none');
      setOverrideDuplicate(true);
      setErrorMessage(null);
    }
  }, [registration, isOpen]);

  if (!isOpen || !registration) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    const ageCalc = registration.birthDate ? calculateAgeGroup(registration.birthDate) : null;
    const targetTeamId = selectedTeamId || registration.assignedTeamId || ageCalc?.recommendedTeamId || 'team-b';
    try {
      await approveRegistration(registration.id, {
        teamId: targetTeamId,
        adminNotes: adminNotes.trim() || 'Terverifikasi memenuhi kriteria kelompok usia akademi CFA',
        reviewerName: currentUser?.name || 'Mohammad Wildan Kemal Pasha',
        overrideDuplicate: true,
      });
      setActiveAction('none');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyetujui pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      setErrorMessage('Harap masukkan alasan penolakan.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await rejectRegistration(registration.id, {
        reason: adminNotes.trim(),
        reviewerName: currentUser?.name || 'Staf Admin CFA',
      });
      setActiveAction('none');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menolak pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!adminNotes.trim()) {
      setErrorMessage('Harap masukkan catatan bagian data yang perlu diperbaiki oleh pemain.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestRevisionRegistration(registration.id, {
        notes: adminNotes.trim(),
        reviewerName: currentUser?.name || 'Staf Admin CFA',
      });
      setActiveAction('none');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim permintaan perbaikan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await updateRegistration(registration.id, {
        ...editForm,
        birthYear: editForm.birthDate ? new Date(editForm.birthDate).getFullYear() : registration.birthYear,
      });
      setActiveAction('none');
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = () => {
    switch (registration.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            Disetujui
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <RotateCcw className="w-3.5 h-3.5" />
            Perlu Perbaikan
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-emerald-850 to-green-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">
                  {registration.registrationNumber}
                </span>
                {statusBadge()}
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Verifikasi Pendaftaran: {registration.fullName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Perhatian</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Duplicate Detection Warning Banner */}
          {registration.duplicateWarning?.isDuplicate && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-sm flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  Peringatan Potensi Data Ganda Terdeteksi!
                </p>
                <p className="text-amber-800 text-xs sm:text-sm">
                  {registration.duplicateWarning.message ||
                    `Ditemukan pemain dengan nama "${registration.fullName}" dan tanggal lahir yang sama sudah terdaftar di database utama.`}
                </p>
                <p className="text-xs text-amber-700">
                  ID Pemain Terdaftar: <span className="font-mono font-bold">{registration.duplicateWarning.matchedPlayerId}</span>
                </p>
              </div>
            </div>
          )}

          {/* Approved Info Banner */}
          {registration.status === 'approved' && registration.approvedPlayerId && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Telah Disetujui & Masuk Database Utama</p>
                <p className="text-xs text-emerald-700">
                  Player ID Resmi:{' '}
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    {registration.approvedPlayerId}
                  </span>{' '}
                  • Ditinjau oleh {registration.reviewerName || 'Staf Admin'} pada{' '}
                  {registration.reviewedAt ? new Date(registration.reviewedAt).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
          )}

          {/* Action Panels */}
          {activeAction === 'approve' && (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <h3 className="font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Formulir Persetujuan & Penempatan Tim
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Batal
                </button>
              </div>

              {/* Criteria Verified Notice */}
              <div className="p-3 bg-emerald-100/90 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900">Pemain Memenuhi Kriteria Akademi:</p>
                  <p className="text-emerald-800 mt-0.5">
                    Data usia ({registration.birthYear}), posisi utama ({registration.primaryPosition}), dan identitas atlet telah divalidasi resmi oleh Administrator CFA.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                  Tentukan Tim Penempatan Pemain *
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.ageGroup})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-emerald-700 mt-1">
                  Pemain akan langsung terhubung ke jadwal sesi latihan, presensi kehadiran, training load, dan evaluasi tim yang dipilih.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
                  Catatan Verifikasi / Pesan Pelatih (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Terverifikasi memenuhi kriteria kelompok usia Tim B, direkomendasikan latihan perdana hari Kamis."
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Konfirmasi & Terbitkan Player ID
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeAction === 'revision' && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="font-bold text-amber-950 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  Minta Perbaikan Data ke Pemain
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="text-xs text-amber-800 hover:underline"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                  Catatan Perbaikan yang Perlu Direvisi *
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Mohon perjelas sekolah dan foto profil terbaru dengan resolusi jelas."
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-amber-700 mt-1">
                  Catatan ini akan dapat dilihat oleh pemain saat mengecek status formulirnya agar dapat segera diperbaiki.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRequestRevision}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Catatan Perbaikan'}
                </button>
              </div>
            </div>
          )}

          {activeAction === 'reject' && (
            <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-red-200 pb-3">
                <h3 className="font-bold text-red-950 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Tolak Pengajuan Pendaftaran
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="text-xs text-red-700 hover:underline"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-red-900 uppercase tracking-wider mb-1.5">
                  Alasan Penolakan *
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Usia pemain belum memenuhi kelompok umur yang dibuka saat ini."
                  className="w-full px-3.5 py-2.5 bg-white border border-red-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? 'Memproses...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {activeAction === 'edit' ? (
            <div className="space-y-4 border rounded-2xl p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  Koreksi Data Pengajuan (Kewenangan Staf)
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Batal Koreksi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={editForm.birthPlace}
                    onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sekolah</label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={editForm.schoolGrade}
                    onChange={(e) => setEditForm({ ...editForm, schoolGrade: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Posisi Utama</label>
                  <input
                    type="text"
                    value={editForm.primaryPosition}
                    onChange={(e) => setEditForm({ ...editForm, primaryPosition: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Posisi Alternatif</label>
                  <input
                    type="text"
                    value={editForm.secondaryPosition}
                    onChange={(e) => setEditForm({ ...editForm, secondaryPosition: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kaki Dominan</label>
                  <select
                    value={editForm.dominantFoot}
                    onChange={(e) => setEditForm({ ...editForm, dominantFoot: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  >
                    <option value="Kanan">Kanan</option>
                    <option value="Kiri">Kiri</option>
                    <option value="Keduanya">Keduanya</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Domisili</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('none')}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </div>
          ) : null}

          {/* Data Cards View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bagian A: Identitas Pemain */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-200">
                <User className="w-4 h-4 text-emerald-600" />
                A. Identitas Pemain
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 text-lg font-bold overflow-hidden shrink-0">
                  {registration.photoUrl ? (
                    <img src={registration.photoUrl} alt={registration.fullName} className="w-full h-full object-cover" />
                  ) : (
                    registration.nickname?.substring(0, 2).toUpperCase() || 'PL'
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-gray-900 leading-tight">
                    {registration.fullName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Panggilan: <span className="font-semibold text-gray-700">{registration.nickname}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Gender: <span className="font-semibold text-gray-700">{registration.gender || 'Laki-laki'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    Tempat, Tgl Lahir:{' '}
                    <strong className="text-gray-800">
                      {registration.birthPlace || '-'}, {registration.birthDate} (Tahun {registration.birthYear})
                    </strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    Alamat Domisili: <strong className="text-gray-800">{registration.address || '-'}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <School className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    Sekolah & Kelas:{' '}
                    <strong className="text-gray-800">
                      {registration.school || '-'} ({registration.schoolGrade || '-'})
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian B: Informasi Sepak Bola */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-200">
                <Activity className="w-4 h-4 text-emerald-600" />
                B. Informasi Sepak Bola
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200/60">
                  <span className="text-gray-500">Posisi Utama:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {registration.primaryPosition}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200/60">
                  <span className="text-gray-500">Posisi Alternatif:</span>
                  <span className="font-semibold text-gray-800">
                    {registration.secondaryPosition || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200/60">
                  <span className="text-gray-500">Kaki Dominan:</span>
                  <span className="font-semibold text-gray-800">{registration.dominantFoot}</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200/60">
                  <span className="text-gray-500">Pengalaman Bermain:</span>
                  <span className="font-semibold text-gray-800">{registration.playingExperience || '-'}</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200/60">
                  <span className="text-gray-500">Klub / SSB Sebelumnya:</span>
                  <span className="font-semibold text-gray-800">{registration.previousClub || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian C: Informasi Tambahan & Catatan */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-1 border-b border-gray-200">
              <Award className="w-4 h-4 text-emerald-600" />
              C. Keterangan Tambahan & Riwayat
            </div>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">
              {registration.additionalNotes || 'Tidak ada keterangan tambahan yang dicantumkan.'}
            </p>

            {registration.adminNotes && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <span className="font-bold">Catatan Staf/Pelatih:</span> {registration.adminNotes}
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t">
            <span>Dikirim pada: {new Date(registration.createdAt).toLocaleString('id-ID')}</span>
            <span>Terakhir diperbarui: {new Date(registration.updatedAt).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeAction === 'none' && (
              <button
                type="button"
                onClick={() => setActiveAction('edit')}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                Koreksi Data
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeAction === 'none' && (
              <>
                {registration.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setActiveAction('reject')}
                    className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    Tolak
                  </button>
                )}

                {registration.status !== 'needs_revision' && registration.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => setActiveAction('revision')}
                    className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    Minta Perbaikan
                  </button>
                )}

                {registration.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => setActiveAction('approve')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Setujui & Buat Profil Pemain
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
