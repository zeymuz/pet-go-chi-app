import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import PixelPet from '../components/PixelPet';
import StatusBar from '../components/StatusBar';
import COLORS from '../constants/colors';
import usePet from './../hooks/usePet';

export default function HomeScreen() {
  const {
    pet,
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
    equippedOutfit,
  } = usePet();

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
          pet={pet} 
          activeAction={activeAction} 
          equippedOutfit={equippedOutfit} 
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
      </View>
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
});