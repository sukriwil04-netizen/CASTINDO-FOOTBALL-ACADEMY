import React, { useState, useEffect } from 'react';
import { X, Zap, Save } from 'lucide-react';
import { MotorTest, MotorTestCategory } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';

interface MotorTestEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  testToEdit?: MotorTest | null;
}

const CATEGORIES: MotorTestCategory[] = [
  'Keterampilan Bola',
  'Sprint Jarak Pendek',
  'Perubahan Arah (Agility)',
  'Keseimbangan',
  'Koordinasi',
  'Keterampilan Gerak Dasar',
  'Tes Kustom',
];

export const MotorTestEditModal: React.FC<MotorTestEditModalProps> = ({
  isOpen,
  onClose,
  testToEdit,
}) => {
  const { createMotorTest, updateMotorTest } = useData();

  const isEditing = Boolean(testToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MotorTestCategory>('Keterampilan Bola');
  const [objective, setObjective] = useState('');
  const [protocol, setProtocol] = useState('');
  const [unit, setUnit] = useState('detik');
  const [equipment, setEquipment] = useState('Bola & Marker');
  const [higherIsBetter, setHigherIsBetter] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (testToEdit) {
        setName(testToEdit.name || '');
        setCategory(testToEdit.category || 'Keterampilan Bola');
        setObjective(testToEdit.objective || '');
        setProtocol(testToEdit.protocol || '');
        setUnit(testToEdit.unit || 'detik');
        setEquipment(testToEdit.equipment || 'Bola & Marker');
        setHigherIsBetter(testToEdit.higherIsBetter ?? false);
      } else {
        setName('');
        setCategory('Keterampilan Bola');
        setObjective('');
        setProtocol('');
        setUnit('detik');
        setEquipment('Bola & Marker');
        setHigherIsBetter(false);
      }
      setError(null);
    }
  }, [isOpen, testToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama instrumen tes wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<MotorTest> = {
        name: name.trim(),
        category,
        objective: objective.trim(),
        protocol: protocol.trim(),
        unit: unit.trim(),
        equipment: equipment.trim(),
        higherIsBetter,
      };

      if (isEditing && testToEdit) {
        await updateMotorTest(testToEdit.id, payload);
      } else {
        await createMotorTest(payload);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan protokol tes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? `Edit Protokol: ${testToEdit?.name}` : 'Tambah Instrumen Tes Baru'}
              </h2>
              <p className="text-xs text-emerald-200">
                Peralatan standar: Bola dan Marker (Section 2)
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

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Nama Tes Fisik / Motorik *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Slalom Dribble Test"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MotorTestCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Satuan Ukur (Unit)</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Contoh: detik, repetisi, cm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Peralatan</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Contoh: Bola & Marker"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Interpretasi Angka</label>
              <select
                value={higherIsBetter ? 'true' : 'false'}
                onChange={(e) => setHigherIsBetter(e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="false">Semakin kecil semakin baik (contoh: waktu sprint/detik)</option>
                <option value="true">Semakin besar semakin baik (contoh: juggling/repetisi)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Tujuan Tes</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Contoh: Mengukur kontrol sentuhan bola saat mengubah arah cepat"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Protokol Pelaksanaan</label>
            <textarea
              rows={3}
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder="Jelaskan langkah-langkah pelaksanaan tes secara sistematis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
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
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Protokol'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
