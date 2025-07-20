import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 428; // iPhone 14 Plus width
const BASE_HEIGHT = 926; // iPhone 14 Plus height

export const scale = (size: number) => (width / BASE_WIDTH) * size;
export const verticalScale = (size: number) => (height / BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5) => 
  size + (scale(size) - size) * factor;

export const scaleFont = (size: number) => {
  const scaledSize = scale(size);
  return Math.min(scaledSize, size * 1.3); // Cap scaling at 130%
};