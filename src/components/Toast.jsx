import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircledIcon, ExclamationTriangleIcon, Cross2Icon } from '@radix-ui/react-icons';
import '../styles/Toast.css';

const Toast = ({ isOpen, onClose, message, variant = 'success' }) => {
  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircledIcon : ExclamationTriangleIcon;

  return (
    <ToastPrimitive.Provider>
      <ToastPrimitive.Root
        open={isOpen}
        onOpenChange={onClose}
        className={`toast ${isSuccess ? 'success' : 'error'}`}
        style={{ zIndex: 99999 }}
      >
        <div className="toast-content">
          <Icon className={`toast-icon ${isSuccess ? 'success' : 'error'}`} />
          <div className="toast-message">
            <ToastPrimitive.Title className={`toast-title ${isSuccess ? 'success' : 'error'}`}>
              {isSuccess ? 'Success' : 'Error'}
            </ToastPrimitive.Title>
            <ToastPrimitive.Description className={`toast-description ${isSuccess ? 'success' : 'error'}`}>
              {message}
            </ToastPrimitive.Description>
          </div>
          <ToastPrimitive.Close asChild>
            <button className="toast-close-button" onClick={onClose}>
              <Cross2Icon />
            </button>
          </ToastPrimitive.Close>
        </div>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="toast-viewport" />
    </ToastPrimitive.Provider>
  );
};

export default Toast;
