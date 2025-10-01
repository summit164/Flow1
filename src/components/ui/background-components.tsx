"use client";

// Типы для Telegram Web App
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        openLink: (url: string) => void;
      };
    };
  }
}

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/moving-border";
import { SparklesText } from "@/components/ui/sparkles-text";
import { BlurIn } from "@/components/ui/blur-in";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BouquetModal } from "@/components/ui/bouquet-modal";
import { CartModal } from "@/components/ui/cart-modal";
import { ReadyBouquetsModal } from "@/components/ui/ready-bouquets-modal";
import { ContactsModal } from "@/components/ui/contacts-modal";
import { Toast } from "@/components/ui/toast";
import { useState, useEffect } from "react";

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

export const Component = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isReadyBouquetsModalOpen, setIsReadyBouquetsModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('flowerShopCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('flowerShopCart', JSON.stringify(cart));
  }, [cart]);

  const handleButtonClick = (buttonName: string) => {
    console.log(`Clicked: ${buttonName}`);
    if (buttonName === "Собрать букет") {
      setIsModalOpen(true);
    } else if (buttonName === "Готовые букеты") {
      setIsReadyBouquetsModalOpen(true);
    } else if (buttonName === "Корзина") {
      setIsCartModalOpen(true);
    } else if (buttonName === "Контакты") {
      setIsContactsModalOpen(true);
    }
    // Здесь можно добавить навигацию или другую логику
  };

  const handleAddToCart = (selections: FlowerSelection[], totalPrice: number) => {
    const newCartItems: CartItem[] = selections.map(selection => ({
      ...selection,
      id: `${selection.flower.id}-${Date.now()}-${Math.random()}`
    }));
    
    setCart(prev => [...prev, ...newCartItems]);
    showToast(`Букет добавлен в корзину! ${selections.length} позиций на сумму ${totalPrice} ₽`);
    animateCartCounter();
    console.log(`Добавлено в корзину: ${selections.length} позиций на сумму ${totalPrice} ₽`);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.flower.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = async (phoneNumber?: string, address?: string, telegramId?: string) => {
    if (cart.length === 0) {
      showToast("Корзина пуста!");
      return;
    }

    try {
      // Generate unique user ID based on priority: telegramId > phoneNumber > stored > random
      let userId = localStorage.getItem('flowerShopUserId');
      
      if (telegramId) {
        // If Telegram ID is provided, use it as the primary user ID
        userId = `telegram_${telegramId}`;
        localStorage.setItem('flowerShopUserId', userId);
      } else if (phoneNumber) {
        // If phone number is provided, use it as the user ID
        userId = `phone_${phoneNumber.replace(/\D/g, '')}`;
        localStorage.setItem('flowerShopUserId', userId);
      } else if (!userId) {
        // Generate random user ID if no phone number and no stored ID
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('flowerShopUserId', userId);
      }

      const orderData = {
        userId: userId,
        phoneNumber: phoneNumber,
        address: address,
        telegramId: telegramId,
        items: cart,
        total: getCartTotal(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Send order to backend (we'll create this endpoint)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        if (telegramId) {
          showToast(`Заказ оформлен! Заказ привязан к Telegram ID ${telegramId}. Проверьте заказ в боте через кнопку "🛒 Моя корзина".`);
        } else if (phoneNumber) {
          showToast(`Заказ оформлен! Мы свяжемся с вами по номеру ${phoneNumber}. Также вы можете просмотреть заказ в Telegram боте.`);
        } else {
          showToast(`Заказ оформлен! ID пользователя: ${userId.slice(-6)}. Свяжитесь с нами в Telegram для подтверждения.`);
        }
        setCart([]); // Clear cart after successful order
        setIsCartModalOpen(false);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      showToast("Ошибка при оформлении заказа. Попробуйте еще раз.");
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
  };

  const animateCartCounter = () => {
    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 600);
  };

  const handleAddReadyBouquetToCart = (bouquet: {
    id: string;
    name: string;
    price: number;
    emoji: string;
    description: string;
    flowers: string[];
  }) => {
    const cartItem: CartItem = {
      id: `ready-${bouquet.id}-${Date.now()}-${Math.random()}`,
      flower: {
        id: bouquet.id,
        name: bouquet.name,
        price: bouquet.price,
        emoji: bouquet.emoji,
        description: bouquet.description
      },
      quantity: 1
    };
    
    setCart(prev => [...prev, cartItem]);
    showToast(`${bouquet.name} добавлен в корзину! ${bouquet.price} ₽`);
    animateCartCounter();
    console.log(`Добавлен готовый букет: ${bouquet.name} - ${bouquet.price} ₽`);
  };

  return (
    <AuroraBackground showRadialGradient={true} className="">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        {/* Заголовок с анимированными блестками */}
        <div className="mb-6 sm:mb-8">
          <SparklesText 
            text="FlowersBest" 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black drop-shadow-lg"
            colors={{ first: "#FFD700", second: "#FFA500" }}
            sparklesCount={15}
          />
        </div>
        
        {/* Подзаголовок с анимацией размытия */}
        <div className="mb-12 sm:mb-16">
          <BlurIn 
            word="Свежесть в каждом лепестке"
            className="text-lg sm:text-xl lg:text-2xl text-black/90 drop-shadow-md max-w-2xl mx-auto leading-relaxed font-normal"
            duration={1.5}
          />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 max-w-md mx-auto relative z-10">
          <Button
            onClick={() => handleButtonClick("Собрать букет")}
            borderRadius="1.75rem"
            className="bg-transparent text-black w-full py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg font-medium transition-all duration-300 relative z-20"
            containerClassName="w-full h-16 relative z-20"
          >
            🌺 Собрать букет
          </Button>
          
          <Button
            onClick={() => handleButtonClick("Готовые букеты")}
            borderRadius="1.75rem"
            className="bg-transparent text-black w-full py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg font-medium transition-all duration-300 relative z-20"
            containerClassName="w-full h-16 relative z-20"
          >
            💐 Готовые букеты
          </Button>
          
          <Button
            onClick={() => handleButtonClick("Контакты")}
            borderRadius="1.75rem"
            className="bg-transparent text-black w-full py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg font-medium transition-all duration-300 relative z-20"
            containerClassName="w-full h-16 relative z-20"
          >
            💬 Контакты
          </Button>
        </div>
        
        {/* Кнопка корзины в правом нижнем углу */}
        <div className="fixed bottom-6 right-6 z-30">
          <div className="relative">
            <Button
              onClick={() => handleButtonClick("Корзина")}
              borderRadius="50%"
              className="bg-white/90 text-black w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-gray-200"
              containerClassName="w-14 h-14"
            >
              🛒
            </Button>
            {getCartItemsCount() > 0 && (
              <div className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold transition-all duration-300 ${
                isCartAnimating ? 'scale-125 animate-pulse' : 'scale-100'
              }`}>
                {getCartItemsCount()}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Модальное окно сборки букета */}
        <BouquetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddToCart}
        />

        {/* Модальное окно корзины */}
         <CartModal
           isOpen={isCartModalOpen}
           onClose={() => setIsCartModalOpen(false)}
           cartItems={cart}
           onClearCart={handleClearCart}
           onCheckout={handleCheckout}
         />

        {/* Модальное окно готовых букетов */}
        <ReadyBouquetsModal
          isOpen={isReadyBouquetsModalOpen}
          onClose={() => setIsReadyBouquetsModalOpen(false)}
          onAddToCart={handleAddReadyBouquetToCart}
        />

        {/* Модальное окно контактов */}
        <ContactsModal
          isOpen={isContactsModalOpen}
          onClose={() => setIsContactsModalOpen(false)}
        />

        {/* Уведомления */}
        <Toast
          message={toastMessage}
          isVisible={isToastVisible}
          onClose={() => setIsToastVisible(false)}
          type="success"
        />
      </AuroraBackground>
  );
};