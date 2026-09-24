import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  X,
  Bell,
  AlertTriangle,
  Package,
  Users,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { alerts, markAlertRead, dismissAlert, setActiveNavTab } = useBusiness();

  if (!isOpen) return null;

  const handleAction = (tab?: string, id?: string) => {
    if (tab) {
      setActiveNavTab(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Business Alerts & Notifications ({alerts.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 p-2">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">All clear!</p>
              <p className="text-xs text-slate-500 mt-0.5">
                No active stock or debtor alerts at this moment.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isWarning = alert.severity === 'warning';
              const isCritical = alert.severity === 'critical';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl transition-colors ${
                    alert.read ? 'bg-white opacity-70' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {alert.type === 'low_stock' ? (
                          <Package className="w-4 h-4" />
                        ) : alert.type === 'overdue_debt' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {alert.title}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {alert.actionTarget && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(alert.actionTarget?.tab, alert.actionTarget?.id)
                              }
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Take action</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {!alert.read && (
                            <button
                              type="button"
                              onClick={() => markAlertRead(alert.id)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
