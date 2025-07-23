import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
import Button from '../components/Button';
import PixelPet from '../components/PixelPet';
import StatusBar from '../components/StatusBar';
import COLORS from '../constants/colors';
import usePet from '../hooks/usePet';
import useStore from '../hooks/useStore';
import { Outfit } from '../types/types';

type OutfitType = 'hat' | 'jacket' | 'shirt' | 'pants' | 'shoes';

interface OutfitItem {
  id: string;
  name: string;
  image: any;
  type: OutfitType;
  price: number;
  owned: boolean;
}

// home.tsx (only showing the relevant part)
const OutfitItemComponent = ({
  item,
  equipped,
  onEquip,
}: {
  item: Outfit;
  equipped: boolean;
  onEquip: () => void;
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSource = imageError
    ? require('../../assets/images/adaptive-icon.png')
    : typeof item.image === 'string'
    ? { uri: item.image }
    : item.image; // Still using item.image here

  return (
    <TouchableOpacity
      style={[styles.outfitItem, equipped && styles.equippedOutfit]}
      onPress={onEquip}
    >
      <View style={styles.outfitImageContainer}>
        <Image
          source={imageSource}
          style={styles.outfitImage}
          onError={() => setImageError(true)}
        />
      </View>
      <Text style={styles.outfitName}>{item.name}</Text>
    </TouchableOpacity>
  );
};

const FoodItemComponent = ({
  item,
  onFeed,
  quantity,
}: {
  item: any;
  onFeed: () => void;
  quantity: number;
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSource = imageError
    ? require('../../assets/images/adaptive-icon.png')
    : typeof item.image === 'string'
    ? { uri: item.image }
    : item.image;

  return (
    <TouchableOpacity 
      style={[styles.foodItem, quantity === 0 && styles.disabledFoodItem]} 
      onPress={onFeed} 
      disabled={quantity === 0}
    >
      <Image
        source={imageSource}
        style={styles.foodImage}
        onError={() => setImageError(true)}
      />
      <Text style={styles.foodName}>{item.name}</Text>
      <Text style={styles.foodRestore}>Restores: {item.hungerRestore}%</Text>
      <Text style={styles.quantityText}>Qty: {quantity}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const {
    feed,
    play,
    sleep,
    wakeUp,
    clean,
    happiness,
    hunger,
    energy,
    cleanliness,
    level,
    experience,
    showOutfits,
    setShowOutfits,
    showFood,
    setShowFood,
    isSleeping,
  } = usePet();

  const {
    outfits,
    equippedOutfits,
    equipOutfit,
    foods,
    foodQuantities,
  } = useStore();

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const outfitsPosition = useRef(new Animated.Value(0)).current;
  const foodPosition = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(1)).current;
  const [lastCleanTime, setLastCleanTime] = useState<number | null>(null);
  const [canClean, setCanClean] = useState(true);

  const handleAction = (action: string) => {
    setActiveAction(action);
    setTimeout(() => setActiveAction(null), 1000);

    switch (action) {
      case 'feed':
        toggleFoodMenu();
        break;
      case 'play':
        navigation.navigate('games');
        break;
      case 'sleep':
        if (!isSleeping) sleep();
        break;
      case 'clean':
        if (canClean) {
          clean();
          setLastCleanTime(Date.now());
          setCanClean(false);
          setTimeout(() => setCanClean(true), 2 * 60 * 60 * 1000);
        }
        break;
    }
  };

  const toggleOutfitsMenu = () => {
    const toValue = showOutfits ? 0 : 1;
    setShowOutfits(!showOutfits);

    Animated.parallel([
      Animated.timing(outfitsPosition, {
        toValue,
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: showOutfits ? 1 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleFoodMenu = () => {
    const toValue = showFood ? 0 : 1;
    setShowFood(!showFood);

    Animated.parallel([
      Animated.timing(foodPosition, {
        toValue,
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: showFood ? 1 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Group outfits by type
  const groupedOutfits = outfits.reduce((acc: Record<string, Outfit[]>, outfit) => {
    if (!acc[outfit.type]) {
      acc[outfit.type] = [];
    }
    acc[outfit.type].push(outfit);
    return acc;
  }, {});

  const renderOutfitItem = ({ item }: { item: OutfitItem }) => (
    <OutfitItemComponent
      item={item}
      equipped={equippedOutfits[item.type] === item.id}
      onEquip={() => equipOutfit(item.id)}
    />
  );

  const renderFoodItem = ({ item }: { item: any }) => (
    <FoodItemComponent
      item={item}
      onFeed={() => {
        feed(item);
      }}
      quantity={foodQuantities[item.id] || 0}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pixel Pet</Text>
        <Text style={styles.level}>Lvl: {level}</Text>
      </View>

      <View style={styles.petContainer}>
        <PixelPet activeAction={activeAction} equippedOutfits={equippedOutfits} />
      </View>

      <StatusBar
        happiness={happiness}
        hunger={hunger}
        energy={energy}
        cleanliness={cleanliness}
        experience={experience}
      />

      <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
        <View style={styles.buttonRow}>
          <Button icon="fast-food" text="Feed" onPress={() => handleAction('feed')} disabled={isSleeping || showFood} />
          <Button icon="game-controller" text="Play" onPress={() => handleAction('play')} disabled={isSleeping || energy < 15 || hunger > 85 || showFood} />
        </View>
        <View style={styles.buttonRow}>
          <Button icon="moon" text={isSleeping ? "Sleeping..." : "Sleep"} onPress={() => handleAction('sleep')} disabled={isSleeping || showFood} />
          <Button icon="water" text="Clean" onPress={() => handleAction('clean')} disabled={!canClean || isSleeping || showFood} />
        </View>
        <TouchableOpacity style={styles.outfitsButton} onPress={toggleOutfitsMenu} disabled={isSleeping || showFood}>
          <Text style={styles.outfitsButtonText}>Outfits</Text>
          <Ionicons name={showOutfits ? "chevron-up" : "chevron-down"} size={16} color="white" style={styles.outfitArrow} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.outfitsContainer, {
        transform: [{
          translateY: outfitsPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [300, 0]
          })
        }]
      }]}>
        <TouchableOpacity style={styles.closeOutfitsButton} onPress={toggleOutfitsMenu}>
          <Ionicons name="chevron-up" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        {/* Grouped outfits by type */}
        <FlatList
          data={Object.entries(groupedOutfits)}
          keyExtractor={([type]) => type}
          renderItem={({ item: [type, outfits] }) => (
            <View style={styles.outfitCategory}>
              <Text style={styles.categoryTitle}>{type.toUpperCase()}</Text>
              <FlatList
                data={outfits.filter(o => o.owned) as OutfitItem[]}
                numColumns={3}
                keyExtractor={(item) => item.id}
                renderItem={renderOutfitItem}
                contentContainerStyle={styles.outfitsContent}
              />
            </View>
          )}
          contentContainerStyle={styles.outfitsContent}
        />
      </Animated.View>

      <Animated.View style={[styles.foodContainer, {
        transform: [{
          translateY: foodPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [300, 0]
          })
        }]
      }]}>
        <TouchableOpacity style={styles.closeFoodButton} onPress={toggleFoodMenu}>
          <Ionicons name="chevron-up" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <FlatList
          data={foods.filter(f => foodQuantities[f.id] > 0)}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodItem}
          contentContainerStyle={styles.foodContent}
          ListEmptyComponent={
            <View style={styles.emptyFoodContainer}>
              <Text style={styles.emptyFoodText}>No food available</Text>
              <Text style={styles.emptyFoodSubtext}>Visit the store to buy food</Text>
            </View>
          }
        />
      </Animated.View>

      {isSleeping && (
        <View style={styles.sleepOverlay}>
          <Text style={styles.sleepText}>Your pet is sleeping...</Text>
          <Text style={styles.sleepText}>Energy: {Math.min(100, Math.floor(energy))}%</Text>
          <TouchableOpacity style={styles.wakeUpButton} onPress={wakeUp}>
            <Text style={styles.wakeUpButtonText}>Wake Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40c4ff',
    padding: verticalScale(16),
    paddingBottom: verticalScale(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(24),
    color: COLORS.primary,
  },
  level: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(16),
    color: COLORS.text,
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(5),
  },
  buttonsContainer: {
    marginTop: verticalScale(15),
    position: 'relative',
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(12),
  },
  outfitsButton: {
    backgroundColor: '#FFD700',
    padding: verticalScale(10),
    borderRadius: scale(8),
    alignItems: 'center',
    marginTop: verticalScale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  outfitsButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: '#292F36',
  },
  outfitArrow: {
    marginLeft: scale(8),
    color: '#292F36',
  },
  outfitsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
    backgroundColor: '#ffe3d7',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: verticalScale(20),
    elevation: 10,
    zIndex: 2,
  },
  outfitCategory: {
    marginBottom: verticalScale(15),
  },
  categoryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: COLORS.primary,
    marginBottom: verticalScale(8),
    paddingBottom: verticalScale(4),
    borderBottomWidth: scale(2),
    borderBottomColor: '#40c4ff',
  },
  closeOutfitsButton: {
    alignSelf: 'center',
    marginBottom: verticalScale(10),
    padding: verticalScale(5),
  },
  outfitsContent: {
    paddingBottom: verticalScale(20),
  },
  outfitItem: {
    width: scale(100),
    height: verticalScale(120),
    margin: scale(5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40c4ff',
    borderRadius: scale(10),
    padding: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  outfitImageContainer: {
    width: scale(60),
    height: scale(60),
    marginBottom: verticalScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: scale(8),
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  equippedOutfit: {
    borderWidth: scale(2),
    borderColor: COLORS.primary,
  },
  outfitName: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textAlign: 'center',
  },
  foodContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
    backgroundColor: '#ffe3d7',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: verticalScale(20),
    elevation: 10,
    zIndex: 2,
  },
  foodContent: {
    paddingBottom: verticalScale(20),
  },
  closeFoodButton: {
    alignSelf: 'center',
    marginBottom: verticalScale(10),
    padding: verticalScale(5),
  },
  foodItem: {
    width: '45%',
    height: verticalScale(140),
    margin: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40c4ff',
    borderRadius: scale(8),
    padding: verticalScale(10),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  disabledFoodItem: {
    opacity: 0.5,
  },
  foodImage: {
    width: scale(60),
    height: scale(60),
  },
  foodName: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(5),
  },
  foodRestore: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: 'yellow',
    textAlign: 'center',
  },
  quantityText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(8),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
  emptyFoodContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: verticalScale(20),
  },
  emptyFoodText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(14),
    color: COLORS.text,
    marginBottom: verticalScale(8),
  },
  emptyFoodSubtext: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
  },
  sleepOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  sleepText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(16),
    color: 'white',
    marginBottom: verticalScale(10),
  },
  wakeUpButton: {
    backgroundColor: COLORS.primary,
    padding: verticalScale(15),
    borderRadius: scale(8),
    marginTop: verticalScale(20),
  },
  wakeUpButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(16),
    color: 'white',
  },
});