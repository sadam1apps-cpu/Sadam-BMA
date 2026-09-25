import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Employee, UserRole } from '../../types';
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
    sheetsSyncStatus,
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

  // Initial owner setup if employee database is empty
  const [showOwnerSetup, setShowOwnerSetup] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const hiddenPinInputRef = useRef<HTMLInputElement>(null);

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
    if (activeTab === 'pin' && (employees.length > 0 || isScreenLocked) && lockoutSeconds <= 0) {
      hiddenPinInputRef.current?.focus();
    }
  }, [activeTab, isScreenLocked, employees.length, lockoutSeconds]);

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
      setErrorMessage('Too many failed attempts. Terminal locked for 30s for security.');
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
        }, 350);
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
      }, 350);
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
      }, 350);
    } else {
      handleAuthFailure(res.message || 'Invalid email or password.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden select-none"
      style={{ height: '100dvh', maxHeight: '100dvh' }}
    >
      {/* Hidden input to capture physical keyboard strokes on terminal */}
      <input
        ref={hiddenPinInputRef}
        type="password"
        maxLength={4}
        value={pinInput}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        className="opacity-0 pointer-events-none absolute -left-9999px"
        aria-hidden="true"
        disabled={lockoutSeconds > 0}
      />

      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-auto relative shrink-0">
        
        {/* Optional Close button (only when modal is a dismissible overlay, not login gate) */}
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

        {/* Professional Header */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-3.5 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                {isScreenLocked ? <Lock className="w-4 h-4 text-white" /> : <Store className="w-4 h-4 text-white" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
                  {profile.name || 'Terminal Access'}
                </h2>
                <p className="text-[11px] text-slate-300 truncate leading-normal">
                  {isScreenLocked
                    ? `Locked session for ${currentUser?.name || 'Staff'}`
                    : 'Secure staff authentication'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Protected</span>
              </span>
            </div>
          </div>
        </div>

        {/* Authentication Mode Switcher (Only when not screen unlock) */}
        {!isScreenLocked && (
          <div className="flex border-b border-slate-200 bg-slate-50 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('pin')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quick PIN</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>
        )}

        {/* Security / Error Alerts */}
        {errorMessage && (
          <div className="mx-4 mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs shrink-0 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {lockoutSeconds > 0 && (
          <div className="mx-4 mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-xs shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="font-semibold">
              Security lockout active: Retry in <strong>{lockoutSeconds}s</strong>
            </div>
          </div>
        )}

        {successAnimation && (
          <div className="mx-4 mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs animate-pulse shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="font-semibold">
              {successUser ? `Access Granted: ${successUser}` : 'Access Granted. Entering session...'}
            </div>
          </div>
        )}

        {/* Content Container (Tailored for zero scroll on all screens) */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center">

          {/* CONNECTING / SYNCHRONIZING WITH DATABASE */}
          {employees.length === 0 && sheetsSyncStatus === 'syncing' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Connecting to Secure Database
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Synchronizing staff credentials and security profiles. Please wait a moment...
                </p>
              </div>
            </div>
          )}

          {/* EMPTY DATABASE STATE (Only after sync finished and no records exist) */}
          {employees.length === 0 && sheetsSyncStatus !== 'syncing' && !showOwnerSetup && (
            <div className="text-center py-4 space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  No staff accounts configured
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Initialize your store owner account to get started with full administrative privileges.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => syncFromSheets()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* INITIAL OWNER REGISTRATION (If DB is empty) */}
          {employees.length === 0 && showOwnerSetup && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-900">Initialize Store Owner</span>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer mt-1"
              >
                Save &amp; Enter Terminal
              </button>
            </div>
          )}

          {/* TAB 1: SECURE QUICK PIN TERMINAL (NO PUBLIC DROPDOWN) */}
          {(employees.length > 0 || isScreenLocked) && activeTab === 'pin' && (
            <div className="space-y-2.5">
              
              {/* Screen Lock Status Banner */}
              {isScreenLocked && currentUser && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Session locked for <strong className="font-bold">{currentUser.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setPinInput('');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                    title="Log out active session and switch user"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Switch</span>
                  </button>
                </div>
              )}

              {/* Optional Staff Identifier Input (Used when PIN is ambiguous or for extra security) */}
              {!isScreenLocked && showIdentifierInput && (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Work Email or Username (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIdentifierInput(false);
                        setStaffIdentifier('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      placeholder="e.g. sarah.j@store.com or staff ID"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Masked PIN Indicators */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="flex items-center gap-3.5">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          filled
                            ? 'bg-indigo-600 scale-110 shadow-xs'
                            : 'bg-slate-200 border border-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  Enter 4-digit staff security PIN
                </div>
              </div>

              {/* Responsive 3x4 Touch Keypad */}
              <div className="grid grid-cols-3 gap-1.5 max-w-[280px] mx-auto w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    disabled={lockoutSeconds > 0}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 text-slate-800 text-base sm:text-lg font-bold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('clear')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 text-xs font-semibold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 text-slate-800 text-base sm:text-lg font-bold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-2xs"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => handleKeypadPress('backspace')}
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 text-xs font-semibold border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                  aria-label="Backspace"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Action & Optional Disambiguation Link */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={lockoutSeconds > 0 || pinInput.length < 4}
                  onClick={() => submitPin()}
                  className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isScreenLocked ? 'Unlock Terminal' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {!isScreenLocked && !showIdentifierInput && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowIdentifierInput(true)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                    >
                      Multiple staff on this terminal? Specify Work Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STANDARD EMAIL & PASSWORD AUTHENTICATION */}
          {employees.length > 0 && !isScreenLocked && activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3 py-1">
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
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
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
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
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
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

        {/* Professional Security Guarantee Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400 shrink-0">
          <Shield className="w-3 h-3 text-indigo-500" />
          <span>Protected POS Access • Anti-Enumeration Terminal Security</span>
        </div>

      </div>
    </div>
  );
};
