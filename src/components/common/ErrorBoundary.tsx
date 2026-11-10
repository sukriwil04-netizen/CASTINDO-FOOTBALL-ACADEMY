import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Trash2, ChevronDown, ChevronUp, Copy, Check, Shield } from 'lucide-react';
import { safeStorage } from '../../utils/safeStorage.ts';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  isInline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isCopied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isCopied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Castindo FA ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleResetCache = () => {
    safeStorage.clearAppCache();
    window.location.href = '/';
  };

  private handleCopyDetails = () => {
    const errorText = `[CFA Error Diagnostic]
Message: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
Timestamp: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(errorText);
    this.setState({ isCopied: true });
    setTimeout(() => this.setState({ isCopied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.isInline) {
        return (
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-rose-200 shadow-sm text-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <h3 className="text-sm font-bold text-gray-900">
                {this.props.fallbackTitle || 'Komponen ini mengalami kendala tampilan'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Data pada menu ini belum dapat dimuat sempurna. Anda dapat mencoba memuat ulang tampilan atau membersihkan cache perangkat.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Muat Ulang</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-300"
              >
                <span>Refresh Browser</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Cache</span>
              </button>
            </div>

            {/* Diagnostic accordion */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800"
              >
                <span>Detail Teknis</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] font-mono text-gray-700 space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-600 truncate max-w-[80%]">
                      {this.state.error?.message || 'Unknown error'}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyDetails}
                      className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      {this.state.isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{this.state.isCopied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] text-gray-500 whitespace-pre-wrap break-all">
                    {this.state.error?.stack || 'No stack trace'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient emerald blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* CFA Logo & Title */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-md">
                <img src="/logo.png" alt="CFA" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Castindo Football Academy
                </span>
                <h1 className="text-lg sm:text-xl font-black text-white">
                  Pemulihan Tampilan Aplikasi
                </h1>
              </div>
            </div>

            {/* Error Notice */}
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Terjadi Kendala Memuat Halaman</span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Aplikasi mendeteksi gangguan sesi atau memori cache pada perangkat Anda. Data Anda di database tetap aman dan tidak hilang.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleResetCache}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-800/60 transition-colors cursor-pointer"
                  title="Bersihkan penyimpanan cache browser lokal jika aplikasi macet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Cache & Reset</span>
                </button>
              </div>
            </div>

            {/* Collapsible Technical Details for Diagnostics */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1"
              >
                <span className="font-mono">Informasi Teknis Gangguan</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-rose-400 font-bold truncate max-w-[280px]">
                      {this.state.error?.message || 'Unknown error'}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyDetails}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      {this.state.isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap break-all">
                    {this.state.error?.stack || 'No stack trace available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
