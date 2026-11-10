import React, { useMemo, useState } from 'react';
import {
  Activity,
  Save,
  Info,
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
  Smile,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  Users,
  Zap,
  Filter,
  ArrowUpRight,
  Shield,
} from 'lucide-react';
import { TrainingLoadRecord, TrainingSession } from '../types/database.ts';
import { useData } from '../context/DataContext.tsx';
import {
  formatIndonesianDate,
  RPE_DESCRIPTIONS,
} from '../utils/formatters.ts';
import { TssLoadMonitoringCard } from '../components/reports/TssLoadMonitoringCard.tsx';
import { calculateTssMetrics } from '../utils/tssEngine.ts';

interface TrainingLoadViewProps {
  initialSessionId?: string | null;
}

const RPE_SCALE_1_TO_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const TrainingLoadView: React.FC<TrainingLoadViewProps> = ({ initialSessionId }) => {
  const {
    sessions,
    players,
    activePlayers,
    trainingLoads,
    attendanceRecords,
    teams,
    saveTrainingLoadBatch,
    getPlayerTrainingLoadStats,
  } = useData();

  const [activeTab, setActiveTab] = useState<'input' | 'charts' | 'tss_pmc'>('input');
  const [chartTeamFilter, setChartTeamFilter] = useState<string>('all');
  const [selectedTssPlayerId, setSelectedTssPlayerId] = useState<string>(() => activePlayers[0]?.id || '');

  const availableSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (initialSessionId && sessions.some((s) => s.id === initialSessionId)) {
      return initialSessionId;
    }
    return availableSessions[0]?.id || '';
  });

  // Auto-select valid session when sessions load or change
  React.useEffect(() => {
    if (availableSessions.length > 0) {
      if (!selectedSessionId || !availableSessions.some((s) => s.id === selectedSessionId)) {
        if (initialSessionId && availableSessions.some((s) => s.id === initialSessionId)) {
          setSelectedSessionId(initialSessionId);
        } else {
          setSelectedSessionId(availableSessions[0].id);
        }
      }
    }
  }, [availableSessions, initialSessionId, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const sessionTeam = useMemo(
    () => teams.find((t) => t.id === selectedSession?.teamId),
    [teams, selectedSession]
  );

  // Players in this session's team who attended or were enrolled
  const sessionPlayers = useMemo(() => {
    if (!selectedSession) return [];
    const attendingPlayerIds = new Set(
      attendanceRecords.filter((a) => a.sessionId === selectedSession.id).map((a) => a.playerId)
    );
    if (!selectedSession.teamId || selectedSession.teamId === 'all') {
      return activePlayers;
    }
    const teamFiltered = activePlayers.filter((p) => p.teamId === selectedSession.teamId);
    const extraAttending = activePlayers.filter(
      (p) => attendingPlayerIds.has(p.id) && p.teamId !== selectedSession.teamId
    );
    return [...teamFiltered, ...extraAttending];
  }, [activePlayers, selectedSession, attendanceRecords]);

  // Local form state for RPE inputs in this session
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        actualDurationMinutes: number;
        rpe: number | null;
        playerResponseNotes: string;
      }
    >
  >({});

  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drilldownPlayerId, setDrilldownPlayerId] = useState<string | null>(null);

  // Sync formData when selectedSession or sessionPlayers change
  React.useEffect(() => {
    if (!selectedSession) return;
    const initialMap: typeof formData = {};

    sessionPlayers.forEach((p) => {
      const existingTl = trainingLoads.find(
        (tl) => tl.sessionId === selectedSession.id && tl.playerId === p.id
      );

      // Get actual minutes from attendance if available
      const att = attendanceRecords.find(
        (a) => a.sessionId === selectedSession.id && a.playerId === p.id
      );

      const actualMins = att
        ? att.status === 'absent' || att.status === 'sick' || att.status === 'excused'
          ? 0
          : att.actualMinutes
        : selectedSession.actualDurationMinutes || 75;

      initialMap[p.id] = {
        actualDurationMinutes: existingTl && existingTl.actualDurationMinutes !== undefined ? existingTl.actualDurationMinutes : actualMins,
        rpe: existingTl ? existingTl.rpe : null,
        playerResponseNotes: existingTl?.playerResponseNotes || '',
      };
    });

    setFormData(initialMap);
  }, [selectedSession?.id, sessionPlayers.length]);

  const handleRpeSelect = (playerId: string, rpeVal: number | null) => {
    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        rpe: rpeVal,
      },
    }));
    setSaveError(null);
  };

  const handleMinutesChange = (playerId: string, mins: number) => {
    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        actualDurationMinutes: Math.max(0, mins),
      },
    }));
    setSaveError(null);
  };

  const handleNotesChange = (playerId: string, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        playerResponseNotes: notes,
      },
    }));
    setSaveError(null);
  };

  // Bulk quick-actions for the entire squad
  const handleBulkSetRpe = (rpeVal: number | null) => {
    setFormData((prev) => {
      const next = { ...prev };
      sessionPlayers.forEach((p) => {
        next[p.id] = {
          ...(next[p.id] || {
            actualDurationMinutes: selectedSession?.actualDurationMinutes || 75,
            playerResponseNotes: '',
          }),
          rpe: rpeVal,
        };
      });
      return next;
    });
    setSaveError(null);
  };

  const handleBulkSetMinutes = (mins: number) => {
    setFormData((prev) => {
      const next = { ...prev };
      sessionPlayers.forEach((p) => {
        next[p.id] = {
          ...(next[p.id] || {
            rpe: null,
            playerResponseNotes: '',
          }),
          actualDurationMinutes: Math.max(0, mins),
        };
      });
      return next;
    });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const recordsToSave = sessionPlayers.map((p) => {
        const item = formData[p.id] || {
          actualDurationMinutes: selectedSession.actualDurationMinutes || 75,
          rpe: null,
          playerResponseNotes: '',
        };
        return {
          playerId: p.id,
          actualDurationMinutes: Number(item.actualDurationMinutes) || 0,
          rpe: item.rpe,
          playerResponseNotes: item.playerResponseNotes || '',
        };
      });

      await saveTrainingLoadBatch(selectedSession.id, recordsToSave);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err: any) {
      console.error('Error saving training load batch:', err);
      setSaveError(err.message || 'Gagal menyimpan seluruh beban latihan ke basis data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats for the active drilldown player
  const drilldownStats = useMemo(() => {
    if (!drilldownPlayerId) return null;
    return getPlayerTrainingLoadStats(drilldownPlayerId);
  }, [drilldownPlayerId, getPlayerTrainingLoadStats]);

  const drilldownPlayer = useMemo(
    () => players.find((p) => p.id === drilldownPlayerId),
    [drilldownPlayerId, players]
  );

  const drilldownPlayerLoads = useMemo(() => {
    if (!drilldownPlayerId) return [];
    return trainingLoads.filter((l) => l.playerId === drilldownPlayerId);
  }, [drilldownPlayerId, trainingLoads]);

  const drilldownTss = useMemo(() => {
    if (!drilldownPlayerLoads || drilldownPlayerLoads.length === 0) return null;
    return calculateTssMetrics(drilldownPlayerLoads, { days: 42 });
  }, [drilldownPlayerLoads]);

  // Selected player for TSS PMC tab
  const selectedTssPlayer = useMemo(() => {
    return players.find((p) => p.id === selectedTssPlayerId) || activePlayers[0] || null;
  }, [players, activePlayers, selectedTssPlayerId]);

  const selectedTssLoads = useMemo(() => {
    if (!selectedTssPlayer) return [];
    return trainingLoads.filter((l) => l.playerId === selectedTssPlayer.id);
  }, [selectedTssPlayer, trainingLoads]);

  // Live session statistics
  const filledRpeCount = useMemo(() => {
    return sessionPlayers.filter((p) => {
      const val = formData[p.id]?.rpe;
      return typeof val === 'number' && val > 0;
    }).length;
  }, [sessionPlayers, formData]);

  const totalSessionAu = useMemo(() => {
    return sessionPlayers.reduce((sum, p) => {
      const item = formData[p.id];
      if (item && item.rpe && item.actualDurationMinutes) {
        return sum + item.rpe * item.actualDurationMinutes;
      }
      return sum;
    }, 0);
  }, [sessionPlayers, formData]);

  const avgSessionRpe = useMemo(() => {
    if (filledRpeCount === 0) return '-';
    const total = sessionPlayers.reduce((sum, p) => sum + (formData[p.id]?.rpe || 0), 0);
    return (total / filledRpeCount).toFixed(1);
  }, [sessionPlayers, formData, filledRpeCount]);

  // ==========================================
  // AGGREGATED REPORT ANALYTICS FOR GRAPH TAB
  // ==========================================
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => chartTeamFilter === 'all' || s.teamId === chartTeamFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, chartTeamFilter]);

  const reportAnalytics = useMemo(() => {
    const relevantSessionIds = new Set(filteredSessions.map((s) => s.id));
    const validLoads = trainingLoads.filter(
      (tl) => relevantSessionIds.has(tl.sessionId) && tl.rpe !== null && tl.trainingLoad !== null && tl.trainingLoad > 0
    );

    const totalAu = validLoads.reduce((sum, tl) => sum + (tl.trainingLoad || 0), 0);
    const avgAuPerRecord = validLoads.length > 0 ? Math.round(totalAu / validLoads.length) : 0;

    // RPE Average (1-10)
    const totalRpe = validLoads.reduce((sum, tl) => sum + (tl.rpe || 0), 0);
    const avgRpe = validLoads.length > 0 ? (totalRpe / validLoads.length).toFixed(1) : '0';

    // RPE Distribution 1-10
    const rpeDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
    };
    validLoads.forEach((tl) => {
      if (tl.rpe && tl.rpe >= 1 && tl.rpe <= 10) {
        rpeDistribution[tl.rpe] = (rpeDistribution[tl.rpe] || 0) + 1;
      }
    });

    // Session by session data points for timeline graph
    const sessionDataPoints = filteredSessions.map((s) => {
      const sLoads = validLoads.filter((tl) => tl.sessionId === s.id);
      const sTotalAu = sLoads.reduce((sum, tl) => sum + (tl.trainingLoad || 0), 0);
      const sAvgAu = sLoads.length > 0 ? Math.round(sTotalAu / sLoads.length) : 0;
      const sAvgRpe = sLoads.length > 0 ? (sLoads.reduce((sum, tl) => sum + (tl.rpe || 0), 0) / sLoads.length).toFixed(1) : '0';

      return {
        sessionId: s.id,
        date: s.date,
        focus: s.focus,
        teamId: s.teamId,
        teamName: teams.find((t) => t.id === s.teamId)?.name || s.teamId,
        playerCount: sLoads.length,
        totalAu: sTotalAu,
        avgAu: sAvgAu,
        avgRpe: Number(sAvgRpe),
        duration: s.actualDurationMinutes || 75,
      };
    });

    // Player Workload Rankings
    const relevantPlayers = activePlayers.filter(
      (p) => chartTeamFilter === 'all' || p.teamId === chartTeamFilter
    );

    const playerWorkloads = relevantPlayers.map((p) => {
      const pLoads = validLoads.filter((tl) => tl.playerId === p.id);
      const pTotalAu = pLoads.reduce((sum, tl) => sum + (tl.trainingLoad || 0), 0);
      const pAvgAu = pLoads.length > 0 ? Math.round(pTotalAu / pLoads.length) : 0;
      const pAvgRpe = pLoads.length > 0 ? (pLoads.reduce((sum, tl) => sum + (tl.rpe || 0), 0) / pLoads.length).toFixed(1) : '0';

      return {
        player: p,
        totalAu: pTotalAu,
        avgAu: pAvgAu,
        avgRpe: Number(pAvgRpe),
        sessionCount: pLoads.length,
      };
    }).sort((a, b) => b.totalAu - a.totalAu);

    return {
      totalAu,
      avgAuPerRecord,
      avgRpe,
      totalRecordedRecords: validLoads.length,
      rpeDistribution,
      sessionDataPoints,
      playerWorkloads,
    };
  }, [filteredSessions, trainingLoads, teams, activePlayers, chartTeamFilter]);

  return (
    <div className="space-y-6">
      {/* Educational Framework Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-950 shadow-2xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Metodologi Training Load Pemain Usia Dini: Modified Session-RPE (Skala 1–10)</span>
            <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              Borg / Foster CR-10
            </span>
          </div>
          <p className="text-emerald-900/90 leading-relaxed text-[11px]">
            Rumus: <strong>Beban Latihan (AU) = Durasi Latihan Aktual (Menit) × Session-RPE (Skala 1–10)</strong>.
            Skala 1–10 diadaptasi dengan analogi bahasa dan emoticon intuitif untuk anak kelahiran 2016–2017.
            Data ini digunakan untuk memantau adaptasi fisik, mencegah kelelahan berlebih (*overtraining*), dan menjaga kegembiraan bermain anak.
          </p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'input'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Input Beban Sesi (RPE 1–10)</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'charts'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Grafik Skuad Foster (AU)</span>
            <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded-md font-extrabold">
              Visual
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tss_pmc')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'tss_pmc'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>Monitoring Beban TSS (CTL, ATL, TSB)</span>
            <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded-md font-extrabold">
              Sports Science
            </span>
          </button>
        </div>

        {activeTab === 'charts' && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={chartTeamFilter}
              onChange={(e) => setChartTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-800 bg-white"
            >
              <option value="all">Semua Kelompok Tim</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.ageGroup})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'tss_pmc' && (
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold text-gray-700 hidden sm:inline">Pilih Atlet:</span>
            <select
              value={selectedTssPlayerId}
              onChange={(e) => setSelectedTssPlayerId(e.target.value)}
              className="px-2.5 py-1.5 border border-emerald-300 rounded-lg font-bold text-gray-900 bg-white shadow-2xs focus:ring-2 focus:ring-emerald-500"
            >
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.primaryPosition})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: INPUT BEBAN SESI (SKALA 1-10)                          */}
      {/* ============================================================ */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Session Selector & Quick Actions */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Pilih Sesi Latihan:
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full sm:w-auto min-w-80 px-3 py-2 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatIndonesianDate(s.date)} — {s.focus} ({s.time})
                  </option>
                ))}
              </select>
            </div>

            {selectedSession && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || sessionPlayers.length === 0}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Beban (AU)'}</span>
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {isSaved && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Beban latihan seluruh skuad (Session-RPE 1–10 & AU) berhasil disimpan ke basis data!</span>
            </div>
          )}

          {/* Quick Bulk Settings Toolbar */}
          {selectedSession && sessionPlayers.length > 0 && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block">Aksi Cepat Beban Seluruh Skuad:</span>
                  <span className="text-[11px] text-emerald-700">Terapkan nilai RPE atau durasi langsung ke seluruh {sessionPlayers.length} pemain</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-emerald-900 mr-1">RPE Semua:</span>
                {[2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleBulkSetRpe(num)}
                    className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold shadow-2xs text-[11px] transition-all cursor-pointer"
                    title={`Terapkan RPE ${num} (${RPE_DESCRIPTIONS[num]?.label}) ke seluruh pemain`}
                  >
                    {RPE_DESCRIPTIONS[num]?.emoji} {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleBulkSetMinutes(selectedSession.actualDurationMinutes || 75)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold shadow-2xs text-[11px] transition-all cursor-pointer ml-1"
                  title="Samakan durasi menit ke seluruh pemain"
                >
                  <Clock className="w-3 h-3 inline mr-1 text-emerald-700" />
                  {selectedSession.actualDurationMinutes || 75}m Semua
                </button>
              </div>
            </div>
          )}

          {/* RPE Explanatory Legend (Full 1-10 Scale) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-700" />
                Panduan Lengkap Skala Session-RPE 1–10 (Modified Borg CR-10):
              </h4>
              <span className="text-[11px] text-gray-500">
                1–2 Pemulihan • 3–4 Ringan • 5–6 Target Ideal • 7–8 Keras • 9–10 Maksimal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {RPE_SCALE_1_TO_10.map((score) => {
                const desc = RPE_DESCRIPTIONS[score];
                return (
                  <div
                    key={score}
                    className={`p-2 rounded-xl border ${desc.color} text-xs flex flex-col justify-between shadow-2xs hover:scale-102 transition`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-black mb-1">
                        <span className="text-base">{desc.emoji}</span>
                        <span className="text-xs px-1.5 py-0.2 bg-white/70 rounded-md font-extrabold">{score}</span>
                      </div>
                      <div className="font-bold text-[10px] leading-tight truncate">{desc.label}</div>
                    </div>
                    <div className="text-[9px] opacity-80 mt-1 line-clamp-2">{desc.childDesc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch Training Load Input List */}
          {selectedSession ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center text-xs font-bold text-gray-700 uppercase tracking-wider gap-2">
                <div className="flex items-center gap-2">
                  <span>Input RPE 1–10 & Hitung Beban Sesi ({sessionPlayers.length} Pemain)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 lowercase">
                    {filledRpeCount}/{sessionPlayers.length} terisi
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600 lowercase">
                  <span>Total Beban: <strong className="text-emerald-800 font-mono text-xs">{totalSessionAu} AU</strong></span>
                  <span>Rata-rata: <strong className="text-indigo-800 font-mono text-xs">{avgSessionRpe}/10</strong></span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {sessionPlayers.map((player) => {
                  const current = formData[player.id] || {
                    actualDurationMinutes: selectedSession.actualDurationMinutes || 75,
                    rpe: null,
                    playerResponseNotes: '',
                  };

                  const calcLoad =
                    current.rpe !== null && current.rpe > 0 && current.actualDurationMinutes > 0
                      ? current.actualDurationMinutes * current.rpe
                      : null;

                  return (
                    <div
                      key={player.id}
                      className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      {/* Player info & drilldown trigger */}
                      <div className="flex items-center space-x-3 min-w-56">
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 overflow-hidden">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.nickname || player.fullName} className="w-full h-full object-cover" />
                          ) : (
                            (player.nickname || player.fullName || 'P').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            <span>{player.fullName}</span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {player.id} • {player.primaryPosition}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDrilldownPlayerId(drilldownPlayerId === player.id ? null : player.id)
                            }
                            className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <TrendingUp className="w-3 h-3" />
                            {drilldownPlayerId === player.id ? 'Tutup Riwayat Beban' : 'Lihat Tren Riwayat'}
                          </button>
                        </div>
                      </div>

                      {/* RPE 1-10 Selectors */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                            Respons Anak (Skala RPE 1–10):
                          </label>
                          {current.rpe && (
                            <span className="text-[10px] font-bold text-emerald-800">
                              {RPE_DESCRIPTIONS[current.rpe]?.label} ({RPE_DESCRIPTIONS[current.rpe]?.zone})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {RPE_SCALE_1_TO_10.map((num) => {
                            const isSelected = current.rpe === num;
                            const rpeInfo = RPE_DESCRIPTIONS[num];
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleRpeSelect(player.id, num)}
                                className={`w-8 h-8 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white shadow-xs scale-110 ring-2 ring-emerald-500 font-black'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                title={`RPE ${num}: ${rpeInfo.label} - ${rpeInfo.childDesc}`}
                              >
                                <span className="text-[10px] leading-none">{rpeInfo.emoji}</span>
                                <span className="leading-none mt-0.5">{num}</span>
                              </button>
                            );
                          })}

                          {current.rpe !== null && (
                            <button
                              type="button"
                              onClick={() => handleRpeSelect(player.id, null)}
                              className="px-2 py-1 text-[10px] text-gray-400 hover:text-rose-600 font-semibold ml-1"
                              title="Kosongkan nilai RPE"
                            >
                              Kosongkan
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Minutes & Calculated AU */}
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                            Durasi Menit:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="180"
                            value={current.actualDurationMinutes}
                            onChange={(e) => handleMinutesChange(player.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center font-bold text-gray-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                            Hasil Beban:
                          </label>
                          <div
                            className={`px-3 py-1.5 rounded-lg font-bold text-center border min-w-20 ${
                              calcLoad === null
                                ? 'bg-gray-50 text-gray-400 border-gray-200'
                                : calcLoad > 600
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : calcLoad >= 300
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {calcLoad !== null ? `${calcLoad} AU` : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-1 w-full lg:w-48">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Catatan Respons Anak:
                        </label>
                        <input
                          type="text"
                          placeholder="Kondisi, capek, riang..."
                          value={current.playerResponseNotes}
                          onChange={(e) => handleNotesChange(player.id, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{filledRpeCount} dari {sessionPlayers.length}</span> pemain terisi skor RPE. Total beban sesi: <strong className="text-emerald-800 font-mono text-sm">{totalSessionAu} AU</strong> (rata-rata: <strong className="text-indigo-800">{avgSessionRpe}/10</strong>).
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || sessionPlayers.length === 0}
                  className="inline-flex items-center space-x-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Seluruh Beban Latihan'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-40 text-gray-500" />
              <p className="text-xs">Belum ada sesi latihan. Buat sesi latihan terlebih dahulu.</p>
            </div>
          )}

          {/* Drilldown Player Trend Drawer / Modal */}
          {drilldownPlayer && drilldownStats && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Riwayat & Tren Beban: {drilldownPlayer.fullName} ({drilldownPlayer.id})
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Pemantauan beban latihan individual (Session-RPE 1–10)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDrilldownPlayerId(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  Tutup
                </button>
              </div>

              {/* Foster Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Beban Kumulatif</span>
                  <span className="text-xl font-black text-gray-900">{drilldownStats.totalLoad} AU</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Rata-Rata per Sesi</span>
                  <span className="text-xl font-black text-emerald-800">{drilldownStats.averageLoad} AU</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Sesi Terekam</span>
                  <span className="text-xl font-black text-blue-900">{drilldownStats.completedSessionsCount} Sesi</span>
                </div>
              </div>

              {/* TSS Sports Science Metrics Summary */}
              {drilldownTss && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-700" />
                      Sports Science Engine: TSS & Form (TSB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTssPlayerId(drilldownPlayer.id);
                        setActiveTab('tss_pmc');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition cursor-pointer"
                    >
                      <span>Buka Kurva PMC Lengkap</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Daily TSS</span>
                      <span className="text-base font-black text-emerald-950">{drilldownTss.currentTSS}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">CTL (Fitness)</span>
                      <span className="text-base font-black text-blue-700">{drilldownTss.currentCTL}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">ATL (Fatigue)</span>
                      <span className="text-base font-black text-amber-700">{drilldownTss.currentATL}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">TSB (Form)</span>
                      <span className={`text-base font-black ${drilldownTss.currentTSB >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {drilldownTss.currentTSB > 0 ? `+${drilldownTss.currentTSB}` : drilldownTss.currentTSB}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-0.5 px-1">
                    <span className="text-gray-600 font-medium">Status Kesiapan:</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${drilldownTss.status.badgeBg} ${drilldownTss.status.badgeText} border ${drilldownTss.status.badgeBorder}`}>
                      {drilldownTss.status.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Load Trend Bars */}
              {drilldownStats.recentLoads.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Riwayat Sesi Terakhir:
                  </span>
                  <div className="space-y-2">
                    {drilldownStats.recentLoads.map((item, idx) => {
                      const maxVisual = 700;
                      const pct = Math.min(100, Math.round((item.load / maxVisual) * 100));
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-gray-700">
                              {formatIndonesianDate(item.date)} ({item.minutes}m)
                            </span>
                            <span className="font-bold text-amber-900">
                              {item.load} AU (RPE {item.rpe}/10 • {item.rpe ? RPE_DESCRIPTIONS[item.rpe]?.label : '-'})
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                item.load > 550
                                  ? 'bg-rose-500'
                                  : item.load >= 300
                                  ? 'bg-emerald-600'
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic py-2">
                  Belum ada riwayat beban tersimpan untuk pemain ini.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: GRAFIK & ANALISIS REPORT BEBAN LATIHAN (VISUAL)        */}
      {/* ============================================================ */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Akumulasi Beban
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {reportAnalytics.totalAu.toLocaleString('id-ID')} <span className="text-sm font-bold text-gray-500">AU</span>
              </div>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {reportAnalytics.totalRecordedRecords} catatan sesi terekam
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Rata-rata Beban/Sesi
              </span>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {reportAnalytics.avgAuPerRecord} <span className="text-sm font-bold text-gray-500">AU</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                Zona Target: 250–500 AU
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Rata-rata RPE Skuad
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1 flex items-baseline gap-1.5">
                <span>{reportAnalytics.avgRpe}</span>
                <span className="text-xs font-bold text-gray-400">/ 10</span>
              </div>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {RPE_DESCRIPTIONS[Math.round(Number(reportAnalytics.avgRpe)) || 5]?.label || 'Sedang'}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Status Kebugaran Skuad
              </span>
              <div className="text-base font-black text-emerald-800 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Adaptasi Baik</span>
              </div>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Format 7v7 berintensitas terukur
              </span>
            </div>
          </div>

          {/* GRAFIK 1: Tren Beban Latihan Sesi ke Sesi (Timeline Chart) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  Grafik Tren Beban Latihan Sesi ke Sesi (Timeline AU)
                </h3>
                <p className="text-xs text-gray-500">
                  Perkembangan intensitas rata-rata pemain per sesi latihan terhadap zona adaptasi target.
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] font-semibold flex-wrap">
                <span className="flex items-center gap-1 text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> Ringan (&lt;250 AU)
                </span>
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Optimal (250–500 AU)
                </span>
                <span className="flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Tinggi (&gt;500 AU)
                </span>
              </div>
            </div>

            {/* Visual Bar Chart (Responsive SVG) */}
            {reportAnalytics.sessionDataPoints.length > 0 ? (
              <div className="space-y-2">
                <div className="h-64 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-gray-200">
                  {reportAnalytics.sessionDataPoints.map((item, idx) => {
                    const maxChartAu = 650;
                    const heightPct = Math.min(100, Math.max(12, Math.round((item.avgAu / maxChartAu) * 100)));
                    const isHigh = item.avgAu > 500;
                    const isOptimal = item.avgAu >= 250 && item.avgAu <= 500;

                    const barColor = isHigh ? 'bg-rose-500 hover:bg-rose-600' : isOptimal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-500 hover:bg-teal-600';

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 pointer-events-none bg-gray-900 text-white text-[10px] rounded-lg p-2 shadow-lg w-44">
                          <div className="font-bold text-emerald-300">{formatIndonesianDate(item.date)}</div>
                          <div className="text-gray-300 truncate font-medium">{item.focus}</div>
                          <div className="mt-1 border-t border-gray-700 pt-1 flex justify-between">
                            <span>Rata-rata Beban:</span>
                            <span className="font-bold text-amber-300">{item.avgAu} AU</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Avg RPE:</span>
                            <span>{item.avgRpe} / 10</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Durasi / Pemain:</span>
                            <span>{item.duration}m ({item.playerCount} anak)</span>
                          </div>
                        </div>

                        {/* Top AU Label */}
                        <span className="text-[10px] font-black text-gray-600 mb-1 group-hover:text-emerald-700">
                          {item.avgAu > 0 ? `${item.avgAu}` : '0'}
                        </span>

                        {/* The Bar */}
                        <div
                          className={`w-full max-w-12 rounded-t-lg transition-all duration-300 shadow-2xs ${barColor}`}
                          style={{ height: `${heightPct}%` }}
                        />

                        {/* Date under bar */}
                        <span className="text-[9px] text-gray-400 font-semibold mt-1.5 truncate max-w-14">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-medium px-2">
                  <span>← Sesi Lampau</span>
                  <span>Sesi Terkini →</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs italic">
                Belum ada data beban latihan untuk rentang filter saat ini.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* GRAFIK 2: Distribusi Frekuensi RPE 1–10 (Histogram) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-700" />
                  Distribusi Frekuensi Skala RPE (1–10)
                </h3>
                <p className="text-xs text-gray-500">
                  Sebaran sensasi kelelahan yang dirasakan pemain pada seluruh sesi pembinaan.
                </p>
              </div>

              <div className="space-y-2">
                {RPE_SCALE_1_TO_10.map((score) => {
                  const count = reportAnalytics.rpeDistribution[score] || 0;
                  const total = reportAnalytics.totalRecordedRecords || 1;
                  const pct = Math.round((count / total) * 100);
                  const desc = RPE_DESCRIPTIONS[score];

                  return (
                    <div key={score} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                          <span>{desc.emoji}</span>
                          <span>RPE {score}</span>
                          <span className="text-gray-400 font-normal">({desc.label})</span>
                        </span>
                        <span className="font-mono font-bold text-gray-700">
                          {count} input ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            score <= 2
                              ? 'bg-emerald-500'
                              : score <= 4
                              ? 'bg-teal-500'
                              : score <= 6
                              ? 'bg-sky-500'
                              : score <= 8
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAFIK 3: Peringkat & Keseimbangan Beban Pemain */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Keseimbangan Beban Pemain (Top Workload)
                </h3>
                <p className="text-xs text-gray-500">
                  Perbandingan total beban (AU) dan rata-rata RPE per anak untuk mencegah ketimpangan menit bermain.
                </p>
              </div>

              <div className="space-y-3 max-h-88 overflow-y-auto pr-1">
                {reportAnalytics.playerWorkloads.slice(0, 10).map((item, idx) => {
                  const maxAu = Math.max(...reportAnalytics.playerWorkloads.map((pw) => pw.totalAu), 400);
                  const barPct = Math.min(100, Math.round((item.totalAu / maxAu) * 100));

                  return (
                    <div key={item.player.id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-gray-900">{item.player.fullName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({item.player.primaryPosition})</span>
                        </div>
                        <span className="font-mono font-black text-emerald-950">
                          {item.totalAu} AU
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{item.sessionCount} Sesi Terekam</span>
                        <span>Avg RPE: <strong className="text-amber-800">{item.avgRpe}/10</strong> ({item.avgAu} AU/sesi)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SISTEM MONITORING LOAD TSS (CTL, ATL, TSB & PMC)       */}
      {/* ============================================================ */}
      {activeTab === 'tss_pmc' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Athlete Selector & Quick Banner */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Pilih Atlet untuk Analisis TSS & Kurva PMC:
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedTssPlayerId}
                  onChange={(e) => setSelectedTssPlayerId(e.target.value)}
                  className="w-full sm:w-auto min-w-72 px-3 py-2 text-xs font-bold text-gray-900 bg-gray-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) — Posisi {p.primaryPosition}
                    </option>
                  ))}
                </select>
                {selectedTssPlayer && (
                  <span className="hidden md:inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-md border border-emerald-200">
                    Kelahiran: {selectedTssPlayer.birthYear || selectedTssPlayer.birthDate?.slice(0, 4) || '2016/2017'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-gray-500 font-semibold">
                Total Sesi: <strong className="text-emerald-900">{selectedTssLoads.length} Sesi</strong>
              </span>
            </div>
          </div>

          {/* Full Sports Science Card */}
          <TssLoadMonitoringCard
            loads={selectedTssLoads}
            playerName={selectedTssPlayer?.fullName}
          />
        </div>
      )}
    </div>
  );
};
