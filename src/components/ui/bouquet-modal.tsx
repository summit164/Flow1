"use client";

import React, { useState } from 'react';
import { Button } from './button';

interface Flower {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
}

interface FlowerSelection {
  flower: Flower;
  quantity: number;
}

interface BouquetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (selections: FlowerSelection[], totalPrice: number) => void;
}

const flowers: Flower[] = [
  { id: '1', name: 'Розы', price: 150, emoji: '🌹', description: 'Классические красные розы' },
  { id: '2', name: 'Тюльпаны', price: 80, emoji: '🌷', description: 'Нежные весенние тюльпаны' },
  { id: '3', name: 'Лилии', price: 120, emoji: '🌺', description: 'Ароматные белые лилии' },
  { id: '4', name: 'Хризантемы', price: 90, emoji: '🌼', description: 'Яркие осенние хризантемы' },
  { id: '5', name: 'Пионы', price: 200, emoji: '🌸', description: 'Пышные розовые пионы' },
  { id: '6', name: 'Гвоздики', price: 70, emoji: '🌺', description: 'Стойкие разноцветные гвоздики' },
];

export function BouquetModal({ isOpen, onClose, onAddToCart }: BouquetModalProps) {
  const [selections, setSelections] = useState<{ [key: string]: number }>({});

  if (!isOpen) return null;

  const updateQuantity = (flowerId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [flowerId]: Math.max(0, quantity)
    }));
  };

  const getSelectedFlowers = (): FlowerSelection[] => {
    return Object.entries(selections)
      .filter(([_, quantity]) => quantity > 0)
      .map(([flowerId, quantity]) => ({
        flower: flowers.find(f => f.id === flowerId)!,
        quantity
      }));
  };

  const getTotalPrice = (): number => {
    return getSelectedFlowers().reduce((total, selection) => 
      total + (selection.flower.price * selection.quantity), 0
    );
  };

  const handleAddToCart = () => {
    const selectedFlowers = getSelectedFlowers();
    if (selectedFlowers.length > 0) {
      onAddToCart(selectedFlowers, getTotalPrice());
      setSelections({});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Собрать букет</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">Выберите цветы и количество для вашего букета</p>
        </div>

        {/* Список цветов */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flowers.map((flower) => (
              <div key={flower.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{flower.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{flower.name}</h3>
                      <p className="text-sm text-gray-600">{flower.description}</p>
                      <p className="text-lg font-bold text-green-600">{flower.price} ₽</p>
                    </div>
                  </div>
                </div>
                
                {/* Счетчик количества */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Количество:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const currentQuantity = selections[flower.id] || 0;
                        updateQuantity(flower.id, Math.max(0, currentQuantity - 1));
                      }}
                      disabled={(selections[flower.id] || 0) <= 0}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={selections[flower.id] ? selections[flower.id].toString() : ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Разрешаем пустое поле для удобства редактирования
                        if (inputValue === '') {
                          updateQuantity(flower.id, 0);
                          return;
                        }
                        
                        const value = parseInt(inputValue);
                        
                        // Проверяем, что значение является числом и в допустимом диапазоне
                        if (!isNaN(value) && value >= 0 && value <= 999) {
                          updateQuantity(flower.id, value);
                        }
                      }}
                      onBlur={(e) => {
                        // При потере фокуса устанавливаем минимум 0, если поле пустое
                        if (e.target.value === '') {
                          updateQuantity(flower.id, 0);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Запрещаем ввод отрицательных чисел и некоторых символов
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      className="w-16 h-8 text-center font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <button
                      onClick={() => {
                        const currentQuantity = selections[flower.id] || 0;
                        updateQuantity(flower.id, Math.min(999, currentQuantity + 1));
                      }}
                      disabled={(selections[flower.id] || 0) >= 999}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Итого и кнопки */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">
                Выбрано цветов: {getSelectedFlowers().reduce((total, s) => total + s.quantity, 0)}
              </p>
              <p className="text-xl font-bold text-gray-900">
                Итого: {getTotalPrice()} ₽
              </p>
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-3 text-base font-medium"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={getSelectedFlowers().length === 0}
                className="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-6 py-3 text-base font-medium"
              >
                Добавить в корзину
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}