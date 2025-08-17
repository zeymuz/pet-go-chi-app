import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';


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
            // Fixed: Only award coins when score is divisible by 10
            if (scoreRef.current % 10 === 0) {
              coinsEarnedRef.current += 1;
              setCoinsEarned(coinsEarnedRef.current);
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
      onClose(coinsEarnedRef.current); // Pass coins earned instead of score
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
          source={require('../../assets/images/gifs/PIXELHEAD.png')}
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
    backgroundColor: '#ff5a5f',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(16),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  score: {
    position: 'absolute',
    top: verticalScale(40),
    left: scale(20),
    zIndex: 10,
    fontSize: scaleFont(20),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  coins: {
    position: 'absolute',
    top: verticalScale(70),
    left: scale(20),
    zIndex: 10,
    fontSize: scaleFont(20),
    color: 'gold',
    fontFamily: 'PressStart2P',
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
    fontSize: scaleFont(24),
    color: '#fff',
    fontFamily: 'PressStart2P',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: verticalScale(20),
    borderRadius: scale(10),
  },
  gameOverContainer: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: verticalScale(20),
    borderRadius: scale(10),
    alignItems: 'center',
    zIndex: 20,
  },
  gameOverText: {
    fontSize: scaleFont(24),
    color: '#fff',
    marginBottom: verticalScale(10),
    fontFamily: 'PressStart2P',
  },
  finalScore: {
    fontSize: scaleFont(20),
    color: '#fff',
    marginBottom: verticalScale(10),
    fontFamily: 'PressStart2P',
  },
  coinsEarned: {
    fontSize: scaleFont(18),
    color: 'gold',
    marginBottom: verticalScale(20),
    fontFamily: 'PressStart2P',
  },
  restartButtonText: {
    fontSize: scaleFont(18),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  exitButtonText: {
    fontSize: scaleFont(18),
    top: verticalScale(7),
    color: '#fff',
    fontFamily: 'PressStart2P',
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
    width: scale(40),
    height: verticalScale(30),
    left: width / 3 - scale(40) / 2,
    resizeMode: 'contain',
  },
  pipeTop: {
    position: 'absolute',
    width: scale(70),
    backgroundColor: '#74b42c',
    borderLeftWidth: scale(2),
    borderRightWidth: scale(2),
    borderBottomWidth: scale(5),
    borderColor: '#5a9022',
    top: 0,
  },
  pipeBottom: {
    position: 'absolute',
    width: scale(70),
    backgroundColor: '#74b42c',
    borderLeftWidth: scale(2),
    borderRightWidth: scale(2),
    borderTopWidth: scale(5),
    borderColor: '#5a9022',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    padding: verticalScale(15),
    borderRadius: scale(10),
    flex: 1,
    marginRight: scale(10),
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: '#ff5a5f',
    padding: verticalScale(15),
    borderRadius: scale(10),
    flex: 1,
    marginLeft: scale(10),
    alignItems: 'center',
  },
});