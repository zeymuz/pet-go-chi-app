import { Food, Outfit } from '../types/types';

const OUTFITS: Outfit[] = [
  // Hats
  {
    id: 'hat1',
    name: 'Baseball Cap',
    price: 50,
    owned: false,
    image: 'https://example.com/hat1.png',
    type: 'hat',
  },
  {
    id: 'hat2',
    name: 'Wizard Hat',
    price: 100,
    owned: false,
    image: 'https://example.com/hat2.png',
    type: 'hat',
  },
  {
    id: 'hat3',
    name: 'Cowboy Hat',
    price: 75,
    owned: false,
    image: 'https://example.com/hat3.png',
    type: 'hat',
  },
  {
    id: 'hat4',
    name: 'Beanie',
    price: 40,
    owned: false,
    image: 'https://example.com/hat4.png',
    type: 'hat',
  },
  {
    id: 'hat5',
    name: 'Crown',
    price: 200,
    owned: false,
    image: 'https://example.com/hat5.png',
    type: 'hat',
  },
  // Jackets
  {
    id: 'jacket1',
    name: 'Denim Jacket',
    price: 150,
    owned: false,
    image: 'https://example.com/jacket1.png',
    type: 'jacket',
  },
  {
    id: 'jacket2',
    name: 'Leather Jacket',
    price: 250,
    owned: false,
    image: 'https://example.com/jacket2.png',
    type: 'jacket',
  },
  {
    id: 'jacket3',
    name: 'Hoodie',
    price: 120,
    owned: false,
    image: 'https://example.com/jacket3.png',
    type: 'jacket',
  },
  {
    id: 'jacket4',
    name: 'Bomber Jacket',
    price: 180,
    owned: false,
    image: 'https://example.com/jacket4.png',
    type: 'jacket',
  },
  {
    id: 'jacket5',
    name: 'Raincoat',
    price: 100,
    owned: false,
    image: 'https://example.com/jacket5.png',
    type: 'jacket',
  },
  // Shirts
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
    name: 'Button-Up',
    price: 60,
    owned: false,
    image: 'https://example.com/shirt2.png',
    type: 'shirt',
  },
  {
    id: 'shirt3',
    name: 'Tank Top',
    price: 25,
    owned: false,
    image: 'https://example.com/shirt3.png',
    type: 'shirt',
  },
  {
    id: 'shirt4',
    name: 'Sweater',
    price: 80,
    owned: false,
    image: 'https://example.com/shirt4.png',
    type: 'shirt',
  },
  {
    id: 'shirt5',
    name: 'Polo',
    price: 50,
    owned: false,
    image: 'https://example.com/shirt5.png',
    type: 'shirt',
  },
  // Pants
  {
    id: 'pants1',
    name: 'Jeans',
    price: 100,
    owned: false,
    image: 'https://example.com/pants1.png',
    type: 'pants',
  },
  {
    id: 'pants2',
    name: 'Shorts',
    price: 60,
    owned: false,
    image: 'https://example.com/pants2.png',
    type: 'pants',
  },
  {
    id: 'pants3',
    name: 'Sweatpants',
    price: 70,
    owned: false,
    image: 'https://example.com/pants3.png',
    type: 'pants',
  },
  {
    id: 'pants4',
    name: 'Cargo Pants',
    price: 90,
    owned: false,
    image: 'https://example.com/pants4.png',
    type: 'pants',
  },
  {
    id: 'pants5',
    name: 'Dress Pants',
    price: 120,
    owned: false,
    image: 'https://example.com/pants5.png',
    type: 'pants',
  },
  // Shoes
  {
    id: 'shoes1',
    name: 'Sneakers',
    price: 80,
    owned: false,
    image: 'https://example.com/shoes1.png',
    type: 'shoes',
  },
  {
    id: 'shoes2',
    name: 'Boots',
    price: 150,
    owned: false,
    image: 'https://example.com/shoes2.png',
    type: 'shoes',
  },
  {
    id: 'shoes3',
    name: 'Sandals',
    price: 50,
    owned: false,
    image: 'https://example.com/shoes3.png',
    type: 'shoes',
  },
  {
    id: 'shoes4',
    name: 'Dress Shoes',
    price: 120,
    owned: false,
    image: 'https://example.com/shoes4.png',
    type: 'shoes',
  },
  {
    id: 'shoes5',
    name: 'Flip Flops',
    price: 30,
    owned: false,
    image: 'https://example.com/shoes5.png',
    type: 'shoes',
  },
];

const FOODS: Food[] = [
  {
    id: 'food1',
    name: 'Apple',
    price: 10,
    owned: false,
    image: 'https://example.com/apple.png',
    type: 'food',
    hungerRestore: 15
  },
  {
    id: 'food2',
    name: 'Pizza',
    price: 30,
    owned: false,
    image: 'https://example.com/pizza.png',
    type: 'food',
    hungerRestore: 40
  },
  {
    id: 'food3',
    name: 'Burger',
    price: 25,
    owned: false,
    image: 'https://example.com/burger.png',
    type: 'food',
    hungerRestore: 35
  },
  {
    id: 'food4',
    name: 'Salad',
    price: 15,
    owned: false,
    image: 'https://example.com/salad.png',
    type: 'food',
    hungerRestore: 20
  },
  {
    id: 'food5',
    name: 'Steak',
    price: 50,
    owned: false,
    image: 'https://example.com/steak.png',
    type: 'food',
    hungerRestore: 60
  }
];

export { FOODS, OUTFITS };

export default () => null;