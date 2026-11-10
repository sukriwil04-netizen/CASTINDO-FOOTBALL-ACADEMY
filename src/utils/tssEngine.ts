import { TrainingLoadRecord } from '../types/database.ts';

export interface TssDailyDataPoint {
  date: string; // 'YYYY-MM-DD'
  dateLabel: string; // 'DD/MM'
  dayName: string; // 'Sen', 'Sel', etc.
  tss: number; // Daily Training Stress Score
  sessionLoadAU: number; // Raw sRPE AU (minutes * RPE)
  sessionCount: number;
  durationMinutes: number;
  avgRpe: number | null;
  ctl: number; // Chronic Training Load ("Fitness")
  atl: number; // Acute Training Load ("Fatigue")
  tsb: number; // Training Stress Balance ("Form" = CTL - ATL)
  acwr: number; // Acute:Chronic Workload Ratio (ATL / CTL)
}

export type TsbFormCategory =
  | 'peak' // +5 to +25 (Sangat Prima / Kesiapan Tanding Puncak)
  | 'optimal' // -10 to +5 (Zona Latihan Produktif)
  | 'fatigued' // -10 to -25 (Akumulasi Kelelahan Terencana)
  | 'danger' // < -25 (Risiko Beban Berlebih & Cedera)
  | 'transition'; // > +25 (Transisi / Rehat Panjang)

export interface TsbStatusInfo {
  category: TsbFormCategory;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
  coachingAdvice: string;
}

export interface TssSummaryMetrics {
  currentTSS: number; // Latest daily TSS or 0
  avgDailyTSS: number; // Average daily TSS across the period
  totalTSS: number;
  currentCTL: number; // Fitness
  currentATL: number; // Fatigue
  currentTSB: number; // Form
  currentACWR: number; // Acute:Chronic Ratio
  ctlTrend: 'up' | 'down' | 'neutral';
  atlTrend: 'up' | 'down' | 'neutral';
  status: TsbStatusInfo;
  acwrStatus: {
    label: string;
    level: 'sweet_spot' | 'moderate' | 'danger' | 'underload';
    color: string;
    bg: string;
    border: string;
    description: string;
  };
  history: TssDailyDataPoint[];
  sessionsCount: number;
  totalDurationMinutes: number;
}

/**
 * Standardize Foster sRPE session load into Coggan TSS (Training Stress Score) scale.
 * 60 minutes at maximal threshold (RPE 10) = 100 TSS.
 * Formula: TSS = (Duration * RPE) / 6
 */
export function calculateSessionTSS(durationMinutes: number, rpe: number | null): number {
  if (!rpe || rpe <= 0 || !durationMinutes || durationMinutes <= 0) return 0;
  return Math.round((durationMinutes * rpe) / 6);
}

/**
 * Categorize TSB (Training Stress Balance = CTL - ATL) into sports science zones.
 */
