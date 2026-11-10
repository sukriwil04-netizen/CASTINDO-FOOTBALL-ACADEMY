import React, { useState, useEffect } from 'react';
import { X, Users, Save, Shield } from 'lucide-react';
import { Team } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: Team | null;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  isOpen,
  onClose,
  teamToEdit,
}) => {
  const { createTeam, updateTeam } = useData();

  const isEditing = Boolean(teamToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [format, setFormat] = useState('7v7');
  const [weeklySessionsCount, setWeeklySessionsCount] = useState(3);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (teamToEdit) {
        setName(teamToEdit.name || '');
        setCode(teamToEdit.code || '');
        setAgeGroup(teamToEdit.ageGroup || '');
        setFormat(teamToEdit.format || '7v7');
        setWeeklySessionsCount(teamToEdit.weeklySessionsCount || 3);
        setDescription(teamToEdit.description || '');
        setActive(teamToEdit.active ?? true);
      } else {
        setName('');
        setCode('');
        setAgeGroup('Kelahiran 2016–2017');
        setFormat('7v7');
        setWeeklySessionsCount(3);
        setDescription('');
        setActive(true);
      }
      setError(null);
    }
  }, [isOpen, teamToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama tim wajib diisi');
      return;
    }
    if (!code.trim()) {
      setError('Kode tim wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<Team> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        ageGroup: ageGroup.trim(),
        format: format.trim(),
        weeklySessionsCount: Number(weeklySessionsCount) || 3,
        description: description.trim(),
        active,
      };

      if (isEditing && teamToEdit) {
        await updateTeam(teamToEdit.id, payload);
      } else {
        await createTeam(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan konfigurasi tim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? `Edit Tim: ${teamToEdit?.name}` : 'Tambah Kelompok Tim Baru'}
              </h2>
              <p className="text-xs text-emerald-200">
                Konfigurasi kelompok tim, umur, dan format permainan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-gray-700">Nama Tim / Kelompok *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Castindo Tim B (U-8/U-9)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Kode Tim *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: TIM_B"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Kelompok Usia / Tahun Lahir</label>
              <input
                type="text"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                placeholder="Contoh: Kelahiran 2016–2017"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Format Permainan</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="Contoh: 7v7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Frekuensi Latihan (Sesi / Minggu)</label>
              <input
                type="number"
                min="1"
                max="7"
                value={weeklySessionsCount}
                onChange={(e) => setWeeklySessionsCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-gray-700">Fokus & Sasaran Tim</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsikan fokus pembinaan tim ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="teamActive"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-600"
            />
            <label htmlFor="teamActive" className="text-gray-700 font-medium cursor-pointer">
              Tim aktif dalam kompetisi dan jadwal latihan reguler
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tim'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
