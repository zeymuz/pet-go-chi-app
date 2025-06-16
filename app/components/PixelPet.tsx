import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

interface PixelPetProps {
  activeAction: string | null;
  equippedOutfits: Record<string, string | null>;
}

export default function PixelPet({ activeAction, equippedOutfits }: PixelPetProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeAction) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
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
        
        {/* Render equipped outfits */}
        {equippedOutfits.hat && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfits.hat}.png` }}
            style={[styles.outfitImage, styles.hat]}
          />
        )}
        {equippedOutfits.jacket && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfits.jacket}.png` }}
            style={[styles.outfitImage, styles.jacket]}
          />
        )}
        {equippedOutfits.shirt && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfits.shirt}.png` }}
            style={[styles.outfitImage, styles.shirt]}
          />
        )}
        {equippedOutfits.pants && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfits.pants}.png` }}
            style={[styles.outfitImage, styles.pants]}
          />
        )}
        {equippedOutfits.shoes && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfits.shoes}.png` }}
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
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  outfitImage: {
    position: 'absolute',
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  hat: {
    top: -10,
    left: 0,
  },
  jacket: {
    top: 0,
    left: 0,
  },
  shirt: {
    top: 20,
    left: 0,
  },
  pants: {
    top: 50,
    left: 0,
  },
  shoes: {
    top: 80,
    left: 0,
  },
});