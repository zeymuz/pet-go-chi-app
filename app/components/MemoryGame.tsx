import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      }))
      .sort(() => 0.5 - Math.random());
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const handleCardPress = (id: number) => {
    if (!gameStarted) return;

    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    const newCards = cards.map(card => 
      card.id === id ? { ...card, isFlipped: true } : card
    );
    
    setCards(newCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      setMoves(moves + 1);
      const [firstId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === id);
      
      if (firstCard?.icon === secondCard?.icon) {
        setTimeout(() => {
          const matchedCards = newCards.map(card => 
            card.id === firstId || card.id === id 
              ? { ...card, isMatched: true } 
              : card
          );
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
          const resetCards = newCards.map(card => 
            card.id === firstId || card.id === id 
              ? { ...card, isFlipped: false } 
              : card
          );
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const handleClose = () => {
    onClose(0);
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
        {cards.map(card => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              card.isFlipped || card.isMatched ? styles.cardFlipped : styles.cardBack,
            ]}
            onPress={() => handleCardPress(card.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={card.isFlipped || card.isMatched ? (card.icon as any) : "md-help-circle"} 
              size={28} 
              color={card.isFlipped || card.isMatched ? COLORS.primary : "white"} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {!gameStarted && (
        <View style={styles.startOverlay}>
          <Text style={styles.startText}>TAP ANY CARD TO START</Text>
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
  card: {
    width: width / 4 - 20,
    height: width / 4 - 20,
    margin: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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