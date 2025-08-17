// PixelPet.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { scale, verticalScale } from '../../utils/scaling';
import { OUTFITS } from '../constants/pets';

interface PixelPetProps {
  activeAction: string | null;
  equippedOutfits: Record<string, string | null>;
}

export default function PixelPet({ activeAction, equippedOutfits }: PixelPetProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const getOutfitSource = (outfitId: any | null): ImageSourcePropType | undefined => {
    if (!outfitId) return undefined;
    const outfit = OUTFITS.find(o => o.id === outfitId);
    return outfit?.petImage; // Changed from image to petImage
  };

  useEffect(() => {
    if (activeAction) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeAction]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image 
          source={require('../../assets/images/gifs/anim-ezgif.com-apng-to-gif-converter.gif')} 
          style={styles.petImage} 
        />
        
        {equippedOutfits.hat && (
          <Image 
            source={getOutfitSource(equippedOutfits.hat)}
            style={styles.outfitImage}
          />
        )}
        
        {equippedOutfits.jacket && (
          <Image 
            source={getOutfitSource(equippedOutfits.jacket)}
            style={styles.outfitImage}
          />
        )}
        
        {equippedOutfits.shirt && (
          <Image 
            source={getOutfitSource(equippedOutfits.shirt)}
            style={styles.outfitImage}
          />
        )}
        
        {equippedOutfits.pants && (
          <Image 
            source={getOutfitSource(equippedOutfits.pants)}
            style={styles.outfitImage}
          />
        )}
        
        {equippedOutfits.shoes && (
          <Image 
            source={getOutfitSource(equippedOutfits.shoes)}
            style={styles.outfitImage}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    width: scale(300),
    height: verticalScale(300),
    resizeMode: 'contain',
  },
  outfitImage: {
    position: 'absolute',
    width: scale(300),
    height: verticalScale(300),
    resizeMode: 'contain',
    top: 0,
    left: 0,
  },
});