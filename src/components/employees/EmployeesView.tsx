import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Employee, UserRole, ROLE_HIERARCHY } from '../../types';
import {
  UserCheck,
  Plus,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  User,
  Sparkles,
} from 'lucide-react';
import { ManageEmployeeModal } from './ManageEmployeeModal';

interface EmployeesViewProps {
  onOpenNewEmployee: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ onOpenNewEmployee }) => {
  const {
    employees,
    toggleAttendance,
    permissions,
    profile,
    currentRole,
    currentUser,
    setIsLoginModalOpen,
    deleteEmployee,
  } = useBusiness();

  const [currentPage, setCurrentPage] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    owner: { label: 'Store Owner', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    manager: { label: 'Duty Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    cashier: { label: 'Cashier / Sales', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    inventory_clerk: { label: 'Inventory Clerk', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  };

  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (e.monthlySalary || 0), 0);

  const pageSize = 6;
  const totalPages = Math.ceil(employees.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = employees.slice((validPage - 1) * pageSize, validPage * pageSize);

  const togglePinReveal = (empId: string) => {
    setRevealedPins((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsManageModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsManageModalOpen(true);
  };

  const handleDeleteStaff = (emp: Employee) => {
    if (currentUser?.id === emp.id) {
      alert('You cannot delete your own currently active account.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to remove ${emp.name}? This will revoke their POS login access.`
    );
    if (confirmed) {
      deleteEmployee(emp.id);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
              Employees, Logins &amp; Roles
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Synced with Employees Sheet
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {employees.length} team members • {employees.filter((e) => e.attendanceStatus === 'present').length} clocked in • Manage PINs, passwords &amp; custom permissions
          </p>
        </div>

        {permissions.canManageEmployees ? (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Account</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Read-only mode
          </div>
        )}
      </div>

      {/* Permission Restriction Banner (if read-only) */}
      {!permissions.canManageEmployees && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> Staff logins, passwords, and permission assignments can only be altered by Store Owners or Managers.
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Staff Logins
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
            {employees.length} Accounts
          </div>
          <span className="text-[10px] text-emerald-600 hidden sm:block">
            {employees.filter((e) => (e.status || 'active') === 'active').length} active, {employees.filter((e) => e.status === 'suspended').length} suspended
          </span>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Attendance
          </span>
          <div className="text-sm sm:text-xl font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
            {employees.filter((e) => e.attendanceStatus === 'present').length}/{employees.length}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Clocked in right now</span>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Monthly Payroll
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalMonthlyPayroll.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Base payroll liability</span>
        </div>
      </div>

      {/* Employees Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        
        {/* Mobile View: Cards */}
        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedEmployees.map((emp) => {
            const isPresent = emp.attendanceStatus === 'present';
            const roleInfo = roleBadges[emp.role] || { label: emp.role, color: 'bg-slate-100 text-slate-800 border-slate-200' };
            const isSelf = currentUser?.id === emp.id;
            const isPinRevealed = Boolean(revealedPins[emp.id]);
            const isSuspended = emp.status === 'suspended';
            const hasOverrides = emp.customPermissions && Object.keys(emp.customPermissions).length > 0;
            const overrideCount = emp.customPermissions ? Object.keys(emp.customPermissions).length : 0;

            const myLevel = ROLE_HIERARCHY[currentUser?.role || currentRole] || 1;
            const targetLevel = ROLE_HIERARCHY[emp.role] || 1;
            const isHigherRank = currentUser?.role === 'owner' || myLevel > targetLevel;
            const canEditThisStaff = permissions.canManageEmployees && (isHigherRank || isSelf);
            const canViewPin = currentUser?.role === 'owner' || isSelf || (permissions.canManageEmployees && isHigherRank);

            return (
              <div key={emp.id} className="p-3 flex flex-col gap-2 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate block">{emp.name}</span>
                      {isSelf && (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-full">
                          You
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                          Suspended
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{emp.email} • {emp.phone}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleInfo.color} shrink-0`}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* Login credentials badge */}
                <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      PIN: {canViewPin ? (isPinRevealed ? (emp.pin || '1234') : '••••') : '••••'}
                    </span>
                    {canViewPin && (
                      <button
                        type="button"
                        onClick={() => togglePinReveal(emp.id)}
                        className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 cursor-pointer"
                        title={isPinRevealed ? 'Hide PIN' : 'Show PIN'}
                      >
                        {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div>
                    {hasOverrides ? (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                        Customized ({overrideCount})
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded-full">
                        Standard Preset
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleAttendance(emp.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Present</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Off Shift</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {canEditThisStaff && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(emp)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                      >
                        Edit &amp; Perms
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!isSelf && !isSuspended) {
                          setIsLoginModalOpen(true);
                        }
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        isSelf
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 cursor-default'
                          : isSuspended
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                      }`}
                      disabled={isSelf || isSuspended}
                    >
                      {isSelf ? 'Active' : 'Sign In'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
              <tr>
                <th className="py-2.5 px-3.5">Staff &amp; ID</th>
                <th className="py-2.5 px-3.5">Role</th>
                <th className="py-2.5 px-3.5">Login Credentials</th>
                <th className="py-2.5 px-3.5">Permissions Status</th>
                <th className="py-2.5 px-3.5">Attendance</th>
                <th className="py-2.5 px-3.5">Salary</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp) => {
                const isPresent = emp.attendanceStatus === 'present';
                const roleInfo = roleBadges[emp.role] || { label: emp.role, color: 'bg-slate-100 text-slate-800 border-slate-200' };
                const isSelf = currentUser?.id === emp.id;
                const isPinRevealed = Boolean(revealedPins[emp.id]);
                const isSuspended = emp.status === 'suspended';
                const hasOverrides = emp.customPermissions && Object.keys(emp.customPermissions).length > 0;
                const overrideCount = emp.customPermissions ? Object.keys(emp.customPermissions).length : 0;

                const myLevel = ROLE_HIERARCHY[currentUser?.role || currentRole] || 1;
                const targetLevel = ROLE_HIERARCHY[emp.role] || 1;
                const isHigherRank = currentUser?.role === 'owner' || myLevel > targetLevel;
                const canEditThisStaff = permissions.canManageEmployees && (isHigherRank || isSelf);
                const canDeleteThisStaff = permissions.canManageEmployees && !isSelf && isHigherRank;
                const canViewPin = currentUser?.role === 'owner' || isSelf || (permissions.canManageEmployees && isHigherRank);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Contact */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        {isSelf && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                        {isSuspended && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {emp.email} • {emp.phone}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    {/* Login Credentials (PIN & Status) */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-slate-400" />
                          <span>
                            {canViewPin
                              ? (isPinRevealed ? (emp.pin || '1234') : '••••')
                              : '••••'}
                          </span>
                          {canViewPin && (
                            <button
                              type="button"
                              onClick={() => togglePinReveal(emp.id)}
                              className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                              title={isPinRevealed ? 'Hide PIN' : 'Show PIN'}
                            >
                              {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            isSuspended ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          title={isSuspended ? 'Account Suspended' : 'Account Active'}
                        />
                      </div>
                    </td>

                    {/* Permissions Status */}
                    <td className="py-2.5 px-3.5">
                      {hasOverrides ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Customized ({overrideCount})</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Default Preset
                        </span>
                      )}
                    </td>

                    {/* Attendance */}
                    <td className="py-2.5 px-3.5">
                      <button
                        type="button"
                        onClick={() => toggleAttendance(emp.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Click to toggle clock-in status"
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Off Shift</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Salary & Commission */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      <div>{profile.currency}{(emp.monthlySalary || 0).toLocaleString()} / mo</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {emp.commissionRate > 0 ? `${emp.commissionRate}% comm.` : 'No commission'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Edit Staff & Permissions */}
                        {canEditThisStaff && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title={isSelf ? 'Edit your profile details' : 'Edit staff profile & role permissions'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Switch / Sign In As */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isSelf && !isSuspended) {
                              setIsLoginModalOpen(true);
                            }
                          }}
                          disabled={isSelf || isSuspended}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            isSelf
                              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 cursor-default'
                              : isSuspended
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                          }`}
                          title={isSelf ? 'Current active session' : 'Sign in using credentials'}
                        >
                          {isSelf ? 'Active Session' : 'Sign In'}
                        </button>

                        {/* Delete Staff (if permitted and not self) */}
                        {canDeleteThisStaff && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(emp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Delete staff account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {employees.length === 0
              ? 'No employees recorded'
              : `Showing ${(validPage - 1) * pageSize + 1} - ${Math.min(
                  validPage * pageSize,
                  employees.length
                )} of ${employees.length} staff`}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-[11px]">
              {validPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Staff & Custom Permissions Modal */}
      <ManageEmployeeModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        employeeToEdit={editingEmployee}
      />
    </div>
  );
};
