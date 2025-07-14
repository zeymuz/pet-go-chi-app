import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FOODS, OUTFITS } from '../constants/pets';

const STORAGE_KEY = 'pet_store_data';
const STORE_VERSION = 3; // Updated version to support new food system

// Global store state
let globalStore = {
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
  }
};

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const saveStore = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...globalStore,
      _version: STORE_VERSION,
    }));
  } catch (error) {
    console.log('Error saving store data:', error);
  }
};

// Load saved store
(async () => {
  try {
    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const saved = JSON.parse(savedData);

      if (saved._version !== STORE_VERSION) {
        console.log('Store version outdated. Resetting store data.');
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      globalStore = {
        ...globalStore,
        coins: saved.coins ?? globalStore.coins,
        foodQuantities: saved.foodQuantities ?? globalStore.foodQuantities,
        equippedOutfits: saved.equippedOutfits ?? globalStore.equippedOutfits,
        outfits: OUTFITS.map(defaultOutfit => {
          const savedOutfit = saved.outfits?.find((o: any) => o.id === defaultOutfit.id);
          return savedOutfit ? { ...defaultOutfit, ...savedOutfit } : defaultOutfit;
        }),
        foods: FOODS.map(defaultFood => {
          const savedFood = saved.foods?.find((f: any) => f.id === defaultFood.id);
          return savedFood ? { ...defaultFood, ...savedFood } : defaultFood;
        }),
      };
    }
  } catch (error) {
    console.log('Error loading store data:', error);
  }
})();

const useStore = () => {
  const [state, setState] = useState(globalStore);

  useEffect(() => {
    const listener = () => {
      setState({ ...globalStore });
      saveStore();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateStore = (updater: (store: typeof globalStore) => typeof globalStore) => {
    globalStore = updater(globalStore);
    notifyListeners();
  };

  const purchaseItem = (itemId: string, quantity: number = 1) => {
    updateStore(store => {
      const item = [...store.outfits, ...store.foods].find(o => o.id === itemId);
      if (!item || store.coins < item.price * quantity) return store;

      const newCoins = store.coins - (item.price * quantity);
      console.log(`Purchasing ${quantity} items, coins: ${store.coins} -> ${newCoins}`);

      if (item.type === 'food') {
        const currentQuantity = store.foodQuantities[itemId] || 0;
        return {
          ...store,
          coins: newCoins,
          foodQuantities: {
            ...store.foodQuantities,
            [itemId]: currentQuantity + quantity
          }
        };
      } else {
        return {
          ...store,
          coins: newCoins,
          outfits: store.outfits.map(o => 
            o.id === itemId ? { ...o, owned: true } : o
          )
        };
      }
    });
  };

  const equipOutfit = (outfitId: string) => {
    updateStore(store => {
      const outfit = store.outfits.find(o => o.id === outfitId);
      if (!outfit || !outfit.owned) return store;

      return {
        ...store,
        equippedOutfits: {
          ...store.equippedOutfits,
          [outfit.type]: outfitId
        }
      };
    });
  };

  const earnCoins = (amount: number) => {
    if (amount <= 0) return 0;

    updateStore(store => {
      const newCoins = store.coins + amount;
      console.log(`Earning coins: ${store.coins} -> ${newCoins}`);
      return {
        ...store,
        coins: newCoins
      };
    });

    return amount;
  };

  return {
    coins: state.coins,
    outfits: state.outfits,
    foods: state.foods,
    foodQuantities: state.foodQuantities,
    equippedOutfits: state.equippedOutfits,
    purchaseItem,
    equipOutfit,
    earnCoins,
  };
};

export default useStore;