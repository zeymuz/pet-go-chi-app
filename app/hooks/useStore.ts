import { useState } from 'react';
import { OUTFITS, PETS } from '../constants/pets';
import { Outfit, Pet, StoreItem } from '../types/types';

const useStore = () => {
  const [coins, setCoins] = useState(100);
  const [outfits, setOutfits] = useState<Outfit[]>(OUTFITS);
  const [pets, setPets] = useState<Pet[]>(PETS);
  const [equippedOutfit, setEquippedOutfit] = useState<string | null>(null);

  const purchaseItem = (itemId: string, type: 'outfit' | 'pet') => {
    let item: StoreItem | undefined;
    
    if (type === 'outfit') {
      item = outfits.find(o => o.id === itemId);
    } else {
      item = pets.find(p => p.id === itemId);
    }
    
    if (!item || item.owned || coins < item.price) return;
    
    setCoins(prev => prev - item.price);
    
    if (type === 'outfit') {
      setOutfits(prev => 
        prev.map(o => o.id === itemId ? { ...o, owned: true } : o)
      );
    } else {
      setPets(prev => 
        prev.map(p => p.id === itemId ? { ...p, owned: true } : p)
      );
    }
  };

  const equipOutfit = (outfitId: string) => {
    const outfit = outfits.find(o => o.id === outfitId);
    if (!outfit || !outfit.owned) return;
    setEquippedOutfit(outfitId);
  };

  const earnCoins = (amount: number) => {
    setCoins(prev => prev + amount);
    return amount;
  };

  return {
    outfits,
    pets,
    coins,
    purchaseItem,
    equipOutfit,
    equippedOutfit,
    earnCoins,
  };
};

export default useStore;