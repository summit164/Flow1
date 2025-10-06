"use client";

import React from 'react';
import { Button } from './button';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactsModal({ isOpen, onClose }: ContactsModalProps) {
  if (!isOpen) return null;

  const handleTelegramClick = () => {
    window.open('https://t.me/RyazanovKirill', '_blank');
  };

  const handlePhoneClick = () => {
    window.open('tel:+79999999999', '_self');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/79999999999', '_blank');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Контакты</h2>
              <p className="text-blue-100 mt-1 text-sm">Свяжитесь с нами удобным способом</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold transition-colors duration-200 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Telegram */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">
                📱
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Telegram</h3>
                <p className="text-blue-600 font-medium text-sm">@RyazanovKirill</p>
              </div>
            </div>
            <Button
              onClick={handleTelegramClick}
              className="w-full mt-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm py-2"
            >
              Написать в Telegram
            </Button>
          </div>

          {/* Телефон */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                📞
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Телефон</h3>
                <p className="text-green-600 font-medium text-sm">8 (999) 999-99-99</p>
              </div>
            </div>
            <Button
              onClick={handlePhoneClick}
              className="w-full mt-2 bg-green-500 text-white hover:bg-green-600 transition-colors text-sm py-2"
            >
              Позвонить сейчас
            </Button>
          </div>

          {/* WhatsApp */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-lg">
                💬
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">WhatsApp</h3>
                <p className="text-emerald-600 font-medium text-sm">8 (999) 999-99-99</p>
              </div>
            </div>
            <Button
              onClick={handleWhatsAppClick}
              className="w-full mt-2 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm py-2"
            >
              Открыть WhatsApp
            </Button>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-gray-50 p-3 border-t border-gray-200 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              🕒 Работаем ежедневно с 9:00 до 21:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}