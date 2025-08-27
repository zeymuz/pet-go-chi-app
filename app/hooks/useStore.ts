// hooks/useStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FOODS, OUTFITS } from '../constants/pets';

const STORAGE_KEY = 'pet_store_data';

interface StoreState {
  coins: number;
  outfits: typeof OUTFITS;
  foods: typeof FOODS;
  foodQuantities: Record<string, number>;
  equippedOutfits: {
    hat: string | null;
    jacket: string | null;
    shirt: string | null;
    pants: string | null;
    shoes: string | null;
  };
}

const defaultStoreState: StoreState = {
  coins: 100,
  outfits: OUTFITS,
  foods: FOODS,
  foodQuantities: FOODS.reduce((acc: Record<string, number>, food) => {
    acc[food.id] = 0;
    return acc;
  }, {}),
  equippedOutfits: {
    hat: null,
    jacket: null,
    shirt: null,
    pants: null,
    shoes: null,
  },
};

export default function useStore() {
  const [store, setStore] = useState<StoreState>(defaultStoreState);
  const [isLoading, setIsLoading] = useState(true);

  // Load store data on mount
  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setStore(parsedData);
      }
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStore = async (newStore: StoreState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  const updateStore = (updater: (currentStore: StoreState) => StoreState) => {
    setStore(currentStore => {
      const newStore = updater(currentStore);
      saveStore(newStore);
      return newStore;
    });
  };

  const purchaseItem = (itemId: string, quantity: number = 1) => {
    updateStore(currentStore => {
      const item = [...currentStore.outfits, ...currentStore.foods].find(o => o.id === itemId);
      if (!item || currentStore.coins < item.price * quantity) {
        return currentStore;
      }

      const newCoins = currentStore.coins - (item.price * quantity);

      if (item.type === 'food') {
        const currentQuantity = currentStore.foodQuantities[itemId] || 0;
        return {
          ...currentStore,
          coins: newCoins,
          foodQuantities: {
            ...currentStore.foodQuantities,
            [itemId]: currentQuantity + quantity
          }
        };
      } else {
        return {
          ...currentStore,
          coins: newCoins,
          outfits: currentStore.outfits.map(o => 
            o.id === itemId ? { ...o, owned: true } : o
          )
        };
      }
    });
  };

  const consumeFood = (itemId: string) => {
    updateStore(currentStore => {
      const currentQuantity = currentStore.foodQuantities[itemId] || 0;
      if (currentQuantity <= 0) return currentStore;

      return {
        ...currentStore,
        foodQuantities: {
          ...currentStore.foodQuantities,
          [itemId]: currentQuantity - 1
        }
      };
    });
  };

  const equipOutfit = (outfitId: string, type?: string) => {
    updateStore(currentStore => {
      if (outfitId === '') {
        if (type) {
          return {
            ...currentStore,
            equippedOutfits: {
              ...currentStore.equippedOutfits,
              [type]: null
            }
          };
        }
        return {
          ...currentStore,
          equippedOutfits: {
            hat: null,
            jacket: null,
            shirt: null,
            pants: null,
            shoes: null,
          }
        };
      }

      const outfit = currentStore.outfits.find(o => o.id === outfitId);
      if (!outfit || !outfit.owned) return currentStore;

      const newEquipped = { ...currentStore.equippedOutfits };
      if (outfit.type === 'jacket') {
        newEquipped.shirt = null;
      } else if (outfit.type === 'shirt') {
        newEquipped.jacket = null;
      }

      return {
        ...currentStore,
        equippedOutfits: {
          ...newEquipped,
          [outfit.type]: outfitId
        }
      };
    });
  };

  const earnCoins = (amount: number) => {
    if (amount <= 0) return 0;
    
    const actualAmount = Math.floor(amount);
    updateStore(currentStore => ({
      ...currentStore,
      coins: currentStore.coins + actualAmount
    }));
    return actualAmount;
  };

  const addCoins = (amount: number) => {
    updateStore(currentStore => ({
      ...currentStore,
      coins: currentStore.coins + amount
    }));
    return amount;
  };

  return {
    coins: store.coins,
    outfits: store.outfits,
    foods: store.foods,
    foodQuantities: store.foodQuantities,
    equippedOutfits: store.equippedOutfits,
    isLoading,
    purchaseItem,
    consumeFood,
    equipOutfit,
    earnCoins,
    addCoins,
  };
}