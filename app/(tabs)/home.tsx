import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    clean,
    happiness,
    hunger,
    energy,
    cleanliness,
    level,
    experience,
    showOutfits,
    setShowOutfits,
  } = usePet();
  
  const {
    outfits,
    equippedOutfits,
    equipOutfit,
  } = useStore();

  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setActiveAction(action);
    setTimeout(() => setActiveAction(null), 1000);
    
    switch (action) {
      case 'feed':
        feed();
        break;
      case 'play':
        play();
        break;
      case 'sleep':
        sleep();
        break;
      case 'clean':
        clean();
        break;
    }
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
          <Button icon="fast-food" text="Feed" onPress={() => handleAction('feed')} />
          <Button icon="gamepad" text="Play" onPress={() => handleAction('play')} />
        </View>
        <View style={styles.buttonRow}>
          <Button icon="bed" text="Sleep" onPress={() => handleAction('sleep')} />
          <Button icon="shower" text="Clean" onPress={() => handleAction('clean')} />
        </View>
        <TouchableOpacity 
          style={styles.outfitsButton}
          onPress={() => setShowOutfits(!showOutfits)}
        >
          <Text style={styles.outfitsButtonText}>Outfits</Text>
        </TouchableOpacity>
      </View>

      {showOutfits && (
        <View style={styles.outfitsContainer}>
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
});