import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import BrickBreaker from '../components/brickBreakerGame';
import FlappyBirdGame from '../components/FlappyBirdGame';
import GameButton from '../components/GameButton';
import MemoryGame from '../components/MemoryGame';
import PlatformJumperGame from '../components/PlatformJumperGame';
import COLORS from '../constants/colors';
import usePet from '../hooks/usePet';
import useStore from '../hooks/useStore';

// Import game images (create these files in your assets folder)
const gameImages = {
  flappy: require('../../assets/images/favicon.png'),
  jumper: require('../../assets/images/favicon.png'),
  memory: require('../../assets/images/favicon.png'),
  brick: require('../../assets/images/favicon.png'),
};

export default function GamesScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { energy, play, hunger } = usePet();
  const { earnCoins } = useStore();

  const games = [
    { 
      id: 'flappy', 
      name: 'Flappy Pet', 
      image: gameImages.flappy 
    },
    { 
      id: 'jumper', 
      name: 'Platform Jumper', 
      image: gameImages.jumper 
    },
    { 
      id: 'memory', 
      name: 'Memory Game', 
      image: gameImages.memory 
    },
    { 
      id: 'brick', 
      name: 'Brick Breaker', 
      image: gameImages.brick 
    },
  ];

  const handleGameStart = (gameId: string) => {
    if (energy < 15) {
      Alert.alert('Too Tired', 'Your pet is too tired to play! Energy must be above 15%');
      return;
    }
    if (hunger > 85) {
      Alert.alert('Too Hungry', 'Your pet is too hungry to play! Feed your pet first.');
      return;
    }
    play();
    setActiveGame(gameId);
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
            {games.map((game) => (
              <GameButton
                key={game.id}
                image={game.image}
                text={game.name}
                onPress={() => handleGameStart(game.id)}
              />
            ))}
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
    padding: 16,

  },
  header: {
    marginBottom: 20,
  
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  gamesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});