import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Pet } from '../types/types';

interface PixelPetProps {
  pet: Pet;
  activeAction: string | null;
  equippedOutfit: string | null;
}

export default function PixelPet({ pet, activeAction, equippedOutfit }: PixelPetProps) {
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

  const getPetImage = () => {
    if (pet.happiness < 30) return require('../../assets/images/adaptive-icon.png');
    if (pet.hunger > 70) return require('../../assets/images/adaptive-icon.png');
    if (pet.energy < 30) return require('../../assets/images/adaptive-icon.png');
    return require('../../assets/images/adaptive-icon.png');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image source={getPetImage()} style={styles.petImage} />
        {equippedOutfit && (
          <Image 
            source={{ uri: `../assets/images/outfits/${equippedOutfit}.png` }} 
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
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  outfitImage: {
    position: 'absolute',
    width: 100,
    height: 100,
    resizeMode: 'contain',
    top: 0,
    left: 0,
  },
});