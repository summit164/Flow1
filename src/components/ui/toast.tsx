"use client";

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, isVisible, onClose, duration = 3000, type = 'success' }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transform transition-all duration-300 ease-in-out ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`${getTypeStyles()} px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-[400px]`}
      >
        <span className="text-xl">{getIcon()}</span>
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={() => {
            setIsAnimating(false);
            setTimeout(onClose, 300);
          }}
          className="ml-auto text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}