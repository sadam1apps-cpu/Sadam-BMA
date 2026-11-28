import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { QuoteRequest, QuoteRequestStatus } from '../../types';
import { formatDateOnly } from '../../utils/dateFormat';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  ArrowLeft,
  Ban,
  Power,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    quoteRequests,
    quoteSettings,
    newQuoteRequestsCount,
    selectedMessageId,
    setSelectedMessageId,
    updateQuoteRequestStatus,
    deleteQuoteRequest,
    toggleWebsiteMessagesEnabled,
    blockQuoteSender,
    unblockQuoteSender,
    language,
  } = useBusiness();

  const isPt = language === 'pt';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteRequestStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedItemsPage, setSelectedItemsPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<QuoteRequest | null>(null);
  const [blockTarget, setBlockTarget] = useState<QuoteRequest | null>(null);
  const [blockEmailChecked, setBlockEmailChecked] = useState(true);
  const [blockDomainChecked, setBlockDomainChecked] = useState(false);
  const [blockPhoneChecked, setBlockPhoneChecked] = useState(true);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [manualBlockInput, setManualBlockInput] = useState('');
  const [manualBlockType, setManualBlockType] = useState<'email' | 'phone'>('email');
  const [blockedModalPage, setBlockedModalPage] = useState(1);
  const [fullNotesModalText, setFullNotesModalText] = useState<string | null>(null);

  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Dynamically fit exact rows inside available height so inbox never scrolls
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;

    const computeRows = () => {
      const height = el.clientHeight;
      if (height > 0) {
        const rowHeight = 56;
        const count = Math.max(3, Math.floor(height / rowHeight));
        setItemsPerPage(count);
      }
    };

    computeRows();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(computeRows);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', computeRows);
    return () => window.removeEventListener('resize', computeRows);
  }, []);

  const statusLabels: Record<QuoteRequestStatus, string> = {
    new: isPt ? 'Novo' : 'New',
    reviewed: isPt ? 'Analisado' : 'Reviewed',
    quoted: isPt ? 'Cotado' : 'Quoted',
    archived: isPt ? 'Arquivado' : 'Archived',
  };

  const getStatusStyle = (status: QuoteRequestStatus | string) => {
    if (status === 'reviewed') {
      return { label: statusLabels.reviewed, textClass: 'text-amber-700', dotClass: 'bg-amber-500' };
    }
    if (status === 'quoted') {
      return { label: statusLabels.quoted, textClass: 'text-emerald-700', dotClass: 'bg-emerald-600' };
    }
    if (status === 'archived') {
      return { label: statusLabels.archived, textClass: 'text-slate-500', dotClass: 'bg-slate-400' };
    }
    return { label: statusLabels.new, textClass: 'text-indigo-700', dotClass: 'bg-indigo-600' };
  };

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return quoteRequests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (!query) return true;
      return (
        req.referenceId.toLowerCase().includes(query) ||
        req.fullName.toLowerCase().includes(query) ||
        (req.organization || '').toLowerCase().includes(query) ||
        req.email.toLowerCase().includes(query) ||
        (req.phone || '').toLowerCase().includes(query) ||
        (req.notes || '').toLowerCase().includes(query) ||
        req.selectedItems.some((item) => item.toLowerCase().includes(query))
      );
    });
  }, [quoteRequests, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRequests = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, safePage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (!selectedMessageId && paginatedRequests.length > 0 && window.innerWidth >= 1024) {
      setSelectedMessageId(paginatedRequests[0].id);
    }
  }, [paginatedRequests, selectedMessageId, setSelectedMessageId]);

  useEffect(() => {
    setSelectedItemsPage(1);
  }, [selectedMessageId]);

  const selectedRequest =
    quoteRequests.find((q) => q.id === selectedMessageId) || null;

  const statusCounts = useMemo(
    () => ({
      all: quoteRequests.length,
      new: quoteRequests.filter((q) => q.status === 'new').length,
      reviewed: quoteRequests.filter((q) => q.status === 'reviewed').length,
      quoted: quoteRequests.filter((q) => q.status === 'quoted').length,
      archived: quoteRequests.filter((q) => q.status === 'archived').length,
    }),
    [quoteRequests]
  );

  const blockedCount =
    quoteSettings.blockedEmails.length + quoteSettings.blockedPhones.length;

  const blockedEntries = useMemo(
    () => [
      ...quoteSettings.blockedEmails.map((val) => ({ type: 'email' as const, value: val })),
      ...quoteSettings.blockedPhones.map((val) => ({ type: 'phone' as const, value: val })),
    ],
    [quoteSettings.blockedEmails, quoteSettings.blockedPhones]
  );

  const BLOCKED_PER_PAGE = 5;
  const totalBlockedPages = Math.max(1, Math.ceil(blockedEntries.length / BLOCKED_PER_PAGE));
  const safeBlockedPage = Math.min(blockedModalPage, totalBlockedPages);
  const paginatedBlockedEntries = blockedEntries.slice(
    (safeBlockedPage - 1) * BLOCKED_PER_PAGE,
    safeBlockedPage * BLOCKED_PER_PAGE
  );

  // Paginate requested items inside detail view so long lists never trigger scrollbars
  const ITEMS_PER_DETAIL_PAGE = 4;
  const selectedItemsTotal = selectedRequest?.selectedItems.length || 0;
  const selectedItemsTotalPages = Math.max(
    1,
    Math.ceil(selectedItemsTotal / ITEMS_PER_DETAIL_PAGE)
  );
  const safeItemsPage = Math.min(selectedItemsPage, selectedItemsTotalPages);
  const visibleSelectedItems = selectedRequest
    ? selectedRequest.selectedItems.slice(
        (safeItemsPage - 1) * ITEMS_PER_DETAIL_PAGE,
        safeItemsPage * ITEMS_PER_DETAIL_PAGE
      )
    : [];

  const openBlockModal = (req: QuoteRequest) => {
    setBlockTarget(req);
    setBlockEmailChecked(Boolean(req.email));
    setBlockDomainChecked(false);
    setBlockPhoneChecked(Boolean(req.phone));
  };

  const handleConfirmBlockSender = () => {
    if (!blockTarget) return;
    let emailPattern: string | undefined;
    if (blockDomainChecked && blockTarget.email.includes('@')) {
      emailPattern = `@${blockTarget.email.split('@')[1].trim().toLowerCase()}`;
    } else if (blockEmailChecked && blockTarget.email) {
      emailPattern = blockTarget.email.trim().toLowerCase();
    }
    const phoneToBlock = blockPhoneChecked && blockTarget.phone ? blockTarget.phone.trim() : undefined;
    if (emailPattern || phoneToBlock) {
      blockQuoteSender(emailPattern, phoneToBlock);
    }
    setBlockTarget(null);
  };

  const handleAddManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualBlockInput.trim();
    if (!clean) return;
    if (manualBlockType === 'email') {
      blockQuoteSender(clean.toLowerCase(), undefined);
    } else {
      blockQuoteSender(undefined, clean);
    }
    setManualBlockInput('');
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteQuoteRequest(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Compact Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shrink-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
            <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {isPt ? 'Mensagens' : 'Messages'}
            </h1>
            {newQuoteRequestsCount > 0 && (
              <span className="text-xs font-semibold text-indigo-600 tabular-nums whitespace-nowrap">
                · {newQuoteRequestsCount} {isPt ? 'nova(s)' : 'new'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Website Intake Toggle */}
            <button
              type="button"
              onClick={toggleWebsiteMessagesEnabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                quoteSettings.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title={
                quoteSettings.enabled
                  ? isPt
                    ? 'Clique para desativar mensagens do website'
                    : 'Click to disable receiving messages from website'
                  : isPt
                  ? 'Clique para ativar mensagens do website'
                  : 'Click to enable receiving messages from website'
              }
            >
              <Power className="w-3.5 h-3.5 shrink-0" />
              <span>
                {quoteSettings.enabled
                  ? isPt
                    ? 'Website: Ativo'
                    : 'Website: On'
                  : isPt
                  ? 'Website: Desativado'
                  : 'Website: Off'}
              </span>
            </button>

            {/* Blocked Senders Button */}
            <button
              type="button"
              onClick={() => {
                setBlockedModalPage(1);
                setIsBlockedModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                {isPt ? 'Bloqueados' : 'Blocked'} ({blockedCount})
              </span>
            </button>
          </div>
        </div>

        {/* Second Toolbar Row: Segmented Filter + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto">
            {(['all', 'new', 'reviewed', 'quoted', 'archived'] as const).map((key) => {
              const active = statusFilter === key;
              const label =
                key === 'all' ? (isPt ? 'Todos' : 'All') : statusLabels[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label} ({statusCounts[key]})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isPt ? 'Pesquisar...' : 'Search name, ref, item...'}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {!quoteSettings.enabled && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span className="truncate font-medium">
                {isPt
                  ? 'Receção de mensagens do website desativada.'
                  : 'Website message intake is disabled.'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleWebsiteMessagesEnabled}
              className="text-[11px] font-bold underline hover:no-underline shrink-0 cursor-pointer"
            >
              {isPt ? 'Reativar' : 'Enable'}
            </button>
          </div>
        )}
      </div>

      {/* Master-Detail No-Scroll Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        {/* Left List (Paginated, Zero Scroll) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 overflow-hidden ${
            selectedRequest ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div
            ref={listContainerRef}
            className="flex-1 min-h-0 divide-y divide-slate-100 overflow-hidden flex flex-col"
          >
            {paginatedRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="w-7 h-7 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {isPt ? 'Nenhuma mensagem' : 'No messages found'}
                </p>
              </div>
            ) : (
              paginatedRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const style = getStatusStyle(req.status);
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedMessageId(req.id)}
                    className={`w-full h-14 px-3 text-left transition-colors cursor-pointer flex flex-col justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-50/70'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-xs truncate ${
                            req.status === 'new'
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-800'
                          }`}
                        >
                          {req.fullName || req.email}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold shrink-0 ${style.textClass}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5 pl-3 text-[11px] text-slate-500 min-w-0">
                      <span className="truncate">
                        {req.organization || req.referenceId}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                        {formatDateOnly(req.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Inbox Pagination Footer */}
          {filteredRequests.length > itemsPerPage && (
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
              <span className="tabular-nums">
                {safePage} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel (Compact, Zero Scroll) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 overflow-hidden ${
            selectedRequest ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {isPt ? 'Selecione uma mensagem' : 'Select a message'}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              {/* Top Action & Sender Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedMessageId(null)}
                    className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                    aria-label={isPt ? 'Voltar' : 'Back'}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {selectedRequest.fullName || selectedRequest.email}
                      </h2>
                      {selectedRequest.organization && (
                        <span className="text-xs text-slate-500 truncate">
                          · {selectedRequest.organization}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-indigo-700 font-semibold">
                        {selectedRequest.referenceId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateOnly(selectedRequest.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${getStatusStyle(selectedRequest.status).textClass}`}>
                        {getStatusStyle(selectedRequest.status).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Controls */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => updateQuoteRequestStatus(selectedRequest.id, 'reviewed')}
                    disabled={selectedRequest.status === 'reviewed'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer whitespace-nowrap ${
                      selectedRequest.status === 'reviewed'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 opacity-75 cursor-default'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">{statusLabels.reviewed}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateQuoteRequestStatus(selectedRequest.id, 'quoted')}
                    disabled={selectedRequest.status === 'quoted'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer whitespace-nowrap ${
                      selectedRequest.status === 'quoted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 opacity-75 cursor-default'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="hidden sm:inline">{statusLabels.quoted}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuoteRequestStatus(
                        selectedRequest.id,
                        selectedRequest.status === 'archived' ? 'new' : 'archived'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    title={
                      selectedRequest.status === 'archived'
                        ? isPt
                          ? 'Reabrir'
                          : 'Reopen'
                        : statusLabels.archived
                    }
                  >
                    <Archive className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openBlockModal(selectedRequest)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border bg-white text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer whitespace-nowrap"
                    title={isPt ? 'Bloquear remetente' : 'Block sender'}
                  >
                    <Ban className="w-3 h-3" />
                    <span className="hidden sm:inline">{isPt ? 'Bloquear' : 'Block'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedRequest)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border bg-white text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer whitespace-nowrap"
                    title={isPt ? 'Eliminar' : 'Delete'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Compact Content Area (Zero Nested Boxes, Fits Viewport) */}
              <div className="flex-1 min-h-0 px-3.5 py-3 flex flex-col gap-3 overflow-hidden">
                {/* Flat Contact & Delivery Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pb-2.5 border-b border-slate-100 shrink-0">
                  {selectedRequest.email && (
                    <a
                      href={`mailto:${selectedRequest.email}`}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium truncate"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedRequest.email}</span>
                    </a>
                  )}
                  {selectedRequest.phone && (
                    <a
                      href={`tel:${selectedRequest.phone}`}
                      className="flex items-center gap-1.5 text-slate-700 hover:text-indigo-700 font-medium tabular-nums truncate"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedRequest.phone}</span>
                    </a>
                  )}
                  {selectedRequest.deliveryFormat && (
                    <div className="flex items-center gap-1.5 text-slate-700 truncate">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedRequest.deliveryFormat}</span>
                    </div>
                  )}
                  {selectedRequest.preferredDate && (
                    <div className="flex items-center gap-1.5 text-slate-700 tabular-nums truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateOnly(selectedRequest.preferredDate)}</span>
                    </div>
                  )}
                </div>

                {/* Selected Items (Paginated if > 4 so never overflows) */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {isPt ? 'Itens Solicitados' : 'Requested Items'} ({selectedItemsTotal})
                    </span>
                    {selectedItemsTotalPages > 1 && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 tabular-nums">
                        <span>
                          {safeItemsPage}/{selectedItemsTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={safeItemsPage <= 1}
                          onClick={() => setSelectedItemsPage((p) => Math.max(1, p - 1))}
                          className="p-0.5 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={safeItemsPage >= selectedItemsTotalPages}
                          onClick={() =>
                            setSelectedItemsPage((p) => Math.min(selectedItemsTotalPages, p + 1))
                          }
                          className="p-0.5 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {visibleSelectedItems.length > 0 && (
                    <ul className="divide-y divide-slate-100 border-t border-b border-slate-100">
                      {visibleSelectedItems.map((item, idx) => (
                        <li
                          key={`${selectedRequest.id}-item-${safeItemsPage}-${idx}`}
                          className="py-1.5 text-xs text-slate-800 font-medium truncate"
                          title={item}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Client Notes (Only shown if provided) */}
                {selectedRequest.notes?.trim() && (
                  <div className="pt-2 border-t border-slate-100 shrink-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {isPt ? 'Notas' : 'Notes'}
                      </span>
                      {selectedRequest.notes.length > 140 && (
                        <button
                          type="button"
                          onClick={() => setFullNotesModalText(selectedRequest.notes || '')}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {isPt ? 'Ler tudo' : 'Read full'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Sender Modal */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setBlockTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-4 z-10">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isPt ? 'Bloquear Remetente Online' : 'Block Online Sender'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBlockTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <p className="text-slate-600">
                {isPt
                  ? `Bloquear futuras mensagens de ${blockTarget.fullName}:`
                  : `Block future website messages from ${blockTarget.fullName}:`}
              </p>

              {blockTarget.email && (
                <label className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockEmailChecked}
                    onChange={(e) => {
                      setBlockEmailChecked(e.target.checked);
                      if (e.target.checked) setBlockDomainChecked(false);
                    }}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="truncate font-medium">{blockTarget.email}</span>
                </label>
              )}

              {blockTarget.email.includes('@') && (
                <label className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockDomainChecked}
                    onChange={(e) => {
                      setBlockDomainChecked(e.target.checked);
                      if (e.target.checked) setBlockEmailChecked(false);
                    }}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="truncate font-medium">
                    @{blockTarget.email.split('@')[1]} ({isPt ? 'todo o domínio' : 'entire domain'})
                  </span>
                </label>
              )}

              {blockTarget.phone && (
                <label className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockPhoneChecked}
                    onChange={(e) => setBlockPhoneChecked(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="font-mono">{blockTarget.phone}</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setBlockTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockSender}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
              >
                {isPt ? 'Bloquear' : 'Block Sender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Blocked Online Users Modal */}
      {isBlockedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsBlockedModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-4 z-10">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isPt ? 'Utilizadores Online Bloqueados' : 'Blocked Online Senders'} ({blockedCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockedModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Email, @domain, or Phone to Block List */}
            <form onSubmit={handleAddManualBlock} className="mt-3 flex items-center gap-1.5">
              <select
                value={manualBlockType}
                onChange={(e) => setManualBlockType(e.target.value as 'email' | 'phone')}
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="email">{isPt ? 'Email/@Domínio' : 'Email/@Domain'}</option>
                <option value="phone">{isPt ? 'Telefone' : 'Phone'}</option>
              </select>
              <input
                type="text"
                value={manualBlockInput}
                onChange={(e) => setManualBlockInput(e.target.value)}
                placeholder={
                  manualBlockType === 'email'
                    ? 'user@domain.com or @domain.com'
                    : '+258 84 000 0000'
                }
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isPt ? 'Bloquear' : 'Block'}</span>
              </button>
            </form>

            {/* Paginated Blocked List */}
            <div className="mt-3 divide-y divide-slate-100 border-t border-b border-slate-100">
              {paginatedBlockedEntries.length === 0 ? (
                <p className="py-5 text-center text-xs text-slate-500">
                  {isPt ? 'Nenhum remetente bloqueado.' : 'No blocked emails or phones.'}
                </p>
              ) : (
                paginatedBlockedEntries.map((entry) => (
                  <div
                    key={`${entry.type}-${entry.value}`}
                    className="py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.type === 'email' ? (
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate font-medium text-slate-800">{entry.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockQuoteSender(entry.type, entry.value)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer shrink-0"
                    >
                      {isPt ? 'Desbloquear' : 'Unblock'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {blockedEntries.length > BLOCKED_PER_PAGE && (
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                <span>
                  {safeBlockedPage} / {totalBlockedPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeBlockedPage <= 1}
                    onClick={() => setBlockedModalPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={safeBlockedPage >= totalBlockedPages}
                    onClick={() =>
                      setBlockedModalPage((p) => Math.min(totalBlockedPages, p + 1))
                    }
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Notes Modal (only if notes exceed preview) */}
      {fullNotesModalText !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setFullNotesModalText(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-4 z-10">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {isPt ? 'Notas do Cliente' : 'Client Notes'}
              </h3>
              <button
                type="button"
                onClick={() => setFullNotesModalText(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {fullNotesModalText}
            </p>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-4 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPt ? 'Eliminar Mensagem?' : 'Delete Message?'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {deleteTarget.referenceId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {isPt
                ? `Eliminar permanentemente o pedido de ${deleteTarget.fullName}?`
                : `Permanently delete the message from ${deleteTarget.fullName}?`}
            </p>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                {isPt ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
