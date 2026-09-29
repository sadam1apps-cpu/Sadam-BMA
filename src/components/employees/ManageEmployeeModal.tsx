import React, { useState, useEffect } from 'react';
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
  Phone,
  Mail,
  Check,
  RotateCcw,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
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
  const { addEmployee, updateEmployee, currentUser, currentRole, permissions, profile, language, t } = useBusiness();

  const isEditing = Boolean(employeeToEdit);
  const isSelf = Boolean(currentUser && employeeToEdit && currentUser.id === employeeToEdit.id);
  const myLevel = ROLE_HIERARCHY[currentUser?.role || currentRole] || 1;
  const targetCurrentLevel = employeeToEdit ? (ROLE_HIERARCHY[employeeToEdit.role] || 1) : 0;

  // Role permissions locking rules
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
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(2000);
  const [commissionRate, setCommissionRate] = useState<number>(1.0);

  // Login & Security Credentials
  const [pin, setPin] = useState('1234');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  // Customizable Permissions
  const [customPermissions, setCustomPermissions] = useState<Partial<RolePermissions>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize form fields whenever employeeToEdit or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setName(employeeToEdit.name || '');
        setRole(employeeToEdit.role || 'cashier');
        setPhone(employeeToEdit.phone || '');
        setEmail(employeeToEdit.email || '');
        setMonthlySalary(employeeToEdit.monthlySalary ?? 0);
        setCommissionRate(employeeToEdit.commissionRate ?? 0);
        setPin(employeeToEdit.pin || '1234');
        setPassword(employeeToEdit.password || 'password123');
        setStatus(employeeToEdit.status || 'active');
        setCustomPermissions(
          employeeToEdit.customPermissions ? { ...employeeToEdit.customPermissions } : {}
        );
      } else {
        setName('');
        setRole('cashier');
        setPhone('');
        setEmail('');
        setMonthlySalary(2000);
        setCommissionRate(1.0);
        setPin(Math.floor(1000 + Math.random() * 9000).toString());
        setPassword('password123');
        setStatus('active');
        setCustomPermissions({});
      }
      setActiveTab('profile');
      setShowPassword(false);
      setErrorMsg(null);
      setSavedSuccess(false);
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const isOwner = (currentUser?.role || currentRole) === 'owner';
  const isSuperior = !isSelf && !isOwner && employeeToEdit && targetCurrentLevel > myLevel;

  if (isSuperior) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
        <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-center shadow-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {language === 'pt' ? 'Acesso Restrito' : 'Restricted Superior Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t.superiorRestrictedDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  // Compute effective permissions for preview
  const defaultRolePerms = DEFAULT_ROLE_PERMISSIONS[role];
  const effectivePermissions: RolePermissions = {
    ...defaultRolePerms,
    ...customPermissions,
  };

  const overrideCount = Object.keys(customPermissions).length;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  const handleResetToRoleDefaults = () => {
    setCustomPermissions({});
  };

  const handlePermissionToggle = (key: keyof RolePermissions) => {
    const currentEffective = effectivePermissions[key];
    const newEffective = !currentEffective;
    const defaultVal = defaultRolePerms[key];

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
      setErrorMsg(language === 'pt' ? 'Nome completo é obrigatório.' : 'Full name is required.');
      setActiveTab('profile');
      return;
    }
    if (!email.trim()) {
      setErrorMsg(language === 'pt' ? 'E-mail de trabalho é obrigatório.' : 'Work email is required.');
      setActiveTab('profile');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg(language === 'pt' ? 'O PIN deve ter pelo menos 4 dígitos.' : 'PIN must be at least 4 digits.');
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
    }, 500);
  };

  const permissionKeys = Object.keys(PERMISSION_METADATA) as (keyof RolePermissions)[];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* Compact Header */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {isEditing ? `${t.editStaff}: ${employeeToEdit?.name}` : t.newStaffAccount}
                </h3>
                {isEditing && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {status}
                  </span>
                )}
              </div>
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

        {/* Streamlined Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Perfil' : 'Staff Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Credenciais' : 'Login & Security'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Permissões' : 'Permissions'}</span>
            {overrideCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-bold">
                {overrideCount}
              </span>
            )}
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-4 mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body - Fully responsive without scrollbars */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden">
          
          {/* TAB 1: STAFF PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {/* Row 1: Full Name & Assigned Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'pt' ? 'ex: Sara Silva' : 'e.g. Sarah Jenkins'}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {t.role}
                    </label>
                    {isRoleLocked && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {isSelf
                          ? (language === 'pt' ? 'Própria função' : 'Own role')
                          : (language === 'pt' ? 'Hierarquia' : 'Hierarchy')}
                      </span>
                    )}
                  </div>
                  <select
                    value={role}
                    disabled={isRoleLocked}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                      isRoleLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {language === 'pt'
                          ? r.value === 'owner'
                            ? t.roleOwner
                            : r.value === 'manager'
                            ? t.roleManager
                            : r.value === 'cashier'
                            ? t.roleCashier
                            : t.roleClerk
                          : r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Work Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {language === 'pt' ? 'E-mail de Trabalho (Login) *' : 'Work Email (Login ID) *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@store.com"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {language === 'pt' ? 'Telefone de Contacto' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Monthly Salary & Commission Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {language === 'pt' ? `Salário Mensal (${profile.currency})` : `Monthly Salary (${profile.currency})`}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {language === 'pt' ? 'Taxa de Comissão (%)' : 'Commission Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGIN & SECURITY CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-3">
              {/* Row 1: Quick PIN & Account Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {t.pinCode} *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{language === 'pt' ? 'Gerar PIN' : 'Random PIN'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-8 pr-3 py-1.5 text-sm font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {language === 'pt' ? 'Palavra-passe de Acesso *' : 'Account Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-8 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Account Status */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t.accountStatus}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs">{language === 'pt' ? 'Ativo' : 'Active'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('suspended')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      status === 'suspended'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-xs">{language === 'pt' ? 'Suspenso' : 'Suspended'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZABLE ROLE & PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-2.5">
              {/* Presets and template bar */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {language === 'pt' ? 'Modelo:' : 'Template:'}
                  </span>
                  <span className="capitalize text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 text-xs font-bold truncate">
                    {role.replace('_', ' ')}
                  </span>
                  {overrideCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                      {overrideCount} {language === 'pt' ? 'personalizadas' : 'overrides'}
                    </span>
                  )}
                </div>

                {!isRoleLocked && overrideCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{language === 'pt' ? 'Repor Padrão' : 'Reset Defaults'}</span>
                  </button>
                )}
              </div>

              {/* 2-column responsive compact permission toggles without scroll */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {permissionKeys.map((key) => {
                  const meta = PERMISSION_METADATA[key];
                  const isGranted = Boolean(effectivePermissions[key]);
                  const isOverridden = key in customPermissions;

                  return (
                    <div
                      key={key}
                      title={meta.description}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                        isGranted
                          ? 'bg-indigo-50/40 border-indigo-200/80 text-slate-900'
                          : 'bg-slate-50/60 border-slate-200/70 text-slate-500'
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
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                              {language === 'pt' ? 'Alt.' : 'Mod.'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Compact Toggle Switch */}
                      <button
                        type="button"
                        disabled={isRoleLocked}
                        onClick={() => !isRoleLocked && handlePermissionToggle(key)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isRoleLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        } ${isGranted ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            isGranted ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.saved}</span>
                </>
              ) : (
                <span>{t.saveStaff}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
