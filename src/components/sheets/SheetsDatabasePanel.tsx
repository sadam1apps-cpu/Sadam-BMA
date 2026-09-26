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
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
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
    apiQuotaStats,
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
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
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

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Connection & Web App URL Setup Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
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
                    ? 'Connected'
                    : sheetsSyncStatus === 'syncing'
                    ? 'Syncing...'
                    : sheetsSyncStatus === 'error'
                    ? 'Connection Error'
                    : 'Unlinked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {spreadsheetTitle ? `Linked to "${spreadsheetTitle}"` : 'Spreadsheet sync with automatic column matching'}
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
              <span>Pull Data</span>
            </button>

            <button
              type="button"
              onClick={() => pushToSheetsNow()}
              disabled={!sheetsUrl || sheetsSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Push all app records to Google Sheets"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Push All</span>
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
        </div>

        {/* Streamlined Setup Instructions & Copy Script Box */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Backend Apps Script Code
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Paste into your sheet under <strong>Extensions &gt; Apps Script</strong>, deploy as <strong>Web App</strong> (Who has access: <strong>Anyone</strong>), and save the Web App URL above.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyScript}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                  copyCodeSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copyCodeSuccess ? 'Code Copied!' : 'Copy Backend Script'}</span>
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

          {/* Collapsible script viewer */}
          {showScriptCode && (
            <div className="pt-2 border-t border-indigo-100 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-700 font-semibold text-[11px]">
                  Code.gs (Self-Healing Apps Script API)
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
              <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-60 border border-slate-800 select-all leading-relaxed">
                {SELF_HEALING_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Test Connection Results Banner */}
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
                  Detected tabs: {testResult.sheets.join(', ')}
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

      {/* Synchronization Policy Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Synchronization Policy
            </h3>
            <p className="text-[11px] text-slate-500">
              Choose how data changes are pushed to your Google Sheet.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span>Calls today: <strong>{apiQuotaStats.totalCallsToday}</strong> / {apiQuotaStats.dailySafeCeiling}</span>
            {pendingChangesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                {pendingChangesCount} in queue
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSyncStrategy('smart_batch')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              syncStrategy === 'smart_batch'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Smart Auto-Batch</span>
              </span>
              {syncStrategy === 'smart_batch' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Batches rapid sales into atomic updates. Recommended for store operations.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('interval_15m')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              syncStrategy === 'interval_15m'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>15-Minute Interval</span>
              </span>
              {syncStrategy === 'interval_15m' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Syncs pending changes every 15 minutes. Preserves background quota.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSyncStrategy('manual')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              syncStrategy === 'manual'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                <span>Manual Push Only</span>
              </span>
              {syncStrategy === 'manual' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              100% offline-first. Data is only pushed when clicking &ldquo;Push All&rdquo;.
            </p>
          </button>
        </div>
      </div>

      {/* Sheet Tabs & Row 1 Headers Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Required Sheet Tabs ({SHEETS_DATABASE_SCHEMAS.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Create these tabs in your sheet. Click &ldquo;Copy Row 1 Headers&rdquo; to paste headers directly into Row 1.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {SHEETS_DATABASE_SCHEMAS.map((schema) => {
            const isExpanded = expandedSheet === schema.sheetName;
            const isTsvCopied = copiedSheetName === `${schema.sheetName}_tsv`;

            return (
              <div
                key={schema.sheetName}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white"
              >
                {/* Accordion Row */}
                <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2 bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                  <div
                    onClick={() => setExpandedSheet(isExpanded ? null : schema.sheetName)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                      {schema.sheetName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {schema.sheetName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-medium">
                        {schema.columns.length} cols
                      </span>
                      <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                        &mdash; {schema.title}
                      </span>
                    </div>
                  </div>

                  {/* Copy Action Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyColumns(schema, 'tsv')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        isTsvCopied
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
                      }`}
                      title="Copy tab-separated headers to paste into Row 1 of this Google Sheet tab"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>{isTsvCopied ? 'Copied Row 1!' : 'Copy Row 1 Headers'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedSheet(isExpanded ? null : schema.sheetName)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Column Chips */}
                {isExpanded && (
                  <div className="p-2.5 border-t border-slate-200 bg-slate-50/50">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                        Row 1 Headers:
                      </span>
                      {schema.columns.map((col) => (
                        <span
                          key={col.name}
                          className="px-1.5 py-0.5 rounded bg-white text-slate-800 font-mono text-[10px] font-semibold border border-slate-200 shadow-2xs"
                        >
                          {col.name}
                        </span>
                      ))}
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
