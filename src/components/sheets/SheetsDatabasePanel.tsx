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
  Flame,
  ShieldCheck,
  Layers,
  Wifi,
  Upload,
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
    profile,
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
      setTimeout(() => setFirebaseSyncNotice(null), 6000);
    } finally {
      setSyncingFirebase(false);
    }
  };

  // Sync inputUrl whenever sheetsUrl in context updates
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

  const quotaPercent = Math.min(
    100,
    Math.round((apiQuotaStats.totalCallsToday / (apiQuotaStats.dailySafeCeiling || 1500)) * 100)
  );

  return (
    <div className="space-y-3">
      {/* ========================================================= */}
      {/* 1. PRIMARY DATABASE: FIREBASE FIRESTORE                   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border-2 border-indigo-500/30 p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  Firebase Firestore
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  {language === 'pt' ? 'Base de Dados Principal' : 'Main Database'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    ? (language === 'pt' ? 'Ativo & Sincronizado' : 'Active & Connected')
                    : firebaseSyncStatus === 'connecting'
                    ? (language === 'pt' ? 'A ligar...' : 'Connecting...')
                    : (language === 'pt' ? 'Erro de Ligação' : 'Connection Error')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {language === 'pt'
                  ? 'Persistência profissional em tempo real na nuvem do Google Firebase'
                  : 'Professional real-time cloud persistence powered by Google Firebase'}
                {firebaseLastSyncedAt && ` • ${t.lastSynced}: ${firebaseLastSyncedAt}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePingFirebase}
              disabled={testingFirebase}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Verify active connection to Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
              <span>{language === 'pt' ? 'Verificar Ping' : 'Check Ping'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllToFirebase}
              disabled={syncingFirebase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
              title="Force sync all in-memory business records to Firebase Firestore"
            >
              <Upload className={`w-3.5 h-3.5 ${syncingFirebase ? 'animate-bounce' : ''}`} />
              <span>
                {syncingFirebase
                  ? (language === 'pt' ? 'A sincronizar tudo...' : 'Syncing All...')
                  : (language === 'pt' ? 'Sincronizar Tudo no Firebase' : 'Sync All Data to Firebase')}
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

        {/* Database specs pill bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'pt' ? 'Projeto Firebase' : 'Firebase Project'}
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-800 truncate block mt-0.5">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'pt' ? 'ID da Base de Dados' : 'Database ID'}
            </span>
            <span className="font-mono text-[11px] font-bold text-indigo-700 truncate block mt-0.5">
              {firebaseConfig.firestoreDatabaseId}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'pt' ? 'Coleções Ativas (11)' : 'Active Collections (11)'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
              <Layers className="w-3 h-3" />
              <span>{language === 'pt' ? '11 coleções ativas' : '11 active collections'}</span>
            </span>
          </div>
        </div>

        {/* Live synced collections breakdown */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              {language === 'pt' ? 'Registos Sincronizados no Firebase Firestore' : 'Live Synced Records in Firebase Firestore'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {language === 'pt' ? 'Tempo Real Ativo' : 'Real-time Live'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Business Profile</div>
              <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                {profile.businessName || profile.name || 'Synced (1 doc)'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Products</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {products.length} {language === 'pt' ? 'produtos' : 'items'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Customers</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {customers.length} {language === 'pt' ? 'clientes' : 'records'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Suppliers</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {suppliers.length} {language === 'pt' ? 'fornecedores' : 'records'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Expenses</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {expenses.length} {language === 'pt' ? 'despesas' : 'records'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Employees</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {employees.length} {language === 'pt' ? 'funcionários' : 'staff'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Accounts</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {accounts.length} {language === 'pt' ? 'contas' : 'accounts'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Quotations</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {quotations.length} {language === 'pt' ? 'orçamentos' : 'quotes'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Sales & Invoices</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {sales.length} {language === 'pt' ? 'vendas' : 'transactions'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Purchase Orders</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {purchaseOrders.length} {language === 'pt' ? 'encomendas' : 'orders'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Stock Movements</div>
              <div className="text-xs font-bold text-indigo-700 mt-0.5">
                {stockMovements.length} {language === 'pt' ? 'movimentos' : 'logs'}
              </div>
            </div>
          </div>
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
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Status & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Google Sheets
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {language === 'pt' ? 'Cópia de Segurança (Backup)' : 'Spreadsheet Backup'}
                </span>
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
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                {spreadsheetTitle ? `"${spreadsheetTitle}"` : (language === 'pt' ? 'Folha de cálculo conectada' : 'Connected spreadsheet')}
                {lastSyncedAt && ` • ${t.lastSynced}: ${lastSyncedAt}`}
              </p>
            </div>
          </div>

          {/* Quota Used Widget */}
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

        {/* Web App Endpoint URL Row */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {language === 'pt' ? 'URL do Web App Google Apps Script (Backup)' : 'Google Apps Script Web App URL (Backup)'}
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
                  message: language === 'pt' ? 'Configuração salva com sucesso!' : 'Configuration saved successfully!',
                });
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
            >
              {language === 'pt' ? 'Salvar' : 'Save'}
            </button>
          </div>
        </div>

        {/* Manual Actions for Spreadsheet Backup */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => pushToSheetsNow()}
            disabled={sheetsSyncStatus === 'syncing'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Fazer Backup para Folha Agora' : 'Backup to Spreadsheet Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => syncFromSheets()}
            disabled={sheetsSyncStatus === 'syncing'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{language === 'pt' ? 'Restaurar da Folha de Cálculo' : 'Restore from Spreadsheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestSheets}
            disabled={testingSheets}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${testingSheets ? 'animate-spin text-amber-500' : 'text-slate-500'}`} />
            <span>{language === 'pt' ? 'Testar Conexão' : 'Test Endpoint'}</span>
          </button>
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
              {language === 'pt' ? 'Tentar Novamente' : 'Retry Now'}
            </button>
          </div>
        )}
      </div>

      {/* Synchronization Policy Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3.5 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {language === 'pt' ? 'Política de Backup para Folha de Cálculo' : 'Spreadsheet Backup Schedule & Policy'}
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

      {/* Backend Apps Script Code */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900 truncate">
            {language === 'pt' ? 'Código Apps Script (Backup da Folha)' : 'Apps Script Code (Spreadsheet Backup)'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyScript}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          title="Copy Apps Script code"
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
  );
};
