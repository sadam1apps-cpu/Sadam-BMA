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
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    currentUser?.id || employees[0]?.id || ''
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);

  // Initial owner setup if employee sheet is completely empty
  const [showOwnerSetup, setShowOwnerSetup] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const hiddenPinInputRef = useRef<HTMLInputElement>(null);

  // Sync selected staff if employees change
  useEffect(() => {
    if (!selectedStaffId && employees.length > 0) {
      setSelectedStaffId(employees[0].id);
    }
  }, [employees, selectedStaffId]);

  // Keep hidden input focused for physical keyboards
  useEffect(() => {
    if (activeTab === 'pin' && (employees.length > 0 || isScreenLocked)) {
      hiddenPinInputRef.current?.focus();
    }
  }, [activeTab, isScreenLocked, employees.length]);

  const handleTabChange = (tab: 'pin' | 'password') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setPinInput('');
  };

  const selectedStaff = employees.find((e) => e.id === selectedStaffId) || employees[0];

  const handleKeypadPress = (val: string) => {
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

  const submitPin = (pinToSubmit = pinInput) => {
    setErrorMessage(null);
    if (!pinToSubmit || pinToSubmit.length < 4) {
      setErrorMessage('Please enter 4-digit PIN.');
      return;
    }

    if (isScreenLocked && currentUser) {
      const res = unlockScreen(pinToSubmit);
      if (res.success) {
        setSuccessAnimation(true);
        setTimeout(() => {
          setSuccessAnimation(false);
          if (onClose) onClose();
        }, 350);
      } else {
        setErrorMessage(res.message || 'Incorrect PIN. Try again.');
        setPinInput('');
      }
      return;
    }

    const res = loginWithPin(pinToSubmit, selectedStaff?.id);
    if (res.success) {
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
        if (onClose) onClose();
      }, 350);
    } else {
      setErrorMessage(res.message || 'Incorrect PIN. Try again.');
      setPinInput('');
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginWithCredentials(emailInput.trim(), passwordInput);
    if (res.success) {
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
        if (onClose) onClose();
      }, 350);
    } else {
      setErrorMessage(res.message || 'Invalid email or password.');
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Store Owner';
      case 'manager':
        return 'Manager';
      case 'cashier':
        return 'Cashier';
      case 'inventory_clerk':
        return 'Inventory Clerk';
      default:
        return role;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden select-none"
      style={{ height: '100dvh', maxHeight: '100dvh' }}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col my-auto relative shrink-0">
        
        {/* Close button (only when modal is optional dialog) */}
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

        {/* Compact Header */}
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
                    ? `Locked: ${currentUser?.name || 'Staff'}`
                    : 'Sign in to access POS & inventory'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Protected
              </span>
            </div>
          </div>
        </div>

        {/* Auth Method Tabs (Only when not screen unlock) */}
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
              <span>PIN</span>
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

        {/* Inline Feedback Alerts */}
        {errorMessage && (
          <div className="mx-4 mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <div className="font-medium truncate">{errorMessage}</div>
          </div>
        )}

        {successAnimation && (
          <div className="mx-4 mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs animate-pulse shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="font-semibold">Access Granted. Loading session...</div>
          </div>
        )}

        {/* Content Container (No Scroll) */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center">

          {/* ZERO EMPLOYEES / EMPTY DATABASE STATE */}
          {employees.length === 0 && !showOwnerSetup && (
            <div className="text-center py-3 space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                {sheetsSyncStatus === 'syncing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                ) : (
                  <Shield className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {sheetsSyncStatus === 'syncing'
                    ? 'Connecting to database...'
                    : 'No staff accounts configured'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {sheetsSyncStatus === 'syncing'
                    ? 'Retrieving employee records from spreadsheet...'
                    : 'Initialize your store owner account to get started.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => syncFromSheets()}
                  disabled={sheetsSyncStatus === 'syncing'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* INITIAL OWNER REGISTRATION (If DB is empty) */}
          {employees.length === 0 && showOwnerSetup && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-900">Initialize Store Owner</span>
                <button
                  type="button"
                  onClick={() => setShowOwnerSetup(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                Save &amp; Enter
              </button>
            </div>
          )}

          {/* TAB 1: QUICK PIN AUTHENTICATION */}
          {(employees.length > 0 || isScreenLocked) && activeTab === 'pin' && (
            <div className="space-y-2.5">
              
              {/* Staff Selector (compact dropdown, takes ~36px height) */}
              {!isScreenLocked ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedStaff?.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-0.5">
                      Employee
                    </div>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => {
                        setSelectedStaffId(e.target.value);
                        setPinInput('');
                        setErrorMessage(null);
                      }}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer py-0 border-none truncate"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({getRoleLabel(emp.role)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Session locked for <strong className="font-bold">{currentUser?.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setPinInput('');
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0 ml-2"
                  >
                    Switch
                  </button>
                </div>
              )}

              {/* Masked PIN Indicator */}
              <div className="flex justify-center items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full transition-all duration-150 ${
                        filled
                          ? 'bg-indigo-600 scale-125 shadow-xs'
                          : 'bg-slate-200 border border-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Hidden input to capture physical keyboard input */}
              <input
                ref={hiddenPinInputRef}
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPinInput(val);
                  if (val.length === 4) {
                    submitPin(val);
                  }
                }}
                className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
                autoFocus
              />

              {/* Compact Numeric Keypad */}
              <div className="grid grid-cols-3 gap-1.5 w-full max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key === 'C' ? 'clear' : key === '⌫' ? 'backspace' : key)}
                    className={`h-9 sm:h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                      key === 'C' || key === '⌫'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs'
                        : 'bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 hover:text-indigo-700 shadow-2xs'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Sign In / Unlock Button */}
              <button
                type="button"
                onClick={() => submitPin()}
                className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{isScreenLocked ? 'Unlock Terminal' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 2: PASSWORD AUTHENTICATION */}
          {employees.length > 0 && !isScreenLocked && activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-3 py-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="staff@company.com"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    placeholder="Enter password"
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-1"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400 shrink-0">
          <Shield className="w-3 h-3 text-indigo-500" />
          <span>Protected Terminal Access • 256-bit Session Security</span>
        </div>

      </div>
    </div>
  );
};
