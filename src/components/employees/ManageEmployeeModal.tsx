import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  Employee,
  RolePermissions,
  UserRole,
  PERMISSION_METADATA,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
} from '../../types';
import {
  X,
  User,
  KeyRound,
  Shield,
  DollarSign,
  Phone,
  Mail,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react';

interface ManageEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

export const ManageEmployeeModal: React.FC<ManageEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { addEmployee, updateEmployee, currentUser, currentRole, permissions } = useBusiness();

  const isEditing = Boolean(employeeToEdit);
  const isSelf = Boolean(currentUser && employeeToEdit && currentUser.id === employeeToEdit.id);
  const myLevel = ROLE_HIERARCHY[currentUser?.role || currentRole] || 1;
  const targetCurrentLevel = employeeToEdit ? (ROLE_HIERARCHY[employeeToEdit.role] || 1) : 0;

  // Cannot modify role or permissions if:
  // 1. Editing self (assigned role cannot be changed by the staff member)
  // 2. User lacks canManageEmployees privilege
  // 3. User is not owner and target has equal or higher rank
  const isRoleLocked =
    isSelf ||
    !permissions.canManageEmployees ||
    (isEditing && currentUser?.role !== 'owner' && targetCurrentLevel >= myLevel);

  // Available roles to assign based on rank
  const availableRoles: { value: UserRole; label: string }[] = [];
  if (currentUser?.role === 'owner') {
    availableRoles.push(
      { value: 'owner', label: 'Store Owner (Super Admin)' },
      { value: 'manager', label: 'Duty Manager' },
      { value: 'cashier', label: 'POS Cashier' },
      { value: 'inventory_clerk', label: 'Inventory Clerk' }
    );
  } else if (currentUser?.role === 'manager') {
    availableRoles.push(
      { value: 'cashier', label: 'POS Cashier' },
      { value: 'inventory_clerk', label: 'Inventory Clerk' }
    );
  } else {
    availableRoles.push({
      value: (employeeToEdit?.role || 'cashier') as UserRole,
      label: (employeeToEdit?.role || 'cashier').replace('_', ' ').toUpperCase(),
    });
  }

  // Active form tab
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'permissions'>('profile');

  // Basic Profile Info
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [role, setRole] = useState<UserRole>(employeeToEdit?.role || 'cashier');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [monthlySalary, setMonthlySalary] = useState<number>(employeeToEdit?.monthlySalary || 2000);
  const [commissionRate, setCommissionRate] = useState<number>(employeeToEdit?.commissionRate || 1.0);

  // Login & Security Credentials
  const [pin, setPin] = useState(employeeToEdit?.pin || '1234');
  const [password, setPassword] = useState(employeeToEdit?.password || 'password123');
  const [status, setStatus] = useState<'active' | 'suspended'>(employeeToEdit?.status || 'active');

  // Customizable Permissions (start with employee's custom permissions or defaults)
  const [customPermissions, setCustomPermissions] = useState<Partial<RolePermissions>>(() => {
    if (employeeToEdit?.customPermissions) {
      return { ...employeeToEdit.customPermissions };
    }
    return {};
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute effective permissions for preview
  const defaultRolePerms = DEFAULT_ROLE_PERMISSIONS[role];
  const effectivePermissions: RolePermissions = {
    ...defaultRolePerms,
    ...customPermissions,
  };

  // Count overrides
  const overrideCount = Object.keys(customPermissions).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Keep custom overrides or prompt
  };

  const handleResetToRoleDefaults = () => {
    setCustomPermissions({});
  };

  const handlePermissionToggle = (key: keyof RolePermissions) => {
    const currentEffective = effectivePermissions[key];
    const newEffective = !currentEffective;
    const defaultVal = defaultRolePerms[key];

    // If new effective value matches default, remove from customPermissions
    if (newEffective === defaultVal) {
      setCustomPermissions((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } else {
      setCustomPermissions((prev) => ({
        ...prev,
        [key]: newEffective,
      }));
    }
  };

  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      setActiveTab('profile');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email address (login ID) is required.');
      setActiveTab('profile');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      setActiveTab('credentials');
      return;
    }

    if (isEditing && employeeToEdit) {
      updateEmployee(employeeToEdit.id, {
        name,
        phone,
        email,
        monthlySalary: Number(monthlySalary),
        commissionRate: Number(commissionRate),
        pin,
        password,
        status,
        ...(isRoleLocked ? {} : { role, customPermissions }),
      });
    } else {
      addEmployee({
        name,
        role,
        phone,
        email,
        monthlySalary: Number(monthlySalary),
        commissionRate: Number(commissionRate),
        attendanceStatus: 'present',
        pin,
        password,
        status,
        customPermissions,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const permissionKeys = Object.keys(PERMISSION_METADATA) as (keyof RolePermissions)[];

  const categories = [
    { id: 'financial', title: 'Financial & Cash Balances' },
    { id: 'pos', title: 'POS Operations & Invoicing' },
    { id: 'inventory', title: 'Inventory & Catalog' },
    { id: 'management', title: 'Staff, Team & Reports' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isEditing ? `Edit Staff: ${employeeToEdit?.name}` : 'New Staff Account'}
              </h3>
              <p className="text-xs text-slate-400">
                Manage login credentials and customizable role permissions
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-2 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Staff Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login &amp; Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role &amp; Permissions</span>
            {overrideCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-bold">
                {overrideCount}
              </span>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Primary Role
                    </label>
                    {isRoleLocked && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {isSelf ? 'Own role locked' : 'Hierarchy locked'}
                      </span>
                    )}
                  </div>
                  <select
                    value={role}
                    disabled={isRoleLocked}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border transition-colors ${
                      isRoleLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {isRoleLocked && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isSelf
                        ? 'Your assigned role is maintained by store management and cannot be modified by yourself.'
                        : 'Only higher-level administrators can change roles for this staff member.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Work Email (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah.j@store.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Monthly Salary ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGIN & SECURITY CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  Login credentials allow this staff member to sign in on POS terminals via quick 4-digit PIN or standard email and password.
                </div>
              </div>

              {/* Quick Login PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Quick Login PIN (4 Digits) *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Generate Random PIN
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used on touch terminals for rapid staff switching.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for email sign-in or remote terminal login.
                </p>
              </div>

              {/* Account Status (Active vs Suspended) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Account Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-xs">Active</div>
                      <div className="text-[10px] text-slate-500 font-normal">Can log in &amp; operate</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('suspended')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      status === 'suspended'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-rose-600" />
                    <div className="text-left">
                      <div className="text-xs">Suspended</div>
                      <div className="text-[10px] text-slate-500 font-normal">Access blocked</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZABLE ROLE & PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* If permissions are locked */}
              {isRoleLocked && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Permissions Read-Only:</strong>{' '}
                    {isSelf
                      ? 'Your account privileges are assigned by store management and cannot be modified by yourself.'
                      : 'You do not have administrative rank to modify permissions for this account.'}
                  </span>
                </div>
              )}
              
              {/* Role Presets Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Base Template:</span>
                    <span className="capitalize text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-bold">
                      {role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {overrideCount > 0
                      ? `${overrideCount} custom permission override(s) active on this account.`
                      : 'All permissions match standard role policy.'}
                  </p>
                </div>

                {!isRoleLocked && overrideCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                )}
              </div>

              {/* Granular Permission Toggles grouped by Category */}
              <div className="space-y-4">
                {categories.map((cat) => {
                  const items = permissionKeys.filter(
                    (key) => PERMISSION_METADATA[key].category === cat.id
                  );

                  return (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                        {cat.title}
                      </h4>
                      <div className="space-y-2">
                        {items.map((key) => {
                          const meta = PERMISSION_METADATA[key];
                          const isGranted = Boolean(effectivePermissions[key]);
                          const isOverridden = key in customPermissions;

                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                isGranted
                                  ? 'bg-emerald-50/30 border-emerald-200/80'
                                  : 'bg-slate-50/50 border-slate-200/80'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-bold ${
                                      isGranted ? 'text-slate-900' : 'text-slate-500'
                                    }`}
                                  >
                                    {meta.label}
                                  </span>
                                  {isOverridden && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                      Customized
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {meta.description}
                                </p>
                              </div>

                              {/* Toggle Switch */}
                              <button
                                type="button"
                                disabled={isRoleLocked}
                                onClick={() => !isRoleLocked && handlePermissionToggle(key)}
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isRoleLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                } ${
                                  isGranted ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    isGranted ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Staff Account</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
