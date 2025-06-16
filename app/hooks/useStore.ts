import { useState } from 'react';
import { OUTFITS } from '../constants/pets';
import { Outfit } from '../types/types';

const useStore = () => {
  const [coins, setCoins] = useState(100);
  const [outfits, setOutfits] = useState<Outfit[]>(OUTFITS);
  const [equippedOutfits, setEquippedOutfits] = useState<Record<string, string | null>>({
    hat: null,
    jacket: null,
    shirt: null,
    pants: null,
    shoes: null,
  });

  const purchaseItem = (itemId: string) => {
    const item = outfits.find(o => o.id === itemId);
    
    if (!item || item.owned || coins < item.price) return;
    
    setCoins(prev => prev - item.price);
    setOutfits(prev => 
      prev.map(o => o.id === itemId ? { ...o, owned: true } : o)
    );
  };

  const equipOutfit = (outfitId: string) => {
    const outfit = outfits.find(o => o.id === outfitId);
    if (!outfit || !outfit.owned) return;

    
    setEquippedOutfits(prev => ({
      ...prev,
      [outfit.type]: outfitId,
    }));

    setEquippedOutfits(outfitId);

  };

  const earnCoins = (amount: number) => {
    setCoins(prev => prev + amount);
    return amount;
  };

  return {
    outfits,
    coins,
    purchaseItem,
    equipOutfit,
    equippedOutfits,
    earnCoins,
  };
};

export default useStore;