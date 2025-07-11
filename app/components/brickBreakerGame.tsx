import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_WIDTH = SCREEN_WIDTH * 0.95;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.75;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 12;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_MARGIN = 1;
const BRICK_HEIGHT = 12;
const PADDLE_Y_OFFSET = 50;

const BASE_PADDLE_WIDTH = GAME_WIDTH * 0.2;
const BRICK_WIDTH = (GAME_WIDTH - (BRICK_COLS + 1) * BRICK_MARGIN) / BRICK_COLS;

type PowerUpType = 'expand' | 'shrink' | 'multi' | 'slow' | 'fast';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
}

interface Props {
  onExit?: () => void; // callback to exit game
}

export default function BrickBreakerGame({ onExit }: Props) {
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - BASE_PADDLE_WIDTH / 2);
  const [paddleWidth, setPaddleWidth] = useState(BASE_PADDLE_WIDTH);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [coins, setCoins] = useState(0);

  const ballsRef = useRef(balls);
  const paddleXRef = useRef(paddleX);
  const paddleWidthRef = useRef(paddleWidth);
  const bricksRef = useRef(bricks);
  const powerUpsRef = useRef(powerUps);
  const coinsRef = useRef(coins);
  const animationFrame = useRef<number>();
  const powerUpTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    startNewGame();
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      Object.values(powerUpTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => { ballsRef.current = balls; }, [balls]);
  useEffect(() => { paddleXRef.current = paddleX; }, [paddleX]);
  useEffect(() => { paddleWidthRef.current = paddleWidth; }, [paddleWidth]);
  useEffect(() => { bricksRef.current = bricks; }, [bricks]);
  useEffect(() => { powerUpsRef.current = powerUps; }, [powerUps]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);

  const startNewGame = () => {
    const startBall = [{ x: GAME_WIDTH / 2 - BALL_SIZE / 2, y: GAME_HEIGHT / 2, dx: 3, dy: -3 }];
    setBalls(startBall);
    ballsRef.current = startBall;
    setPaddleX(GAME_WIDTH / 2 - BASE_PADDLE_WIDTH / 2);
    setPaddleWidth(BASE_PADDLE_WIDTH);
    setCoins(0);
    setPowerUps([]);
    powerUpsRef.current = [];
    createBricks();
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const createBricks = () => {
    const newBricks: boolean[][] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        row.push(true);
      }
      newBricks.push(row);
    }
    setBricks(newBricks);
    bricksRef.current = newBricks;
  };

  const gameLoop = () => {
    let updatedBricks = bricksRef.current.map(row => [...row]);
    let newBalls = ballsRef.current.map(ball => {
      let { x, y, dx, dy } = ball;
      x += dx;
      y += dy;

      if (x <= 0 || x + BALL_SIZE >= GAME_WIDTH) dx = -dx;
      if (y <= 0) dy = -dy;

      const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET;
      const paddleLeft = paddleXRef.current;
      const paddleRight = paddleLeft + paddleWidthRef.current;

      if (
        y + BALL_SIZE >= paddleTop &&
        y + BALL_SIZE <= paddleTop + PADDLE_HEIGHT + 5 &&
        x + BALL_SIZE >= paddleLeft &&
        x <= paddleRight &&
        dy > 0
      ) {
        const hitPos = (x + BALL_SIZE / 2 - paddleLeft) / paddleWidthRef.current;
        const angle = (hitPos - 0.5) * Math.PI / 2;
        const speed = Math.sqrt(dx * dx + dy * dy);
        dx = speed * Math.sin(angle);
        dy = -Math.abs(speed * Math.cos(angle));
        y = paddleTop - BALL_SIZE;
      }

      const row = Math.floor((y - PADDLE_Y_OFFSET) / (BRICK_HEIGHT + BRICK_MARGIN));
      const col = Math.floor(x / (BRICK_WIDTH + BRICK_MARGIN));
      if (
        row >= 0 && row < BRICK_ROWS &&
        col >= 0 && col < BRICK_COLS &&
        updatedBricks[row] && updatedBricks[row][col]
      ) {
        updatedBricks[row][col] = false;
        dy = -dy;
        setCoins(prev => prev + 1);

        if (Math.random() < 0.5) {
          const types: PowerUpType[] = ['expand', 'shrink', 'multi', 'slow', 'fast'];
          const type = types[Math.floor(Math.random() * types.length)];
          setPowerUps(old => [...old, {
            x: col * (BRICK_WIDTH + BRICK_MARGIN) + BRICK_WIDTH / 2,
            y: row * (BRICK_HEIGHT + BRICK_MARGIN) + PADDLE_Y_OFFSET,
            type,
          }]);
        }
      }

      return { x, y, dx, dy };
    }).filter(b => b.y <= GAME_HEIGHT);

    if (newBalls.length === 0) {
      Alert.alert('Game Over', 'Try again', [{ text: 'OK', onPress: () => startNewGame() }]);
      return;
    }

    setBalls(newBalls);
    ballsRef.current = newBalls;
    setBricks(updatedBricks);
    bricksRef.current = updatedBricks;

    const updatedPowerUps = powerUpsRef.current
      .map(pu => ({ ...pu, y: pu.y + 2 }))
      .filter(pu => {
        if (
          pu.y + BALL_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET &&
          pu.x >= paddleXRef.current &&
          pu.x <= paddleXRef.current + paddleWidthRef.current
        ) {
          applyPowerUp(pu.type);
          return false;
        }
        return pu.y < GAME_HEIGHT;
      });

    setPowerUps(updatedPowerUps);
    powerUpsRef.current = updatedPowerUps;
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const applyPowerUp = (type: PowerUpType) => {
    const timeoutKey = `powerup-${type}`;
    clearTimeout(powerUpTimeouts.current[timeoutKey]);

    switch (type) {
      case 'expand':
        setPaddleWidth(BASE_PADDLE_WIDTH * 1.5);
        powerUpTimeouts.current[timeoutKey] = setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'shrink':
        setPaddleWidth(BASE_PADDLE_WIDTH * 0.6);
        powerUpTimeouts.current[timeoutKey] = setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'multi':
        if (ballsRef.current.length < 5) {
          const base = ballsRef.current[0];
          const speed = Math.sqrt(base.dx * base.dx + base.dy * base.dy);
          setBalls(balls => [...balls, {
            x: base.x,
            y: base.y,
            dx: speed,
            dy: -speed
          }, {
            x: base.x,
            y: base.y,
            dx: -speed,
            dy: -speed
          }]);
        }
        break;
      case 'slow':
        setBalls(balls => balls.map(b => ({ ...b, dx: b.dx * 0.7, dy: b.dy * 0.7 })));
        break;
      case 'fast':
        setBalls(balls => balls.map(b => ({ ...b, dx: b.dx * 1.3, dy: b.dy * 1.3 })));
        break;
    }
  };

  const handleTouch = (e: GestureResponderEvent) => {
    const touchX = e.nativeEvent.locationX;
    const newX = Math.max(0, Math.min(touchX - paddleWidthRef.current / 2, GAME_WIDTH - paddleWidthRef.current));
    setPaddleX(newX);
  };

  const getPowerUpColor = (type: PowerUpType) => {
    switch (type) {
      case 'expand': return 'green';
      case 'shrink': return 'red';
      case 'multi': return 'purple';
      case 'slow': return 'blue';
      case 'fast': return 'orange';
      default: return 'white';
    }
  };

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderMove={handleTouch}
    >
      <TouchableOpacity style={styles.exitButton} onPress={() => onExit && onExit()}>
        <Text style={styles.exitText}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.coins}>Coins: {coins}</Text>
      {bricks.map((row, rIdx) => row.map((brick, cIdx) => brick && (
        <View key={`${rIdx}-${cIdx}`} style={[styles.brick, {
          top: PADDLE_Y_OFFSET + rIdx * (BRICK_HEIGHT + BRICK_MARGIN),
          left: BRICK_MARGIN + cIdx * (BRICK_WIDTH + BRICK_MARGIN),
          backgroundColor: `hsl(${(rIdx * 60) % 360}, 70%, 50%)`,
        }]} />
      )))}
      {balls.map((ball, idx) => (
        <View key={idx} style={[styles.ball, { top: ball.y, left: ball.x }]} />
      ))}
      <View style={[styles.paddle, { left: paddleX, width: paddleWidth }]} />
      {powerUps.map((pu, idx) => (
        <View key={idx} style={[styles.powerUp, {
          left: pu.x - BALL_SIZE / 2,
          top: pu.y,
          backgroundColor: getPowerUpColor(pu.type),
        }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#222',
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#555',
    marginTop: 50,
  },
  brick: {
    position: 'absolute',
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    borderRadius: 2,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: 'cyan',
  },
  paddle: {
    position: 'absolute',
    bottom: PADDLE_Y_OFFSET,
    height: PADDLE_HEIGHT,
    backgroundColor: 'hotpink',
    borderRadius: 10,
  },
  powerUp: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    opacity: 0.8,
  },
  exitButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: '#900',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  exitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 20,
  },
  coins: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'yellow',
    fontSize: 16,
    zIndex: 1,
  },
});
