import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Clock,
  Gauge,
  Check,
  Code2,
  Copy,
  X,
  FileCode,
} from 'lucide-react';
import { SELF_HEALING_APPS_SCRIPT_CODE } from '../../services/sheetsDb';

export const SheetsDatabasePanel: React.FC = () => {
  const {
    sheetsUrl,
    setSheetsUrl,
    sheetsSyncStatus,
    lastSyncedAt,
    syncError,
    spreadsheetTitle,
    testSheetsConnection,
    syncFromSheets,
    pushToSheetsNow,
    syncStrategy,
    setSyncStrategy,
    pendingChangesCount,
    apiQuotaStats,
    language,
    t,
  } = useBusiness();

  const [inputUrl, setInputUrl] = useState(sheetsUrl);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sheets?: string[];
  } | null>(null);

  const handleTest = async () => {
    const url = (inputUrl || sheetsUrl).trim();
    if (!url) {
      setTestResult({ success: false, message: 'No Cloud Database endpoint URL configured.' });
      return;
    }
    setTesting(true);
    setTestResult(null);

    const res = await testSheetsConnection(url);
    setTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
      sheets: res.sheets,
    });
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(SELF_HEALING_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for sandboxed iframes without clipboard permissions
      const textarea = document.createElement('textarea');
      textarea.value = SELF_HEALING_APPS_SCRIPT_CODE;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const quotaPercent = Math.min(
    100,
    Math.round((apiQuotaStats.totalCallsToday / (apiQuotaStats.dailySafeCeiling || 1500)) * 100)
  );

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Cloud Database Connection & Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Status & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {t.cloudDbTitle}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold ${
                    sheetsSyncStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : sheetsSyncStatus === 'syncing'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : sheetsSyncStatus === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sheetsSyncStatus === 'connected'
                        ? 'bg-emerald-500'
                        : sheetsSyncStatus === 'syncing'
                        ? 'bg-amber-500'
                        : sheetsSyncStatus === 'error'
                        ? 'bg-rose-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {sheetsSyncStatus === 'connected'
                    ? t.connected
                    : sheetsSyncStatus === 'syncing'
                    ? t.syncing
                    : sheetsSyncStatus === 'error'
                    ? t.syncError
                    : t.unlinked}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                {spreadsheetTitle ? `"${spreadsheetTitle}"` : ''}
                {lastSyncedAt && ` • ${t.lastSynced}: ${lastSyncedAt}`}
              </p>
            </div>
          </div>

          {/* Quota Used Widget - Compact and organized */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {language === 'pt' ? 'Cotas:' : 'Quota:'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[11px] sm:text-xs text-slate-900 font-mono">
                {apiQuotaStats.totalCallsToday} <span className="text-slate-400 font-normal">/ {apiQuotaStats.dailySafeCeiling}</span>
              </span>
              <div className="w-10 sm:w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaPercent > 80
                      ? 'bg-rose-500'
                      : quotaPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.max(5, quotaPercent)}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-500">
                {quotaPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !sheetsUrl}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200"
            title="Test connection to the cloud database"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Database className="w-3.5 h-3.5 text-slate-500" />}
            <span className="truncate">{testing ? t.testing : t.testConnection}</span>
          </button>

          <button
            type="button"
            onClick={() => syncFromSheets()}
            disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Pull latest data from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span className="truncate">{t.pullData}</span>
          </button>

          <button
            type="button"
            onClick={() => pushToSheetsNow()}
            disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title="Push all app records to cloud database"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="truncate">{t.pushAll}</span>
          </button>
        </div>

        {/* Test Result Notice */}
        {testResult && (
          <div
            className={`p-2 rounded-lg text-xs border flex items-start gap-1.5 animate-fadeIn ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1 text-[11px]">
              <span className="font-semibold">{testResult.message}</span>
            </div>
          </div>
        )}

        {syncError && !testResult && (
          <div className="p-2 rounded-lg text-xs border bg-rose-50 border-rose-200 text-rose-800 flex items-center justify-between gap-1.5 animate-fadeIn">
            <div className="flex items-start gap-1.5 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] truncate">
                <span className="font-semibold">Notice: </span>
                <span>{syncError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (pendingChangesCount > 0) {
                  pushToSheetsNow();
                } else {
                  syncFromSheets();
                }
              }}
              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer shrink-0 transition-colors"
            >
              {language === 'pt' ? 'Tentar Novamente' : 'Retry Now'}
            </button>
          </div>
        )}
      </div>

      {/* Compact Synchronization Policy Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {t.syncPolicy}
          </h3>
          {pendingChangesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[9px] sm:text-[10px]">
              {pendingChangesCount} {t.inQueue}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSyncStrategy('smart_batch')}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'smart_batch'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1 font-bold text-[11px] sm:text-xs truncate">
              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{t.smartBatch}</span>
            </span>
            {syncStrategy === 'smart_batch' && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('interval_15m')}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'interval_15m'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1 font-bold text-[11px] sm:text-xs truncate">
              <Clock className="w-3 h-3 text-sky-500 shrink-0" />
              <span className="truncate">{t.interval15m}</span>
            </span>
            {syncStrategy === 'interval_15m' && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('manual')}
            className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'manual'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1 font-bold text-[11px] sm:text-xs truncate">
              <Gauge className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{t.manualPush}</span>
            </span>
            {syncStrategy === 'manual' && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Backend Apps Script Code - Compact, Space-Efficient Copy Widget */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {language === 'pt' ? 'Código Apps Script (Backend)' : 'Backend Apps Script Code'}
            </h4>
            <p className="text-[10px] text-slate-500 truncate">
              {language === 'pt' ? 'Extensões > Apps Script no Google Sheets' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="View code and deployment instructions"
          >
            {language === 'pt' ? 'Ver' : 'View'}
          </button>

          <button
            type="button"
            onClick={handleCopyScript}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title="Copy entire Apps Script code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>{language === 'pt' ? 'Copiado!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>{language === 'pt' ? 'Copiar Código' : 'Copy Code'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  {language === 'pt' ? 'Código do Backend Google Apps Script' : 'Google Apps Script Backend Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 overflow-hidden flex-1 flex flex-col">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">
                  {language === 'pt' ? 'Instruções de Instalação:' : 'Deployment Steps:'}
                </span>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-500">
                  <li>{language === 'pt' ? 'No Google Sheets, abra Extensões > Apps Script.' : 'In Google Sheets, open Extensions > Apps Script.'}</li>
                  <li>{language === 'pt' ? 'Cole este código substituindo todo o conteúdo de Code.gs.' : 'Replace everything in Code.gs with this code.'}</li>
                  <li>{language === 'pt' ? 'Clique em Implementar > Nova implementação > Tipo: Aplicação Web.' : 'Click Deploy > New deployment > Select type: Web app.'}</li>
                  <li>{language === 'pt' ? 'Defina "Executar como: Eu" e "Quem tem acesso: Qualquer pessoa".' : 'Set "Execute as: Me" and "Who has access: Anyone".'}</li>
                </ol>
              </div>

              <div className="flex-1 min-h-0 relative rounded-xl border border-slate-200 bg-slate-950 p-3 overflow-y-auto font-mono text-[10px] text-slate-300">
                <pre className="whitespace-pre">{SELF_HEALING_APPS_SCRIPT_CODE}</pre>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {t.close}
              </button>

              <button
                type="button"
                onClick={handleCopyScript}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{copied ? (language === 'pt' ? 'Copiado!' : 'Copied!') : (language === 'pt' ? 'Copiar Todo o Código' : 'Copy All Code')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
