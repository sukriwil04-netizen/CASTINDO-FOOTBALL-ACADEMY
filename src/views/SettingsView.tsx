import React, { useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Edit2,
  Plus,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Team, MotorTest } from '../types/database.ts';
import { formatIndonesianDate } from '../utils/formatters.ts';
import { UserEditModal } from '../components/users/UserEditModal.tsx';
import { TeamEditModal } from '../components/settings/TeamEditModal.tsx';
import { MotorTestEditModal } from '../components/settings/MotorTestEditModal.tsx';
import { BackupRestoreModal } from '../components/database/BackupRestoreModal.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';

export const SettingsView: React.FC = () => {
  const {
    teams,
    motorTests,
    database,
    resetData,
    restoreAllData,
    getRecoverySnapshotInfo,
    isLoading,
  } = useData();

  const { currentUser, switchRole, usersList, reloadUsers } = useAuth();

  const [message, setMessage] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  const [isMotorModalOpen, setIsMotorModalOpen] = useState(false);
  const [motorTestToEdit, setMotorTestToEdit] = useState<MotorTest | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isRestoreAllConfirmOpen, setIsRestoreAllConfirmOpen] = useState(false);
  const [isRestoreAllLoading, setIsRestoreAllLoading] = useState(false);
  const [snapshotInfo, setSnapshotInfo] = useState<{
    hasSnapshot: boolean;
    playersCount: number;
    registrationsCount: number;
    usersCount: number;
    lastSaved: string | null;
    samplePlayerNames: string[];
  } | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(database, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `castindo_academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteReset = async () => {
    setIsResetLoading(true);
    try {
      await resetData();
      setIsResetConfirmOpen(false);
      setMessage('Basis data telah berhasil dikosongkan dan siap untuk data nyata.');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Gagal mengosongkan data: ${err.message}`);
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleOpenRestoreConfirm = async () => {
    setIsLoadingSnapshot(true);
    setIsRestoreAllConfirmOpen(true);
    try {
      const info = await getRecoverySnapshotInfo();
      setSnapshotInfo(info);
    } catch {
      setSnapshotInfo(null);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleExecuteRestoreAll = async () => {
    setIsRestoreAllLoading(true);
    try {
      const res = await restoreAllData();
      await reloadUsers();
      setIsRestoreAllConfirmOpen(false);
      if (res?.success) {
        setMessage(
          `Riwayat data berhasil dipulihkan! (${res?.restoredPlayersCount || 0} Atlet, ${res?.restoredUsersCount || 0} Akun Pengguna / Wali Murid).`
        );
      } else {
        setMessage(res?.message || 'Belum ada riwayat data yang tersimpan sebelumnya untuk dipulihkan.');
      }
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage(`Gagal memulihkan data: ${err.message}`);
    } finally {
      setIsRestoreAllLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isCoach = currentUser?.role === 'head_coach' || currentUser?.role === 'assistant_coach';

  return (
    <div className="space-y-6 text-xs">
      {message && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{message}</span>
        </div>
      )}

      {/* Profil Akun Pengguna Aktif (Untuk Semua Pengguna) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Profil Akun Saya
              </h3>
              <p className="text-[11px] text-gray-500">
                Informasi identitas akun yang sedang aktif digunakan
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setUserToEdit(currentUser);
              setIsUserModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profil Saya</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <div className="flex items-center space-x-3.5">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-800 border-2 border-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6 text-emerald-200" />}
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span>{currentUser?.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                  {currentUser?.role === 'admin'
                    ? 'Administrator'
                    : currentUser?.role === 'head_coach'
                    ? 'Head Coach'
                    : currentUser?.role === 'assistant_coach'
                    ? 'Assistant Coach'
                    : 'Wali Murid'}
                </span>
              </h4>
              <p className="text-gray-600 text-xs mt-0.5">{currentUser?.email}</p>
              {currentUser?.phone && (
                <p className="text-gray-500 text-[11px]">Kontak: {currentUser.phone}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
              Penugasan Tim:
            </span>
            <span className="font-bold text-xs text-emerald-900">
              {teams.find((t) => t.id === currentUser?.assignedTeamId)?.name || 'Castindo Tim B'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Management & RBAC - KHUSUS ADMINISTRATOR */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-sm text-gray-900">
                  Manajemen Staf Pelatih & Pengguna (Admin)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Kelola hak akses dan akun seluruh staf pelatih akademi
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah / Edit Pelatih</span>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {usersList.map((user) => {
              const isActive = currentUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50 px-2 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>{user.name}</span>
                        {isActive && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Pengguna Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {user.email} • Jabatan:{' '}
                        <strong className="text-emerald-800 uppercase">
                          {user.role === 'admin'
                            ? 'Administrator'
                            : user.role === 'head_coach'
                            ? 'Head Coach'
                            : user.role === 'assistant_coach'
                            ? 'Assistant Coach'
                            : 'Wali Murid'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setUserToEdit(user);
                        setIsUserModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg font-semibold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Profil</span>
                    </button>

                    <button
                      onClick={() => switchRole(user.role)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                      }`}
                    >
                      {isActive ? 'Sedang Aktif' : 'Gunakan Akun Ini'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Academy Teams & Structure */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Struktur Tim & Kelompok Usia Akademi
              </h3>
              <p className="text-[11px] text-gray-500">
                {isAdmin
                  ? 'Konfigurasi kelompok umur, format 7v7, dan frekuensi latihan'
                  : 'Referensi pembagian kelompok usia dan format pertandingan'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setTeamToEdit(null);
                setIsTeamModalOpen(true);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Tim</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{t.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {t.format}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setTeamToEdit(t);
                        setIsTeamModalOpen(true);
                      }}
                      className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                      title="Edit Tim"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-gray-600">
                Kelompok Umur: <strong>{t.ageGroup}</strong> ({t.code})
              </div>
              <div className="text-gray-600">
                Frekuensi: <strong>{t.weeklySessionsCount} sesi per minggu</strong>
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed pt-1 border-t border-gray-200/60">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Protocols for Motor Tests */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Protokol Tes Motorik & Fisik Terdaftar
              </h3>
              <p className="text-[11px] text-gray-500">
                {isAdmin
                  ? 'Daftar instrumen pengukuran menggunakan bola dan marker (Section 11)'
                  : 'Pedoman protokol tes fisik dan motorik yang digunakan dalam evaluasi'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setMotorTestToEdit(null);
                setIsMotorModalOpen(true);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Instrumen Tes</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {motorTests.map((t) => (
            <div key={t.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">{t.name}</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border text-gray-600 font-semibold">
                    {t.unit}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMotorTestToEdit(t);
                        setIsMotorModalOpen(true);
                      }}
                      className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                      title="Edit Instrumen Tes"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">{t.category}</span>
              <p className="text-[11px] text-gray-600 leading-tight">{t.objective}</p>
              <div className="text-[10px] text-gray-400">Alat: {t.equipment}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management & Persistence - KHUSUS ADMINISTRATOR */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Database className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Pencadangan & Pengelolaan Basis Data Persisten (Admin)
              </h3>
              <p className="text-[11px] text-gray-500">
                Semua data pemain dan latihan disimpan secara permanen di basis data lokal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenRestoreConfirm}
              disabled={isLoading || isRestoreAllLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Pulihkan riwayat data atlet dan pendaftaran yang sebelumnya pernah terdaftar di aplikasi"
            >
              <RotateCcw className="w-4 h-4 text-emerald-700" />
              <span>Pulihkan Riwayat Data Terdaftar</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>Masukkan / Unggah Cadangan Data (.JSON)</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold border border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Cadangan Lengkap (.JSON)</span>
            </button>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isLoading || isResetLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-bold border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Kosongkan Seluruh Data Aplikasi</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Restore All Modal */}
      <ConfirmModal
        isOpen={isRestoreAllConfirmOpen}
        title="Pulihkan Riwayat Data Sebelumnya?"
        message={
          <div className="space-y-2.5">
            <p className="font-semibold text-gray-800">
              Apakah Anda ingin memulihkan riwayat data yang sebelumnya pernah terdaftar di aplikasi ini?
            </p>
            {isLoadingSnapshot ? (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center gap-2 text-gray-600 text-[11px]">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Memeriksa riwayat data tersimpan...</span>
              </div>
            ) : snapshotInfo && snapshotInfo.hasSnapshot && snapshotInfo.playersCount > 0 ? (
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Riwayat data sebelumnya yang akan dipulihkan:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>{snapshotInfo.playersCount} data atlet/pemain yang pernah terdaftar</li>
                  <li>{snapshotInfo.usersCount} akun pengguna (wali murid & pelatih)</li>
                  {snapshotInfo.registrationsCount > 0 && (
                    <li>{snapshotInfo.registrationsCount} berkas formulir pendaftaran resmi</li>
                  )}
                  {snapshotInfo.lastSaved && (
                    <li className="text-emerald-800">
                      Tersimpan pada: {formatIndonesianDate(snapshotInfo.lastSaved, 'full')}
                    </li>
                  )}
                </ul>
                {snapshotInfo.samplePlayerNames.length > 0 && (
                  <p className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                    Contoh atlet: {snapshotInfo.samplePlayerNames.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Belum Ada Riwayat Data Terdaftar
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Belum ada riwayat pemain yang pernah tersimpan sebelumnya. Sistem akan otomatis mencadangkan titik pemulihan (*snapshot*) setiap kali ada pemain baru yang didaftarkan.
                </p>
              </div>
            )}
            <p className="text-gray-500 text-[11px]">
              Data riwayat akan disinkronkan kembali ke database server tanpa menimpa akun Administrator resmi Anda.
            </p>
          </div>
        }
        confirmText={
          snapshotInfo && snapshotInfo.hasSnapshot && snapshotInfo.playersCount > 0
            ? 'Ya, Pulihkan Riwayat Data'
            : 'Tutup'
        }
        cancelText="Batal"
        variant={snapshotInfo && snapshotInfo.hasSnapshot && snapshotInfo.playersCount > 0 ? 'primary' : 'warning'}
        isLoading={isRestoreAllLoading}
        onConfirm={
          snapshotInfo && snapshotInfo.hasSnapshot && snapshotInfo.playersCount > 0
            ? handleExecuteRestoreAll
            : async () => setIsRestoreAllConfirmOpen(false)
        }
        onClose={() => setIsRestoreAllConfirmOpen(false)}
      />

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Kosongkan Seluruh Data Aplikasi?"
        message={
          <div className="space-y-2">
            <p className="font-bold text-rose-800">
              PERINGATAN: Seluruh data pemain, formulir pendaftaran orang tua, dan catatan sesi latihan akan dihapus bersih dari database server.
            </p>
            <p className="text-gray-500 text-[11px]">
              Akun Administrator Utama tetap aman. Anda dapat memasukkan kembali berkas cadangan (.JSON) kapan saja.
            </p>
          </div>
        }
        confirmText="Ya, Kosongkan Semua Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isResetLoading}
        onConfirm={handleExecuteReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Modals */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={() => setMessage('Data cadangan berhasil dipulihkan ke aplikasi!')}
      />

      <UserEditModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserToEdit(null);
        }}
        targetUser={userToEdit}
      />

      <TeamEditModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setTeamToEdit(null);
        }}
        teamToEdit={teamToEdit}
      />

      <MotorTestEditModal
        isOpen={isMotorModalOpen}
        onClose={() => {
          setIsMotorModalOpen(false);
          setMotorTestToEdit(null);
        }}
        testToEdit={motorTestToEdit}
      />
    </div>
  );
};
