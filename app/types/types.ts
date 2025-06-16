interface StoreItem {
  id: string;
  name: string;
  price: number;
  image: string;
  owned: boolean;
}

interface Outfit extends StoreItem {
  type: 'hat' | 'jacket' | 'shirt' | 'pants' | 'shoes';
}

export type { Outfit, StoreItem };

export default () => null;