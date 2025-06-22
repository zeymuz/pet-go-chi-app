import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FOODS, OUTFITS } from '../constants/pets';

const STORAGE_KEY = 'pet_store_data';

// Global store instance
let globalStore = {
  coins: 100,
  outfits: OUTFITS,
  foods: FOODS,
  equippedOutfits: {
    hat: null,
    jacket: null,
    shirt: null,
    pants: null,
    shoes: null,
  }
};

// Load saved data on initialization
(async () => {
  try {
    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedData) {
      Object.assign(globalStore, JSON.parse(savedData));
    }
  } catch (error) {
    console.log('Error loading store data:', error);
  }
})();

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const saveStore = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(globalStore));
  } catch (error) {
    console.log('Error saving store data:', error);
  }
};

const useStore = () => {
  const [state, setState] = useState(globalStore);

  useEffect(() => {
    const listener = () => {
      setState({...globalStore});
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

  const purchaseItem = (itemId: string) => {
    updateStore(store => {
      const item = [...store.outfits, ...store.foods].find(o => o.id === itemId);
      if (!item || item.owned || store.coins < item.price) return store;

      const newCoins = store.coins - item.price;
      console.log(`Purchasing item, coins: ${store.coins} -> ${newCoins}`);

      if (item.type === 'food') {
        return {
          ...store,
          coins: newCoins,
          foods: store.foods.map(f => f.id === itemId ? { ...f, owned: true } : f)
        };
      } else {
        return {
          ...store,
          coins: newCoins,
          outfits: store.outfits.map(o => o.id === itemId ? { ...o, owned: true } : o)
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
    equippedOutfits: state.equippedOutfits,
    purchaseItem,
    equipOutfit,
    earnCoins,
  };
};

export default useStore;