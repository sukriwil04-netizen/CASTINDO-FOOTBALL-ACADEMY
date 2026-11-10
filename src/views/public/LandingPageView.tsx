import React, { useState } from 'react';
import {
  Activity,
  Award,
  ChevronRight,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Target,
  Clock,
  ArrowRight,
  Calendar,
  Lock,
  Heart,
  BarChart3,
  FileText,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { calculateAgeGroup } from '../../utils/ageGroup.ts';

interface LandingPageViewProps {
  onGoToLogin: (initialRole?: 'parent' | 'coach' | 'admin') => void;
  onGoToRegister: () => void;
  onOpenPrivacyTerms: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenPrivacyTerms,
}) => {
  // Interactive Age Calculator Preview
  const [calcDate, setCalcDate] = useState('2016-05-12');
  const calcResult = calculateAgeGroup(calcDate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
              <img
                src="/logo.png"
                alt="Castindo Football Academy"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-base sm:text-lg text-white">
                  CASTINDO
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  FOOTBALL ACADEMY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Sistem Pemantauan & Analisis Fisik Kelompok Umur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => onGoToLogin('coach')}
              className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Portal Pelatih
            </button>
            <button
              onClick={() => onGoToLogin('admin')}
              className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors border border-amber-500/30 rounded-lg hover:border-amber-500/60 bg-amber-500/5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Login Admin</span>
            </button>
            <button
              onClick={() => onGoToLogin('parent')}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors shadow-sm"
            >
              Login Wali
            </button>
            <button
              onClick={onGoToRegister}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 transition-all hidden sm:block"
            >
              Daftar Akun
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-800/60">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Platform Analisis Sains Olahraga & LTAD Usia Dini
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Kembangkan Potensi Fisik Sepak Bola Anak Secara{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Terukur & Terarah
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Sistem manajemen performa atlet sepak bola berbasis kelompok umur: memantau akselerasi, kelincahan, daya tahan, beban latihan (RPE), hingga target Long-Term Athlete Development (LTAD).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <button
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
              >
                Daftarkan Atlet & Akun Wali
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onGoToLogin('parent')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm sm:text-base border border-slate-700/80 flex items-center justify-center gap-2 transition-colors"
              >
                Sudah Punya Akun? Masuk
              </button>
            </div>

            {/* Quick Metrics Trust Bar */}
            <div className="pt-8 sm:pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left border-t border-slate-800/60 mt-10">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">7+</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Protokol Tes Fisik Standar</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">U-7 — U-16</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Rentang Kelompok Umur</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">100%</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Data Privat & Terverifikasi</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">RPE & LTAD</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Monitoring Beban Latihan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Breakdown: Parents vs Coaches */}
      <section className="py-16 sm:py-20 bg-slate-900/40 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manfaat Nyata Bagi Ekosistem Akademi
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Kolaborasi transparan dan terukur antara staf pelatih dan orang tua/wali murid demi perkembangan optimal anak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* For Parents */}
            <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-emerald-900/40 relative group hover:border-emerald-700/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Untuk Orang Tua & Wali Murid
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Dapatkan kepastian dan transparansi mengenai kebugaran serta kesiapan fisik anak tanpa spekulasi.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Transparansi Hasil Tes Fisik Resmi</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Melihat catatan akselerasi, kelincahan, daya ledak, dan daya tahan yang telah dipublikasikan pelatih.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Grafik Perkembangan dari Waktu ke Waktu</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Pantau lonjakan performa dan perubahan hasil tes antar periode dengan protokol pengukuran yang konsisten.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Laporan Kebugaran & Kehadiran yang Bisa Diunduh</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Buka dan cetak lembar evaluasi berkala anak dengan format resmi CFA untuk rekam jejak atlet.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Dukungan Multi-Atlet</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Satu akun wali dapat menghubungkan lebih dari satu anak dalam akademi dengan profil terpisah.
                    </span>
                  </div>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={onGoToRegister}
                  className="w-full py-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-800 flex items-center justify-center gap-2 transition-colors"
                >
                  Daftarkan Akun Wali Sekarang
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* For Coaches */}
            <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border border-slate-800 relative group hover:border-slate-700 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Untuk Pelatih & Staf Pembina
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Instrumen berbasis data ilmiah untuk memandu periodisasi latihan dan mitigasi cedera usia dini.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Standarisasi Protokol Tes Motorik & Fisik</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Pencatatan Sprint 10m/20m, Illinois Agility, Standing Broad Jump, Yo-Yo Test, Sit & Reach, dan Ball Slalom.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Kontrol Publikasi Hasil ke Orang Tua</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Hasil tes dan catatan pelatih tersimpan sebagai draft internal sebelum pelatih siap memublikasikannya.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Monitoring Beban Latihan (Session RPE)</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Menghitung volume dan intensitas latihan per pemain untuk menghindari overtraining pada fase pertumbuhan.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">Penetapan Target LTAD & Evaluasi Promosi Tim</strong>
                    <span className="text-slate-400 text-xs leading-relaxed">
                      Kriteria objektif untuk menentukan kesiapan atlet naik dari Tim B (U-8/U-9) ke Tim A (U-9/U-10).
                    </span>
                  </div>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={() => onGoToLogin('coach')}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  Masuk sebagai Pelatih / Staf
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Age Group & Pathway Calculator */}
      <section className="py-16 sm:py-20 border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Simulasi Otomatis Sistem CFA
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Kalkulator Kelompok Umur & Format Sepak Bola
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Sistem menghitung kelompok umur secara presisi berdasarkan cut-off tanggal lahir dan regulasi FIFA/PSSI.
                </p>
              </div>

              <div className="w-full md:w-auto">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Uji Coba Tanggal Lahir Atlet:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={calcDate}
                    onChange={(e) => setCalcDate(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {calcResult && (
              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium block">Kelompok Umur</span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                    {calcResult.ageGroupCode}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{calcResult.ageGroupLabel}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium block">Fase Perkembangan</span>
                  <p className="text-sm font-bold text-white mt-1 leading-snug">
                    {calcResult.developmentStage}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Usia Kronologis: {calcResult.exactAgeYears} thn {calcResult.exactAgeMonths} bln
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium block">Format Rekomendasi</span>
                  <p className="text-lg font-bold text-white mt-1">
                    {calcResult.recommendedFormat}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ukuran Bola: No. {calcResult.recommendedBallSize}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium block">Penempatan Tim Awal</span>
                  <p className="text-lg font-bold text-emerald-300 mt-1">
                    {calcResult.recommendedTeamName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Otomatis saat pendaftaran</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security & Access Statement */}
      <section className="py-14 bg-slate-950 border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Privasi & Keamanan Data Atlet Terjamin</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            Data pribadi atlet, kontak wali, dan rekam medis disimpan secara aman pada server terenkripsi. Orang tua hanya dapat melihat atlet yang terhubung dengan akun resminya. Publik umum tidak memiliki akses ke database internal akademi.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenPrivacyTerms}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              Baca Kebijakan Privasi & Ketentuan Penggunaan
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-500 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CFA" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-slate-400">CASTINDO FOOTBALL ACADEMY</span>
            <span>·</span>
            <span>Sistem Analisis Performa Fisik Kelompok Umur</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenPrivacyTerms} className="hover:text-slate-300 transition-colors">
              Kebijakan Privasi
            </button>
            <span>·</span>
            <button onClick={onOpenPrivacyTerms} className="hover:text-slate-300 transition-colors">
              Syarat & Ketentuan
            </button>
            <span>·</span>
            <button onClick={() => onGoToLogin('coach')} className="hover:text-slate-300 transition-colors">
              Staf Pelatih
            </button>
            <span>·</span>
            <button onClick={() => onGoToLogin('admin')} className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Login Admin</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
