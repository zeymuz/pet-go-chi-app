import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface MemoryGameProps {
  onClose: (score: number) => void;
}

const ALL_IMAGES = new Array(100).fill(require('../../assets/images/favicon.png'));

interface Card {
  id: number;
  image: any;
  isFlipped: boolean;
  isMatched: boolean;
  flipAnimation: Animated.Value;
}

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [maxMoves, setMaxMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const pairs = level < 6 ? 4 * Math.pow(2, level - 1) : 64 / 2;

  useEffect(() => {
    initializeGame();
  }, [level]);

  const initializeGame = () => {
    const selectedImages = [...ALL_IMAGES].sort(() => 0.5 - Math.random()).slice(0, pairs);
    const cardPairs = [...selectedImages, ...selectedImages]
      .map((image, index) => ({
        id: index,
        image,
        isFlipped: false,
        isMatched: false,
        flipAnimation: new Animated.Value(0),
      }))
      .sort(() => 0.5 - Math.random());

    const newMaxMoves = Math.max(pairs * 2 - level * 2, pairs);
    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMaxMoves(newMaxMoves);
    setGameStarted(false);
  };

  const flipCard = (cardId: number, toValue: number, callback?: () => void) => {
    const cardIndex = cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    Animated.timing(cards[cardIndex].flipAnimation, {
      toValue,
      duration: 150,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleCardPress = (id: number) => {
    const cardIndex = cards.findIndex((c) => c.id === id);
    if (
      cardIndex === -1 ||
      cards[cardIndex].isFlipped ||
      cards[cardIndex].isMatched ||
      flippedCards.length >= 2
    )
      return;

    if (!gameStarted) setGameStarted(true);
    if (moves >= maxMoves) {
      Alert.alert('Out of moves!', 'You lost this level.', [
        { text: 'Try Again', onPress: () => initializeGame() },
        { text: 'Quit', onPress: () => onClose(coins) },
      ]);
      return;
    }

    flipCard(id, 1, () => {
      const newCards = [...cards];
      newCards[cardIndex].isFlipped = true;
      const newFlipped = [...flippedCards, id];

      setCards(newCards);
      setFlippedCards(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((prev) => prev + 1);
        const [firstId, secondId] = newFlipped;
        const first = newCards.find((c) => c.id === firstId);
        const second = newCards.find((c) => c.id === secondId);

        if (first?.image === second?.image) {
          setTimeout(() => {
            const updated = newCards.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            );
            setCards(updated);
            setFlippedCards([]);

            if (updated.every((c) => c.isMatched)) {
              const earned = level * 10;
              const newCoins = coins + earned;
              setCoins(newCoins);

              Alert.alert('Level Complete!', `You earned ${earned} coins`, [
                {
                  text: 'Next',
                  onPress: () => {
                    setTimeout(() => {
                      setLevel((l) => l + 1);
                    }, 100);
                  },
                },
                {
                  text: 'Quit',
                  onPress: () => {
                    setTimeout(() => {
                      onClose(newCoins);
                    }, 100);
                  },
                },
              ]);
            }
          }, 300);
        } else {
          setTimeout(() => {
            flipCard(firstId, 0);
            flipCard(secondId, 0, () => {
              const reset = newCards.map((c) =>
                c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
              );
              setCards(reset);
              setFlippedCards([]);
            });
          }, 600);
        }
      }
    });
  };

  const handleClose = () => {
    onClose(coins);
  };

  const getCardStyle = (card: Card) => {
    const frontInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });

    const backInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return {
      frontAnimatedStyle: { transform: [{ rotateY: frontInterpolate }] },
      backAnimatedStyle: { transform: [{ rotateY: backInterpolate }] },
    };
  };

  const cardSize = Math.min(width, height) / Math.ceil(Math.sqrt(cards.length)) - 8;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Memory Game - Level {level}</Text>
      <Text style={styles.stats}>Moves: {moves} / {maxMoves} | Pairs: {pairs}</Text>
      <Text style={styles.coins}>Coins: {coins} | Potential: {level * 10}</Text>

      <View style={styles.gameArea}>
        {cards.map((card) => {
          const { frontAnimatedStyle, backAnimatedStyle } = getCardStyle(card);

          return (
            <TouchableOpacity
              key={card.id}
              style={{ width: cardSize, height: cardSize, margin: 3 }}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                <Ionicons name="swap-horizontal" size={cardSize * 0.4} color="#FF6B6B" />
              </Animated.View>
              <Animated.View style={[styles.card, styles.cardFlipped, frontAnimatedStyle]}>
                <Image
                  source={card.image}
                  style={{ width: '80%', height: '80%', resizeMode: 'contain' }}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!gameStarted && (
        <TouchableOpacity
          style={styles.startOverlay}
          onPress={() => setGameStarted(true)}
          activeOpacity={1}
        >
          <Text style={styles.startText}>TAP ANY CARD TO START</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40c4ff',
    padding: verticalScale(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(40),
    right: scale(20),
    zIndex: 10,
    backgroundColor: COLORS.primary,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(20),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: verticalScale(5),
    marginBottom: verticalScale(5),
  },
  stats: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: verticalScale(5),
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: 'gold',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: verticalScale(15),
  },
  card: {
    borderRadius: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  cardBack: {
    backgroundColor: '#fff9b0',
  },
  cardFlipped: {
    backgroundColor: '#fff9b0',
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  startText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(18),
    color: 'white',
    padding: verticalScale(20),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scale(10),
  },
});
