import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  isFlipped: boolean;
  isMatched: boolean;
  flipAnimation: Animated.Value;
}

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

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
        isFlipped: false,
        isMatched: false,
        flipAnimation: new Animated.Value(0) // Initialize animation value here
      }))
      .sort(() => 0.5 - Math.random());
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
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

    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex === -1 || cards[cardIndex].isFlipped || cards[cardIndex].isMatched || flippedCards.length >= 2) {
      return;
    }

    // Flip the card to show front
    flipCard(id, 1, () => {
      const newCards = [...cards];
      newCards[cardIndex] = {
        ...newCards[cardIndex],
        isFlipped: true
      };
      setCards(newCards);
      setFlippedCards([...flippedCards, id]);

      if (flippedCards.length === 1) {
        setMoves(moves + 1);
        const [firstId] = flippedCards;
        const firstCardIndex = cards.findIndex(c => c.id === firstId);
        const firstCard = cards[firstCardIndex];
        const secondCard = cards[cardIndex];
        
        if (firstCard?.icon === secondCard?.icon) {
          setTimeout(() => {
            const matchedCards = [...newCards];
            matchedCards[firstCardIndex] = {
              ...matchedCards[firstCardIndex],
              isMatched: true
            };
            matchedCards[cardIndex] = {
              ...matchedCards[cardIndex],
              isMatched: true
            };
            setCards(matchedCards);
            setFlippedCards([]);
            
            if (matchedCards.every(card => card.isMatched)) {
              setGameComplete(true);
              const coinsEarned = level * 10;
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
                    onPress: () => onClose(coinsEarned) 
                  }
                ]
              );
            }
          }, 500);
        } else {
          setTimeout(() => {
            // Flip both cards back
            flipCard(firstId, 0);
            flipCard(id, 0, () => {
              const resetCards = [...newCards];
              resetCards[firstCardIndex] = {
                ...resetCards[firstCardIndex],
                isFlipped: false
              };
              resetCards[cardIndex] = {
                ...resetCards[cardIndex],
                isFlipped: false
              };
              setCards(resetCards);
              setFlippedCards([]);
            });
          }, 1000);
        }
      }
    });
  };

  const handleClose = () => {
    onClose(0);
  };

  const getCardStyle = (card: Card) => {
    if (!card.flipAnimation) {
      // Fallback in case animation value is missing
      return {
        frontAnimatedStyle: { transform: [{ rotateY: '0deg' }] },
        backAnimatedStyle: { transform: [{ rotateY: '0deg' }] }
      };
    }

    const frontInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg']
    });
    
    const backInterpolate = card.flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg']
    });

    const frontAnimatedStyle = {
      transform: [
        { rotateY: frontInterpolate }
      ]
    };

    const backAnimatedStyle = {
      transform: [
        { rotateY: backInterpolate }
      ]
    };

    return { frontAnimatedStyle, backAnimatedStyle };
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Memory Game - Level {level}</Text>
      <Text style={styles.stats}>Moves: {moves} | Pairs: {pairs}</Text>
      <Text style={styles.coins}>Potential Coins: {level * 10}</Text>

      <View style={styles.gameArea}>
        {cards.map(card => {
          const { frontAnimatedStyle, backAnimatedStyle } = getCardStyle(card);
          
          return (
            <TouchableOpacity
              key={card.id}
              style={styles.cardContainer}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                <Ionicons 
                  name="md-help-circle" 
                  size={28} 
                  color="white" 
                />
              </Animated.View>
              <Animated.View style={[styles.card, styles.cardFlipped, frontAnimatedStyle]}>
                <Ionicons 
                  name={card.icon as any} 
                  size={28} 
                  color={COLORS.primary} 
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
    marginBottom: 20,
  },
  gameArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  cardContainer: {
    width: width / 4 - 20,
    height: width / 4 - 20,
    margin: 6,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
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