import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { database } from '../config/firebase';
import useAuth from '../hooks/useAuth'; // Use to get current user

interface BasketItem {
  id: string;
  name: string;
  price: number;
}

interface BasketContextType {
  basketItems: BasketItem[];
  addItemToBasket: (item: BasketItem) => Promise<void>;
  itemCount: number; // To track the number of items in the basket
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
  const [itemCount, setItemCount] = useState<number>(0); // Track the item count
  const currentUser = useAuth();

  // Function to add items to basket and update Firestore
  const addItemToBasket = async (item: BasketItem) => {
    if (!currentUser?.email) {
      console.error('User is not authenticated.');
      return;
    }

    try {
      const buyerId = currentUser.email; // Use the user's email as the buyer ID
      const cartDocRef = doc(database, 'ShoppingCart', buyerId);
      const cartDoc = await getDoc(cartDocRef);

      let updatedItems: BasketItem[] = [];
      let newItemCount = 1;

      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        const existingItems = cartData.items || [];
        const itemCount = cartData.item_count || 0;

        // Check if the item already exists in the cart
        const existingItemIndex = existingItems.findIndex((basketItem: BasketItem) => basketItem.id === item.id);
        if (existingItemIndex > -1) {
          newItemCount = itemCount + 1;
        } else {
          // If the item doesn't exist, add it to the cart
          existingItems.push(item);
          newItemCount = itemCount + 1;
        }

        updatedItems = existingItems;

        // Update the cart in Firestore
        await updateDoc(cartDocRef, {
          items: updatedItems,
          item_count: newItemCount,
          total: updatedItems.reduce((total: number, basketItem: BasketItem) => total + basketItem.price, 0),
        });
      } else {
        // If the cart doesn't exist, create a new one
        updatedItems = [item];
        await setDoc(cartDocRef, {
          buyer_id: buyerId,
          items: updatedItems,
          item_count: 1,
          total: item.price,
        });
      }

      // Update local basket state and item count
      setBasketItems(updatedItems);
      setItemCount(newItemCount); // Update the item count locally
    } catch (error) {
      console.error('Error adding item to basket:', error);
    }
  };

  // useEffect to sync the basket count from Firestore when the user is logged in
  useEffect(() => {
    const fetchBasketCount = async () => {
      if (!currentUser?.email) return;

      try {
        const buyerId = currentUser.email;
        const cartDocRef = doc(database, 'ShoppingCart', buyerId);
        const cartDoc = await getDoc(cartDocRef);

        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          const existingItems = cartData.items || [];
          const itemCount = cartData.item_count || 0;

          // Update local state with items and count from Firestore
          setBasketItems(existingItems);
          setItemCount(itemCount);
        }
      } catch (error) {
        console.error('Error fetching basket from Firestore:', error);
      }
    };

    fetchBasketCount();
  }, [currentUser]);

  return (
    <BasketContext.Provider value={{ basketItems, addItemToBasket, itemCount }}>
      {children}
    </BasketContext.Provider>
  );
};