import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import COLORS from '../constants/colors';

const window = Dimensions.get('window');
const GAME_WIDTH = Math.min(window.width, 400);
const GAME_HEIGHT = window.height;

interface BrickBreakerProps {
  onClose: (score: number) => void;
}

const PADDLE_WIDTH = GAME_WIDTH * 0.2;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 12;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_MARGIN = 1;
const totalMargin = BRICK_MARGIN * (BRICK_COLS + 1);
const availableWidth = GAME_WIDTH - totalMargin;
const BRICK_WIDTH = Math.floor(availableWidth / BRICK_COLS);
const BRICK_HEIGHT = 12;
const BRICK_TOP_OFFSET = GAME_HEIGHT * 0.1;
const POWERUP_SIZE = 20;
const POWERUP_SPEED = 3;

type PowerUpType = 'expand' | 'shrink' | 'speed' | 'slow' | 'multi';

export default function BrickBreaker({ onClose }: BrickBreakerProps) {
  const [ballX, setBallX] = useState(GAME_WIDTH / 2);
  const [ballY, setBallY] = useState(GAME_HEIGHT * 0.7);
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ballDX, setBallDX] = useState(4);
  const [ballDY, setBallDY] = useState(-4);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameRunning, setGameRunning] = useState(false);
  const [showLevelText, setShowLevelText] = useState(true);
  const [currentPaddleWidth, setCurrentPaddleWidth] = useState(PADDLE_WIDTH);
  const [powerUps, setPowerUps] = useState<{ x: number; y: number; type: PowerUpType }[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; timer: NodeJS.Timeout }[]>([]);
  const levelAnim = useRef(new Animated.Value(1)).current;

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpTimersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    resetBricks();
  }, [level]);

  useEffect(() => {
    showLevelAnimation();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      powerUpTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const showLevelAnimation = () => {
    setShowLevelText(true);
    Animated.sequence([
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(levelAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLevelText(false);
      resetGame();
    });
  };

  const resetBricks = () => {
    const newBricks: boolean[][] = [];
    for (let i = 0; i < BRICK_ROWS; i++) {
      newBricks.push([]);
      for (let j = 0; j < BRICK_COLS; j++) {
        newBricks[i].push(true);
      }
    }
    setBricks(newBricks);
  };

  const resetGame = () => {
    setBallX(GAME_WIDTH / 2);
    setBallY(GAME_HEIGHT * 0.7);
    setPaddleX(GAME_WIDTH / 2 - currentPaddleWidth / 2);
    setBallDX(4);
    setBallDY(-4);
    setPowerUps([]);
    setCurrentPaddleWidth(PADDLE_WIDTH);
    setGameRunning(true);

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(gameLoop, 16);
  };

  const gameLoop = () => {
    let newBallX = ballX + ballDX;
    let newBallY = ballY + ballDY;

    // Wall collisions
    if (newBallX <= 0 || newBallX + BALL_SIZE >= GAME_WIDTH) {
      setBallDX(prev => -prev);
      newBallX = ballX - ballDX;
    }

    if (newBallY <= 0) {
      setBallDY(prev => -prev);
      newBallY = ballY - ballDY;
    }

    // Paddle collision
    if (
      newBallY + BALL_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - 50 &&
      newBallX + BALL_SIZE >= paddleX &&
      newBallX <= paddleX + currentPaddleWidth
    ) {
      const hitPosition = (newBallX + BALL_SIZE / 2 - paddleX) / currentPaddleWidth;
      const angle = hitPosition * Math.PI - Math.PI / 2;
      const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);

      setBallDX(Math.cos(angle) * speed);
      setBallDY(-Math.abs(Math.sin(angle) * speed));
      newBallY = ballY + ballDY;
    }

    // Bottom = game over
    if (newBallY + BALL_SIZE >= GAME_HEIGHT) {
      gameOver();
      return;
    }

    setBallX(newBallX);
    setBallY(newBallY);

    // Brick collisions
    setBricks(prev => {
      const newBricks = prev.map(row => [...row]);
      let brickHit = false;

      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (!newBricks[r][c]) continue;

          const brickX = c * (BRICK_WIDTH + BRICK_MARGIN) + BRICK_MARGIN;
          const brickY = r * (BRICK_HEIGHT + BRICK_MARGIN) + BRICK_TOP_OFFSET;

          if (
            newBallX + BALL_SIZE >= brickX &&
            newBallX <= brickX + BRICK_WIDTH &&
            newBallY + BALL_SIZE >= brickY &&
            newBallY <= brickY + BRICK_HEIGHT
          ) {
            newBricks[r][c] = false;
            brickHit = true;
            setCoins(coins => coins + level);

            if (Math.random() < 0.2) {
              const types: PowerUpType[] = ['expand', 'shrink', 'speed', 'slow', 'multi'];
              const type = types[Math.floor(Math.random() * types.length)];
              setPowerUps(powerUps => [...powerUps, {
                x: brickX + BRICK_WIDTH / 2,
                y: brickY,
                type
              }]);
            }

            const dx = (newBallX + BALL_SIZE / 2) - (brickX + BRICK_WIDTH / 2);
            const dy = (newBallY + BALL_SIZE / 2) - (brickY + BRICK_HEIGHT / 2);

            if (Math.abs(dx) > Math.abs(dy)) {
              setBallDX(prev => -prev);
            } else {
              setBallDY(prev => -prev);
            }
          }
        }
      }

      if (brickHit) checkWin(newBricks);
      return newBricks;
    });

    // Power-up movement and collection
    setPowerUps(prev => {
      return prev
        .map(pu => ({ ...pu, y: pu.y + POWERUP_SPEED }))
        .filter(pu => {
          if (
            pu.y + POWERUP_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - 50 &&
            pu.x + POWERUP_SIZE >= paddleX &&
            pu.x <= paddleX + currentPaddleWidth
          ) {
            applyPowerUp(pu.type);
            return false;
          }
          return pu.y < GAME_HEIGHT;
        });
    });
  };

  const applyPowerUp = (type: PowerUpType) => {
    let timer: NodeJS.Timeout | null = null;

    switch (type) {
      case 'expand':
        setCurrentPaddleWidth(PADDLE_WIDTH * 1.5);
        timer = setTimeout(() => setCurrentPaddleWidth(PADDLE_WIDTH), 10000);
        break;
      case 'shrink':
        setCurrentPaddleWidth(PADDLE_WIDTH * 0.7);
        timer = setTimeout(() => setCurrentPaddleWidth(PADDLE_WIDTH), 8000);
        break;
      case 'speed':
        setBallDX(prev => prev * 1.3);
        setBallDY(prev => prev * 1.3);
        timer = setTimeout(() => {
          setBallDX(prev => prev / 1.3);
          setBallDY(prev => prev / 1.3);
        }, 7000);
        break;
      case 'slow':
        setBallDX(prev => prev * 0.7);
        setBallDY(prev => prev * 0.7);
        timer = setTimeout(() => {
          setBallDX(prev => prev / 0.7);
          setBallDY(prev => prev / 0.7);
        }, 7000);
        break;
      case 'multi':
        // Can be implemented later
        break;
    }

    if (timer) {
      powerUpTimersRef.current.push(timer);
      setActivePowerUps(prev => [...prev, { type, timer }]);
    }
  };

  const checkWin = (bricks: boolean[][]) => {
    if (bricks.flat().every(b => !b)) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      Alert.alert('Level Complete!', `You earned ${level * BRICK_ROWS} coins`, [
        { text: 'Next Level', onPress: () => setLevel(l => l + 1) },
        { text: 'Quit', onPress: () => onClose(coins) },
      ]);
    }
  };

  const gameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    Alert.alert('Game Over', `You earned ${coins} coins`, [
      { text: 'Retry', onPress: resetGame },
      { text: 'Quit', onPress: () => onClose(coins) },
    ]);
  };

  const handleTouch = (e: any) => {
    const touchX = e.nativeEvent.locationX;
    setPaddleX(Math.max(0, Math.min(touchX - currentPaddleWidth / 2, GAME_WIDTH - currentPaddleWidth)));
  };

  const getPowerUpColor = (type: PowerUpType) => {
    switch (type) {
      case 'expand': return 'green';
      case 'shrink': return 'red';
      case 'speed': return 'orange';
      case 'slow': return 'blue';
      case 'multi': return 'purple';
      default: return 'gray';
    }
  };

  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'expand':
      case 'shrink': return 'resize';
      case 'speed': return 'flash';
      case 'slow': return 'hourglass';
      case 'multi': return 'copy';
      default: return 'help';
    }
  };

  return (
    <View style={styles.container} onTouchStart={handleTouch} onTouchMove={handleTouch}>
      <TouchableOpacity style={styles.closeButton} onPress={() => onClose(coins)}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Brick Breaker - Level {level}</Text>
      <Text style={styles.coins}>Coins: {coins}</Text>

      <View style={styles.powerUpContainer}>
        {activePowerUps.map((pu, index) => (
          <Ionicons
            key={index}
            name={getPowerUpIcon(pu.type) as any}
            size={20}
            color={getPowerUpColor(pu.type)}
            style={styles.powerUpIcon}
          />
        ))}
      </View>

      {bricks.map((row, r) =>
        row.map(
          (brick, c) =>
            brick && (
              <View
                key={`brick-${r}-${c}`}
                style={[
                  styles.brick,
                  {
                    top: r * (BRICK_HEIGHT + BRICK_MARGIN) + BRICK_TOP_OFFSET,
                    left: c * (BRICK_WIDTH + BRICK_MARGIN) + BRICK_MARGIN,
                    backgroundColor: `hsl(${r * 60}, 80%, 50%)`,
                  },
                ]}
              />
            )
        )
      )}

      <View
        style={[
          styles.ball,
          {
            left: ballX,
            top: ballY,
            backgroundColor: 'blue',
          },
        ]}
      />

      <View
        style={[
          styles.paddle,
          {
            left: paddleX,
            width: currentPaddleWidth,
          },
        ]}
      />

      {powerUps.map((pu, index) => (
        <View
          key={index}
          style={[
            styles.powerUp,
            {
              left: pu.x - POWERUP_SIZE / 2,
              top: pu.y,
              backgroundColor: getPowerUpColor(pu.type),
            },
          ]}
        >
          <Ionicons name={getPowerUpIcon(pu.type) as any} size={POWERUP_SIZE * 0.8} color="white" />
        </View>
      ))}

      {showLevelText && (
        <Animated.View style={[styles.levelOverlay, { opacity: levelAnim }]}>
          <Text style={styles.levelText}>Level {level}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    width: GAME_WIDTH,
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
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 40,
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: 'gold',
    textAlign: 'center',
    marginBottom: 10,
  },
  powerUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  powerUpIcon: {
    marginHorizontal: 5,
  },
  brick: {
    position: 'absolute',
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    borderRadius: 4,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    zIndex: 10,
  },
  paddle: {
    position: 'absolute',
    bottom: 50,
    height: PADDLE_HEIGHT,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    zIndex: 10,
  },
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  levelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  levelText: {
    fontFamily: 'PressStart2P',
    fontSize: 22,
    color: 'white',
  },
});
