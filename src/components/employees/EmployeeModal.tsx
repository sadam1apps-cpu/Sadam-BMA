import React from 'react';
import { ManageEmployeeModal } from './ManageEmployeeModal';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose }) => {
  return <ManageEmployeeModal isOpen={isOpen} onClose={onClose} />;
};
