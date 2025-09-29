"use client";

import React, { useState } from 'react';
import { Button } from './button';

interface ReadyBouquet {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  flowers: string[];
  image?: string;
}

interface ReadyBouquetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (bouquet: ReadyBouquet) => void;
}

const readyBouquets: ReadyBouquet[] = [
  {
    id: 'romantic-red',
    name: 'Романтический красный',
    price: 2500,
    description: 'Классический букет из красных роз для особых моментов',
    emoji: '🌹',
    flowers: ['15 красных роз', '5 веток эвкалипта', 'красивая упаковка']
  },
  {
    id: 'spring-mix',
    name: 'Весенний микс',
    price: 1800,
    description: 'Яркий весенний букет с тюльпанами и нарциссами',
    emoji: '🌷',
    flowers: ['10 тюльпанов', '7 нарциссов', '3 ветки мимозы', 'зелень']
  },
  {
    id: 'gentle-pink',
    name: 'Нежная розовая мечта',
    price: 2200,
    description: 'Воздушный букет в розовых тонах для утонченных натур',
    emoji: '🌸',
    flowers: ['12 розовых роз', '8 розовых пионов', 'гипсофила', 'атласная лента']
  },
  {
    id: 'sunny-yellow',
    name: 'Солнечное настроение',
    price: 1950,
    description: 'Яркий желтый букет, который подарит радость и тепло',
    emoji: '🌻',
    flowers: ['9 подсолнухов', '12 желтых роз', '5 хризантем', 'зеленая упаковка']
  },
  {
    id: 'elegant-white',
    name: 'Элегантная классика',
    price: 2800,
    description: 'Изысканный белый букет для торжественных случаев',
    emoji: '🤍',
    flowers: ['20 белых роз', '10 белых лилий', 'белые хризантемы', 'серебряная упаковка']
  }
];

export function ReadyBouquetsModal({ isOpen, onClose, onAddToCart }: ReadyBouquetsModalProps) {
  const [addedBouquets, setAddedBouquets] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleAddToCart = (bouquet: ReadyBouquet) => {
    onAddToCart(bouquet);
    setAddedBouquets(prev => new Set([...prev, bouquet.id]));
    
    // Убираем индикатор через 2 секунды
    setTimeout(() => {
      setAddedBouquets(prev => {
        const newSet = new Set(prev);
        newSet.delete(bouquet.id);
        return newSet;
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">🌺 Готовые букеты</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Выберите один из наших готовых букетов
          </p>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyBouquets.map((bouquet) => (
              <div key={bouquet.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                {/* Заголовок букета */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{bouquet.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {bouquet.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {bouquet.description}
                  </p>
                  <div className="text-2xl font-bold text-green-600 mb-3">
                    {bouquet.price} ₽
                  </div>
                </div>

                {/* Состав букета */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Состав:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {bouquet.flowers.map((flower, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        {flower}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Кнопка добавления */}
                <Button
                  onClick={() => handleAddToCart(bouquet)}
                  className={`w-full py-2 text-white transition-all duration-300 ${
                    addedBouquets.has(bouquet.id)
                      ? 'bg-green-500 hover:bg-green-600 scale-105'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {addedBouquets.has(bouquet.id) ? (
                    <>✅ Добавлено!</>
                  ) : (
                    <>🛒 Добавить в корзину</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Нижняя панель */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-8 py-2"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}