import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const window = Dimensions.get('window');
const screenWidth = window.width;
const screenHeight = Platform.OS === 'ios' ? window.height : window.height - 24;

const PLAYER_SIZE = 50;
const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const GRAVITY = 1;
const JUMP_VELOCITY = -20;
const PLATFORM_SPACING = 150;
const NUM_INITIAL_PLATFORMS = 10;
const CLOUD_WIDTH = 100;
const CLOUD_HEIGHT = 60;
const MAX_PLATFORMS = 30;
const JUMP_COOLDOWN = 300;

type Platform = {
  id: string;
  x: number;
  y: number;
  special: boolean;
  lastJumpTime: number;
};

type Cloud = {
  id: string;
  x: number;
  y: number;
  speed: number;
};

type Props = {
  onExit: () => void; // function to call when pressing X button to go back
};

export default function PlatformJumperGame({ onExit }: Props) {
  const playerX = useRef(screenWidth / 2 - PLAYER_SIZE / 2);
  const playerY = useRef(screenHeight - PLAYER_SIZE - 100);
  const velocityY = useRef(0);
  const isJumping = useRef(false);

  const platforms = useRef<Platform[]>([]);
  const clouds = useRef<Cloud[]>([]);
  const score = useRef(0);
  const highScore = useRef(0);

  // states for UI updates only when needed
  const [, setTick] = useState(0);
  const [scoreUI, setScoreUI] = useState(0);
  const [highScoreUI, setHighScoreUI] = useState(0);
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'gameover'>('ready');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newX = playerX.current + gestureState.dx * 0.15;
        if (newX < 0) newX = 0;
        if (newX > screenWidth - PLAYER_SIZE) newX = screenWidth - PLAYER_SIZE;
        playerX.current = newX;
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // game loop ref for cleanup and restart
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (gameStatus === 'playing') {
      const loop = () => {
        gameTick();
        animationFrameId.current = requestAnimationFrame(loop);
      };

      animationFrameId.current = requestAnimationFrame(loop);

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    } else {
      // cancel loop if not playing
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
  }, [gameStatus]);

  function resetGame() {
    playerX.current = screenWidth / 2 - PLAYER_SIZE / 2;
    playerY.current = screenHeight - PLAYER_SIZE - 100;
    velocityY.current = 0;
    isJumping.current = false;

    score.current = 0;

    const newPlatforms: Platform[] = [];
    newPlatforms.push({
      id: `platform-0`,
      x: screenWidth / 2 - PLATFORM_WIDTH / 2,
      y: screenHeight - 80,
      special: false,
      lastJumpTime: 0,
    });
    for (let i = 1; i < NUM_INITIAL_PLATFORMS; i++) {
      newPlatforms.push({
        id: `platform-${i}`,
        x: Math.random() * (screenWidth - PLATFORM_WIDTH),
        y: screenHeight - 80 - i * PLATFORM_SPACING,
        special: Math.random() < 0.1,
        lastJumpTime: 0,
      });
    }
    platforms.current = newPlatforms;

    const newClouds: Cloud[] = [];
    for (let i = 0; i < 3; i++) {
      newClouds.push({
        id: `cloud-${i}`,
        x: Math.random() * (screenWidth - CLOUD_WIDTH),
        y: Math.random() * (screenHeight / 2),
        speed: 0.2 + Math.random() * 0.3,
      });
    }
    clouds.current = newClouds;

    // update UI
    setScoreUI(0);
    setHighScoreUI(highScore.current);
    setTick((t) => t + 1);
  }

  function startGame() {
    resetGame(); // reset first on start so restart works right
    setGameStatus('playing');
  }

  function endGame() {
    setGameStatus('gameover');
    if (score.current > highScore.current) {
      highScore.current = score.current;
      setHighScoreUI(highScore.current);
    }
  }

  function gameTick() {
    velocityY.current += GRAVITY;
    playerY.current += velocityY.current;

    const now = Date.now();

    let landed = false;
    for (let i = 0; i < platforms.current.length; i++) {
      const p = platforms.current[i];
      if (
        velocityY.current > 0 &&
        playerY.current + PLAYER_SIZE >= p.y &&
        playerY.current + PLAYER_SIZE <= p.y + PLATFORM_HEIGHT + 10 &&
        playerX.current + PLAYER_SIZE > p.x + 5 &&
        playerX.current < p.x + PLATFORM_WIDTH - 5 &&
        now - p.lastJumpTime > JUMP_COOLDOWN
      ) {
        playerY.current = p.y - PLAYER_SIZE;
        velocityY.current = p.special ? JUMP_VELOCITY * 1.5 : JUMP_VELOCITY;
        landed = true;

        platforms.current[i] = { ...p, lastJumpTime: now };
        break;
      }
    }

    isJumping.current = !landed;

    if (playerY.current < screenHeight / 3) {
      const diff = screenHeight / 3 - playerY.current;
      playerY.current = screenHeight / 3;

      platforms.current = platforms.current
        .map((p) => ({ ...p, y: p.y + diff }))
        .filter((p) => p.y < screenHeight + PLATFORM_HEIGHT * 2);

      clouds.current = clouds.current
        .map((c) => ({ ...c, y: c.y + diff * 0.5 }))
        .filter((c) => c.y < screenHeight + CLOUD_HEIGHT);

      score.current += Math.floor(diff);
      setScoreUI(score.current);
    }

    clouds.current = clouds.current.map((c) => {
      let newX = c.x + c.speed;
      if (newX > screenWidth) newX = -CLOUD_WIDTH;
      return { ...c, x: newX };
    });

    if (platforms.current.length > 0) {
      const lastPlatform = platforms.current[platforms.current.length - 1];
      if (lastPlatform.y > 0 && platforms.current.length < MAX_PLATFORMS) {
        const newPlatform: Platform = {
          id: `platform-${Date.now()}`,
          x: Math.random() * (screenWidth - PLATFORM_WIDTH),
          y: lastPlatform.y - PLATFORM_SPACING,
          special: Math.random() < 0.1,
          lastJumpTime: 0,
        };
        platforms.current.push(newPlatform);
      }
    }

    if (playerY.current > screenHeight) {
      endGame();
      return;
    }

    setTick((t) => t + 1);
  }

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Exit X button */}
      <TouchableOpacity style={styles.exitButton} onPress={onExit}>
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>

      {clouds.current.map((cloud) => (
        <View
          key={cloud.id}
          style={[styles.cloud, { left: cloud.x, top: cloud.y, width: CLOUD_WIDTH, height: CLOUD_HEIGHT }]}
        />
      ))}

      {platforms.current.map((platform) => (
        <View
          key={platform.id}
          style={[
            styles.platform,
            {
              left: platform.x,
              top: platform.y,
              width: PLATFORM_WIDTH,
              height: PLATFORM_HEIGHT,
              backgroundColor: platform.special ? '#FFD700' : '#4CAF50',
            },
          ]}
        />
      ))}

      {gameStatus === 'playing' && (
        <Image
          source={require('../../assets/images/favicon.png')}
          style={[styles.character, { left: playerX.current, top: playerY.current }]}
          resizeMode="contain"
        />
      )}

      <View style={styles.scoreContainer}>
        <Text style={styles.score}>Score: {scoreUI}</Text>
        <Text style={styles.highScore}>High Score: {highScoreUI}</Text>
      </View>

      {gameStatus === 'ready' && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Pet-Jump</Text>
          <Text style={styles.instructions}>
            Drag to move left/right{'\n'}
            Land precisely on GREEN and GOLD platforms!{'\n'}
            Golden platforms give extra height!
          </Text>
          <TouchableOpacity style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameStatus === 'gameover' && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.score}>Final Score: {scoreUI}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              resetGame();
              setGameStatus('playing'); // let player play again on restart
            }}
          >
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  platform: {
    position: 'absolute',
    borderRadius: 10,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 30,
  },
  character: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  highScore: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
  },
});
