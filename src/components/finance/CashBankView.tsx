import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Account } from '../../types';
import {
  Wallet,
  Building2,
  Smartphone,
  ArrowRightLeft,
  Plus,
  Edit2,
  Copy,
  Check,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { AccountRecordModal } from './AccountRecordModal';

interface CashBankViewProps {
  onOpenTransfer: () => void;
}

export const CashBankView: React.FC<CashBankViewProps> = ({ onOpenTransfer }) => {
  const { accounts, totalCashAndBank, profile, sales, expenses } = useBusiness();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleCopyDetails = (acc: Account) => {
    const lines = [
      `Account: ${acc.name}`,
      acc.bankName ? `Bank: ${acc.bankName}` : '',
      acc.accountHolder ? `Beneficiary: ${acc.accountHolder}` : '',
      acc.accountNumber ? `Account No: ${acc.accountNumber}` : '',
      acc.ibanOrNib ? `NIB / IBAN: ${acc.ibanOrNib}` : '',
      acc.swiftCode ? `SWIFT / BIC: ${acc.swiftCode}` : '',
      acc.branchName ? `Branch: ${acc.branchName}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(lines);
    setCopiedAccountId(acc.id);
    setTimeout(() => setCopiedAccountId(null), 2000);
  };

  // Unified activity log
  const recentActivities = [
    ...sales.map((s) => ({
      id: s.id,
      title: `Sale Receipt #${s.invoiceNumber}`,
      type: 'inflow' as const,
      amount: s.amountPaid,
      timestamp: s.timestamp,
      account: s.paymentMethod === 'cash' ? 'Cash Drawer' : 'Bank Account',
    })),
    ...expenses.map((e) => ({
      id: e.id,
      title: `Expense: ${e.title}`,
      type: 'outflow' as const,
      amount: e.amount,
      timestamp: e.timestamp,
      account: accounts.find((a) => a.id === e.accountId)?.name || 'Cash',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const pageSize = 8;
  const totalPages = Math.ceil(recentActivities.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedActivities = recentActivities.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Cash &amp; Bank Records
          </h1>
          <p className="text-xs text-slate-500">
            Manage internal bank details, account numbers, and cash registers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>

          <button
            type="button"
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5 shrink-0 max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar pb-0.5">
        {/* Total Liquidity Tile */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Available Reserves
              </span>
              <span className="text-[10px] bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300">
                All Ledgers
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {profile.currency}{totalCashAndBank.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-slate-300 mt-2 flex items-center justify-between border-t border-slate-700/60 pt-1.5">
            <span>{accounts.length} active account{accounts.length === 1 ? '' : 's'}</span>
            <span className="text-emerald-400 font-medium">Reconciled</span>
          </div>
        </div>

        {/* Individual Account Cards */}
        {accounts.map((acc) => {
          const isCash = acc.type === 'cash';
          const isMobile = acc.type === 'mobile_money';
          const hasBankDetails = Boolean(acc.bankName || acc.accountNumber || acc.ibanOrNib);

          return (
            <div
              key={acc.id}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-900 truncate block">
                      {acc.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 block">
                      {isCash
                        ? 'Cash Register Till'
                        : isMobile
                        ? acc.bankName || 'Mobile Money'
                        : acc.bankName || 'Bank Account Record'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      title="Edit bank and account details"
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isCash ? (
                      <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                    ) : isMobile ? (
                      <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                  {profile.currency}{acc.balance.toLocaleString()}
                </div>

                {/* Bank / Account Record Metadata */}
                {hasBankDetails && (
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100 font-mono">
                    {acc.accountNumber && (
                      <div className="truncate">
                        <span className="text-slate-600 font-sans font-medium">Acct:</span> {acc.accountNumber}
                      </div>
                    )}
                    {acc.ibanOrNib && (
                      <div className="truncate" title={`NIB/IBAN: ${acc.ibanOrNib}`}>
                        <span className="text-slate-600 font-sans font-medium">NIB:</span> {acc.ibanOrNib}
                      </div>
                    )}
                    {acc.accountHolder && (
                      <div className="truncate text-slate-600 font-sans">
                        <span className="text-slate-600 font-medium">Holder:</span> {acc.accountHolder}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(acc)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Edit Record
                </button>

                {hasBankDetails && (
                  <button
                    type="button"
                    onClick={() => handleCopyDetails(acc)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                    title="Copy details to send to customers"
                  >
                    {copiedAccountId === acc.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Stream Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
            Activity &amp; Ledger Feed
          </h2>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            {recentActivities.length} entries recorded
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions recorded yet in the ledger.
            </div>
          ) : (
            paginatedActivities.map((tx) => {
              const isInflow = tx.type === 'inflow';
              return (
                <div
                  key={`${tx.id}-${tx.title}`}
                  className="p-2 sm:p-2.5 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isInflow
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isInflow ? (
                        <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate">{tx.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {tx.account} • {new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-black text-xs shrink-0 ${
                      isInflow ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isInflow ? '+' : '-'}
                    {profile.currency}{tx.amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {recentActivities.length === 0
              ? '0 entries'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  recentActivities.length
                )} of ${recentActivities.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 px-1">
              {validPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Account Record Add / Edit Modal */}
      <AccountRecordModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={editingAccount}
      />
    </div>
  );
};
