import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const PIPE_WIDTH = 60;
const GRAVITY = 3;
const JUMP_FORCE = -50;
const PIPE_GAP = 150;

interface FlappyBirdGameProps {
  onClose: () => void;
}

export default function FlappyBirdGame({ onClose }: FlappyBirdGameProps) {
  const [birdPosition, setBirdPosition] = useState(height / 2);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [pipes, setPipes] = useState<{ x: number; height: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const pipeLoopRef = useRef<NodeJS.Timeout>();
  const birdVelocityRef = useRef(JUMP_FORCE);

  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      startGame();
    }
    birdVelocityRef.current = JUMP_FORCE;
  };

  const startGame = () => {
    setPipes([]);
    setScore(0);
    setBirdPosition(height / 2);
    setGameOver(false);
    
    // Game loop
    gameLoopRef.current = setInterval(() => {
      setBirdPosition(prev => {
        const newPosition = prev + birdVelocityRef.current;
        birdVelocityRef.current += GRAVITY;
        
        // Check if bird hits the ground or ceiling
        if (newPosition <= 0 || newPosition >= height - BIRD_HEIGHT) {
          endGame();
          return prev;
        }
        
        // Check if bird hits pipes
        pipes.forEach(pipe => {
          if (
            width / 2 - BIRD_WIDTH / 2 > pipe.x - PIPE_WIDTH / 2 &&
            width / 2 - BIRD_WIDTH / 2 < pipe.x + PIPE_WIDTH / 2 &&
            (birdPosition < pipe.height || birdPosition + BIRD_HEIGHT > pipe.height + PIPE_GAP)
          ) {
            endGame();
          }
        });
        
        return newPosition;
      });
    }, 20);
    
    // Pipe generation loop
    pipeLoopRef.current = setInterval(() => {
      setPipes(prev => {
        const newPipes = [...prev];
        if (newPipes.length > 0 && newPipes[0].x < -PIPE_WIDTH) {
          newPipes.shift();
          setScore(prevScore => prevScore + 1);
        }
        
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < width - 300) {
          newPipes.push({
            x: width,
            height: Math.random() * (height - PIPE_GAP - 100) + 50,
          });
        }
        
        return newPipes.map(pipe => ({
          ...pipe,
          x: pipe.x - 5,
        }));
      });
    }, 20);
  };

  const endGame = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(pipeLoopRef.current);
    setGameOver(true);
    setGameStarted(false);
  };

  useEffect(() => {
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(pipeLoopRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      
      <Text style={styles.score}>Score: {score}</Text>
      
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={startGame}>
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.gameArea} 
        activeOpacity={1} 
        onPress={jump}
      >
        <Image
          source={require('../../assets/images/adaptive-icon.png')}
          style={[
            styles.bird,
            {
              top: birdPosition,
              transform: [{ rotate: `${birdVelocityRef.current * 0.2}deg` }],
            },
          ]}
        />
        
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.pipe,
                {
                  left: pipe.x,
                  height: pipe.height,
                  top: 0,
                },
              ]}
            />
            <View
              style={[
                styles.pipe,
                {
                  left: pipe.x,
                  height: height - pipe.height - PIPE_GAP,
                  bottom: 0,
                },
              ]}
            />
          </React.Fragment>
        ))}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  closeButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: '#fff',
  },
  score: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bird: {
    position: 'absolute',
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    left: width / 2 - BIRD_WIDTH / 2,
    resizeMode: 'contain',
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: COLORS.primary,
  },
  gameOverContainer: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  gameOverText: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  finalScore: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
  },
  restartButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#fff',
  },
});