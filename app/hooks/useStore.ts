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
    console.error('Error saving store:', error);
  }
};

const migrateData = (oldData: any) => {
  if (!oldData) return globalStore;

  if (oldData._version === 3) {
    return {
      ...globalStore,
      coins: oldData.coins || globalStore.coins,
      foodQuantities: oldData.foodQuantities || globalStore.foodQuantities,
      equippedOutfits: oldData.equippedOutfits || globalStore.equippedOutfits,
      outfits: oldData.outfits?.map((outfit: any) => ({
        ...defaultOutfitsById[outfit.id],
        ...outfit,
        petImage: defaultOutfitsById[outfit.id]?.petImage 
      })) || OUTFITS,
      foods: oldData.foods?.map((food: any) => ({
        ...defaultFoodsById[food.id],
        ...food
      })) || FOODS
    };
  }

  return null;
};

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
        }
        return;
      }

      globalStore = {
        ...globalStore,
        coins: saved.coins ?? globalStore.coins,
        foodQuantities: saved.foodQuantities ?? globalStore.foodQuantities,
        equippedOutfits: saved.equippedOutfits ?? globalStore.equippedOutfits,
        outfits: saved.outfits?.map((outfit: any) => ({
          ...defaultOutfitsById[outfit.id],
          ...outfit
        })) ?? OUTFITS,
        foods: saved.foods?.map((food: any) => ({
          ...defaultFoodsById[food.id],
          ...food
        })) ?? FOODS
      };
    }
  } catch (error) {
    console.error('Error loading store:', error);
    await AsyncStorage.removeItem(STORAGE_KEY);
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

  const addCoins = (amount: number) => {
    updateStore(store => ({
      ...store,
      coins: store.coins + amount
    }));
  };

  const purchaseItem = (itemId: string, quantity: number = 1) => {
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

  const equipOutfit = (outfitId: string) => {
    updateStore(store => {
      if (!outfitId) {
        return {
          ...store,
          equippedOutfits: {
            ...store.equippedOutfits,
            ...Object.entries(store.equippedOutfits).reduce((acc, [type, id]) => {
              if (id === outfitId) {
                acc[type] = null;
              }
              return acc;
            }, {} as Record<string, string | null>)
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
    if (amount <= 0) return 0;

    updateStore(store => {
      const newCoins = store.coins + amount;
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
    consumeFood,
    equipOutfit,
    earnCoins,
    addCoins,
  };
};

export default useStore;