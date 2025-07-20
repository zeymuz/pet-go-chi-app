import { PixelRatio } from 'react-native';

export const scaleFont = (size: number) => {
  const scaleFactor = PixelRatio.getFontScale();
  return size * Math.min(scaleFactor, 1.3);
};