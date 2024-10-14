import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface BasketItem {
  id: string;
  name: string;
  price: number;
  commission: number;
  deposit_fee: number;
  deposit_fee_type: string;
  quantity: number;
}

interface BasketContextType {
  basketItems: BasketItem[];
  addItemToBasket: (item: BasketItem) => boolean;
  clearBasket: () => void;
  itemCount: number;
  total: number;
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
  const [itemCount, setItemCount] = useState<number>(0);

  // Save basket to localStorage
  const saveBasketToLocalStorage = (items: BasketItem[], itemCount: number) => {
    const basket = { items, itemCount };
    localStorage.setItem('basket', JSON.stringify(basket));
  };

  // Load basket from localStorage
  const loadBasketFromLocalStorage = () => {
    const savedBasket = localStorage.getItem('basket');
    if (savedBasket) {
      const basket = JSON.parse(savedBasket);
      setBasketItems(basket.items || []);
      setItemCount(basket.itemCount || 0);
    }
  };

  // Add item to the basket and return true if added, false if it already exists
  const addItemToBasket = (item: BasketItem): boolean => {
    let updatedItems = [...basketItems];
    const existingItemIndex = updatedItems.findIndex((basketItem) => basketItem.id === item.id);

    if (existingItemIndex === -1) {
      // If the item is not in the basket, add it
      updatedItems.push(item);
      const newItemCount = updatedItems.length;

      setBasketItems(updatedItems);
      setItemCount(newItemCount);
      saveBasketToLocalStorage(updatedItems, newItemCount);

      return true;  // Item was added successfully
    } else {
      // If item already exists, return false
      return false;  // Item was not added
    }
  };

  // Clear the basket and localStorage
  const clearBasket = () => {
    setBasketItems([]);
    setItemCount(0);
    localStorage.removeItem('basket');
  };

  // Load basket from localStorage on initial render
  useEffect(() => {
    loadBasketFromLocalStorage();
  }, []);

  // Calculate total dynamically
  const total = basketItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <BasketContext.Provider value={{ basketItems, addItemToBasket, clearBasket, itemCount, total }}>
      {children}
    </BasketContext.Provider>
  );
};
