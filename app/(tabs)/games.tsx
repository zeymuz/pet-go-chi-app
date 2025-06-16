import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FlappyBirdGame from '../components/FlappyBirdGame';
import GameButton from '../components/GameButton';
import MemoryGame from '../components/MemoryGame';
import PlatformJumperGame from '../components/PlatformJumperGame';
import COLORS from '../constants/colors';
import usePet from '../hooks/usePet';
import useStore from '../hooks/useStore';

export default function GamesScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { energy, play } = usePet();
  const { earnCoins } = useStore();

  const games = [
    { id: 'flappy', name: 'Flappy Pet', icon: 'game-controller' },
    { id: 'jumper', name: 'Platform Jumper', icon: 'game-controller' },
    { id: 'memory', name: 'Memory Game', icon: 'game-controller' },
  ];

  const handleGameStart = (gameId: string) => {
    if (energy < 10) {
      alert('Your pet is too tired to play!');
      return;
    }
    play(); // Decrease energy
    setActiveGame(gameId);
  };

  const handleGameEnd = (score: number) => {
    const coinsEarned = Math.floor(score / 10);
    earnCoins(coinsEarned);
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
      default:
        return (
          <View style={styles.gamesContainer}>
            {games.map((game) => (
              <GameButton
                key={game.id}
                icon={game.icon}
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
    backgroundColor: COLORS.background,
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