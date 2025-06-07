import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FlappyBirdGame from '../components/FlappyBirdGame';
import GameButton from '../components/GameButton';
import PlatformJumperGame from '../components/PlatformJumperGame';
import COLORS from '../constants/colors';

export default function GamesScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    { id: 'flappy', name: 'Flappy Pet', icon: 'game-controller' },
    { id: 'jumper', name: 'Platform Jumper', icon: 'game-controller' },
    { id: 'memory', name: 'Memory Game', icon: 'game-controller' },
  ];

  const renderGame = () => {
    switch (activeGame) {
      case 'flappy':
        return <FlappyBirdGame onClose={() => setActiveGame(null)} />;
      case 'jumper':
        return <PlatformJumperGame onExit={() => setActiveGame(null)} />;
      default:
        return (
          <View style={styles.gamesContainer}>
            {games.map((game) => (
              <GameButton
                key={game.id}
                icon={game.icon}
                text={game.name}
                onPress={() => setActiveGame(game.id)}
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