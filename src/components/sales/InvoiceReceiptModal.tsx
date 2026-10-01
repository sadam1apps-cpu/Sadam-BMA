import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Sale } from '../../types';
import { Printer, Download, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface InvoiceReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ sale, onClose }) => {
  const { profile, currentUser, language, t } = useBusiness();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!sale) return null;

  const saleDateFormatted = new Date(sale.timestamp).toLocaleString(
    language === 'pt' ? 'pt-PT' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  );

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash':
        return t.cash;
      case 'bank_transfer':
        return t.bankTransfer;
      case 'mobile_money':
        return t.mobileMoney;
      case 'pos_card':
        return t.posCard;
      case 'credit':
        return t.credit;
      default:
        return String(method).replace(/_/g, ' ');
    }
  };

  const paymentMethodLabel = getPaymentMethodLabel(sale.paymentMethod);

  // Professional print function that uses clean print CSS
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print error:', err);
      setNotice({
        message: language === 'pt' ? 'Não foi possível acionar a impressão direta.' : 'Could not trigger print window.',
        type: 'error',
      });
    }
  };

  // High-fidelity vector PDF generation & download
  const handleSavePdf = () => {
    try {
      setIsGeneratingPdf(true);
      setNotice(null);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = profile.logo ? 14 : 22;

      // 0. Business Logo (if configured)
      if (profile.logo) {
        try {
          const logoW = 22;
          const logoH = 22;
          doc.addImage(profile.logo, (pageWidth - logoW) / 2, y, logoW, logoH);
          // Generous vertical margin so logo never touches the business name or details
          y += logoH + 13;
        } catch (e) {
          console.warn('PDF logo render warning:', e);
        }
      }

      // 1. Store Business Name & Details
      const storeName = (profile.businessName || profile.name || '').toUpperCase();
      if (storeName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(storeName, pageWidth / 2, y, { align: 'center' });
        y += 7;
      }

      if (profile.tagline) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(profile.tagline, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);

      if (profile.address) {
        doc.text(profile.address, pageWidth / 2, y, { align: 'center' });
        y += 4.5;
      }

      const contacts = [
        profile.phone ? `${t.phoneLabel}: ${profile.phone}` : '',
        profile.email ? `${t.emailLabel}: ${profile.email}` : '',
      ]
        .filter(Boolean)
        .join('  •  ');

      if (contacts) {
        doc.text(contacts, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }

      // Divider Line
      y += 2;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // 2. Receipt Meta Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'D');

      const colLeft = margin + 4;
      const colRight = margin + contentWidth / 2 + 4;
      const metaY1 = y + 6;
      const metaY2 = y + 13;
      const metaY3 = y + 19;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${t.invoiceNo}:`, colLeft, metaY1);
      doc.text(`${t.dateTime}:`, colRight, metaY1);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sale.invoiceNumber, colLeft + 22, metaY1);
      doc.text(saleDateFormatted, colRight + 22, metaY1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${t.customer}:`, colLeft, metaY2);
      doc.text(`${t.issuedBy}:`, colRight, metaY2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const custText = sale.customerPhone
        ? `${sale.customerName} (${sale.customerPhone})`
        : sale.customerName;
      doc.text(custText, colLeft + 22, metaY2);
      const cashierText = sale.cashierName || currentUser?.name || profile.ownerName || '';
      if (cashierText) {
        doc.text(cashierText, colRight + 22, metaY2);
      }

      y += 31;

      // 3. Table Header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.line(margin, y + 7, pageWidth - margin, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      const colItem = margin + 3;
      const colQty = margin + contentWidth * 0.55;
      const colPrice = margin + contentWidth * 0.75;
      const colTotal = pageWidth - margin - 3;

      doc.text(t.item.toUpperCase(), colItem, y + 5);
      doc.text(t.qty.toUpperCase(), colQty, y + 5, { align: 'center' });
      doc.text(t.price.toUpperCase(), colPrice, y + 5, { align: 'right' });
      doc.text(t.total.toUpperCase(), colTotal, y + 5, { align: 'right' });

      y += 8;

      // 4. Line Items
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      sale.items.forEach((item) => {
        // Page break safety
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const itemName = item.productName || 'Product';
        doc.setFont('helvetica', 'bold');
        doc.text(itemName, colItem, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.text(String(item.quantity), colQty, y + 4.5, { align: 'center' });
        doc.text(`${profile.currency}${item.unitPrice.toLocaleString()}`, colPrice, y + 4.5, {
          align: 'right',
        });
        doc.setFont('helvetica', 'bold');
        doc.text(`${profile.currency}${item.subtotal.toLocaleString()}`, colTotal, y + 4.5, {
          align: 'right',
        });

        y += 6.5;
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, pageWidth - margin, y);
        y += 1.5;
      });

      // 5. Totals Breakdown
      y += 3;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      const summaryLabelX = margin + contentWidth * 0.6;
      const summaryValX = pageWidth - margin - 3;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      // Subtotal
      doc.text(`${t.subtotal}:`, summaryLabelX, y);
      doc.text(`${profile.currency}${sale.subtotal.toLocaleString()}`, summaryValX, y, {
        align: 'right',
      });
      y += 5;

      // Discount
      if (sale.discountAmount > 0) {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`${t.discount}:`, summaryLabelX, y);
        doc.text(`-${profile.currency}${sale.discountAmount.toLocaleString()}`, summaryValX, y, {
          align: 'right',
        });
        y += 5;
        doc.setTextColor(71, 85, 105);
      }

      // Tax
      if (sale.taxAmount > 0) {
        doc.text(`${t.tax}:`, summaryLabelX, y);
        doc.text(`+${profile.currency}${sale.taxAmount.toLocaleString()}`, summaryValX, y, {
          align: 'right',
        });
        y += 5;
      }

      // Grand Total
      y += 1;
      doc.setDrawColor(226, 232, 240);
      doc.line(summaryLabelX - 5, y, pageWidth - margin, y);
      y += 5.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${t.grandTotal}:`, summaryLabelX, y);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text(`${profile.currency}${sale.total.toLocaleString()}`, summaryValX, y, {
        align: 'right',
      });
      y += 6.5;

      // Payment details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${t.paymentMethod}:`, summaryLabelX, y);
      doc.text(paymentMethodLabel, summaryValX, y, { align: 'right' });
      y += 5;

      doc.text(`${t.amountPaid}:`, summaryLabelX, y);
      doc.text(`${profile.currency}${sale.amountPaid.toLocaleString()}`, summaryValX, y, {
        align: 'right',
      });
      y += 5;

      // Balance or Paid in Full badge
      if (sale.balanceDue > 0) {
        doc.setFillColor(255, 241, 242); // rose-50
        doc.roundedRect(summaryLabelX - 4, y - 4, contentWidth * 0.4 + 4, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text(`${t.balanceDue}:`, summaryLabelX, y);
        doc.text(`${profile.currency}${sale.balanceDue.toLocaleString()}`, summaryValX, y, {
          align: 'right',
        });
      } else {
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.roundedRect(summaryLabelX - 4, y - 4, contentWidth * 0.4 + 4, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text(`✓ ${t.fullPaymentReceived}`, summaryLabelX, y);
        doc.text(t.paidInFull, summaryValX, y, { align: 'right' });
      }

      y += 12;

      // Notes
      if (sale.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${t.notes}: ${sale.notes}`, margin, y);
        y += 8;
      }

      // Footer
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(profile.invoiceFooter || t.thankYouBusiness, pageWidth / 2, y, { align: 'center' });
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(t.goodsPurchasedCondition, pageWidth / 2, y, { align: 'center' });

      // Save PDF file
      doc.save(`Receipt-${sale.invoiceNumber}.pdf`);

      setNotice({
        message: t.pdfDownloadSuccess,
        type: 'success',
      });
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setNotice({
        message: language === 'pt' ? 'Erro ao gerar ficheiro PDF. A acionar janela de impressão...' : 'Could not generate PDF directly. Triggering print window...',
        type: 'error',
      });
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Dedicated Print Stylesheet for flawless isolation and paper printing */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-modal,
          #printable-receipt-modal * {
            visibility: visible !important;
          }
          #printable-receipt-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-receipt {
            max-width: 480px !important;
            margin: 0 auto !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-receipt-modal"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white"
      >
        <div className="fixed inset-0 no-print" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 print:shadow-none print:border-none print:w-full print:max-w-none">
          {/* Modal Top Actions (Hidden when printing) */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.receiptTitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Print receipt on POS thermal or office printer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.printReceipt}</span>
              </button>

              {/* Direct Save PDF Button */}
              <button
                type="button"
                onClick={handleSavePdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Generate and download receipt as PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.generatingPdf}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.savePdf}</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer ml-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {notice && (
            <div
              className={`px-4 py-2 text-xs flex items-center gap-1.5 border-b no-print animate-fadeIn ${
                notice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="font-semibold">{notice.message}</span>
            </div>
          )}

          {/* Printable Receipt Body */}
          <div id="printable-receipt" className="p-6 sm:p-8 space-y-5 text-slate-900 text-sm bg-white">
            {/* Store Information */}
            <div className="text-center border-b border-slate-200 pb-4">
              {profile.logo && (
                <div className="flex justify-center mb-5 sm:mb-6">
                  <div className="p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs inline-flex items-center justify-center">
                    <img
                      src={profile.logo}
                      alt={profile.businessName || profile.name || ''}
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                </div>
              )}
              {(profile.businessName || profile.name) && (
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                  {profile.businessName || profile.name}
                </h2>
              )}
              {profile.tagline && (
                <p className="text-xs text-slate-500 mt-1">{profile.tagline}</p>
              )}
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                {profile.address && <p>{profile.address}</p>}
                <p>
                  {profile.phone && `${t.phoneLabel}: ${profile.phone}`}
                  {profile.phone && profile.email && ' • '}
                  {profile.email && `${t.emailLabel}: ${profile.email}`}
                </p>
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500">{t.invoiceNo}:</span>
                <p className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-slate-500">{t.dateTime}:</span>
                <p className="font-medium text-slate-800">{saleDateFormatted}</p>
              </div>
              <div>
                <span className="text-slate-500">{t.customer}:</span>
                <p className="font-bold text-slate-900">{sale.customerName}</p>
                {sale.customerPhone && (
                  <p className="text-slate-500">{sale.customerPhone}</p>
                )}
              </div>
              <div>
                <span className="text-slate-500">{t.issuedBy}:</span>
                <p className="font-medium text-slate-800">
                  {sale.cashierName || currentUser?.name || profile.ownerName || ''}
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="text-left py-2">{t.item}</th>
                    <th className="text-center py-2">{t.qty}</th>
                    <th className="text-right py-2">{t.price}</th>
                    <th className="text-right py-2">{t.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-2.5 text-center text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {profile.currency}{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {profile.currency}{item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Breakdown */}
            <div className="border-t-2 border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t.subtotal}:</span>
                <span>{profile.currency}{sale.subtotal.toLocaleString()}</span>
              </div>

              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>{t.discount}:</span>
                  <span>-{profile.currency}{sale.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{t.tax}:</span>
                  <span>+{profile.currency}{sale.taxAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>{t.grandTotal}:</span>
                <span className="text-indigo-600">
                  {profile.currency}{sale.total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-700 pt-1">
                <span>{t.paymentMethod}:</span>
                <span className="font-semibold uppercase tracking-wider">
                  {paymentMethodLabel}
                </span>
              </div>

              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>{t.amountPaid}:</span>
                <span>{profile.currency}{sale.amountPaid.toLocaleString()}</span>
              </div>

              {sale.balanceDue > 0 ? (
                <div className="flex justify-between text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <span>{t.balanceDue}:</span>
                  <span>{profile.currency}{sale.balanceDue.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t.fullPaymentReceived}
                  </span>
                  <span>{t.paidInFull}</span>
                </div>
              )}
            </div>

            {/* Notes & Footer */}
            {sale.notes && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">{t.notes}: </span>
                {sale.notes}
              </div>
            )}

            <div className="text-center pt-2 text-xs text-slate-600 border-t border-dashed border-slate-300">
              <p className="font-semibold text-slate-800">{profile.invoiceFooter || t.thankYouBusiness}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t.goodsPurchasedCondition}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
