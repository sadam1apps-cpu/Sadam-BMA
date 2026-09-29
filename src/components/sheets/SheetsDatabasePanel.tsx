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
} from 'lucide-react';

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
    t,
  } = useBusiness();

  const [inputUrl, setInputUrl] = useState(sheetsUrl);
  const [testing, setTesting] = useState(false);
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

  return (
    <div className="space-y-2.5">
      {/* Cloud Database Connection & Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {t.cloudDbTitle}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
              <p className="text-[11px] text-slate-500">
                {spreadsheetTitle ? `"${spreadsheetTitle}"` : ''}
                {lastSyncedAt && ` • ${t.lastSynced}: ${lastSyncedAt}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !sheetsUrl}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200"
              title="Test connection to the cloud database"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Database className="w-3.5 h-3.5 text-slate-500" />}
              <span>{testing ? t.testing : t.testConnection}</span>
            </button>

            <button
              type="button"
              onClick={() => syncFromSheets()}
              disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Pull latest data from cloud database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{t.pullData}</span>
            </button>

            <button
              type="button"
              onClick={() => pushToSheetsNow()}
              disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="Push all app records to cloud database"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{t.pushAll}</span>
            </button>
          </div>
        </div>

        {/* Test Connection Result Notice */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 animate-fadeIn ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{testResult.message}</div>
              {testResult.sheets && (
                <div className="text-[11px] mt-0.5 text-emerald-700">
                  Tabs: {testResult.sheets.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {syncError && !testResult && (
          <div className="p-2.5 rounded-lg text-xs border bg-rose-50 border-rose-200 text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice: </span>
              <span>{syncError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Compact Synchronization Policy Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {t.syncPolicy}
          </h3>
          {pendingChangesCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
              {pendingChangesCount} {t.inQueue}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSyncStrategy('smart_batch')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'smart_batch'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{t.smartBatch}</span>
            </span>
            {syncStrategy === 'smart_batch' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('interval_15m')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'interval_15m'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-xs">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>{t.interval15m}</span>
            </span>
            {syncStrategy === 'interval_15m' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('manual')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              syncStrategy === 'manual'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-xs">
              <Gauge className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{t.manualPush}</span>
            </span>
            {syncStrategy === 'manual' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  );
};
