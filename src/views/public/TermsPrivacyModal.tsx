import React from 'react';
import { X, Shield, Lock, FileText, CheckCircle } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kebijakan Privasi & Ketentuan Penggunaan</h3>
              <p className="text-xs text-slate-400">Castindo Football Academy (CFA)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              1. Perlindungan Data Pribadi Atlet Usia Dini
            </h4>
            <p>
              Castindo Football Academy berkomitmen menjaga kerahasiaan seluruh data pribadi pemain sepak bola usia dini, termasuk nama lengkap, tempat dan tanggal lahir, foto, sekolah, serta kontak wali murid. Data ini hanya digunakan untuk keperluan administratif akademi, perhitungan kelompok umur kompetisi, dan komunikasi resmi staf pelatih dengan orang tua/wali.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              2. Penggunaan Hasil Tes Fisik & Performa
            </h4>
            <p>
              Seluruh hasil tes fisik (sprint 10m/20m, Illinois agility, standing broad jump, Yo-Yo test, dsb.) serta catatan evaluasi teknik dan taktik bersifat rahasia dan hanya dapat diakses oleh:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs sm:text-sm">
              <li>Staf pelatih resmi akademi yang bertugas.</li>
              <li>Orang tua atau wali sah yang akunnya telah terverifikasi dan terhubung dengan atlet bersangkutan.</li>
            </ul>
            <p className="text-xs text-slate-400 italic">
              Hasil tes tidak akan dipublikasikan ke publik secara terbuka tanpa izin tertulis dari orang tua/wali atlet.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              3. Hak Akses & Kewenangan Pengguna
            </h4>
            <p>
              Akun orang tua/wali murid hanya memiliki hak untuk melihat dan memperbarui informasi dasar yang diizinkan untuk atlet yang terhubung dengan akunnya. Orang tua tidak diperkenankan mengubah rekam jejak tes fisik yang telah diinput pelatih atau mengakses data atlet lain.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-white text-base">4. Persetujuan</h4>
            <p>
              Dengan mendaftarkan akun di sistem Castindo Football Academy, Anda menyatakan bahwa informasi yang diberikan adalah benar dan menyetujui pemrosesan data untuk kepentingan pembinaan sepak bola anak Anda.
            </p>
          </section>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors"
          >
            Saya Memahami & Menutup
          </button>
        </div>
      </div>
    </div>
  );
};