export function getTsbStatus(tsb: number, hasData: boolean = true): TsbStatusInfo {
  if (!hasData) {
    return {
      category: 'optimal',
      label: 'Belum Ada Data Sesi',
      shortLabel: 'Data Kosong',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-700',
      badgeBorder: 'border-gray-300',
      dotColor: 'bg-gray-400',
      description: 'Belum ada catatan beban latihan RPE untuk menghitung dinamika TSS, CTL, ATL, dan TSB.',
      coachingAdvice: 'Input nilai RPE (skala 1-10) setelah sesi latihan selesai untuk mengaktifkan pemantauan kebugaran & kelelahan otomatis.',
    };
  }

  if (tsb > 25) {
    return {
      category: 'transition',
      label: 'Transisi / Rehat Panjang (Detraining Risk)',
      shortLabel: 'Transisi',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      badgeBorder: 'border-sky-300',
      dotColor: 'bg-sky-500',
      description: 'Kondisi fisik sangat segar, namun adaptasi kebugaran kronis (CTL) berisiko menurun jika terlalu lama tanpa beban latihan terstruktur.',
      coachingAdvice: 'Tingkatkan intensitas latihan secara progresif untuk merangsang kembali adaptasi fisik atlet menjelang kompetisi.',
    };
  }

  if (tsb >= 5) {
    return {
      category: 'peak',
      label: 'Sangat Prima / Kesiapan Tanding Puncak (Peak Form)',
      shortLabel: 'Sangat Prima',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-300',
      dotColor: 'bg-emerald-500',
      description: 'Keseimbangan kebugaran optimal dengan akumulasi kelelahan yang minimal. Kondisi fisik ideal untuk bertanding di akhir pekan.',
      coachingAdvice: 'Kondisi atlet sangat siap tanding (match ready). Pertahankan rutinitas pemanasan dinamis dan nutrisi seimbang.',
    };
  }

  if (tsb >= -10) {
    return {
      category: 'optimal',
      label: 'Zona Latihan Produktif (Optimal Adaptation)',
      shortLabel: 'Optimal',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-800',
      badgeBorder: 'border-blue-300',
      dotColor: 'bg-blue-500',
      description: 'Beban latihan berada dalam rentang adaptif sehat. Atlet membangun fondasi aerobik dan daya tahan tanpa kelelahan berlebih.',
      coachingAdvice: 'Jadwal latihan berjalan produktif. Lanjutkan program latihan sesuai rencana pelatih.',
    };
  }

  if (tsb >= -25) {
    return {
      category: 'fatigued',
      label: 'Akumulasi Kelelahan (Fatigued / Overreaching)',
      shortLabel: 'Kelelahan',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-300',
      dotColor: 'bg-amber-500',
      description: 'Kelelahan akut (ATL) mulai melebihi kebugaran kronis. Menandakan fase latihan berat terencana yang membutuhkan regenerasi.',
      coachingAdvice: 'Fokuskan pada hidrasi optimal, nutrisi tinggi karbohidrat/protein, dan tidur malam berkualitas minimal 8-9 jam bagi anak.',
    };
  }

  // TSB < -25
  return {
    category: 'danger',
    label: 'Peringatan Kelelahan Ekstrem / Risiko Cedera (High Strain)',
    shortLabel: 'Risiko Tinggi',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    dotColor: 'bg-rose-500',
    description: 'Kelelahan akut melonjak tajam melampaui daya adaptasi atlet. Risiko cedera otot atau kelelahan mental (burnout) meningkat.',
    coachingAdvice: 'WASPADA: Berikan sesi pemulihan aktif (active recovery) atau kurangi volume sesi berikutnya sebesar 30-50%.',
  };
}

/**
 * Interpret ACWR (Acute to Chronic Workload Ratio)
 */
export function getAcwrStatus(acwr: number, hasData: boolean = true) {
  if (!hasData || acwr <= 0) {
    return {
      label: 'Belum Terhitung',
      level: 'moderate' as const,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
      description: 'Data latihan belum mencukupi.',
    };
  }

  if (acwr < 0.8) {
    return {
      label: 'Underload (< 0.80)',
      level: 'underload' as const,
      color: 'text-sky-800',
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      description: 'Beban akut rendah, kebugaran aman namun stimulasi adaptasi minim.',
    };
  }

  if (acwr <= 1.3) {
    return {
      label: 'Sweet Spot (0.80 - 1.30)',
      level: 'sweet_spot' as const,
      color: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      description: 'Rentang rasio latihan paling aman dan efektif untuk meminimalkan risiko cedera.',
    };
  }

  if (acwr <= 1.5) {
    return {
      label: 'Zona Waspada (1.30 - 1.50)',
      level: 'moderate' as const,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      description: 'Beban akut meningkat lebih cepat dari fondasi kronis. Pantau respons fisik atlet.',
    };
  }

  return {
    label: 'Zona Bahaya (> 1.50)',
    level: 'danger' as const,
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    description: 'Lonjakan beban akut sangat tinggi. Risiko cedera non-kontak meningkat signifikan.',
  };
}

/**
 * Calculates complete daily TSS, CTL (Fitness), ATL (Fatigue), and TSB (Form) curves.
 * Time constants:
 * - CTL (Fitness): tau = 42 days (k = 1 - e^(-1/42) ≈ 0.0235)
 * - ATL (Fatigue): tau = 7 days (k = 1 - e^(-1/7) ≈ 0.1331)
 */
