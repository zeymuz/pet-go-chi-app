import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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
  const [gameComplete, setGameComplete] = useState(false);
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
        flipAnimation: new Animated.Value(0)
      }))
      .sort(() => 0.5 - Math.random());

    const newMaxMoves = Math.max(pairs * 2 - level * 2, pairs);

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMaxMoves(newMaxMoves);
    setGameComplete(false);
    setGameStarted(false);
  };

  const flipCard = (cardId: number, toValue: number, callback?: () => void) => {
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    Animated.timing(cards[cardIndex].flipAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleCardPress = (id: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (moves >= maxMoves) {
      Alert.alert('Out of moves!', 'You lost this level.', [
        {
          text: 'Try Again',
          onPress: () => initializeGame()
        },
        {
          text: 'Quit',
          onPress: () => onClose(coins)
        }
      ]);
      return;
    }

    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex === -1 || cards[cardIndex].isFlipped || cards[cardIndex].isMatched || flippedCards.length >= 2) {
      return;
    }

    flipCard(id, 1, () => {
      const newCards = [...cards];
      newCards[cardIndex] = {
        ...newCards[cardIndex],
        isFlipped: true
      };
      setCards(newCards);
      setFlippedCards([...flippedCards, id]);

      if (flippedCards.length === 1) {
        setMoves(prev => prev + 1);
        const [firstId] = flippedCards;
        const firstCardIndex = cards.findIndex(c => c.id === firstId);
        const firstCard = cards[firstCardIndex];
        const secondCard = cards[cardIndex];

        if (firstCard?.image === secondCard?.image) {
          setTimeout(() => {
            const matchedCards = [...newCards];
            matchedCards[firstCardIndex].isMatched = true;
            matchedCards[cardIndex].isMatched = true;
            setCards(matchedCards);
            setFlippedCards([]);

            if (matchedCards.every(card => card.isMatched)) {
              setGameComplete(true);
              const coinsEarned = level * 10;
              setCoins(prev => prev + coinsEarned);
              Alert.alert(
                `Level Complete!`,
                `Completed in ${moves + 1} moves!\nEarned ${coinsEarned} coins!`,
                [
                  {
                    text: 'Next Level',
                    onPress: () => {
                      setLevel(prev => prev + 1);
                    }
                  },
                  {
                    text: 'Quit',
                    onPress: () => onClose(coins + coinsEarned)
                  }
                ]
              );
            }
          }, 500);
        } else {
          setTimeout(() => {
            flipCard(firstId, 0);
            flipCard(id, 0, () => {
              const resetCards = [...newCards];
              resetCards[firstCardIndex].isFlipped = false;
              resetCards[cardIndex].isFlipped = false;
              setCards(resetCards);
              setFlippedCards([]);
            });
          }, 1000);
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
      outputRange: ['180deg', '360deg']
    });

    const backInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    });

    return {
      frontAnimatedStyle: { transform: [{ rotateY: frontInterpolate }] },
      backAnimatedStyle: { transform: [{ rotateY: backInterpolate }] }
    };
  };

  const cardSize = Math.min(width, height) / Math.ceil(Math.sqrt(cards.length)) - 10;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Memory Game - Level {level}</Text>
      <Text style={styles.stats}>Moves: {moves} / {maxMoves} | Pairs: {pairs}</Text>
      <Text style={styles.coins}>Coins: {coins} | Potential: {level * 10}</Text>

      <View style={styles.gameArea}>
        {cards.map(card => {
          const { frontAnimatedStyle, backAnimatedStyle } = getCardStyle(card);

          return (
            <TouchableOpacity
              key={card.id}
              style={{ width: cardSize, height: cardSize, margin: 2 }}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                <Ionicons name="md-help-circle" size={cardSize * 0.4} color="white" />
              </Animated.View>
              <Animated.View style={[styles.card, styles.cardFlipped, frontAnimatedStyle]}>
                <Image source={card.image} style={{ width: '80%', height: '80%', resizeMode: 'contain' }} />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!gameStarted && (
        <TouchableOpacity style={styles.startOverlay} onPress={() => setGameStarted(true)} activeOpacity={1}>
          <Text style={styles.startText}>TAP ANY CARD TO START</Text>
        </TouchableOpacity>
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
    marginBottom: 5,
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: 'gold',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center'
  },
  card: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  cardBack: {
    backgroundColor: COLORS.secondary,
  },
  cardFlipped: {
    backgroundColor: COLORS.accent,
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
    fontSize: 18,
    color: 'white',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
});
