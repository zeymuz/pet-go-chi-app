import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import COLORS from '../constants/colors';

const { width } = Dimensions.get('window');

interface MemoryGameProps {
  onClose: (score: number) => void;
}

const ALL_ICONS = [
  'game-controller', 'football', 'basketball', 'tennisball',
  'baseball', 'american-football', 'md-trophy', 'md-star',
  'md-heart', 'md-flash', 'md-snow', 'md-rainy'
];

interface Card {
  id: number;
  icon: string;
  isMatched: boolean;
}

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [animations, setAnimations] = useState<Animated.Value[]>([]);

  const pairs = Math.min(4 + (level - 1) * 2, 6);

  useEffect(() => {
    initializeGame();
  }, [level]);

  const initializeGame = () => {
    const selectedIcons = [...ALL_ICONS].sort(() => 0.5 - Math.random()).slice(0, pairs);
    const cardPairs = [...selectedIcons, ...selectedIcons]
      .map((icon, index) => ({
        id: index,
        icon,
        isMatched: false,
      }))
      .sort(() => 0.5 - Math.random());

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setGameStarted(false);

    const anims = cardPairs.map(() => new Animated.Value(0));
    setAnimations(anims);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const flipToFront = (index: number) => {
    Animated.timing(animations[index], {
      toValue: 180,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const flipToBack = (index: number) => {
    Animated.timing(animations[index], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = (id: number) => {
    if (!gameStarted || flippedCards.length >= 2) return;

    const index = cards.findIndex(c => c.id === id);
    if (flippedCards.includes(id) || cards[index].isMatched) return;

    flipToFront(index);
    setFlippedCards(prev => [...prev, id]);

    if (flippedCards.length === 1) {
      setMoves(prev => prev + 1);
      const firstId = flippedCards[0];
      const secondId = id;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.icon === secondCard?.icon) {
        const updated = cards.map(c =>
          c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
        );
        setTimeout(() => {
          setCards(updated);
          setFlippedCards([]);
<<<<<<< HEAD
          
          if (matchedCards.every(card => card.isMatched)) {
            setGameComplete(true);
            const coinsEarned = level * 10;
            Alert.alert(
              `Level Complete!`,
              `Completed in ${moves + 1} moves!\nEarned ${coinsEarned} coins!`,
=======
          if (updated.every(c => c.isMatched)) {
            Alert.alert(
              'Level Complete!',
              `Completed in ${moves + 1} moves!`,
>>>>>>> 1afc59783321e9a2fba9296d45f9210cc686d596
              [
                { 
                  text: 'Next Level', 
                  onPress: () => {
                    setLevel(prev => prev + 1);
                    onClose(coinsEarned);
                  } 
                },
                { 
                  text: 'Quit', 
                  onPress: () => onClose(coinsEarned) 
                }
              ]
            );
          }
        }, 500);
      } else {
        setTimeout(() => {
          const firstIdx = cards.findIndex(c => c.id === firstId);
          const secondIdx = cards.findIndex(c => c.id === secondId);
          flipToBack(firstIdx);
          flipToBack(secondIdx);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => onClose(0)}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Memory Game - Level {level}</Text>
      <Text style={styles.stats}>Moves: {moves} | Pairs: {pairs}</Text>

      <View style={styles.gameArea}>
        {cards.map((card, index) => {
          const flip = animations[index]?.interpolate({
            inputRange: [0, 180],
            outputRange: ['0deg', '180deg'],
          });

          const opacityFront = animations[index]?.interpolate({
            inputRange: [89, 90],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          });

          const opacityBack = animations[index]?.interpolate({
            inputRange: [89, 90],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.card,
                  { transform: [{ perspective: 1000 }, { rotateY: flip }] },
                ]}
              >
                <Animated.View style={[styles.cardFace, styles.cardBack, { opacity: opacityBack }]}>
                  <Ionicons name="md-help-circle" size={28} color="white" />
                </Animated.View>

                <Animated.View style={[styles.cardFace, styles.cardFront, { opacity: opacityFront }]}>
                  <Ionicons name={card.icon as any} size={28} color={COLORS.primary} />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!gameStarted && (
        <TouchableWithoutFeedback onPress={startGame}>
          <View style={styles.startOverlay}>
            <Text style={styles.startText}>TAP ANYWHERE TO START</Text>
          </View>
        </TouchableWithoutFeedback>
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
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  stats: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  gameArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  card: {
    width: width / 4 - 20,
    height: width / 4 - 20,
    margin: 6,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: COLORS.secondary,
  },
  cardFront: {
    backgroundColor: COLORS.accent,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: 'white',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
});
