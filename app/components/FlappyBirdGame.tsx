import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const PIPE_WIDTH = 70;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_GAP = 180;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 1500;
const COLLISION_MARGIN = 6;

interface FlappyBirdGameProps {
  onClose: (score: number) => void;
}

export default function FlappyBirdGame({ onClose }: FlappyBirdGameProps) {
  const [birdPosition, setBirdPosition] = useState(height / 2);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [pipes, setPipes] = useState<{ x: number; topHeight: number; passed: boolean }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const pipeLoopRef = useRef<NodeJS.Timeout>();
  const birdVelocityRef = useRef(0);
  const scoreRef = useRef(0);
  const coinsEarnedRef = useRef(0);

  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      startGame();
      birdVelocityRef.current = JUMP_FORCE;
      return;
    }
    birdVelocityRef.current = JUMP_FORCE;
  };

  const startGame = () => {
    setPipes([]);
    setScore(0);
    scoreRef.current = 0;
    setCoinsEarned(0);
    coinsEarnedRef.current = 0;
    setBirdPosition(height / 2);
    setGameOver(false);
    birdVelocityRef.current = 0;

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (pipeLoopRef.current) clearInterval(pipeLoopRef.current);

    gameLoopRef.current = setInterval(() => {
      setBirdPosition(prev => {
        const newPosition = prev + birdVelocityRef.current;
        birdVelocityRef.current += GRAVITY;

        if (newPosition <= 0 || newPosition >= height - BIRD_HEIGHT) {
          endGame();
          return prev;
        }
        return newPosition;
      });
    }, 16);

    pipeLoopRef.current = setInterval(() => {
      let latestBirdY = 0;
      setBirdPosition(prev => {
        latestBirdY = prev;
        return prev;
      });

      setPipes(prevPipes => {
        const movedPipes = prevPipes
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x > -PIPE_WIDTH);

        if (movedPipes.length === 0 || movedPipes[movedPipes.length - 1].x < width - 300) {
          const MIN_PIPE_TOP = 100;
          const MAX_PIPE_TOP = height - PIPE_GAP - 200;
          const safeTopHeight = Math.random() * (MAX_PIPE_TOP - MIN_PIPE_TOP) + MIN_PIPE_TOP;

          movedPipes.push({
            x: width,
            topHeight: safeTopHeight,
            passed: false,
          });
        }

        const birdX = width / 3;
        const birdY = latestBirdY;
        const birdRight = birdX + BIRD_WIDTH / 2 - COLLISION_MARGIN;
        const birdLeft = birdX - BIRD_WIDTH / 2 + COLLISION_MARGIN;
        const birdTop = birdY + COLLISION_MARGIN;
        const birdBottom = birdY + BIRD_HEIGHT - COLLISION_MARGIN;

        movedPipes.forEach(pipe => {
          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;
          const gapTop = pipe.topHeight;
          const gapBottom = pipe.topHeight + PIPE_GAP;

          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdTop < gapTop || birdBottom > gapBottom) {
              endGame();
            }
          }

          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX - BIRD_WIDTH / 2) {
            pipe.passed = true;
            scoreRef.current += 1;
            const newCoins = Math.floor(scoreRef.current / 10);
            if (newCoins > coinsEarnedRef.current) {
              coinsEarnedRef.current = newCoins;
              setCoinsEarned(newCoins);
            }
            setScore(scoreRef.current);
          }
        });

        return movedPipes;
      });
    }, 16);
  };

  const endGame = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(pipeLoopRef.current);
    setGameOver(true); // Only set game over state here
  };

  const handleExit = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(pipeLoopRef.current);
    setTimeout(() => {
      onClose(scoreRef.current);
    }, 0);
  };

  useEffect(() => {
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(pipeLoopRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleExit}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.coins}>Coins: {coinsEarned}</Text>

      {!gameStarted && !gameOver && (
        <View style={styles.startContainer}>
          <Text style={styles.startText}>Tap to Start</Text>
        </View>
      )}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Score: {score}</Text>
          <Text style={styles.coinsEarned}>Coins Earned: {coinsEarned}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.restartButton} onPress={startGame}>
              <Text style={styles.restartButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.gameArea} activeOpacity={1} onPress={jump}>
        <Image
          source={require('../../assets/images/favicon.png')}
          style={[
            styles.bird,
            {
              top: birdPosition,
              transform: [{ rotate: `${birdVelocityRef.current * 2}deg` }],
            },
          ]}
        />

        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.pipeTop,
                {
                  left: pipe.x,
                  height: pipe.topHeight,
                },
              ]}
            />
            <View
              style={[
                styles.pipeBottom,
                {
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  height: height - pipe.topHeight - PIPE_GAP,
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
    backgroundColor: '#70c5ce',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: '#ff5a5f',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  score: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  coins: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
    fontSize: 20,
    color: 'gold',
    fontWeight: 'bold',
  },
  startContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  startText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
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
    left: width / 3 - BIRD_WIDTH / 2,
    resizeMode: 'contain',
  },
  pipeTop: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#74b42c',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#5a9022',
    top: 0,
  },
  pipeBottom: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#74b42c',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 5,
    borderColor: '#5a9022',
  },
  gameOverContainer: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  gameOverText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  finalScore: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  coinsEarned: {
    fontSize: 18,
    color: 'gold',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: '#ff5a5f',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  exitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});