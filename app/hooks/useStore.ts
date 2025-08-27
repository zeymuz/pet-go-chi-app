// hooks/useStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FOODS, OUTFITS } from '../constants/pets';

const STORAGE_KEY = 'pet_store_data';
const STORE_VERSION = 5;

const createReferenceMaps = () => {
  const defaultOutfitsById: Record<string, typeof OUTFITS[0]> = {};
  const defaultFoodsById: Record<string, typeof FOODS[0]> = {};

  OUTFITS.forEach(outfit => {
    defaultOutfitsById[outfit.id] = outfit;
  });

  FOODS.forEach(food => {
    defaultFoodsById[food.id] = food;
  });

  return { defaultOutfitsById, defaultFoodsById };
};

const { defaultOutfitsById, defaultFoodsById } = createReferenceMaps();

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
  _isInitialized: boolean;
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
  _isInitialized: false
};

let globalStore: StoreState = { ...defaultStoreState };

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const saveStore = async () => {
  try {
    const dataToSave = { ...globalStore };
    delete dataToSave._isInitialized; // Don't save internal flag
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...dataToSave,
      _version: STORE_VERSION,
    }));
  } catch (error) {
    console.error('Error saving store:', error);
  }
};

const migrateData = (oldData: any): StoreState | null => {
  if (!oldData) return null;

  if (oldData._version === 3) {
    return {
      ...defaultStoreState,
      coins: oldData.coins || defaultStoreState.coins,
      foodQuantities: oldData.foodQuantities || defaultStoreState.foodQuantities,
      equippedOutfits: oldData.equippedOutfits || defaultStoreState.equippedOutfits,
      outfits: oldData.outfits?.map((outfit: any) => ({
        ...defaultOutfitsById[outfit.id],
        ...outfit,
        petImage: defaultOutfitsById[outfit.id]?.petImage 
      })) || OUTFITS,
      foods: oldData.foods?.map((food: any) => ({
        ...defaultFoodsById[food.id],
        ...food
      })) || FOODS,
      _isInitialized: true
    };
  }

  return null;
};

// Load initial data - this runs once when the module loads
(async () => {
  try {
    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const saved = JSON.parse(savedData);

      if (saved._version && saved._version !== STORE_VERSION) {
        const migrated = migrateData(saved);
        if (migrated) {
          globalStore = migrated;
          await saveStore();
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
          globalStore = { ...defaultStoreState, _isInitialized: true };
        }
        return;
      }

      globalStore = {
        ...defaultStoreState,
        coins: saved.coins ?? defaultStoreState.coins,
        foodQuantities: saved.foodQuantities ?? defaultStoreState.foodQuantities,
        equippedOutfits: saved.equippedOutfits ?? defaultStoreState.equippedOutfits,
        outfits: saved.outfits?.map((outfit: any) => ({
          ...defaultOutfitsById[outfit.id],
          ...outfit
        })) ?? OUTFITS,
        foods: saved.foods?.map((food: any) => ({
          ...defaultFoodsById[food.id],
          ...food
        })) ?? FOODS,
        _isInitialized: true
      };
    } else {
      globalStore = { ...defaultStoreState, _isInitialized: true };
    }
  } catch (error) {
    console.error('Error loading store:', error);
    await AsyncStorage.removeItem(STORAGE_KEY);
    globalStore = { ...defaultStoreState, _isInitialized: true };
  }
})();

const useStore = () => {
  const [state, setState] = useState<StoreState>(globalStore);
  const [isLoading, setIsLoading] = useState(!globalStore._isInitialized);

  useEffect(() => {
    const listener = () => {
      setState({ ...globalStore });
      setIsLoading(!globalStore._isInitialized);
    };

    listeners.add(listener);
    
    // Initial check in case store was already loaded
    if (globalStore._isInitialized && isLoading) {
      setIsLoading(false);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [isLoading]);

  const updateStore = (updater: (store: StoreState) => StoreState) => {
    if (!globalStore._isInitialized) return;
    
    globalStore = updater(globalStore);
    notifyListeners();
    saveStore();
  };

  const addCoins = (amount: number) => {
    if (!globalStore._isInitialized) return 0;
    
    updateStore(store => ({
      ...store,
      coins: store.coins + amount
    }));
    return amount;
  };

  const purchaseItem = (itemId: string, quantity: number = 1) => {
    if (!globalStore._isInitialized) return;
    
    updateStore(store => {
      const item = [...store.outfits, ...store.foods].find(o => o.id === itemId);
      if (!item || store.coins < item.price * quantity) return store;

      const newCoins = store.coins - (item.price * quantity);

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

  const consumeFood = (itemId: string) => {
    if (!globalStore._isInitialized) return;
    
    updateStore(store => {
      const currentQuantity = store.foodQuantities[itemId] || 0;
      if (currentQuantity <= 0) return store;

      return {
        ...store,
        foodQuantities: {
          ...store.foodQuantities,
          [itemId]: currentQuantity - 1
        }
      };
    });
  };

  const equipOutfit = (outfitId: string, type?: string) => {
    if (!globalStore._isInitialized) return;
    
    updateStore(store => {
      if (outfitId === '') {
        if (type) {
          return {
            ...store,
            equippedOutfits: {
              ...store.equippedOutfits,
              [type]: null
            }
          };
        }
        return {
          ...store,
          equippedOutfits: {
            hat: null,
            jacket: null,
            shirt: null,
            pants: null,
            shoes: null,
          }
        };
      }

      const outfit = store.outfits.find(o => o.id === outfitId);
      if (!outfit || !outfit.owned) return store;

      const newEquipped = { ...store.equippedOutfits };
      if (outfit.type === 'jacket') {
        newEquipped.shirt = null;
      } else if (outfit.type === 'shirt') {
        newEquipped.jacket = null;
      }

      return {
        ...store,
        equippedOutfits: {
          ...newEquipped,
          [outfit.type]: outfitId
        }
      };
    });
  };

  const earnCoins = (amount: number) => {
    if (!globalStore._isInitialized || amount <= 0) return 0;
    
    const actualAmount = Math.floor(amount);
    updateStore(store => ({
      ...store,
      coins: store.coins + actualAmount
    }));
    return actualAmount;
  };

  return {
    coins: state.coins,
    outfits: state.outfits,
    foods: state.foods,
    foodQuantities: state.foodQuantities,
    equippedOutfits: state.equippedOutfits,
    isLoading,
    purchaseItem,
    consumeFood,
    equipOutfit,
    earnCoins,
    addCoins,
  };
};

export default useStore;