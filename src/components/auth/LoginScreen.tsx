import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Store, User, KeyRound, AlertCircle, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const LoginScreen: React.FC = () => {
  const { employees, login, profile } = useBusiness();
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginMethod, setLoginMethod] = useState<'quick' | 'credentials'>('quick');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.isActive !== false);

  const handleQuickSelect = (empId: string) => {
    setSelectedEmpId(empId);
    setErrorMsg(null);
    setPinInput('');
  };

  const handleQuickLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setErrorMsg('Please select your staff account first.');
      return;
    }
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    // If employee has a PIN configured, verify it
    if (emp.pin && emp.pin.trim()) {
      if (emp.pin.trim() !== pinInput.trim()) {
        setErrorMsg('Incorrect PIN. Please try again.');
        return;
      }
    }

    login(emp.id);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPin = pinInput.trim();

    if (!trimmedUser) {
      setErrorMsg('Please enter your username, email, or full name.');
      return;
    }

    const matchedEmp = employees.find((emp) => {
      const matchUsername = emp.username && emp.username.toLowerCase() === trimmedUser;
      const matchEmail = emp.email && emp.email.toLowerCase() === trimmedUser;
      const matchName = emp.name.toLowerCase() === trimmedUser;
      return matchUsername || matchEmail || matchName;
    });

    if (!matchedEmp) {
      setErrorMsg('Staff member not found. Check spelling or use Quick Select.');
      return;
    }

    if (matchedEmp.isActive === false) {
      setErrorMsg('This account has been deactivated. Please contact the administrator.');
      return;
    }

    if (matchedEmp.pin && matchedEmp.pin.trim() && matchedEmp.pin.trim() !== trimmedPin) {
      setErrorMsg('Incorrect PIN / password.');
      return;
    }

    login(matchedEmp.id);
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    owner: { label: 'Store Owner', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    manager: { label: 'Store Manager', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    cashier: { label: 'Cashier / POS', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    inventory_clerk: { label: 'Inventory Clerk', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -translate-y-12"></div>
        <div className="w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl translate-y-24 translate-x-24"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {profile.name || 'Store Management System'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Staff Portal • Secure Role-Based Access
          </p>
        </div>

        {/* Tab Switcher: Quick Select vs Manual Credentials */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('quick');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              loginMethod === 'quick'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Staff Roster
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('credentials');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              loginMethod === 'credentials'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Username & PIN
          </button>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method 1: Quick Select from Employee List */}
        {loginMethod === 'quick' ? (
          <form onSubmit={handleQuickLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Your Account ({activeEmployees.length} registered)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                {activeEmployees.map((emp) => {
                  const isSelected = selectedEmpId === emp.id;
                  const badge = roleBadges[emp.role] || { label: emp.role, color: 'bg-slate-800 text-slate-300' };

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleQuickSelect(emp.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {emp.email || emp.phone || 'Staff Member'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN entry if user selected has PIN */}
            {selectedEmployee && (
              <div className="pt-2 border-t border-slate-800/80 animate-fadeIn">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Enter PIN for {selectedEmployee.name.split(' ')[0]}</span>
                  {selectedEmployee.pin && (
                    <span className="text-[10px] text-indigo-400 font-normal">
                      (Default PIN: {selectedEmployee.pin})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter 4-6 digit PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedEmpId}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>Sign In to System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Method 2: Manual Username / Email and PIN */
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Username, Full Name, or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. alex, samantha, or jordan"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>PIN / Password</span>
                <span className="text-[10px] text-slate-400 font-normal">Stored in Employee Sheet</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Enter PIN (e.g. 1234)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Authenticate Staff</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synced with Google Sheets Employee Roster</span>
          </div>
          <span className="text-[10px] text-slate-400">v2.4 Live</span>
        </div>
      </div>
    </div>
  );
};
