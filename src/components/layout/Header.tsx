import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { UserRole } from '../../types';
import {
  Bell,
  Shield,
  Plus,
  Store,
  CheckCircle2,
  ChevronDown,
  Database,
  RefreshCw,
  User,
  Lock,
  LogOut,
  KeyRound,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { UserPermissionsModal } from '../auth/UserPermissionsModal';

interface HeaderProps {
  onOpenNewSale: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewSale,
  onOpenNotifications,
}) => {
  const {
    profile,
    currentRole,
    permissions,
    alerts,
    sheetsSyncStatus,
    setActiveNavTab,
    currentUser,
    logout,
    lockScreen,
    setIsLoginModalOpen,
    language,
    t,
  } = useBusiness();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    owner: {
      label: language === 'pt' ? 'Proprietário' : 'Store Owner',
      desc: language === 'pt' ? 'Acesso total a todas as operações, DRE e dados' : 'Full access to all operations, P&L, and data',
    },
    manager: {
      label: language === 'pt' ? 'Gerente' : 'Duty Manager',
      desc: language === 'pt' ? 'Acesso operacional completo' : 'Full access (Zero login/permission barrier)',
    },
    cashier: {
      label: language === 'pt' ? 'Operador de Caixa' : 'POS Cashier',
      desc: language === 'pt' ? 'Terminal de vendas e faturação' : 'Full access (Zero login/permission barrier)',
    },
    inventory_clerk: {
      label: language === 'pt' ? 'Gestor de Stock' : 'Inventory Clerk',
      desc: language === 'pt' ? 'Gestão de catálogo e stock' : 'Full access (Zero login/permission barrier)',
    },
  };

  const currentDateFormatted = new Date().toLocaleDateString(
    language === 'pt' ? 'pt-PT' : 'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-xs shrink-0">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 sm:h-16 gap-1.5 sm:gap-3">
          
          {/* Left: Business Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial max-w-[45%] sm:max-w-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold tracking-tight text-xs sm:text-base text-white truncate">
                  {profile.name}
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Live
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 hidden lg:block truncate">
                {currentDateFormatted}
              </span>
            </div>
          </div>

          {/* Right: User Session, Role Switcher, Alerts, Quick Sale */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Authenticated Staff Button & Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 text-xs rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
                  title={`Logged in as ${currentUser.name}`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border border-slate-900" />
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[90px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-medium leading-none capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 text-xs animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-slate-700">
                        <div className="font-bold text-white text-xs">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                            {currentUser.role.replace('_', ' ')}
                          </span>
                          {currentUser.customPermissions &&
                            Object.keys(currentUser.customPermissions).length > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Customized
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setShowPermissionsModal(true);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-700 flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer transition-colors"
                        >
                          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <div className="font-medium text-xs">{language === 'pt' ? 'Minhas Permissões' : 'My Permissions'}</div>
                            <div className="text-[10px] text-slate-400">{language === 'pt' ? 'Ver direitos de acesso e restrições' : 'View access rights & restrictions'}</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            lockScreen();
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-700 flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer transition-colors"
                        >
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="font-medium text-xs">{language === 'pt' ? 'Bloquear Terminal' : 'Lock Terminal'}</div>
                            <div className="text-[10px] text-slate-400">{language === 'pt' ? 'Bloquear ecrã com PIN obrigatório' : 'Lock screen with PIN required'}</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setIsLoginModalOpen(true);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-700 flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-medium text-xs">{language === 'pt' ? 'Mudar de Conta' : 'Switch Staff Account'}</div>
                            <div className="text-[10px] text-slate-400">{language === 'pt' ? 'Iniciar sessão como outro funcionário' : 'Quick sign-in as another user'}</div>
                          </div>
                        </button>

                        <div className="border-t border-slate-700 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-500/20 flex items-center gap-2.5 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="font-medium text-xs">{language === 'pt' ? 'Terminar Sessão' : 'Sign Out'}</div>
                            <div className="text-[10px] text-rose-300/70">{language === 'pt' ? 'Encerrar sessão de trabalho atual' : 'End active staff session'}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'pt' ? 'Entrar' : 'Sign In'}</span>
                <span className="hidden sm:inline">{language === 'pt' ? ' no Terminal' : ' Staff'}</span>
              </button>
            )}

            {/* Assigned Role & Privileges Badge (Hidden on mobile < sm to save ~100px) */}
            <button
              id="role-badge-btn"
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Click to view your active permissions & assigned role privileges"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline text-slate-400">{language === 'pt' ? 'Cargo:' : 'Role:'}</span>
              <span className="font-semibold text-white truncate max-w-[90px]">
                {roleLabels[currentRole]?.label || currentRole}
              </span>
            </button>

            {/* Notifications Alert Bell */}
            <button
              id="header-alerts-btn"
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="View alerts and notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-0 right-0 px-1 py-0.2 text-[9px] font-bold bg-rose-500 text-white rounded-full leading-none">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Cloud Database Status Indicator (Hidden on mobile < md to prioritize + Sale) */}
            {(currentRole === 'owner' || permissions.canManageDatabase) && (
              <button
                id="header-cloud-db-btn"
                type="button"
                onClick={() => setActiveNavTab('settings')}
                className={`hidden md:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                  sheetsSyncStatus === 'syncing'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
                    : sheetsSyncStatus === 'connected'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : sheetsSyncStatus === 'error'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={
                  sheetsSyncStatus === 'syncing'
                    ? t.syncing
                    : `${t.cloudDatabase} - ${sheetsSyncStatus === 'connected' ? t.connected : sheetsSyncStatus === 'error' ? t.syncError : t.unlinked}`
                }
              >
                {sheetsSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                ) : (
                  <Database
                    className={`w-3.5 h-3.5 shrink-0 ${
                      sheetsSyncStatus === 'connected'
                        ? 'text-emerald-400'
                        : sheetsSyncStatus === 'error'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  />
                )}
                <span>
                  {sheetsSyncStatus === 'syncing' ? (
                    t.syncing
                  ) : (
                    <span className="hidden lg:inline">
                      {sheetsSyncStatus === 'connected'
                        ? t.cloudDatabase
                        : sheetsSyncStatus === 'error'
                        ? t.syncError
                        : t.cloudDatabase}
                    </span>
                  )}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sheetsSyncStatus === 'connected'
                      ? 'bg-emerald-400'
                      : sheetsSyncStatus === 'syncing'
                      ? 'bg-amber-400'
                      : sheetsSyncStatus === 'error'
                      ? 'bg-rose-400'
                      : 'bg-slate-500'
                  }`}
                />
              </button>
            )}

            {/* Primary Action Button: + New Sale (Always visible, highest priority) */}
            <button
              id="header-new-sale-btn"
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 z-10"
              title="Record a new point-of-sale invoice"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.quickSale}</span>
            </button>

          </div>
        </div>
      </div>

      {/* User Permissions Viewer Modal */}
      <UserPermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
      />
    </header>
  );
};
