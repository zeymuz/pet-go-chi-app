// components/PixelPet.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { OUTFITS } from '../constants/pets';

interface PixelPetProps {
  activeAction: string | null;
  equippedOutfits: Record<string, string | null>;
}

export default function PixelPet({ activeAction, equippedOutfits }: PixelPetProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Move the function inside the component but before the return statement
  const getOutfitSource = (outfitId: string | null): ImageSourcePropType | undefined => {
    if (!outfitId) return undefined;
    const outfit = OUTFITS.find(o => o.id === outfitId);
    return outfit?.image;
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
          source={require('../../assets/images/adaptive-icon.png')} 
          style={styles.petImage} 
        />
        
        {equippedOutfits.hat && (
          <Image 
            source={getOutfitSource(equippedOutfits.hat)}
            style={[styles.outfitImage, styles.hat]}
          />
        )}
        
        {equippedOutfits.jacket && (
          <Image 
            source={getOutfitSource(equippedOutfits.jacket)}
            style={[styles.outfitImage, styles.jacket]}
          />
        )}
        
        {equippedOutfits.shirt && (
          <Image 
            source={getOutfitSource(equippedOutfits.shirt)}
            style={[styles.outfitImage, styles.shirt]}
          />
        )}
        
        {equippedOutfits.pants && (
          <Image 
            source={getOutfitSource(equippedOutfits.pants)}
            style={[styles.outfitImage, styles.pants]}
          />
        )}
        
        {equippedOutfits.shoes && (
          <Image 
            source={getOutfitSource(equippedOutfits.shoes)}
            style={[styles.outfitImage, styles.shoes]}
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
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  outfitImage: {
    position: 'absolute',
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  hat: {
    top: -15,
    left: 0,
  },
  jacket: {
    top: 0,
    left: 0,
  },
  shirt: {
    top: 35,
    left: 0,
  },
  pants: {
    top: 90,
    left: 0,
  },
  shoes: {
    top: 145,
    left: 0,
  },
});