import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { UserRole } from '../../types';
import {
  Lock,
  KeyRound,
  Mail,
  User,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  X,
  RefreshCw,
  Plus,
  ShieldAlert,
  LogOut,
  Database,
} from 'lucide-react';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  fullScreen?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onClose,
  fullScreen = false,
}) => {
  const {
    profile,
    employees,
    currentUser,
    isScreenLocked,
    unlockScreen,
    loginWithPin,
    loginWithCredentials,
    logout,
    sheetsUrl,
    sheetsSyncStatus,
    isInitialSyncLoading,
    syncFromSheets,
    addEmployee,
    setCurrentUser,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');
  const [pinInput, setPinInput] = useState<string>('');
  const [staffIdentifier, setStaffIdentifier] = useState<string>('');
  const [showIdentifierInput, setShowIdentifierInput] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  const [successUser, setSuccessUser] = useState<string | null>(null);

  // Rate-limiting / brute-force lockout defense
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Initial owner setup (only shown when DB is confirmed empty and not syncing)
  const [showOwnerSetup, setShowOwnerSetup] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const hiddenPinInputRef = useRef<HTMLInputElement>(null);

  // Database is actively establishing handshake or pulling rows
  const isConnecting =
    Boolean(sheetsUrl && sheetsUrl.trim()) &&
    (isInitialSyncLoading || sheetsSyncStatus === 'syncing') &&
    employees.length === 0;

  // Countdown timer for brute-force rate-limiting
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Keep hidden input focused for physical keyboards
  useEffect(() => {
    if (
      activeTab === 'pin' &&
      (employees.length > 0 || isScreenLocked) &&
      lockoutSeconds <= 0 &&
      !isConnecting
    ) {
      hiddenPinInputRef.current?.focus();
    }
  }, [activeTab, isScreenLocked, employees.length, lockoutSeconds, isConnecting]);

  const handleTabChange = (tab: 'pin' | 'password') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setPinInput('');
  };

  const handleKeypadPress = (val: string) => {
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);

    if (val === 'backspace') {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPinInput('');
    } else if (pinInput.length < 4) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (lockoutSeconds > 0) return;
    if (e.key === 'Backspace') {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (e.key === 'Escape' || e.key === 'Delete') {
      setPinInput('');
    } else if (/^[0-9]$/.test(e.key) && pinInput.length < 4) {
      const nextPin = pinInput + e.key;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleAuthFailure = (msg: string) => {
    setPinInput('');
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 5) {
      setLockoutSeconds(30);
      setErrorMessage('Too many failed attempts. Terminal locked for 30s.');
    } else {
      setErrorMessage(msg);
    }
  };

  const submitPin = (pinToSubmit = pinInput) => {
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);

    if (!pinToSubmit || pinToSubmit.length < 4) {
      setErrorMessage('Please enter 4-digit staff PIN.');
      return;
    }

    // Locked Terminal Screen Mode
    if (isScreenLocked && currentUser) {
      const res = unlockScreen(pinToSubmit);
      if (res.success) {
        setFailedAttempts(0);
        setSuccessAnimation(true);
        setSuccessUser(currentUser.name);
        setTimeout(() => {
          setSuccessAnimation(false);
          setSuccessUser(null);
          if (onClose) onClose();
        }, 300);
      } else {
        handleAuthFailure(res.message || 'Incorrect PIN. Try again.');
      }
      return;
    }

    // Secure PIN Authentication without public user enumeration
    const identifier = staffIdentifier.trim() || undefined;
    const res = loginWithPin(pinToSubmit, identifier);

    if (res.success) {
      setFailedAttempts(0);
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
        if (onClose) onClose();
      }, 300);
    } else {
      if (res.matchesCount && res.matchesCount > 1) {
        setShowIdentifierInput(true);
      }
      handleAuthFailure(res.message || 'Incorrect PIN. Try again.');
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);

    const res = loginWithCredentials(emailInput.trim(), passwordInput);
    if (res.success) {
      setFailedAttempts(0);
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
        if (onClose) onClose();
      }, 300);
    } else {
      handleAuthFailure(res.message || 'Invalid email or password.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none bg-[#060E21]/95 backdrop-blur-md"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        background: 'radial-gradient(ellipse at 50% 25%, rgba(0, 82, 204, 0.22), transparent 70%), #060E21',
      }}
    >
      {/* Hidden input to capture physical keyboard strokes on terminal */}
      <input
        ref={hiddenPinInputRef}
        type="password"
        maxLength={4}
        value={pinInput}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        className="opacity-0 pointer-events-none absolute -left-[9999px]"
        aria-hidden="true"
        disabled={lockoutSeconds > 0 || isConnecting}
      />

      <div className="w-full max-w-[340px] sm:max-w-[390px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,35,110,0.45)] border border-[#0052CC]/25 overflow-hidden flex flex-col my-auto relative shrink-0 transition-all">
        
        {/* Optional Close button (only when modal is optional dialog) */}
        {!fullScreen && !isScreenLocked && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Corporate Deep Navy Header */}
        <div className="bg-[#0B1B3D] text-white px-3.5 py-2.5 sm:px-5 sm:py-3 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00388A] flex items-center justify-center text-white shadow-md shadow-[#0052CC]/30 shrink-0">
                {isScreenLocked ? <Lock className="w-4 h-4 text-white" /> : <Store className="w-4 h-4 text-white" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-white truncate leading-tight tracking-tight">
                  {profile.name || 'Terminal Access'}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-300 truncate leading-normal">
                  {isScreenLocked
                    ? `Locked session for ${currentUser?.name || 'Staff'}`
                    : 'Secure staff authentication'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#0052CC]/25 text-[#93C5FD] border border-[#0052CC]/40 flex items-center gap-1 shadow-2xs">
                <Shield className="w-3 h-3 text-[#38BDF8]" />
                <span>Protected</span>
              </span>
            </div>
          </div>

          {/* STech Accent Line Motif */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0066FF] to-transparent opacity-80" />
        </div>

        {/* Authentication Mode Tabs (When not screen locked and accounts exist) */}
        {!isScreenLocked && (employees.length > 0 || !isConnecting) && (
          <div className="flex border-b border-slate-100 bg-[#F8FAFC] p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('pin')}
              className={`flex-1 py-1 sm:py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-[#0052CC] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-[#0B1B3D]'
              }`}
            >
              <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0052CC]" />
              <span>Quick PIN</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={`flex-1 py-1 sm:py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-[#0052CC] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-[#0B1B3D]'
              }`}
            >
              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0052CC]" />
              <span>Password</span>
            </button>
          </div>
        )}

        {/* Feedback / Alert Banners */}
        {errorMessage && (
          <div className="mx-3.5 sm:mx-4 mt-2 p-1.5 sm:p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-1.5 text-rose-800 text-xs shrink-0 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-tight text-[11px] sm:text-xs">{errorMessage}</div>
          </div>
        )}

        {lockoutSeconds > 0 && (
          <div className="mx-3.5 sm:mx-4 mt-2 p-1.5 sm:p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-xs shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="font-semibold text-[11px] sm:text-xs">
              Security lockout active: Retry in <strong>{lockoutSeconds}s</strong>
            </div>
          </div>
        )}

        {successAnimation && (
          <div className="mx-3.5 sm:mx-4 mt-2 p-1.5 sm:p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs animate-pulse shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="font-semibold text-[11px] sm:text-xs">
              {successUser ? `Access Granted: ${successUser}` : 'Access Granted. Entering session...'}
            </div>
          </div>
        )}

        {/* Modal Main Body (Tailored for zero vertical scroll on all screens) */}
        <div className="px-3 py-2 sm:px-4 sm:py-3 flex-1 flex flex-col justify-center">

          {/* 1. SEAMLESS DATABASE CONNECTING STATE */}
          {/* Shown while sync is active; NEVER flashes 'create owner' */}
          {isConnecting && (
            <div className="text-center py-6 sm:py-8 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EBF3FF] border border-[#B9D5FF] flex items-center justify-center text-[#0052CC] shadow-sm relative">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0052CC]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] absolute -top-1 -right-1 ring-2 ring-white animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1B3D]">
                  Connecting to Database
                </h3>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  Synchronizing secure staff credentials and terminal profiles...
                </p>
              </div>
            </div>
          )}

          {/* 2. CONFIRMED EMPTY DATABASE STATE */}
          {/* ONLY displayed if initial sync completed, zero records found, and not connecting */}
          {!isConnecting && employees.length === 0 && !showOwnerSetup && (
            <div className="text-center py-4 space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0B1B3D]">
                  No staff accounts configured
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                  Initialize your store owner account to get started with full privileges.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => syncFromSheets()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0052CC] hover:bg-[#0043A6] text-white flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#0052CC]/30 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. INITIAL OWNER REGISTRATION (If user clicked Create Owner on empty DB) */}
          {!isConnecting && employees.length === 0 && showOwnerSetup && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-[#0B1B3D]">Initialize Store Owner</span>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Email</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@store.com"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!ownerName.trim()) {
                    setErrorMessage('Please enter owner name.');
                    return;
                  }
                  const newEmp = addEmployee({
                    name: ownerName.trim(),
                    email: ownerEmail.trim() || 'owner@store.com',
                    phone: '',
                    role: 'owner',
                    monthlySalary: 0,
                    commissionRate: 0,
                    attendanceStatus: 'present',
                    pin: ownerPin.trim() || '1234',
                    password: ownerPassword.trim() || 'password',
                    status: 'active',
                    customPermissions: {},
                  });
                  setCurrentUser(newEmp);
                  setShowOwnerSetup(false);
                  if (onClose) onClose();
                }}
                className="w-full py-2 bg-[#0052CC] hover:bg-[#0043A6] text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-[#0052CC]/25 transition-all mt-1"
              >
                Save &amp; Enter Terminal
              </button>
            </div>
          )}

          {/* 4. ACTIVE QUICK PIN TERMINAL (NO PUBLIC DROPDOWN) */}
          {(employees.length > 0 || isScreenLocked) && !isConnecting && activeTab === 'pin' && (
            <div className="space-y-2">
              
              {/* Screen Lock Status Indicator */}
              {isScreenLocked && currentUser && (
                <div className="flex items-center justify-between bg-[#F0F5FF] border border-[#B9D5FF] rounded-xl px-2.5 py-1 text-xs text-[#0B1B3D]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Lock className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                    <span className="truncate text-[11px]">
                      Locked: <strong className="font-bold">{currentUser.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setPinInput('');
                      setErrorMessage(null);
                    }}
                    className="text-[10px] font-semibold text-[#0052CC] hover:text-[#00388A] flex items-center gap-1 cursor-pointer shrink-0 ml-1.5"
                    title="Log out active session and switch user"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Switch</span>
                  </button>
                </div>
              )}

              {/* Optional Staff Identifier Input (for shared default PIN environments) */}
              {!isScreenLocked && showIdentifierInput && (
                <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Work Email or Username
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIdentifierInput(false);
                        setStaffIdentifier('');
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="relative">
                    <User className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      placeholder="e.g. staff@company.com"
                      className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Masked PIN Indicators (Cobalt dots) */}
              <div className="flex flex-col items-center justify-center py-0.5">
                <div className="flex items-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          filled
                            ? 'bg-[#0052CC] scale-110 shadow-xs ring-2 ring-[#0052CC]/30 border border-[#0047BA]'
                            : 'bg-slate-100 border border-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  Enter 4-digit staff PIN
                </div>
              </div>

              {/* Responsive 3x4 Touch Keypad (Zero-scroll compact design) */}
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 max-w-[260px] sm:max-w-[280px] mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    disabled={lockoutSeconds > 0}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-8.5 sm:h-10 rounded-xl bg-slate-50/90 hover:bg-[#F0F5FF] hover:text-[#0052CC] active:bg-[#D0E2FF]/60 text-[#0B1B3D] text-base sm:text-lg font-bold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('clear')}
                  className="h-8.5 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 text-xs font-semibold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('0')}
                  className="h-8.5 sm:h-10 rounded-xl bg-slate-50/90 hover:bg-[#F0F5FF] hover:text-[#0052CC] active:bg-[#D0E2FF]/60 text-[#0B1B3D] text-base sm:text-lg font-bold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-2xs"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('backspace')}
                  className="h-8.5 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 text-xs font-semibold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                  aria-label="Backspace"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Action & Optional Disambiguation Link */}
              <div className="space-y-1 pt-0.5">
                <button
                  type="button"
                  disabled={lockoutSeconds > 0 || pinInput.length < 4}
                  onClick={() => submitPin()}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#00388A] hover:from-[#0047BA] hover:to-[#002F75] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0052CC]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{isScreenLocked ? 'Unlock Terminal' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {!isScreenLocked && !showIdentifierInput && (
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowIdentifierInput(true)}
                      className="text-[10px] text-slate-400 hover:text-[#0052CC] font-medium transition-colors cursor-pointer"
                    >
                      Multiple staff on this terminal? Specify Work Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. EMAIL & PASSWORD TAB */}
          {employees.length > 0 && !isScreenLocked && !isConnecting && activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-2.5 py-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Work Email or Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. staff@company.com"
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] bg-white text-[#0B1B3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-8 pr-8 py-1.5 sm:py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] bg-white text-[#0B1B3D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={lockoutSeconds > 0}
                className="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#00388A] hover:from-[#0047BA] hover:to-[#002F75] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0052CC]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

        {/* Corporate Security Guarantee Footer (STech Color Standardized) */}
        <div className="bg-[#F8FAFC] px-3 py-1.5 sm:py-2 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 shrink-0">
          <Shield className="w-3 h-3 text-[#0052CC]" />
          <span>Protected POS Access • Enterprise Security Engine</span>
        </div>

      </div>
    </div>
  );
};
