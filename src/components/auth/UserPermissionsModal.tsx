import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { PERMISSION_METADATA } from '../../types';
import {
  Shield,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, currentRole, permissions, language, t } = useBusiness();

  if (!isOpen) return null;

  const roleName = currentUser ? currentUser.role : currentRole;
  const userName = currentUser ? currentUser.name : (language === 'pt' ? 'Sessão do Terminal' : 'Store Session');
  const hasCustomOverrides =
    Boolean(currentUser?.customPermissions && Object.keys(currentUser.customPermissions).length > 0);

  const permissionKeys = Object.keys(PERMISSION_METADATA) as (keyof typeof PERMISSION_METADATA)[];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Compact Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white truncate">
                  {language === 'pt' ? 'Permissões Ativas' : 'Active Role Permissions'}
                </h3>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                  {roleName.replace('_', ' ')}
                </span>
                {hasCustomOverrides && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {language === 'pt' ? 'Personalizado' : 'Customized'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {userName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permissions Grid - Space-efficient 2-column layout */}
        <div className="p-3 sm:p-4 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissionKeys.map((key) => {
              const meta = PERMISSION_METADATA[key];
              const isGranted = Boolean(permissions[key]);
              const isOverridden = Boolean(
                currentUser?.customPermissions && key in currentUser.customPermissions
              );

              return (
                <div
                  key={key}
                  title={meta.description}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    isGranted
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isGranted ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {meta.label}
                      </span>
                      {isOverridden && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          {language === 'pt' ? 'Alt.' : 'Mod.'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isGranted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'pt' ? 'Sim' : 'Granted'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{language === 'pt' ? 'Não' : 'Denied'}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            {permissionKeys.filter((k) => permissions[k]).length} / {permissionKeys.length} {language === 'pt' ? 'privilégios ativos' : 'privileges active'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
