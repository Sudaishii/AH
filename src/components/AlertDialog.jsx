import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { CheckCircledIcon, ExclamationTriangleIcon, Cross2Icon } from '@radix-ui/react-icons';
import '../styles/AlertDialog.css';

const AlertDialog = ({ isOpen, onClose, title, description, variant = 'error', buttonText }) => {
  const isSuccess = variant === 'success';
  const defaultButtonText = 'OK';
  const finalButtonText = buttonText || defaultButtonText;

  const Icon = isSuccess ? CheckCircledIcon : ExclamationTriangleIcon;

  return (
    <AlertDialogPrimitive.Root open={isOpen}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="alert-dialog-overlay" />
        <AlertDialogPrimitive.Content className={`alert-dialog-content ${isSuccess ? 'success' : 'error'}`}>
          <AlertDialogPrimitive.Cancel asChild>
            <button className="alert-dialog-close-button" onClick={onClose}>
              <Cross2Icon />
            </button>
          </AlertDialogPrimitive.Cancel>
          <div className="alert-dialog-header">
            <Icon className={`alert-dialog-icon ${isSuccess ? 'success' : 'error'}`} />
            <AlertDialogPrimitive.Title className={`alert-dialog-title ${isSuccess ? 'success' : 'error'}`}>
              {title}
            </AlertDialogPrimitive.Title>
          </div>
          <AlertDialogPrimitive.Description className={`alert-dialog-description ${isSuccess ? 'success' : 'error'}`}>
            {description}
          </AlertDialogPrimitive.Description>
          <div className="alert-dialog-actions">
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={onClose}
                className={`alert-dialog-ok-button ${isSuccess ? 'success' : 'error'}`}
              >
                {finalButtonText}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};

export default AlertDialog;
