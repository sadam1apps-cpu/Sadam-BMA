import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { PERMISSION_METADATA } from '../../types';
import {
  Shield,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Sparkles,
  Lock,
  Layers,
} from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, currentRole, permissions } = useBusiness();

  if (!isOpen) return null;

  const roleName = currentUser ? currentUser.role : currentRole;
  const userName = currentUser ? currentUser.name : 'Store Session';
  const hasCustomOverrides =
    Boolean(currentUser?.customPermissions && Object.keys(currentUser.customPermissions).length > 0);

  const categories = [
    { id: 'financial', title: 'Financial & Cash Balances' },
    { id: 'pos', title: 'POS Operations & Invoicing' },
    { id: 'inventory', title: 'Inventory & Products' },
    { id: 'management', title: 'Staff, Team & Reports' },
  ] as const;

  const permissionKeys = Object.keys(PERMISSION_METADATA) as (keyof typeof PERMISSION_METADATA)[];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Active Permissions
                </h3>
                {hasCustomOverrides && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Customized
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {userName} • {roleName.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2.5 text-indigo-900 text-xs">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Role: </span>
              <span className="capitalize">{roleName.replace('_', ' ')}</span>.
              {hasCustomOverrides
                ? ' This staff member has custom permission overrides applied by the store administrator.'
                : ' Standard permissions applied according to the company role policy.'}
            </div>
          </div>

          {categories.map((cat) => {
            const items = permissionKeys.filter(
              (key) => PERMISSION_METADATA[key].category === cat.id
            );

            return (
              <div key={cat.id} className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  {cat.title}
                </h4>
                <div className="space-y-1.5">
                  {items.map((key) => {
                    const meta = PERMISSION_METADATA[key];
                    const isGranted = Boolean(permissions[key]);
                    const isOverridden = Boolean(
                      currentUser?.customPermissions && key in currentUser.customPermissions
                    );

                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 ${
                          isGranted
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold ${
                                isGranted ? 'text-slate-900' : 'text-slate-500 line-through'
                              }`}
                            >
                              {meta.label}
                            </span>
                            {isOverridden && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Overridden
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{meta.description}</p>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isGranted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
