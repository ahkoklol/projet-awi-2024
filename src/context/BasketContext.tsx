// src/context/BasketContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BasketContextType {
  basketItems: BasketItem[];
  addItemToBasket: (item: BasketItem) => void;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};

export const BasketProvider = ({ children }: { children: ReactNode }) => {
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);

  const addItemToBasket = (item: BasketItem) => {
    setBasketItems((prevItems) => {
      const itemExists = prevItems.find((basketItem) => basketItem.id === item.id);
      if (itemExists) {
        // Increase quantity if the item already exists
        return prevItems.map((basketItem) =>
          basketItem.id === item.id ? { ...basketItem, quantity: basketItem.quantity + 1 } : basketItem
        );
      } else {
        // Add new item to the basket
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  return (
    <BasketContext.Provider value={{ basketItems, addItemToBasket }}>
      {children}
    </BasketContext.Provider>
  );
};
