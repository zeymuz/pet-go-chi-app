// Just declare the interfaces - no exports here
interface StoreItem {
  id: string;
  name: string;
  price: number;
  image: string;
  owned: boolean;
}

interface Pet extends StoreItem {
  unlockedAtLevel: number;
}

interface Outfit extends StoreItem {
  type: 'hat' | 'shirt' | 'glasses' | 'other';
}

// Single export statement
export type { StoreItem, Pet, Outfit };

export default () => null;