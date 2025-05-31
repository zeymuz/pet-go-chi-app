import { Pet, Outfit } from '../types/types';

const PETS: Pet[] = [
  {
    id: 'pet1',
    name: 'Pixel Dog',
    price: 0,
    owned: true,
    image: 'https://example.com/pet1.png',
    unlockedAtLevel: 1,
  },
  {
    id: 'pet2',
    name: 'Pixel Cat',
    price: 200,
    owned: false,
    image: 'https://example.com/pet2.png',
    unlockedAtLevel: 10,
  },
  {
    id: 'pet3',
    name: 'Pixel Dragon',
    price: 500,
    owned: false,
    image: 'https://example.com/pet3.png',
    unlockedAtLevel: 20,
  },
  {
    id: 'pet4',
    name: 'Pixel Unicorn',
    price: 1000,
    owned: false,
    image: 'https://example.com/pet4.png',
    unlockedAtLevel: 50,
  },
  {
    id: 'pet5',
    name: 'Pixel Phoenix',
    price: 2000,
    owned: false,
    image: 'https://example.com/pet5.png',
    unlockedAtLevel: 100,
  },
];

const OUTFITS: Outfit[] = [
  {
    id: 'hat1',
    name: 'Wizard Hat',
    price: 50,
    owned: false,
    image: 'https://example.com/hat1.png',
    type: 'hat',
  },
  {
    id: 'hat2',
    name: 'Crown',
    price: 100,
    owned: false,
    image: 'https://example.com/hat2.png',
    type: 'hat',
  },
  {
    id: 'shirt1',
    name: 'T-Shirt',
    price: 30,
    owned: false,
    image: 'https://example.com/shirt1.png',
    type: 'shirt',
  },
  {
    id: 'shirt2',
    name: 'Armor',
    price: 150,
    owned: false,
    image: 'https://example.com/shirt2.png',
    type: 'shirt',
  },
  {
    id: 'glasses1',
    name: 'Sunglasses',
    price: 40,
    owned: false,
    image: 'https://example.com/glasses1.png',
    type: 'glasses',
  },
];

export { PETS, OUTFITS };

export default () => null;
