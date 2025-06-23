// home.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import PixelPet from '../components/PixelPet';
import StatusBar from '../components/StatusBar';
import COLORS from '../constants/colors';
import usePet from './../hooks/usePet';
import useStore from './../hooks/useStore';

export default function HomeScreen() {
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
  } = useStore();

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const navigation = useNavigation();
  const outfitsHeight = useRef(new Animated.Value(0)).current;
  const foodHeight = useRef(new Animated.Value(0)).current;
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
        if (!isSleeping) {
          sleep();
        }
        break;
      case 'clean':
        if (canClean) {
          clean();
          setLastCleanTime(Date.now());
          setCanClean(false);
          setTimeout(() => setCanClean(true), 2 * 60 * 60 * 1000); // 2 hours cooldown
        }
        break;
    }
  };

  const toggleOutfitsMenu = () => {
    setShowOutfits(!showOutfits);
    Animated.timing(outfitsHeight, {
      toValue: showOutfits ? 0 : 200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleFoodMenu = () => {
    setShowFood(!showFood);
    Animated.timing(foodHeight, {
      toValue: showFood ? 0 : 200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pixel Pet</Text>
        <Text style={styles.level}>Lvl: {level}</Text>
      </View>

      <View style={styles.petContainer}>
        <PixelPet 
          activeAction={activeAction} 
          equippedOutfits={equippedOutfits}
        />
      </View>

      <StatusBar 
        happiness={happiness}
        hunger={hunger}
        energy={energy}
        cleanliness={cleanliness}
        experience={experience}
      />

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <Button 
            icon="fast-food" 
            text="Feed" 
            onPress={() => handleAction('feed')} 
            disabled={isSleeping}
          />
          <Button 
            icon="game-controller" 
            text="Play" 
            onPress={() => handleAction('play')} 
            disabled={isSleeping || energy < 15 || hunger > 85}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button 
            icon="moon" 
            text={isSleeping ? "Sleeping..." : "Sleep"} 
            onPress={() => handleAction('sleep')} 
            disabled={isSleeping}
          />
          <Button 
            icon="water" 
            text="Clean" 
            onPress={() => handleAction('clean')} 
            disabled={!canClean || isSleeping}
          />
        </View>
        <TouchableOpacity 
          style={styles.outfitsButton}
          onPress={toggleOutfitsMenu}
          disabled={isSleeping}
        >
          <Text style={styles.outfitsButtonText}>Outfits</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.outfitsContainer, { height: outfitsHeight }]}>
        <FlatList
          data={outfits.filter(o => o.owned)}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.outfitItem,
                equippedOutfits[item.type] === item.id && styles.equippedOutfit
              ]}
              onPress={() => equipOutfit(item.id)}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.outfitImage} 
                resizeMode="contain"
              />
              <Text style={styles.outfitName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      <Animated.View style={[styles.foodContainer, { height: foodHeight }]}>
        <TouchableOpacity 
          style={styles.closeFoodButton}
          onPress={toggleFoodMenu}
        >
          <Text style={styles.closeFoodButtonText}>▲</Text>
        </TouchableOpacity>
        <FlatList
          data={foods.filter(f => f.owned)}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.foodItem}
              onPress={() => {
                feed(item);
                toggleFoodMenu();
              }}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.foodImage} 
                resizeMode="contain"
              />
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodRestore}>Restores: {item.hungerRestore}%</Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {isSleeping && (
        <View style={styles.sleepOverlay}>
          <Text style={styles.sleepText}>Your pet is sleeping...</Text>
          <Text style={styles.sleepText}>Energy: {Math.min(100, Math.floor(energy))}%</Text>
          <TouchableOpacity 
            style={styles.wakeUpButton}
            onPress={wakeUp}
          >
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
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    marginVertical: 20,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  outfitsButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  outfitsButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: 'white',
  },
  outfitsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: 200,
    elevation: 5,
    overflow: 'hidden',
  },
  outfitItem: {
    width: 80,
    height: 80,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 5,
  },
  equippedOutfit: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  outfitImage: {
    width: 50,
    height: 50,
  },
  outfitName: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 5,
  },
  foodContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: 200,
    elevation: 5,
    overflow: 'hidden',
  },
  closeFoodButton: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  closeFoodButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.primary,
  },
  foodItem: {
    width: 120,
    height: 120,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 5,
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