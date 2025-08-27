import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
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
    energyRestore?: number;
  };
  onPurchase: (quantity: number) => void;
  onEquip: (id: string, type?: string) => void;
  isEquipped: boolean;
  owned: boolean;
  quantity: number;
  availableCoins: number; // Add this prop
}

export default function StoreItem({
  item,
  onPurchase,
  onEquip,
  isEquipped,
  owned,
  quantity,
  availableCoins, // Receive available coins as prop
}: StoreItemProps) {
  const [imageError, setImageError] = React.useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const imageSource = imageError 
    ? require('../../assets/images/adaptive-icon.png')
    : typeof item.image === 'string' 
      ? { uri: item.image } 
      : item.image;

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, purchaseQuantity + change);
    setPurchaseQuantity(newQuantity);
  };

  const handleBuy = () => {
    onPurchase(purchaseQuantity);
    setPurchaseQuantity(1);
  };

  const totalPrice = item.price * purchaseQuantity;

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
      
      {item.type === 'food' && item.hungerRestore !== undefined && (
        <Text style={styles.hungerRestore}>Restores: {item.hungerRestore}%</Text>
      )}
      
      {item.type === 'food' && item.energyRestore !== undefined && (
        <Text style={styles.energyRestore}>Energy: +{item.energyRestore}%</Text>
      )}
      
      {item.type === 'food' ? (
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => handleQuantityChange(-1)}
            disabled={purchaseQuantity <= 1}
          >
            <Text style={styles.quantityText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityDisplay}>{purchaseQuantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={() => handleQuantityChange(1)}
          >
            <Text style={styles.quantityText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      
      {item.type === 'food' ? (
        <TouchableOpacity 
          style={styles.buyButton} 
          onPress={handleBuy}
          disabled={totalPrice > availableCoins} // Use the prop instead of global
        >
          <Text style={styles.buttonText}>
            Buy {purchaseQuantity} ({totalPrice} coins)
          </Text>
        </TouchableOpacity>
      ) : !owned ? (
        <TouchableOpacity 
          style={styles.buyButton} 
          onPress={() => onPurchase(1)}
          disabled={item.price > availableCoins} // Use the prop instead of global
        >
          <Text style={styles.buttonText}>Buy</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.equipButton, isEquipped && styles.equippedButton]} 
          onPress={isEquipped ? () => onEquip('', item.type) : () => onEquip(item.id)}
        >
          <Text style={styles.buttonText}>
            {isEquipped ? 'Unequip' : 'Equip'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD700',
    borderRadius: scale(8),
    padding: verticalScale(6),
    margin: scale(12),
    width: scale(100),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  image: {
    width: scale(85),
    height: scale(85),
    resizeMode: 'contain',
    marginBottom: verticalScale(5),
  },
  name: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  price: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: COLORS.text,
    marginBottom: verticalScale(4),
  },
  hungerRestore: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: COLORS.hunger,
    marginBottom: verticalScale(5),
  },
  energyRestore: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: COLORS.energy,
    marginBottom: verticalScale(5),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: verticalScale(4),
  },
  quantityButton: {
    backgroundColor: COLORS.primary,
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: COLORS.text,
    marginHorizontal: scale(8),
  },
  quantityText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: 'white',
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    padding: verticalScale(8),
    borderRadius: scale(4),
    width: '100%',
    alignItems: 'center',
  },
  equipButton: {
    backgroundColor: '#4CAF50',
    padding: verticalScale(8),
    borderRadius: scale(4),
    width: '100%',
    alignItems: 'center',
  },
  equippedButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: '#fff',
  },
});