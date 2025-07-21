// types.ts
interface StoreItem {
  id: string;
  name: string;
  price: number;
  image: any;
  owned: boolean;
  petImage: any; 
}

interface Outfit extends StoreItem {
  type: 'hat' | 'jacket' | 'shirt' | 'pants' | 'shoes';
}

interface Food extends StoreItem {
  type: 'food';
  hungerRestore: number;
}

export type { Food, Outfit, StoreItem };

export default () => null;