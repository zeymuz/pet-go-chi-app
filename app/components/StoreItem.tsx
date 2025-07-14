import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import COLORS from '../constants/colors';

interface StoreItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: any;
    owned: boolean;
    type: string;
    hungerRestore?: number;
  };
  onPurchase: () => void;
  onEquip: () => void;
  isEquipped: boolean;
  owned: boolean;
}

export default function StoreItem({
  item,
  onPurchase,
  onEquip,
  isEquipped,
  owned,
}: StoreItemProps) {
  const [imageError, setImageError] = React.useState(false);

  // Fallback to default image if loading fails
  const imageSource = imageError 
    ? require('../../assets/images/adaptive-icon.png')
    : typeof item.image === 'string' 
      ? { uri: item.image } 
      : item.image;

  return (
    <View style={styles.container}>
      <Image 
        source={imageSource}
        style={styles.image}
        onError={() => setImageError(true)}
        defaultSource={require('../../assets/images/adaptive-icon.png')}
      />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price} coins</Text>
      {item.type === 'food' && item.hungerRestore && (
        <Text style={styles.hungerRestore}>Restores: {item.hungerRestore}%</Text>
      )}
      
      {!owned ? (
        <TouchableOpacity style={styles.buyButton} onPress={onPurchase}>
          <Text style={styles.buttonText}>Buy</Text>
        </TouchableOpacity>
      ) : item.type === 'food' ? (
        <Text style={styles.ownedText}>Owned</Text>
      ) : (
        <TouchableOpacity 
          style={[styles.equipButton, isEquipped && styles.equippedButton]} 
          onPress={onEquip}
        >
          <Text style={styles.buttonText}>
            {isEquipped ? 'Equipped' : 'Equip'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    margin: 8,
    width: 150,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  name: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  price: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: COLORS.text,
    marginBottom: 8,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  equipButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  equippedButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#fff',
  },
  hungerRestore: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: COLORS.hunger,
    marginBottom: 4,
  },
  ownedText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#4CAF50',
    padding: 8,
  },
});