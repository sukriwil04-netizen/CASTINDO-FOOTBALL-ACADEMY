import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Player } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';

interface PlayerCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerCsvImportModal: React.FC<PlayerCsvImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { importPlayersCsv } = useData();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<Player>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const sampleCsv = `Nama Lengkap,Nama Panggilan,Tanggal Lahir,Posisi Utama,Kaki Dominan,Nama Wali,Kontak Wali
Reza Al-Ghifari,Reza,2016-07-14,Gelandang,Kanan,Hendra Al-Ghifari,0812-3344-5566
Daniswara Surya,Danis,2017-03-21,Penyerang Sayap,Kiri,Surya Kusuma,0813-9988-7711
Farel Andika,Farel,2016-10-09,Bek Tengah,Kanan,Andika Pratama,0857-1122-3344`;

  const handleParse = (text: string) => {
    setCsvText(text);
    setErrors([]);
    setSuccessCount(null);

    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const validPlayers: Partial<Player>[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());

      const fullName = cols[0];
      const nickname = cols[1] || fullName?.split(' ')[0] || '';
      const birthDate = cols[2];
      const primaryPosition = cols[3] || 'Gelandang';
      const dominantFoot = (cols[4] as any) || 'Kanan';
      const guardianName = cols[5] || 'Orang Tua';
      const guardianContact = cols[6] || '-';

      if (!fullName) {
        parseErrors.push(`Baris ${i + 1}: Nama lengkap kosong.`);
        continue;
      }
      if (!birthDate || isNaN(new Date(birthDate).getTime())) {
        parseErrors.push(`Baris ${i + 1}: Format tanggal lahir tidak valid (gunakan YYYY-MM-DD).`);
        continue;
      }

      validPlayers.push({
        fullName,
        nickname,
        birthDate,
        joinDate: new Date().toISOString().split('T')[0],
        teamId: 'team-b',
        primaryPosition,
        dominantFoot: dominantFoot === 'Kiri' ? 'Kiri' : 'Kanan',
        guardianName,
        guardianContact,
        guardianRelation: 'Wali',
        status: 'active',
      });
    }

    setParsedRows(validPlayers);
    setErrors(parseErrors);
  };

  const handleApply = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await importPlayersCsv(parsedRows);
      setSuccessCount(res.count);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrors([err.message || 'Gagal menyimpan data pemain CSV']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Impor Data Pemain via CSV</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold text-gray-700">Tempel / Masukkan Format CSV:</label>
              <button
                type="button"
                onClick={() => handleParse(sampleCsv)}
                className="text-emerald-700 font-bold hover:underline text-[11px]"
              >
                Gunakan Contoh Format
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="Nama Lengkap,Nama Panggilan,Tanggal Lahir,Posisi Utama,Kaki Dominan,Nama Wali,Kontak Wali..."
              className="w-full p-3 font-mono text-[11px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Validasi Error CSV:
              </div>
              <ul className="list-disc list-inside text-[11px]">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pratinjau Terverifikasi ({parsedRows.length} Pemain):
                </span>
              </div>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {parsedRows.map((p, i) => (
                  <div key={i} className="p-2 flex items-center justify-between hover:bg-gray-50 text-[11px]">
                    <div>
                      <strong className="text-gray-900">{p.fullName}</strong>
                      <span className="text-gray-500 ml-2">({p.primaryPosition} • Lahir {p.birthDate})</span>
                    </div>
                    <span className="text-emerald-700 font-semibold">{p.dominantFoot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-100 text-emerald-900 font-bold rounded-lg text-center">
              Berhasil mengimpor {successCount} pemain ke database!
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              disabled={parsedRows.length === 0 || isImporting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-50 shadow-xs"
            >
              {isImporting ? 'Menyimpan...' : `Simpan ${parsedRows.length} Pemain`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
