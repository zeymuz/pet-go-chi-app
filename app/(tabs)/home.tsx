import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    : item.image;

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
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: COLORS.primary,
  },
  level: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  buttonsContainer: {
    marginTop: 15,
    position: 'relative',
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  outfitsButton: {
    backgroundColor: '#fff9b0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  outfitsButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#292F36',
  },
  outfitArrow: {
    marginLeft: 8,
    color: '#292F36',
  },
  outfitsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    zIndex: 2,
  },
  outfitCategory: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  closeOutfitsButton: {
    alignSelf: 'center',
    marginBottom: 10,
    padding: 5,
  },
  outfitsContent: {
    paddingBottom: 20,
  },
  outfitItem: {
    width: 100,
    height: 120,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 8,
  },
  outfitImageContainer: {
    width: 60,
    height: 60,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  equippedOutfit: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  outfitName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
  },
  foodContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    zIndex: 2,
  },
  foodContent: {
    paddingBottom: 20,
  },
  closeFoodButton: {
    alignSelf: 'center',
    marginBottom: 10,
    padding: 5,
  },
  foodItem: {
    width: '45%',
    height: 140,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 10,
  },
  disabledFoodItem: {
    opacity: 0.5,
  },
  foodImage: {
    width: 60,
    height: 60,
  },
  foodName: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 5,
  },
  foodRestore: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: COLORS.hunger,
    textAlign: 'center',
  },
  quantityText: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyFoodContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyFoodText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyFoodSubtext: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
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
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
  },
  wakeUpButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  wakeUpButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: 'white',
  },
});