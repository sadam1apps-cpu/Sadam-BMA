import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { UserRole } from '../../types';
import {
  Bell,
  Shield,
  Plus,
  Store,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
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
    resetDemoData,
    sheetsSyncStatus,
    sheetsUrl,
    setActiveNavTab,
    syncFromSheets,
    currentUser,
    logout,
    lockScreen,
    setIsLoginModalOpen,
  } = useBusiness();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    owner: {
      label: 'Store Owner',
      desc: 'Full access to all operations, P&L, and data',
    },
    manager: {
      label: 'Duty Manager',
      desc: 'Full access (Zero login/permission barrier)',
    },
    cashier: {
      label: 'POS Cashier',
      desc: 'Full access (Zero login/permission barrier)',
    },
    inventory_clerk: {
      label: 'Inventory Clerk',
      desc: 'Full access (Zero login/permission barrier)',
    },
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-xs shrink-0">
      <div className="w-full px-2 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-13 sm:h-16 gap-2">
          
          {/* Left: Business Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-xs sm:text-base text-white truncate max-w-[120px] sm:max-w-xs">
                  {profile.name}
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Live
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                {currentDateFormatted}
              </span>
            </div>
          </div>

          {/* Right: User Session, Role Switcher, Alerts, Quick Sale */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Authenticated Staff Button & Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-2.5 py-1 text-xs rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-2xs"
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
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-medium leading-none capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
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
                            <div className="font-medium text-xs">My Permissions</div>
                            <div className="text-[10px] text-slate-400">View access rights &amp; restrictions</div>
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
                            <div className="font-medium text-xs">Lock Terminal</div>
                            <div className="text-[10px] text-slate-400">Lock screen with PIN required</div>
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
                            <div className="font-medium text-xs">Switch Staff Account</div>
                            <div className="text-[10px] text-slate-400">Quick sign-in as another user</div>
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
                            <div className="font-medium text-xs">Sign Out</div>
                            <div className="text-[10px] text-rose-300/70">End active staff session</div>
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </button>
            )}

            {/* Assigned Role & Privileges Badge */}
            <button
              id="role-badge-btn"
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Click to view your active permissions & assigned role privileges"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-slate-400">Role:</span>
              <span className="font-semibold text-white">
                {roleLabels[currentRole]?.label || currentRole}
              </span>
            </button>

            {/* Notifications Alert Bell */}
            <button
              id="header-alerts-btn"
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="View alerts and notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-0 right-0 px-1 py-0.2 text-[9px] font-bold bg-rose-500 text-white rounded-full leading-none">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Reset Demo Data Button */}
            <div className="relative">
              <button
                id="reset-demo-btn"
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                title="Reset demo data"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>

              {showResetConfirm && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowResetConfirm(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-slate-200 text-xs">
                    <p className="font-semibold text-white">Reset Demo Data?</p>
                    <p className="text-slate-400 mt-1">
                      Restore starting sales, expenses, and inventory alerts.
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2.5 py-1 text-slate-300 hover:bg-slate-700 rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetDemoData();
                          setShowResetConfirm(false);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Google Sheets DB Status Indicator (Restricted to Owner/Admin with database privileges) */}
            {(currentRole === 'owner' || permissions.canManageDatabase) && (
              <button
                id="header-sheets-db-btn"
                type="button"
                onClick={() => setActiveNavTab('settings')}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  sheetsSyncStatus === 'connected'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : sheetsSyncStatus === 'syncing'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
                    : sheetsSyncStatus === 'error'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Google Sheets Database Integration (Click to view sheets, columns & sync)"
              >
                {sheetsSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                ) : (
                  <FileSpreadsheet
                    className={`w-3.5 h-3.5 shrink-0 ${
                      sheetsSyncStatus === 'connected'
                        ? 'text-emerald-400'
                        : sheetsSyncStatus === 'error'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  />
                )}
                <span className="hidden md:inline">
                  {sheetsSyncStatus === 'connected'
                    ? 'Sheets DB'
                    : sheetsSyncStatus === 'syncing'
                    ? 'Syncing...'
                    : sheetsSyncStatus === 'error'
                    ? 'Sheets Error'
                    : 'Sheets DB'}
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

            {/* Primary Action Button: + New Sale */}
            <button
              id="header-new-sale-btn"
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sale</span>
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
