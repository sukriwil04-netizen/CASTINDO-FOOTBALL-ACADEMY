export function formatIndonesianDate(
  dateStr?: string,
  style: 'full' | 'medium' | 'short' = 'medium'
): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    if (style === 'full') {
      return `${day} ${months[month]} ${year}`;
    }
    if (style === 'short') {
      return `${day}/${month + 1}/${year}`;
    }
    return `${day} ${shortMonths[month]} ${year}`;
  } catch {
    return dateStr;
  }
}

export function calculateAge(birthDate: string): { years: number; months: number; text: string } {
  if (!birthDate) return { years: 0, months: 0, text: '-' };
  const birth = new Date(birthDate);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    text: `${years} thn ${months > 0 ? `${months} bln` : ''}`,
  };
}

export const RPE_DESCRIPTIONS: Record<
  number,
  { label: string; childDesc: string; emoji: string; color: string; zone: string }
> = {
  1: {
    label: 'Sangat Santai',
    childDesc: 'Sangat santai, tanpa beban, nafas normal seperti duduk atau berjalan santai.',
    emoji: '😌',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    zone: 'Pemulihan (Recovery)',
  },
  2: {
    label: 'Sangat Ringan',
    childDesc: 'Santai, pemanasan ringan, bisa bernyanyi atau mengobrol lancar.',
    emoji: '😊',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    zone: 'Pemanasan Ringan',
  },
  3: {
    label: 'Ringan',
    childDesc: 'Gerak teratur, mulai hangat dan berkeringat tipis, sangat nyaman.',
    emoji: '🙂',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    zone: 'Aerobik Ringan',
  },
  4: {
    label: 'Agak Sedang',
    childDesc: 'Latihan mulai intens, pernapasan sedikit bertambah, masih bisa ngobrol pendek.',
    emoji: '🏃',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    zone: 'Beban Adaptasi',
  },
  5: {
    label: 'Sedang / Pas',
    childDesc: 'Beban mantap, berkeringat aktif, tempo latihan optimal dan menyenangkan.',
    emoji: '😅',
    color: 'bg-sky-100 text-sky-800 border-sky-300',
    zone: 'Zona Target Ideal',
  },
  6: {
    label: 'Cukup Keras',
    childDesc: 'Nafas bertambah cepat, mulai butuh usaha ekstra dan fokus penuh.',
    emoji: '😤',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    zone: 'Zona Pengembangan',
  },
  7: {
    label: 'Keras',
    childDesc: 'Latihan berat, nafas terengah-engah, fisik bekerja keras, keringat deras.',
    emoji: '🥵',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    zone: 'Intensitas Tinggi',
  },
  8: {
    label: 'Sangat Keras',
    childDesc: 'Sangat melelahkan, kaki terasa berat, butuh tekad kuat untuk bertahan.',
    emoji: '😫',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    zone: 'Beban Berat',
  },
  9: {
    label: 'Mendekati Maksimal',
    childDesc: 'Hampir puncak lelah, fisik sangat teruji, sulit bicara, nafas sangat cepat.',
    emoji: '😵',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    zone: 'Ambang Batas',
  },
  10: {
    label: 'Maksimal / Ekstrem',
    childDesc: 'Lelah total maksimal! Usaha puncak 100%, butuh segera istirahat penuh dan minum.',
    emoji: '💥',
    color: 'bg-rose-200 text-rose-900 border-rose-400',
    zone: 'Maksimal Ekstrem',
  },
};

export const SCALE_4_DESCRIPTIONS: Record<number, { title: string; desc: string; badgeColor: string }> = {
  1: {
    title: 'Memerlukan Banyak Dukungan',
    desc: 'Masih butuh demonstrasi ulang dan bimbingan penuh dari pelatih.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  2: {
    title: 'Mulai Berkembang',
    desc: 'Memahami teknik namun eksekusi belum konsisten dalam situasi dinamis.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  3: {
    title: 'Cukup Konsisten',
    desc: 'Mampu menerapkan dengan konsisten dalam konteks latihan/permainan terstruktur.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  4: {
    title: 'Konsisten & Adaptif',
    desc: 'Sangat konsisten dan mampu menyesuaikan diri dengan tekanan situasi nyata.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

export const ATTENDANCE_BADGES = {
  present: { label: 'Hadir', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  late: { label: 'Terlambat', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  excused: { label: 'Izin', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  sick: { label: 'Sakit', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  absent: { label: 'Absen', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const LTAD_STATUS_BADGES = {
  'Belum Mulai': 'bg-gray-100 text-gray-700 border-gray-300',
  'Berjalan': 'bg-blue-100 text-blue-800 border-blue-300',
  'Berkembang': 'bg-amber-100 text-amber-800 border-amber-300',
  'Tercapai': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Perlu Ditinjau': 'bg-purple-100 text-purple-800 border-purple-300',
};

export const PROMOTION_RECOMMENDATION_BADGES = {
  'Belum Ditinjau': 'bg-gray-100 text-gray-700 border-gray-300',
  'Perlu Target Perkembangan Lanjutan': 'bg-amber-100 text-amber-800 border-amber-300',
  'Siap Mengikuti Sesi Observasi Tim A': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
  'Direkomendasikan untuk Dibahas dengan Staf': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Ditinjau Ulang Periode Berikutnya': 'bg-blue-100 text-blue-800 border-blue-300',
};
