import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
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

type PowerUpType = 'expand' | 'shrink' | 'multi';

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

export default function BrickBreakerGame() {
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - BASE_PADDLE_WIDTH / 2);
  const [paddleWidth, setPaddleWidth] = useState(BASE_PADDLE_WIDTH);
  const [balls, setBalls] = useState<Ball[]>([{
    x: GAME_WIDTH / 2 - BALL_SIZE / 2,
    y: GAME_HEIGHT / 2,
    dx: 3,
    dy: -3,
  }]);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  const ballsRef = useRef(balls);
  const paddleXRef = useRef(paddleX);
  const paddleWidthRef = useRef(paddleWidth);
  const bricksRef = useRef(bricks);
  const powerUpsRef = useRef(powerUps);
  const animationFrame = useRef<number>();

  useEffect(() => {
    createBricks();
    ballsRef.current = balls;
    paddleXRef.current = paddleX;
    paddleWidthRef.current = paddleWidth;
    bricksRef.current = bricks;
    powerUpsRef.current = powerUps;

    animationFrame.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  useEffect(() => {
    paddleXRef.current = paddleX;
  }, [paddleX]);

  useEffect(() => {
    paddleWidthRef.current = paddleWidth;
  }, [paddleWidth]);

  useEffect(() => {
    bricksRef.current = bricks;
  }, [bricks]);

  useEffect(() => {
    powerUpsRef.current = powerUps;
  }, [powerUps]);

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
  };

  const gameLoop = () => {
    let bricksChanged = false;
    let updatedBricks = bricksRef.current.map(row => [...row]);

    let newBalls = ballsRef.current.map(ball => {
      let { x, y, dx, dy } = ball;

      // Move ball
      x += dx;
      y += dy;

      // Wall collisions
      if (x <= 0) {
        x = 0;
        dx = -dx;
      } else if (x + BALL_SIZE >= GAME_WIDTH) {
        x = GAME_WIDTH - BALL_SIZE;
        dx = -dx;
      }
      if (y <= 0) {
        y = 0;
        dy = -dy;
      }

      // Paddle collision
      const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET;
      const paddleLeft = paddleXRef.current;
      const paddleRight = paddleXRef.current + paddleWidthRef.current;

      if (
        y + BALL_SIZE >= paddleTop &&
        y + BALL_SIZE <= paddleTop + PADDLE_HEIGHT + 5 && // small tolerance for collision
        x + BALL_SIZE >= paddleLeft &&
        x <= paddleRight &&
        dy > 0
      ) {
        // Bounce up
        dy = -Math.abs(dy);

        // Calculate angle based on hit position on paddle
        const hitPos = (x + BALL_SIZE / 2 - paddleLeft) / paddleWidthRef.current;
        const angle = (hitPos - 0.5) * Math.PI / 2; // -45 to +45 degrees

        const speed = Math.sqrt(dx * dx + dy * dy);
        dx = speed * Math.sin(angle);
        dy = -Math.abs(speed * Math.cos(angle));

        y = paddleTop - BALL_SIZE; // Adjust ball position so it doesn't get stuck inside paddle
      }

      // Brick collision
      const row = Math.floor((y - PADDLE_Y_OFFSET) / (BRICK_HEIGHT + BRICK_MARGIN));
      const col = Math.floor(x / (BRICK_WIDTH + BRICK_MARGIN));
      if (
        row >= 0 && row < BRICK_ROWS &&
        col >= 0 && col < BRICK_COLS &&
        updatedBricks[row] &&
        updatedBricks[row][col]
      ) {
        updatedBricks[row][col] = false;
        bricksChanged = true;

        dy = -dy;

        // Spawn power-up randomly
        if (Math.random() < 0.2) {
          const types: PowerUpType[] = ['expand', 'shrink', 'multi'];
          const type = types[Math.floor(Math.random() * types.length)];
          setPowerUps(old => [...old, {
            x: col * (BRICK_WIDTH + BRICK_MARGIN) + BRICK_WIDTH / 2,
            y: row * (BRICK_HEIGHT + BRICK_MARGIN) + PADDLE_Y_OFFSET,
            type,
          }]);
        }
      }

      return { x, y, dx, dy };
    });

    if (bricksChanged) {
      setBricks(updatedBricks);
      bricksRef.current = updatedBricks;
    }

    // Update balls
    // Remove balls that fall below screen
    newBalls = newBalls.filter(b => b.y <= GAME_HEIGHT);

    if (newBalls.length === 0) {
      Alert.alert('Game Over', 'Try again', [{ text: 'OK' }]);
      // Reset game
      resetGame();
      return;
    }

    setBalls(newBalls);
    ballsRef.current = newBalls;

    // Update power-ups falling
    const updatedPowerUps = powerUpsRef.current
      .map(pu => ({ ...pu, y: pu.y + 2 })) // fall speed 2
      .filter(pu => {
        // Caught by paddle?
        if (
          pu.y + BALL_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET &&
          pu.x >= paddleXRef.current &&
          pu.x <= paddleXRef.current + paddleWidthRef.current
        ) {
          applyPowerUp(pu.type);
          return false;
        }
        // Remove if falls below screen
        return pu.y < GAME_HEIGHT;
      });

    setPowerUps(updatedPowerUps);
    powerUpsRef.current = updatedPowerUps;

    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const applyPowerUp = (type: PowerUpType) => {
    switch (type) {
      case 'expand':
        setPaddleWidth(BASE_PADDLE_WIDTH * 1.5);
        setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'shrink':
        setPaddleWidth(BASE_PADDLE_WIDTH * 0.7);
        setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'multi':
        // Add two more balls near current first ball with different directions
        setBalls(oldBalls => {
          if (oldBalls.length >= 5) return oldBalls; // max 5 balls to avoid overload

          const base = oldBalls[0];
          const speed = Math.sqrt(base.dx * base.dx + base.dy * base.dy);

          const newBall1: Ball = {
            x: base.x,
            y: base.y,
            dx: speed * Math.cos(Math.PI / 4),
            dy: -speed * Math.sin(Math.PI / 4),
          };
          const newBall2: Ball = {
            x: base.x,
            y: base.y,
            dx: -speed * Math.cos(Math.PI / 4),
            dy: -speed * Math.sin(Math.PI / 4),
          };

          return [...oldBalls, newBall1, newBall2];
        });
        break;
    }
  };

  const resetGame = () => {
    createBricks();
    setBalls([{
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT / 2,
      dx: 3,
      dy: -3,
    }]);
    ballsRef.current = balls;

    setPaddleWidth(BASE_PADDLE_WIDTH);
    setPaddleX(GAME_WIDTH / 2 - BASE_PADDLE_WIDTH / 2);
    paddleXRef.current = paddleX;
  };

  const handleTouch = (e: GestureResponderEvent) => {
    const touchX = e.nativeEvent.locationX;
    const newX = Math.max(0, Math.min(touchX - paddleWidthRef.current / 2, GAME_WIDTH - paddleWidthRef.current));
    setPaddleX(newX);
  };

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderMove={handleTouch}
    >
      <Text style={styles.title}>Brick Breaker</Text>

      {/* Render bricks */}
      {bricks.map((row, rIdx) =>
        row.map((brick, cIdx) =>
          brick ? (
            <View
              key={`${rIdx}-${cIdx}`}
              style={[
                styles.brick,
                {
                  top: PADDLE_Y_OFFSET + rIdx * (BRICK_HEIGHT + BRICK_MARGIN),
                  left: BRICK_MARGIN + cIdx * (BRICK_WIDTH + BRICK_MARGIN),
                  backgroundColor: `hsl(${(rIdx * 60) % 360}, 70%, 50%)`,
                },
              ]}
            />
          ) : null
        )
      )}

      {/* Render balls */}
      {balls.map((ball, idx) => (
        <View
          key={idx}
          style={[styles.ball, { top: ball.y, left: ball.x }]}
        />
      ))}

      {/* Render paddle */}
      <View style={[styles.paddle, { left: paddleX, width: paddleWidth }]} />

      {/* Render power-ups */}
      {powerUps.map((pu, idx) => (
        <View
          key={idx}
          style={[styles.powerUp, { left: pu.x - BALL_SIZE / 2, top: pu.y, backgroundColor: getPowerUpColor(pu.type) }]}
        />
      ))}
    </View>
  );
}

function getPowerUpColor(type: PowerUpType) {
  switch (type) {
    case 'expand':
      return 'green';
    case 'shrink':
      return 'red';
    case 'multi':
      return 'purple';
    default:
      return 'gray';
  }
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
  title: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'white',
    fontSize: 16,
    zIndex: 1,
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
});
