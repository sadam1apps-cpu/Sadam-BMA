import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  SHEETS_DATABASE_SCHEMAS,
  SELF_HEALING_APPS_SCRIPT_CODE,
  SheetSchema,
} from '../../services/sheetsDb';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  Gauge,
  Activity,
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
    apiQuotaStats,
    refreshQuotaStats,
  } = useBusiness();

  const [inputUrl, setInputUrl] = useState(sheetsUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sheets?: string[];
  } | null>(null);

  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copiedSheetName, setCopiedSheetName] = useState<string | null>(null);
  const [expandedSheet, setExpandedSheet] = useState<string | null>('Products');
  const [showScriptCode, setShowScriptCode] = useState(false);

  // Handle URL save & test
  const handleSaveUrl = () => {
    setSheetsUrl(inputUrl);
    setTestResult(null);
  };

  const handleTest = async () => {
    const url = inputUrl.trim();
    if (!url) {
      setTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    setSheetsUrl(url);

    const res = await testSheetsConnection(url);
    setTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
      sheets: res.sheets,
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SELF_HEALING_APPS_SCRIPT_CODE);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2500);
  };

  const handleCopyColumns = (schema: SheetSchema, format: 'tsv' | 'csv') => {
    const headerNames = schema.columns.map((c) => c.name);
    const text = format === 'tsv' ? headerNames.join('\t') : headerNames.join(', ');
    navigator.clipboard.writeText(text);
    setCopiedSheetName(`${schema.sheetName}_${format}`);
    setTimeout(() => setCopiedSheetName(null), 2500);
  };

  const percentOfCeiling = Math.min(
    100,
    Math.round((apiQuotaStats.totalCallsToday / apiQuotaStats.dailySafeCeiling) * 100)
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Banner: Connection & Quick Sync */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Google Sheets Database
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
                    ? 'Connected & Active'
                    : sheetsSyncStatus === 'syncing'
                    ? 'Synchronizing...'
                    : sheetsSyncStatus === 'error'
                    ? 'Connection Error'
                    : 'Local Storage (Unlinked)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {spreadsheetTitle ? `Linked to "${spreadsheetTitle}"` : 'Zero-login spreadsheet backend with self-healing columns'}
                {lastSyncedAt && ` • Last synced: ${lastSyncedAt}`}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => syncFromSheets()}
              disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Pull latest data from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Pull from Sheets</span>
            </button>

            <button
              type="button"
              onClick={() => pushToSheetsNow()}
              disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Push all app records to Google Sheets"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Push All to Sheets</span>
            </button>
          </div>
        </div>

        {/* Script URL Input Bar */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Google Apps Script Web App URL
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                Save URL
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
          {/* Prominent Apps Script Setup & One-Click Copy Banner */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-emerald-50/60 border border-indigo-200/90 rounded-xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Step 1: Get Backend Apps Script Code
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      Google Sheet Backend
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Copy this backend script and paste into your Google Sheet under{' '}
                    <strong className="text-slate-800">Extensions &gt; Apps Script</strong>, then deploy as Web App.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
                    copyCodeSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98]'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyCodeSuccess ? 'Backend Code Copied!' : 'Copy Backend Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowScriptCode(!showScriptCode)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>{showScriptCode ? 'Hide Code' : 'View Code'}</span>
                  {showScriptCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick 4-step instructions checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-white/90 p-2 rounded-lg border border-indigo-100/80">
                <span className="font-bold text-indigo-900 block mb-0.5">1. Open Sheet</span>
                <span className="text-slate-600">Open or create your Google Sheet, click <strong>Extensions &gt; Apps Script</strong>.</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-indigo-100/80">
                <span className="font-bold text-indigo-900 block mb-0.5">2. Paste Code</span>
                <span className="text-slate-600">Delete any code in <code>Code.gs</code>, click <strong>Copy Backend Code</strong> above and paste it.</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-indigo-100/80">
                <span className="font-bold text-indigo-900 block mb-0.5">3. Deploy Web App</span>
                <span className="text-slate-600">Click <strong>Deploy &gt; New deployment</strong> &gt; Web app. Set <strong>Who has access: Anyone</strong>.</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-indigo-100/80">
                <span className="font-bold text-indigo-900 block mb-0.5">4. Paste URL Below</span>
                <span className="text-slate-600">Copy the generated Web App URL and paste it in the field below to connect!</span>
              </div>
            </div>

            {/* Code viewer preview right inside this banner when toggled */}
            {showScriptCode && (
              <div className="mt-2 pt-2 border-t border-indigo-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 font-semibold text-[11px]">
                    Code.gs (Self-Healing Google Apps Script API)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copyCodeSuccess ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-72 border border-slate-800 select-all leading-relaxed">
                  {SELF_HEALING_APPS_SCRIPT_CODE}
                </pre>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400">
            Deployed as Web App with <strong>&ldquo;Who has access: Anyone&rdquo;</strong> to allow seamless access for all staff without requiring individual Google logins.
          </p>
        </div>

        {/* Test Connection Results / Feedback */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
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
                <div className="text-[11px] mt-1 text-emerald-700">
                  Detected sheet tabs: {testResult.sheets.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {syncError && !testResult && (
          <div className="p-2.5 rounded-lg text-xs border bg-rose-50 border-rose-200 text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Sync Notice: </span>
              <span>{syncError}</span>
            </div>
          </div>
        )}
      </div>

      {/* API Quota & Rate Limit Protection Architecture Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-xl border border-slate-800 p-3.5 sm:p-4 text-white shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  API Quota &amp; Rate Limit Protection Engine
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quota Safe ({percentOfCeiling}% of safe ceiling)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Offline-first local caching, debounced smart batching, and Google Apps Script concurrency locking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshQuotaStats}
            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Activity className="w-3 h-3" />
            <span>Refresh Quota Meter</span>
          </button>
        </div>

        {/* Live Call Counter & Quota Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Calls Today</div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">
              {apiQuotaStats.totalCallsToday}{' '}
              <span className="text-[11px] font-normal text-slate-400">/ {apiQuotaStats.dailySafeCeiling}</span>
            </div>
            <div className="w-full bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${Math.max(2, percentOfCeiling)}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Google Daily Limit: ~20,000+</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Read Calls (Pulls)</div>
            <div className="text-base sm:text-lg font-bold text-sky-400 mt-0.5">
              {apiQuotaStats.readsToday}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              Local cache serves 99% of reads with 0 API calls
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Write Calls (Batches)</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
              {apiQuotaStats.writesToday}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              {pendingChangesCount > 0
                ? `${pendingChangesCount} changes queued in buffer`
                : 'All local records synchronized'}
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Last API Sync</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 truncate">
              {apiQuotaStats.lastCallTimestamp || 'No calls yet today'}
            </div>
            <div className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LockService Active</span>
            </div>
          </div>
        </div>

        {/* Sync Strategy Selector */}
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60 space-y-2">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Active Synchronization Policy (Choose How Quota is Preserved)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSyncStrategy('smart_batch')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                syncStrategy === 'smart_batch'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-xs'
                  : 'bg-slate-850/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Smart Auto-Batch</span>
                </span>
                {syncStrategy === 'smart_batch' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Debounces rapid sales by 25s. 100 sales in a rush = only 1 single write call. Recommended for stores.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSyncStrategy('interval_15m')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                syncStrategy === 'interval_15m'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-xs'
                  : 'bg-slate-850/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>15-Minute Interval</span>
                </span>
                {syncStrategy === 'interval_15m' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Syncs background updates at most every 15 min. Consumes max 40 calls in a 10-hour business day.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSyncStrategy('manual')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                syncStrategy === 'manual'
                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-xs'
                  : 'bg-slate-850/60 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manual / Shift Sync</span>
                </span>
                {syncStrategy === 'manual' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                100% offline-first. Operations execute instantly locally. Push once at register close (1-2 calls/day).
              </p>
            </button>
          </div>
        </div>

        {/* 5-Layer Quota Protection Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px] text-slate-300 pt-1">
          <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            <div className="font-bold text-white mb-0.5">1. Zero-Read Cache</div>
            <div className="text-slate-400">Viewing products, reports, customers, and margins uses 0 network calls.</div>
          </div>
          <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            <div className="font-bold text-white mb-0.5">2. Write Debouncing</div>
            <div className="text-slate-400">Bursts of sales are queued locally into a single atomic push payload.</div>
          </div>
          <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            <div className="font-bold text-white mb-0.5">3. 2D Array Writes</div>
            <div className="text-slate-400">Hundreds of rows write in 1 single `setValues()` operation on the sheet.</div>
          </div>
          <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            <div className="font-bold text-white mb-0.5">4. LockService Guard</div>
            <div className="text-slate-400">Prevents concurrent cashier collisions and Google 429 concurrency errors.</div>
          </div>
          <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
            <div className="font-bold text-white mb-0.5">5. Zero-Lag POS</div>
            <div className="text-slate-400">Cashiers never wait for Google Sheets network latency at the counter.</div>
          </div>
        </div>
      </div>

      {/* Self-Healing Architecture Explanation & Quick Setup */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 sm:p-4 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Professional Self-Healing Column Architecture</span>
          </div>
          <button
            type="button"
            onClick={() => setShowScriptCode(!showScriptCode)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{showScriptCode ? 'Hide Apps Script Code' : 'View / Copy Apps Script Code'}</span>
            {showScriptCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-0.5">1. Column Order Agnostic</div>
            <div>Columns are matched by header name in Row 1. If you rearrange columns or add custom notes columns, the app never breaks.</div>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-0.5">2. Self-Healing Headers</div>
            <div>If any required header is missing from your sheet, the script automatically detects and appends it to Row 1 on the fly.</div>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-0.5">3. Zero Staff Barriers</div>
            <div>No Google login or permission prompts required for staff. All sales, stock, and records sync directly to your spreadsheet.</div>
          </div>
        </div>

        {/* Collapsible Apps Script Code & Guide */}
        {showScriptCode && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs">Ready-to-Paste Google Apps Script Code</span>
                <p className="text-[10px] text-slate-500">
                  Paste into <em>Extensions &gt; Apps Script</em> in your Google Sheet, then Deploy as Web App.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-semibold text-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copyCodeSuccess ? 'Script Copied!' : 'Copy Entire Script Code'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-60 border border-slate-800 select-all">
              {SELF_HEALING_APPS_SCRIPT_CODE}
            </pre>
          </div>
        )}
      </div>

      {/* Sheet Names & Column Specifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Required Sheet Tabs &amp; Column Definitions ({SHEETS_DATABASE_SCHEMAS.length} Sheets)
            </h3>
            <p className="text-[11px] text-slate-500">
              Manually create these sheet tab names in your Google Sheet. Click any sheet to view details or copy headers directly into Row 1.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {SHEETS_DATABASE_SCHEMAS.map((schema) => {
            const isExpanded = expandedSheet === schema.sheetName;
            const isTsvCopied = copiedSheetName === `${schema.sheetName}_tsv`;
            const isCsvCopied = copiedSheetName === `${schema.sheetName}_csv`;

            return (
              <div
                key={schema.sheetName}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-white"
              >
                {/* Accordion Row Header */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                  <div
                    onClick={() => setExpandedSheet(isExpanded ? null : schema.sheetName)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {schema.sheetName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {schema.sheetName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-medium">
                          {schema.columns.length} columns
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {schema.title} &mdash; {schema.description}
                      </p>
                    </div>
                  </div>

                  {/* Copy Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyColumns(schema, 'tsv')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        isTsvCopied
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                      title="Copy tab-separated headers to paste directly into Row 1 in Google Sheets"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>{isTsvCopied ? 'Copied Row 1!' : 'Copy for Sheets'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyColumns(schema, 'csv')}
                      className={`hidden sm:flex px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer items-center gap-1 ${
                        isCsvCopied
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                      title="Copy comma-separated list of column headers"
                    >
                      <span>{isCsvCopied ? 'CSV Copied' : 'CSV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedSheet(isExpanded ? null : schema.sheetName)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Column Details */}
                {isExpanded && (
                  <div className="p-2.5 sm:p-3 border-t border-slate-200 space-y-2">
                    {/* Header preview chips */}
                    <div className="flex flex-wrap gap-1 items-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                        Row 1 Headers ({schema.columns.length}):
                      </span>
                      {schema.columns.map((col) => (
                        <span
                          key={col.name}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold border border-slate-200"
                        >
                          {col.name}
                        </span>
                      ))}
                    </div>

                    {/* Columns detailed table */}
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="pb-1.5 font-bold">Column Name</th>
                            <th className="pb-1.5 font-bold">Type</th>
                            <th className="pb-1.5 font-bold">Description</th>
                            <th className="pb-1.5 font-bold">Sample Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schema.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-50/50">
                              <td className="py-1.5 font-mono font-bold text-slate-900 pr-2">
                                {col.name}
                              </td>
                              <td className="py-1.5 text-slate-500 pr-2">
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700">
                                  {col.type}
                                </span>
                              </td>
                              <td className="py-1.5 text-slate-600 pr-2">
                                {col.description}
                              </td>
                              <td className="py-1.5 font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                                {col.sample}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
