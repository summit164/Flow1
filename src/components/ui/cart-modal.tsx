"use client";

import React, { useState } from 'react';
import { Button } from './button';

interface FlowerSelection {
  flower: {
    id: string;
    name: string;
    price: number;
    emoji: string;
    description: string;
  };
  quantity: number;
}

interface CartItem extends FlowerSelection {
  id: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onClearCart: () => void;
  onCheckout: (phoneNumber?: string, address?: string, telegramId?: string) => void;
}

export function CartModal({ isOpen, onClose, cartItems, onClearCart, onCheckout }: CartModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [telegramId, setTelegramId] = useState('');
  
  if (!isOpen) return null;

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.flower.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleClearCart = () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      onClearCart();
    }
  };

  const handleCheckout = () => {
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();
    const trimmedTelegramId = telegramId.trim();
    
    if (!trimmedPhone) {
      alert('Пожалуйста, укажите номер телефона');
      return;
    }
    
    if (!trimmedAddress) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    
    onCheckout(trimmedPhone, trimmedAddress, trimmedTelegramId);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex">
      {/* Левая часть - затемненная область, при клике закрывает корзину */}
      <div 
        className="flex-1 cursor-pointer" 
        onClick={onClose}
      />
      {/* Правая часть - панель корзины */}
      <div className="bg-white shadow-xl w-full max-w-md h-full flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">🛒 Корзина</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {cartItems.length === 0 ? 'Корзина пуста' : `Товаров в корзине: ${getTotalItems()}`}
          </p>
        </div>

        {/* Содержимое корзины */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Корзина пуста</h3>
              <p className="text-gray-500">Добавьте товары, чтобы они появились здесь</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{item.flower.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.flower.name}</h4>
                        <p className="text-sm text-gray-600">{item.flower.description}</p>
                        <p className="text-sm text-gray-500">Цена за штуку: {item.flower.price} ₽</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        Количество: {item.quantity}
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {item.flower.price * item.quantity} ₽
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Итого и кнопки */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            {/* Информация об итогах */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Всего товаров: {getTotalItems()}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Итого: {getTotalPrice()} ₽
              </p>
            </div>
            
            {/* Поле для номера телефона */}
            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                📱 По этому номеру мы свяжемся с вами
              </p>
            </div>

            {/* Поле для Telegram ID */}
            <div className="mb-4">
              <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-2">
                Telegram ID (необязательно)
              </label>
              <input
                type="text"
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Например: 123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                🤖 Укажите ваш Telegram ID для просмотра заказа в боте. Получить ID: /myid в боте
              </p>
            </div>

            {/* Поле для адреса */}
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Адрес доставки <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Укажите полный адрес доставки: город, улица, дом, квартира"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                🏠 Укажите точный адрес для доставки цветов
              </p>
            </div>
            
            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleClearCart}
                variant="outline"
                className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 py-3"
              >
                🗑️ Очистить корзину
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
              >
                ✅ Оформить заказ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}