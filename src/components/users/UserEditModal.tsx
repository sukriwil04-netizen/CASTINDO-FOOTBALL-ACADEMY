import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Camera,
  Image,
  Link,
  Check,
  AlertCircle,
} from 'lucide-react';
import { User, UserRole } from '../../types/database.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import {
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_LABEL,
  formatFileSize,
  processAndCompressImage,
} from '../../utils/imageUtils.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { currentUser, usersList, updateUser, createUser, deleteUser, loginAs } = useAuth();
  const { teams } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>(
    targetUser?.id || currentUser?.id || 'usr-1'
  );

  const activeUser = usersList.find((u) => u.id === selectedUserId) || targetUser || currentUser;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [assignedTeamId, setAssignedTeamId] = useState('team-b');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isNewUserMode, setIsNewUserMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    if (activeUser && !isNewUserMode) {
      setName(activeUser.name || '');
      setEmail(activeUser.email || '');
      setRole(activeUser.role || 'admin');
      setAssignedTeamId(activeUser.assignedTeamId || 'team-b');
      setAvatarUrl(activeUser.avatarUrl || '');
      setCustomUrlInput('');
      setShowUrlInput(false);
      setUploadNotice(null);
    }
  }, [activeUser, isOpen, isNewUserMode]);

  if (!isOpen) return null;

  // Handle local image file upload from device / mobile gallery with auto compression up to 10MB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await processAndCompressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        maxSizeBytes: MAX_PHOTO_SIZE_BYTES, // 10MB
      });
      setAvatarUrl(result.dataUrl);
      setUploadNotice(
        `Foto profil berhasil dimuat & dioptimalkan (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)})!`
      );
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses file foto.');
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setAvatarUrl(customUrlInput.trim());
      setShowUrlInput(false);
      setUploadNotice('URL foto berhasil diterapkan!');
      setTimeout(() => setUploadNotice(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (isNewUserMode) {
        const created = await createUser({
          name: name.trim(),
          email: email.trim(),
          role,
          assignedTeamId,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        loginAs(created.id);
        setSelectedUserId(created.id);
        setIsNewUserMode(false);
        setSuccessMsg('Profil baru berhasil ditambahkan dan disimpan!');
      } else if (activeUser) {
        await updateUser(activeUser.id, {
          name: name.trim(),
          email: email.trim(),
          role,
          assignedTeamId,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        setSuccessMsg('Profil pengguna berhasil diperbarui!');
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menyimpan profil: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!activeUser) return;
    if (usersList.length <= 1) {
      setErrorMsg('Tidak dapat menghapus satu-satunya profil yang ada.');
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeUser) return;
    setIsDeleteLoading(true);
    try {
      await deleteUser(activeUser.id);
      const remaining = usersList.filter((u) => u.id !== activeUser.id);
      if (remaining.length > 0) {
        setSelectedUserId(remaining[0].id);
        loginAs(remaining[0].id);
      }
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus profil');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isNewUserMode ? 'Tambah Profil Pelatih Baru' : 'Edit Profil Pelatih / Pengguna'}
              </h2>
              <p className="text-xs text-emerald-300">
                Ubah nama, email, jabatan, penugasan tim, dan foto profil Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 font-bold rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {uploadNotice && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 font-semibold rounded-xl flex items-center gap-2 text-[11px]">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}

          {/* User Selection & Add New Switcher (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Pilih Profil yang Sedang Diedit / Digunakan (Admin):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewUserMode(true);
                    setName('');
                    setEmail('');
                    setRole('head_coach');
                    setAvatarUrl('');
                  }}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baru
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {usersList.map((u) => {
                  const isActive = !isNewUserMode && u.id === selectedUserId;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setIsNewUserMode(false);
                        setSelectedUserId(u.id);
                        setName(u.name);
                        setEmail(u.email);
                        setRole(u.role);
                        setAssignedTeamId(u.assignedTeamId || 'team-b');
                        setAvatarUrl(u.avatarUrl || '');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
                        isActive
                          ? 'bg-emerald-850 text-white shadow-sm ring-2 ring-emerald-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.name || 'Tanpa Nama'}</span>
                    </button>
                  );
                })}

                {isNewUserMode && (
                  <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Mode Profil Baru
                  </span>
                )}
              </div>
            </div>
          )}

          {/* FOTO PROFIL SECTION WITH CUSTOM UPLOAD BUTTON */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
            <label className="block font-bold text-gray-800 text-xs">
              Foto Profil Pengguna
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-md bg-white flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <UserIcon className="w-7 h-7 text-gray-400" />
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">Kosong</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Action Buttons for Custom Photo */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Foto Sendiri (Maks. {MAX_PHOTO_SIZE_LABEL})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Link className="w-3.5 h-3.5 text-gray-500" />
                    Input URL Foto
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('');
                        setUploadNotice('Foto profil dikosongkan.');
                        setTimeout(() => setUploadNotice(null), 3000);
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500">
                  Dukung format JPG, PNG, atau WebP dari HP atau komputer (hingga {MAX_PHOTO_SIZE_LABEL}). Jika belum ada foto, profil pengguna akan dikosongkan.
                </p>

                {showUrlInput && (
                  <div className="flex gap-2 pt-1 animate-in fade-in">
                    <input
                      type="url"
                      placeholder="https://contoh.com/foto.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 bg-emerald-800 text-white font-bold rounded-xl text-xs"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields: Name & Email */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Nama Lengkap Pelatih / Pengguna *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mohammad Wildan Kemal Pasha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Email Pengguna</label>
            <input
              type="email"
              placeholder="Contoh: sukriwil04@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Role & Team Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Peran / Jabatan (Role)
              </label>
              {currentUser?.role === 'admin' ? (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="admin">Administrator (Akses Penuh)</option>
                  <option value="head_coach">Head Coach (Pelatih Utama)</option>
                  <option value="assistant_coach">Assistant Coach (Asisten Pelatih)</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                  {role === 'admin' ? 'Administrator' : role === 'head_coach' ? 'Head Coach (Pelatih)' : role === 'assistant_coach' ? 'Assistant Coach' : 'Wali Murid'}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Penugasan Tim
              </label>
              {currentUser?.role === 'admin' ? (
                <select
                  value={assignedTeamId}
                  onChange={(e) => setAssignedTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700">
                  {teams.find((t) => t.id === assignedTeamId)?.name || 'Castindo Tim B'}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            {!isNewUserMode && currentUser?.role === 'admin' && usersList.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Profil</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Hapus Profil Pengguna?"
        message={`Apakah Anda yakin ingin menghapus profil "${activeUser?.name}" (${activeUser?.email})?`}
        confirmText="Ya, Hapus Profil"
        variant="danger"
        isLoading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};