export function calculateTssMetrics(
  loads: TrainingLoadRecord[],
  options?: {
    days?: number; // Days to generate history for (default 42 days)
    referenceDate?: string; // Anchor date, defaults to today
  }
): TssSummaryMetrics {
  const daysCount = options?.days || 42;
  const refDate = options?.referenceDate ? new Date(options.referenceDate) : new Date();

  // Filter valid loads with rpe and duration
  const validLoads = (loads || []).filter(
    (l) => l && l.rpe !== null && l.rpe > 0 && l.actualDurationMinutes > 0
  );

  const hasData = validLoads.length > 0;

  // Group by date ('YYYY-MM-DD')
  const dailyLoadsMap = new Map<
    string,
    {
      tss: number;
      sessionLoadAU: number;
      count: number;
      duration: number;
      rpeSum: number;
    }
  >();

  validLoads.forEach((l) => {
    const rawDate = l.sessionDate ? String(l.sessionDate) : '';
    const dStr = rawDate.includes('T') ? rawDate.split('T')[0] : (rawDate || new Date().toISOString().split('T')[0]);
    const sessionTSS = calculateSessionTSS(l.actualDurationMinutes, l.rpe);
    const sessionAU = l.trainingLoad || l.actualDurationMinutes * (l.rpe || 1);

    const existing = dailyLoadsMap.get(dStr) || {
      tss: 0,
      sessionLoadAU: 0,
      count: 0,
      duration: 0,
      rpeSum: 0,
    };

    existing.tss += sessionTSS;
    existing.sessionLoadAU += sessionAU;
    existing.count += 1;
    existing.duration += l.actualDurationMinutes;
    existing.rpeSum += l.rpe || 0;

    dailyLoadsMap.set(dStr, existing);
  });

  // Calculate start date (going back daysCount + 28 days for EWMA stabilization)
  const totalSimDays = daysCount + 28;
  const startDate = new Date(refDate);
  startDate.setDate(startDate.getDate() - totalSimDays + 1);

  const ctlDecay = 1 - Math.exp(-1 / 42); // ~0.0235
  const atlDecay = 1 - Math.exp(-1 / 7); // ~0.1331

  let ctl = 0;
  let atl = 0;

  const fullHistory: TssDailyDataPoint[] = [];

  const dayNamesIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = 0; i < totalSimDays; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + i);

    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayData = dailyLoadsMap.get(dateStr);
    const tss = dayData ? dayData.tss : 0;
    const sessionLoadAU = dayData ? dayData.sessionLoadAU : 0;
    const sessionCount = dayData ? dayData.count : 0;
    const durationMinutes = dayData ? dayData.duration : 0;
    const avgRpe = dayData && dayData.count > 0 ? Math.round((dayData.rpeSum / dayData.count) * 10) / 10 : null;

    // EWMA Updates
    ctl = ctl + (tss - ctl) * ctlDecay;
    atl = atl + (tss - atl) * atlDecay;
    const tsb = ctl - atl;
    const acwr = ctl > 0 ? atl / ctl : 0;

    const roundedCtl = Math.round(ctl * 10) / 10;
    const roundedAtl = Math.round(atl * 10) / 10;
    const roundedTsb = Math.round(tsb * 10) / 10;
    const roundedAcwr = Math.round(acwr * 100) / 100;

    fullHistory.push({
      date: dateStr,
      dateLabel: `${day}/${month}`,
      dayName: dayNamesIndo[curDate.getDay()],
      tss,
      sessionLoadAU,
      sessionCount,
      durationMinutes,
      avgRpe,
      ctl: roundedCtl,
      atl: roundedAtl,
      tsb: roundedTsb,
      acwr: roundedAcwr,
    });
  }

  // Slice to the requested display days window (e.g., past 42 days)
  const displayHistory = fullHistory.slice(-daysCount);

  // Latest values
  const latestPoint = fullHistory[fullHistory.length - 1];
  const prevPoint = fullHistory[fullHistory.length - 2] || latestPoint;

  const currentCTL = latestPoint ? latestPoint.ctl : 0;
  const currentATL = latestPoint ? latestPoint.atl : 0;
  const currentTSB = latestPoint ? latestPoint.tsb : 0;
  const currentACWR = latestPoint ? latestPoint.acwr : 0;
  const currentTSS = latestPoint ? latestPoint.tss : 0;

  // Trend determination
  const ctlTrend: 'up' | 'down' | 'neutral' =
    currentCTL > prevPoint.ctl ? 'up' : currentCTL < prevPoint.ctl ? 'down' : 'neutral';
  const atlTrend: 'up' | 'down' | 'neutral' =
    currentATL > prevPoint.atl ? 'up' : currentATL < prevPoint.atl ? 'down' : 'neutral';

  // Overall totals across the display period
  let totalTSS = 0;
  let totalDurationMinutes = 0;
  let sessionsCount = 0;

  displayHistory.forEach((p) => {
    totalTSS += p.tss;
    totalDurationMinutes += p.durationMinutes;
    sessionsCount += p.sessionCount;
  });

  const avgDailyTSS = displayHistory.length > 0 ? Math.round((totalTSS / displayHistory.length) * 10) / 10 : 0;

  const status = getTsbStatus(currentTSB, hasData);
  const acwrStatus = getAcwrStatus(currentACWR, hasData);

  return {
    currentTSS,
    avgDailyTSS,
    totalTSS,
    currentCTL,
    currentATL,
    currentTSB,
    currentACWR,
    ctlTrend,
    atlTrend,
    status,
    acwrStatus,
    history: displayHistory,
    sessionsCount,
    totalDurationMinutes,
  };
}
