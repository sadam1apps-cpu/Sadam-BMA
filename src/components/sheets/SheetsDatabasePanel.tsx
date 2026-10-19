import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Clock,
  Code2,
  Copy,
  Check,
  Flame,
  ShieldCheck,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { SELF_HEALING_APPS_SCRIPT_CODE } from '../../services/sheetsDb';
import firebaseConfig from '../../../firebase-applet-config.json';

export const SheetsDatabasePanel: React.FC = () => {
  const {
    firebaseSyncStatus,
    firebaseLastSyncedAt,
    firebaseError,
    retryFirebaseConnection,
    syncAllToFirebaseNow,
    products,
    sales,
    customers,
    suppliers,
    expenses,
    employees,
    accounts,
    quotations,
    purchaseOrders,
    stockMovements,
    sheetsUrl,
    setSheetsUrl,
    sheetsSyncStatus,
    lastSyncedAt,
    syncError,
    testSheetsConnection,
    syncFromSheets,
    pushToSheetsNow,
    syncStrategy,
    setSyncStrategy,
    pendingChangesCount,
    language,
    t,
  } = useBusiness();

  const [inputUrl, setInputUrl] = useState(sheetsUrl);
  const [testingSheets, setTestingSheets] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [firebaseSyncNotice, setFirebaseSyncNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sheets?: string[];
  } | null>(null);

  const handleSyncAllToFirebase = async () => {
    setSyncingFirebase(true);
    setFirebaseSyncNotice(null);
    try {
      const res = await syncAllToFirebaseNow();
      setFirebaseSyncNotice(res.message);
      setTimeout(() => setFirebaseSyncNotice(null), 5000);
    } finally {
      setSyncingFirebase(false);
    }
  };

  React.useEffect(() => {
    setInputUrl(sheetsUrl);
  }, [sheetsUrl]);

  const handleTestSheets = async () => {
    const url = (inputUrl || sheetsUrl).trim();
    if (!url) {
      setTestResult({ success: false, message: 'No Google Sheets backup endpoint URL configured.' });
      return;
    }
    setTestingSheets(true);
    setTestResult(null);

    const res = await testSheetsConnection(url);
    setTestingSheets(false);
    setTestResult({
      success: res.success,
      message: res.message,
      sheets: res.sheets,
    });
  };

  const handlePingFirebase = async () => {
    setTestingFirebase(true);
    await retryFirebaseConnection();
    setTestingFirebase(false);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(SELF_HEALING_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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

  const totalRecords =
    products.length +
    customers.length +
    suppliers.length +
    expenses.length +
    employees.length +
    accounts.length +
    quotations.length +
    sales.length +
    purchaseOrders.length +
    stockMovements.length;

  return (
    <div className="space-y-3">
      {/* ========================================================= */}
      {/* 1. PRIMARY DATABASE: FIREBASE FIRESTORE                   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-indigo-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-200/60 shadow-xs">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">Firebase Firestore</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  {language === 'pt' ? 'Principal' : 'Main Database'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    firebaseSyncStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : firebaseSyncStatus === 'connecting'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      firebaseSyncStatus === 'connected'
                        ? 'bg-emerald-500'
                        : firebaseSyncStatus === 'connecting'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  {firebaseSyncStatus === 'connected'
                    ? (language === 'pt' ? 'Ativo & Sincronizado' : 'Live & Synced')
                    : firebaseSyncStatus === 'connecting'
                    ? (language === 'pt' ? 'A conectar...' : 'Connecting...')
                    : (language === 'pt' ? 'Erro de Conexão' : 'Connection Error')}
                </span>
              </div>
              {firebaseLastSyncedAt && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.lastSynced}: {firebaseLastSyncedAt}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handlePingFirebase}
              disabled={testingFirebase}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Verify active Firestore connection latency"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{language === 'pt' ? 'Testar' : 'Ping'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllToFirebase}
              disabled={syncingFirebase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
              title="Force sync all records to Firebase"
            >
              <Upload className={`w-3.5 h-3.5 ${syncingFirebase ? 'animate-bounce' : ''}`} />
              <span>
                {syncingFirebase
                  ? (language === 'pt' ? 'A sincronizar...' : 'Syncing...')
                  : (language === 'pt' ? 'Sincronizar' : 'Sync All')}
              </span>
            </button>
          </div>
        </div>

        {firebaseSyncNotice && (
          <div className="p-2.5 rounded-lg text-xs border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{firebaseSyncNotice}</span>
          </div>
        )}

        {/* Clean summary strip */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span>
              <strong className="text-slate-900 font-bold">{totalRecords}</strong>{' '}
              {language === 'pt' ? 'registos na nuvem' : 'records in cloud'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium">11 {language === 'pt' ? 'coleções ativas' : 'active collections'}</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600">
            {language === 'pt' ? 'Tempo Real Ativo' : 'Real-time Live'}
          </span>
        </div>

        {firebaseError && (
          <div className="p-2.5 rounded-lg text-xs border bg-rose-50 border-rose-200 text-rose-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-[11px] truncate font-medium">{firebaseError}</span>
            </div>
            <button
              type="button"
              onClick={handlePingFirebase}
              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer shrink-0"
            >
              {language === 'pt' ? 'Reconectar' : 'Reconnect'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. SECONDARY DATABASE: GOOGLE SHEETS SPREADSHEET BACKUP    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100 shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">Google Sheets</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {language === 'pt' ? 'Cópia de Segurança' : 'Automated Backup'}
                </span>
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
                        : 'bg-rose-500'
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
              {lastSyncedAt && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.lastSynced}: {lastSyncedAt}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => pushToSheetsNow()}
              disabled={sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === 'pt' ? 'Fazer Backup' : 'Backup to Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={() => syncFromSheets()}
              disabled={sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Restore state from spreadsheet backup"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{language === 'pt' ? 'Restaurar' : 'Restore'}</span>
            </button>
          </div>
        </div>

        {/* Compact Backup Schedule Options (Zero Wasted Space) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-medium">
              {language === 'pt' ? 'Frequência de backup:' : 'Backup schedule:'}
            </span>
            {pendingChangesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                {pendingChangesCount} {t.inQueue}
              </span>
            )}
          </div>

          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSyncStrategy('smart_batch')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                syncStrategy === 'smart_batch'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Automatically backs up to Google Sheets in batches when records change"
            >
              {language === 'pt' ? 'Automático' : 'Smart Auto'}
            </button>
            <button
              type="button"
              onClick={() => setSyncStrategy('interval_15m')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                syncStrategy === 'interval_15m'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Backs up every 15 minutes if there are pending changes"
            >
              {language === 'pt' ? 'A cada 15m' : 'Every 15m'}
            </button>
            <button
              type="button"
              onClick={() => setSyncStrategy('manual')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                syncStrategy === 'manual'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Only backs up when you click 'Backup to Sheets'"
            >
              {language === 'pt' ? 'Manual' : 'Manual'}
            </button>
          </div>
        </div>

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
              {language === 'pt' ? 'Tentar Novamente' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. ADVANCED DEVELOPER SETTINGS (COLLAPSIBLE)              */}
      {/* ========================================================= */}
      <details className="group bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <summary className="cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between select-none list-none">
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'pt' ? 'Configurações Avançadas & Desenvolvedor' : 'Advanced & Developer Details'}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {/* Google Apps Script Endpoint URL Configuration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {language === 'pt' ? 'Endpoint do Google Apps Script (Backup)' : 'Google Apps Script Web App Endpoint'}
              </label>
              {inputUrl.trim() !== sheetsUrl.trim() && (
                <span className="text-[10px] text-amber-600 font-semibold animate-pulse">
                  {language === 'pt' ? 'Alterações não salvas' : 'Unsaved changes'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => {
                  setSheetsUrl(inputUrl);
                  setTestResult({
                    success: true,
                    message: language === 'pt' ? 'Configuração salva!' : 'Configuration saved!',
                  });
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
              >
                {language === 'pt' ? 'Salvar' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleTestSheets}
                disabled={testingSheets}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Test endpoint URL"
              >
                <Zap className={`w-3.5 h-3.5 ${testingSheets ? 'animate-spin text-amber-500' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>

          {/* Internal Project IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firebase Project</span>
              <span className="font-mono text-[11px] text-slate-800 truncate block mt-0.5">{firebaseConfig.projectId}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Database ID</span>
              <span className="font-mono text-[11px] text-indigo-700 truncate block mt-0.5">{firebaseConfig.firestoreDatabaseId}</span>
            </div>
          </div>

          {/* Apps Script Code Copy */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-600 font-medium">Google Apps Script Web App Code</span>
            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copied ? (language === 'pt' ? 'Copiado!' : 'Copied!') : (language === 'pt' ? 'Copiar Código' : 'Copy Code')}</span>
            </button>
          </div>
        </div>
      </details>
    </div>
  );
};
