import { Dimensions } from 'react-native';

const BASE_WIDTH = 428; // iPhone 14 Plus width

export default function useDimensions() {
  const { width, height } = Dimensions.get('window');
  
  const scale = (size: number) => (width / BASE_WIDTH) * size;
  const verticalScale = (size: number) => (height / 926) * size; // iPhone 14 Plus height
  
  return {
    width,
    height,
    scale,
    verticalScale,
    moderateScale: (size: number, factor = 0.5) => 
      size + (scale(size) - size) * factor
  };
}