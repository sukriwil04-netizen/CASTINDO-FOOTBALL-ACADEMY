import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  ShieldAlert,
  User,
  MapPin,
  School,
  Phone,
  FileText,
  Save,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Player } from '../../types/database.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import {
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_LABEL,
  formatFileSize,
  processAndCompressImage,
} from '../../utils/imageUtils.ts';

interface ParentChildEditModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ParentChildEditModal: React.FC<ParentChildEditModalProps> = ({
  player,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const {
    parentUpdateChildBasicInfo,
    createChildIdentityChangeRequest,
    childIdentityChangeRequests,
    parentAuditLogs,
  } = useData();

  const [activeTab, setActiveTab] = useState<'basic' | 'identity' | 'audit'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for basic info
  const [nickname, setNickname] = useState(player.nickname || '');
  const [address, setAddress] = useState(player.address || '');
  const [school, setSchool] = useState(player.school || '');
  const [schoolGrade, setSchoolGrade] = useState(player.schoolGrade || '');
  const [photoUrl, setPhotoUrl] = useState(player.photoUrl || '');
  const [guardianContact, setGuardianContact] = useState(player.guardianContact || '');
  const [guardianName, setGuardianName] = useState(player.guardianName || '');
  const [guardianRelation, setGuardianRelation] = useState(player.guardianRelation || 'Ayah');
  const [additionalNotes, setAdditionalNotes] = useState(player.additionalNotes || '');

  // Identity change request states
  const [identityField, setIdentityField] = useState<'fullName' | 'birthDate' | 'birthPlace' | 'gender'>('fullName');
  const [proposedValue, setProposedValue] = useState('');
  const [identityReason, setIdentityReason] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  if (!isOpen) return null;

  // Handle image upload from file or camera with auto-compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCompressingPhoto(true);

    try {
      const result = await processAndCompressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        maxSizeBytes: MAX_PHOTO_SIZE_BYTES, // 10MB
      });
      setPhotoUrl(result.dataUrl);
      setSuccessMsg(
        `Foto profil berhasil dioptimalkan (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}). Klik Simpan untuk memperbarui.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses file foto.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await parentUpdateChildBasicInfo(currentUser.id, player.id, {
        nickname: nickname.trim(),
        address: address.trim(),
        school: school.trim(),
        schoolGrade: schoolGrade.trim(),
        photoUrl: photoUrl.trim() ? photoUrl.trim() : '',
        guardianContact: guardianContact.trim(),
        guardianName: guardianName.trim(),
        guardianRelation,
        additionalNotes: additionalNotes.trim(),
      });
      setSuccessMsg('Data dasar ananda berhasil diperbarui dan tersimpan di database.');
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestIdentityChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!proposedValue.trim() || !identityReason.trim()) {
      setErrorMsg('Harap isi nilai baru dan alasan perubahan identitas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createChildIdentityChangeRequest({
        parentId: currentUser.id,
        playerId: player.id,
        field: identityField,
        proposedValue: proposedValue.trim(),
        reason: identityReason.trim(),
      });
      setSuccessMsg('Pengajuan perubahan identitas telah dikirimkan ke admin untuk diverifikasi.');
      setProposedValue('');
      setIdentityReason('');
      if (onSaved) onSaved();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirimkan pengajuan perubahan identitas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logs for this player
  const playerLogs = parentAuditLogs.filter((l) => l.playerId === player.id);
  const playerIdentityRequests = childIdentityChangeRequests.filter((r) => r.playerId === player.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Perbarui Data Anak: {player.fullName}</h2>
              <p className="text-xs text-emerald-300">
                Player ID: <span className="font-mono font-bold text-white">{player.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('basic'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'basic'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-l border-r border-b-white -mb-px'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Data Dasar & Foto
          </button>
          <button
            onClick={() => { setActiveTab('identity'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'identity'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-l border-r border-b-white -mb-px'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Pengajuan Identitas</span>
            {playerIdentityRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('audit'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg border-t border-l border-r border-b-white -mb-px'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Perubahan ({playerLogs.length})</span>
          </button>
        </div>

        {/* Notification alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Data Dasar & Foto */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSaveBasic} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Foto Profil Ananda */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={player.fullName}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-2xs">
                      <User className="w-7 h-7 text-gray-400 mb-0.5" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Kosong</span>
                    </div>
                  )}
                  {isCompressingPhoto ? (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold">
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-emerald-400" />
                      <span>Optimasi...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      title="Ganti Foto"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-gray-900">Foto Profil Pemain</h4>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Maks. {MAX_PHOTO_SIZE_LABEL} (Auto-Compress)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Unggah foto ananda berseragam atau format potret rapi dari galeri HP/laptop (hingga {MAX_PHOTO_SIZE_LABEL}) atau ambil via kamera. Jika belum ada foto, profil akan dikosongkan.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Foto ({MAX_PHOTO_SIZE_LABEL})</span>
                    </button>
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-600" />
                      <span>Kamera</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setSuccessMsg('Foto profil dikosongkan. Klik Simpan untuk memperbarui.');
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Panggilan (Nickname)</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Kevin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sekolah</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Contoh: SD Negeri 1 Surabaya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kelas Sekolah</label>
                <input
                  type="text"
                  value={schoolGrade}
                  onChange={(e) => setSchoolGrade(e.target.value)}
                  placeholder="Contoh: Kelas 3 SD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp Wali</label>
                <input
                  type="text"
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Orang Tua/Wali</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Nama Lengkap Wali"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hubungan Keluarga</label>
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="Ayah">Ayah Kandung</option>
                  <option value="Ibu">Ibu Kandung</option>
                  <option value="Wali">Wali / Keluarga</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat domisili saat ini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Catatan Tambahan Wali (Opsional)</label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Catatan alergi, kondisi kesehatan khusus, atau info penting untuk pelatih..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Read-only notification */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Penting:</span>
                Data identitas resmi (Nama Lengkap, Tanggal Lahir) tidak dapat diubah langsung untuk menjaga integritas database. Gunakan tab <strong>"Pengajuan Identitas"</strong> jika ada kesalahan ketik data anak.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Dasar'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Pengajuan Perubahan Identitas Utama */}
        {activeTab === 'identity' && (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>Ketentuan Perubahan Identitas Utama</span>
              </h4>
              <p className="mt-1 text-emerald-800 text-[11px] leading-relaxed">
                Perubahan pada <strong>Nama Lengkap, Tanggal Lahir, Tempat Lahir, atau Jenis Kelamin</strong> akan dikirimkan ke antrean verifikasi staf admin akademi sebelum diperbarui secara resmi.
              </p>
            </div>

            <form onSubmit={handleRequestIdentityChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Bagian yang Ingin Diperbaiki</label>
                <select
                  value={identityField}
                  onChange={(e) => setIdentityField(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="fullName">Nama Lengkap Pemain (Saat ini: {player.fullName})</option>
                  <option value="birthDate">Tanggal Lahir (Saat ini: {player.birthDate})</option>
                  <option value="birthPlace">Tempat Lahir (Saat ini: {player.birthPlace || 'Belum diisi'})</option>
                  <option value="gender">Jenis Kelamin (Saat ini: {player.gender || 'Laki-laki'})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nilai Baru yang Benar (Sesuai Akta Kelahiran / KK)
                </label>
                {identityField === 'birthDate' ? (
                  <input
                    type="date"
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                ) : identityField === 'gender' ? (
                  <select
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    placeholder="Masukkan data yang benar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Pengajuan Perubahan</label>
                <textarea
                  rows={2}
                  value={identityReason}
                  onChange={(e) => setIdentityReason(e.target.value)}
                  placeholder="Contoh: Kesalahan ketik huruf nama saat pendaftaran awal mandiri..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan ke Admin'}</span>
                </button>
              </div>
            </form>

            {/* Pending Requests List */}
            {playerIdentityRequests.length > 0 && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <h5 className="text-xs font-bold text-gray-800">Daftar Pengajuan Perubahan Sebelumnya:</h5>
                <div className="space-y-2">
                  {playerIdentityRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {req.field === 'fullName'
                              ? 'Nama Lengkap'
                              : req.field === 'birthDate'
                              ? 'Tanggal Lahir'
                              : req.field}
                            :
                          </span>
                          <span className="text-gray-500 line-through">{req.currentValue}</span>
                          <span className="text-emerald-700 font-bold">→ {req.proposedValue}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">Alasan: {req.reason}</p>
                      </div>
                      <div>
                        {req.status === 'pending' && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                            Menunggu Admin
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            Disetujui
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            Ditolak
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Riwayat Audit Perubahan */}
        {activeTab === 'audit' && (
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Catatan Jejak Audit Pemain ({playerLogs.length})
              </h4>
              <span className="text-[11px] text-gray-500">Dicatat otomatis oleh sistem</span>
            </div>

            {playerLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">
                Belum ada catatan riwayat perubahan data untuk ananda {player.fullName}.
              </div>
            ) : (
              <div className="space-y-2">
                {playerLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{log.fieldChanged}</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-700">
                      <span className="text-gray-500">Diubah oleh:</span> <strong className="text-gray-900">{log.parentName}</strong>
                    </div>
                    {(log.oldValue || log.newValue) && (
                      <div className="text-[11px] bg-white p-2 rounded border border-gray-200 text-gray-800 font-mono">
                        <span className="text-gray-400">Lama:</span> {log.oldValue || '-'} <br />
                        <span className="text-emerald-700">Baru:</span> {log.newValue || '-'}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
