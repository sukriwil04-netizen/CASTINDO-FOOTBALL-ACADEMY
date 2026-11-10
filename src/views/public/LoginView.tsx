import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  User,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { api } from '../../services/api.ts';

interface LoginViewProps {
  initialRole?: 'parent' | 'coach' | 'admin';
  onGoToRegister: () => void;
  onBackToHome: () => void;
  onLoginSuccess: (userRole: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialRole = 'parent',
  onGoToRegister,
  onBackToHome,
  onLoginSuccess,
}) => {
  const { usersList, login, registerCoach } = useAuth();
  const { teams } = useData();

  const [activeTab, setActiveTab] = useState<'parent' | 'coach' | 'admin'>(initialRole);
  const [coachMode, setCoachMode] = useState<'login' | 'register'>('login');

  // Login credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isRecoveringAdmin, setIsRecoveringAdmin] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  // Coach registration fields
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [coachPassword, setCoachPassword] = useState('');
  const [coachRole, setCoachRole] = useState<'head_coach' | 'assistant_coach'>('head_coach');
  const [coachTeamId, setCoachTeamId] = useState('team-b');
  const [coachPhone, setCoachPhone] = useState('');
  const [coachRegSuccess, setCoachRegSuccess] = useState<string | null>(null);

  const handleRecoverAdmin = async () => {
    setIsRecoveringAdmin(true);
    setErrorMessage(null);
    setRecoveryNotice(null);
    try {
      const res = await api.recoverOfficialAdmin();
      setEmail('sukriwil04@gmail.com');
      setPassword('AdminCastindo2026!');
      setRecoveryNotice(
        res.message || 'Akun Administrator Resmi (sukriwil04@gmail.com) berhasil diverifikasi dan dipulihkan di server.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memulihkan akun administrator resmi.');
    } finally {
      setIsRecoveringAdmin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRecoveryNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan email atau nomor kontak Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(cleanEmail, password);
      // Validate role expectation
      if (activeTab === 'admin' && user.role !== 'admin') {
        setErrorMessage('Akun ini bukan akun Administrator. Silakan login pada tab Pelatih atau Orang Tua / Wali.');
        setIsLoading(false);
        return;
      }
      if (activeTab === 'coach' && user.role === 'parent') {
        setErrorMessage('Akun ini adalah akun orang tua/wali murid. Silakan pilih tab Orang Tua / Wali.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(user.role);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoachRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCoachRegSuccess(null);

    const trimmedName = coachName.trim();
    const trimmedEmail = coachEmail.trim();

    if (!trimmedName) {
      setErrorMessage('Silakan masukkan nama lengkap pelatih.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Silakan masukkan alamat email resmi pelatih.');
      return;
    }
    if (!coachPassword || coachPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerCoach({
        name: trimmedName,
        email: trimmedEmail,
        password: coachPassword,
        role: coachRole,
        assignedTeamId: coachTeamId,
        phone: coachPhone.trim(),
      });

      setCoachRegSuccess('Pendaftaran berhasil! Akun pelatih langsung aktif.');
      setTimeout(() => {
        onLoginSuccess(res.user.role);
      }, 700);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Pendaftaran pelatih gagal. Silakan coba kembali.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (roleChoice: 'parent' | 'coach' | 'admin') => {
    setErrorMessage(null);
    setRecoveryNotice(null);
    if (roleChoice === 'admin') {
      setActiveTab('admin');
      setCoachMode('login');
      setEmail('sukriwil04@gmail.com');
      setPassword('AdminCastindo2026!');
    } else if (roleChoice === 'coach') {
      setActiveTab('coach');
      const existingCoach = usersList.find(
        (u) => u.role === 'head_coach' || u.role === 'assistant_coach'
      );
      if (existingCoach) {
        setCoachMode('login');
        setEmail(existingCoach.email);
        setPassword(existingCoach.password || 'CoachCastindo2026!');
      } else {
        setCoachMode('register');
        setErrorMessage('Belum ada akun pelatih terdaftar. Silakan lengkapi formulir pendaftaran pelatih baru di bawah ini.');
      }
    } else if (roleChoice === 'parent') {
      setActiveTab('parent');
      setCoachMode('login');
      const existingParent = usersList.find((u) => u.role === 'parent');
      if (existingParent) {
        setEmail(existingParent.email);
        setPassword(existingParent.password || 'WaliCastindo2026!');
      } else {
        setErrorMessage('Belum ada akun wali murid terdaftar. Anda dapat mendaftarkan akun baru melalui tombol pendaftaran.');
        onGoToRegister();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          ← Kembali ke Halaman Awal
        </button>

        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 mb-3 border border-slate-700">
          <img
            src="/logo.png"
            alt="Castindo Football Academy"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Masuk ke Portal CFA
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          CASTINDO FOOTBALL ACADEMY · Sistem Analisis Performa Fisik
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Role Tabs: 3 dedicated tabs for Parent, Coach, and Admin */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('parent');
                setCoachMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'parent'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Wali Murid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('coach');
                setErrorMessage(null);
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'coach'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pelatih</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setCoachMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Admin</span>
            </button>
          </div>

          {/* Description banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400">
            {activeTab === 'admin' ? (
              <div>
                <strong className="text-amber-400 flex items-center gap-1.5 font-bold mb-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Portal Administrator CFA
                </strong>
                <p className="text-slate-300 leading-relaxed">
                  Akses manajemen penuh: verifikasi atlet, otorisasi staf, validasi berkas identitas, dan pengelolaan database permanen.
                </p>
              </div>
            ) : activeTab === 'parent' ? (
              <div>
                <strong className="text-emerald-400 block font-bold mb-1">Jalur Orang Tua / Wali:</strong>
                <p className="text-slate-300 leading-relaxed">
                  Gunakan email atau kontak yang didaftarkan saat registrasi atlet untuk memantau rapor fisik dan presensi anak Anda.
                </p>
              </div>
            ) : coachMode === 'register' ? (
              <div>
                <strong className="text-blue-400 block font-bold mb-1">Pendaftaran Staf Pelatih Mandiri:</strong>
                <p className="text-slate-300 leading-relaxed">
                  Akun pelatih baru akan langsung aktif dan dapat langsung login tanpa menunggu persetujuan admin.
                </p>
              </div>
            ) : (
              <div>
                <strong className="text-blue-400 block font-bold mb-1">Jalur Staf Pelatih:</strong>
                <p className="text-slate-300 leading-relaxed">
                  Masuk menggunakan akun pelatih terdaftar untuk mengelola latihan, jadwal, dan penilaian fisik atlet.
                </p>
              </div>
            )}
          </div>

          {recoveryNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Status Verifikasi Akun</p>
                <p className="text-emerald-300 mt-0.5">{recoveryNotice}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white">Terjadi Kendala</p>
                <p className="text-red-300 mt-0.5">{errorMessage}</p>
                {activeTab === 'admin' && errorMessage.toLowerCase().includes('tidak ditemukan') && (
                  <button
                    type="button"
                    onClick={handleRecoverAdmin}
                    disabled={isRecoveringAdmin}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRecoveringAdmin ? 'animate-spin' : ''}`} />
                    <span>{isRecoveringAdmin ? 'Memulihkan...' : 'Klik di sini untuk Pulihkan Akun Admin Resmi'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {coachRegSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Pendaftaran Berhasil</p>
                <p className="text-emerald-300 mt-0.5">{coachRegSuccess}</p>
              </div>
            </div>
          )}

          {activeTab === 'coach' && coachMode === 'register' ? (
            /* COACH REGISTRATION FORM */
            <form onSubmit={handleCoachRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap & Gelar Pelatih
                </label>
                <input
                  type="text"
                  required
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="contoh: Coach Budi Prasetyo, S.Pd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Email Resmi Pelatih
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={coachEmail}
                    onChange={(e) => setCoachEmail(e.target.value)}
                    placeholder="contoh: budi.coach@castindo.ac.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jabatan Pelatih
                  </label>
                  <select
                    value={coachRole}
                    onChange={(e) => setCoachRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="head_coach">Pelatih Kepala (Head Coach)</option>
                    <option value="assistant_coach">Asisten Pelatih</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tim Penugasan
                  </label>
                  <select
                    value={coachTeamId}
                    onChange={(e) => setCoachTeamId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {(teams && teams.length > 0 ? teams.filter((t) => t.active !== false) : [
                      { id: 'team-b', name: 'Castindo Tim B (U-8/U-9)' },
                      { id: 'team-a', name: 'Castindo Tim A (U-9/U-10)' },
                      { id: 'team-u11-u12', name: 'Castindo Tim U-11/U-12' },
                    ]).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  value={coachPhone}
                  onChange={(e) => setCoachPhone(e.target.value)}
                  placeholder="contoh: 08123456789"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={coachPassword}
                    onChange={(e) => setCoachPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mendaftarkan & Mengaktifkan...
                  </>
                ) : (
                  <>
                    Daftar & Langsung Masuk Pelatih
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCoachMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
                >
                  Sudah memiliki akun pelatih? Masuk ke portal
                </button>
              </div>
            </form>
          ) : (
            /* STANDARD LOGIN FORM (PARENT, COACH, ADMIN) */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    {activeTab === 'admin'
                      ? 'Email Resmi Administrator'
                      : activeTab === 'coach'
                      ? 'Email Resmi Pelatih CFA'
                      : 'Email atau Kontak Terdaftar'}
                  </span>
                  {activeTab === 'admin' && (
                    <span className="text-[10px] text-amber-400 font-normal">Akses Utama</span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    {activeTab === 'admin' ? (
                      <Shield className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    placeholder={
                      activeTab === 'admin'
                        ? 'sukriwil04@gmail.com'
                        : activeTab === 'parent'
                        ? 'contoh: orangtua@gmail.com'
                        : 'contoh: coach.hendra@castindo.ac.id'
                    }
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      activeTab === 'admin'
                        ? 'border-amber-500/40 focus:border-amber-400'
                        : 'border-slate-700/80 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {activeTab === 'admin' ? 'Kata Sandi Administrator' : 'Kata Sandi'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun Anda"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      activeTab === 'admin'
                        ? 'border-amber-500/40 focus:border-amber-400'
                        : 'border-slate-700/80 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all mt-2 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 font-black'
                    : activeTab === 'parent'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 font-bold'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 font-bold'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Memverifikasi Akses...
                  </>
                ) : activeTab === 'admin' ? (
                  <>
                    <Shield className="w-4 h-4 text-slate-950" />
                    Masuk Portal Administrator
                  </>
                ) : (
                  <>
                    Masuk ke Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Official Admin Quick Fill & Server Sync */}
          {activeTab === 'admin' && (
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-center">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="w-full py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Otomatis Akun Admin Resmi (sukriwil04@gmail.com)</span>
              </button>

              <button
                type="button"
                onClick={handleRecoverAdmin}
                disabled={isRecoveringAdmin}
                className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white text-[11px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRecoveringAdmin ? 'animate-spin' : ''}`} />
                <span>{isRecoveringAdmin ? 'Memverifikasi Server...' : 'Sinkronkan / Pulihkan Akun Administrator Resmi'}</span>
              </button>
            </div>
          )}

          {/* Footer Register Callout */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {activeTab === 'admin' ? (
              <p className="text-slate-400">
                Akun administrator tersimpan permanen di database CFA.{' '}
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin')}
                  className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1"
                >
                  Gunakan Akun Admin Resmi (Mohammad Wildan Kemal Pasha)
                </button>
              </p>
            ) : activeTab === 'parent' ? (
              <>
                Belum memiliki akun orang tua/wali?{' '}
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-1"
                >
                  Daftar Akun Baru
                </button>
              </>
            ) : coachMode === 'login' ? (
              <>
                Belum memiliki akun pelatih?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCoachMode('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1"
                >
                  Daftar Akun Pelatih Baru
                </button>
              </>
            ) : (
              <>
                Sudah terdaftar sebagai pelatih?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCoachMode('login');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1"
                >
                  Masuk ke Portal
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Pemulihan Kata Sandi</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Untuk keamanan rekam jejak performa atlet, pengaturan ulang kata sandi dilakukan melalui verifikasi nomor WhatsApp resmi administrasi CFA atau hubungi admin di sekretariat akademi.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="font-semibold text-white">Kontak Bantuan Admin:</p>
              <p className="text-emerald-400 font-mono mt-0.5">admin@castindo.ac.id / WA: 0812-3456-7890</p>
            </div>
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
