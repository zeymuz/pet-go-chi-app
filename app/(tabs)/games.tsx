import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { scaleFont, verticalScale } from '../../utils/scaling';
import BrickBreaker from '../components/brickBreakerGame';
import FlappyBirdGame from '../components/FlappyBirdGame';
import GameButton from '../components/GameButton';
import MemoryGame from '../components/MemoryGame';
import PlatformJumperGame from '../components/PlatformJumperGame';
import COLORS from '../constants/colors';
import usePet from '../hooks/usePet';
import useStore from '../hooks/useStore';

const gameImages = {
  flappy: require('../../assets/images/games-thumbnails/flappy.jpg'),
  jumper: require('../../assets/images/games-thumbnails/platformjumper.jpg'),
  memory: require('../../assets/images/games-thumbnails/memory-game.jpg'),
  brick: require('../../assets/images/games-thumbnails/brickbreakergame.jpg'),
};

export default function GamesScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { play, energy, hunger } = usePet();
  const { earnCoins } = useStore();

  // REMOVE THIS CODE BLOCK - it's no longer needed
  // const [, forceUpdate] = useState(0);
  // usePetUpdates(() => {
  //   forceUpdate(prev => prev + 1);
  // });

  const handleGameStart = (gameId: string) => {
    console.log('Game start check - Energy:', energy, 'Hunger:', hunger);
    
    if (energy <= 15) {
      Alert.alert('Too Tired', 'Your pet is too tired to play! Energy must be above 15%');
      return false;
    }
    if (hunger > 85) {
      Alert.alert('Too Hungry', 'Your pet is too hungry to play! Feed your pet first.');
      return false;
    }
    
    // Call play and check its return value
    const played = play();
    if (played) {
      setActiveGame(gameId);
      return true;
    }
    
    Alert.alert('Cannot Play', 'Your pet cannot play right now. Check energy and hunger levels.');
    return false;
  };

  const handleGameEnd = async (coinsEarned: number) => {
    if (coinsEarned > 0) {
      const actualEarned = earnCoins(coinsEarned);
      console.log(`Earned ${actualEarned} coins from game`);
      await new Promise(resolve => setTimeout(resolve, 100));
      Alert.alert('Game Over', `You earned ${actualEarned} coins!`);
    }
    setActiveGame(null);
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'flappy':
        return <FlappyBirdGame onClose={(score) => handleGameEnd(score)} />;
      case 'jumper':
        return <PlatformJumperGame onExit={(score) => handleGameEnd(score)} />;
      case 'memory':
        return <MemoryGame onClose={(score) => handleGameEnd(score)} />;
      case 'brick':
        return <BrickBreaker onExit={(score) => handleGameEnd(score)} />;
      default:
        return (
          <View style={styles.gamesContainer}>
            <GameButton
              image={gameImages.flappy}
              text="Flappy Pet"
              onPress={() => handleGameStart('flappy')}
            />
            <GameButton
              image={gameImages.jumper}
              text="Platform Jumper"
              onPress={() => handleGameStart('jumper')}
            />
            <GameButton
              image={gameImages.memory}
              text="Memory Game"
              onPress={() => handleGameStart('memory')}
            />
            <GameButton
              image={gameImages.brick}
              text="Brick Breaker"
              onPress={() => handleGameStart('brick')}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {!activeGame && (
        <View style={styles.header}>
          <Text style={styles.title}>Mini Games</Text>
          <Text style={styles.subtitle}>Earn coins for your pet!</Text>
          <Text style={styles.stats}>Energy: {energy}% | Hunger: {hunger}%</Text>
        </View>
      )}
      {renderGame()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40c4ff',
    padding: verticalScale(16),
  },
  header: {
    marginBottom: verticalScale(20),
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(24),
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  stats: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(5),
  },
  gamesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});