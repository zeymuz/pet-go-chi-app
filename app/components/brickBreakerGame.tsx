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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_WIDTH = SCREEN_WIDTH * 0.95;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.75;

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

interface BrickBreakerProps {
  onClose: (score: number) => void;
}

export default function BrickBreaker({ onClose }: BrickBreakerProps) {
  // Ball data now stored as an array to support multi-ball
  const ballsRef = useRef([{
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT * 0.7,
    dx: 4,
    dy: -4
  }]);
  const [balls, setBalls] = useState(ballsRef.current);
  
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameRunning, setGameRunning] = useState(false);
  const [showLevelText, setShowLevelText] = useState(true);
  const [currentPaddleWidth, setCurrentPaddleWidth] = useState(PADDLE_WIDTH);
  const [powerUps, setPowerUps] = useState<{ x: number; y: number; type: PowerUpType }[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<{ type: PowerUpType; timer: NodeJS.Timeout }[]>([]);
  const levelAnim = useRef(new Animated.Value(1)).current;
  
  // Use ref for bricks to avoid undefined errors
  const bricksRef = useRef<boolean[][]>([]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpTimersRef = useRef<NodeJS.Timeout[]>([]);
  const baseBallSpeed = useRef(4); // Track base speed for power-up calculations

  // Initialize bricks on level change
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
    bricksRef.current = newBricks; // Update the ref
  };

  const resetGame = () => {
    // Clear power-up timers
    powerUpTimersRef.current.forEach(timer => clearTimeout(timer));
    powerUpTimersRef.current = [];
    setActivePowerUps([]);
    
    // Reset ball(s) to initial state
    ballsRef.current = [{
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.7,
      dx: baseBallSpeed.current,
      dy: -baseBallSpeed.current
    }];
    setBalls(ballsRef.current);
    
    // Reset paddle
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    setCurrentPaddleWidth(PADDLE_WIDTH);
    
    // Reset bricks
    resetBricks();
    
    // Clear power-ups
    setPowerUps([]);
    
    setGameRunning(true);

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(gameLoop, 16);
  };

  // Improved collision detection for paddle using continuous collision detection.
  // Modified so the ball is always adjusted on collision.
  const checkPaddleCollision = (ball: any, prevBall: any) => {
  const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 50;
  const paddleLeft = paddleX;
  const paddleRight = paddleX + currentPaddleWidth;

  // Check if ball moved from above paddle to below paddle in this frame
  if (
    prevBall.y + BALL_SIZE <= paddleTop &&
    ball.y + BALL_SIZE >= paddleTop &&
    ball.x + BALL_SIZE >= paddleLeft &&
    ball.x <= paddleRight &&
    ball.dy > 0
  ) {
    // Place ball just above paddle
    ball.y = paddleTop - BALL_SIZE;

    // Bounce upward
    ball.dy = -Math.abs(ball.dy);

    // Adjust horizontal direction based on hit point on paddle
    const hitPos = (ball.x + BALL_SIZE / 2 - paddleLeft) / currentPaddleWidth;
    const maxBounceAngle = Math.PI / 3; // 60 degrees
    const angle = (hitPos - 0.5) * 2 * maxBounceAngle;

    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
  }

  return ball;
};

const gameLoop = () => {
  let bricksChanged = false;
  const newBricks = bricksRef.current.map(row => [...row]);

  const MAX_SPEED = 7;
  const SUB_STEPS = 8;

  const newBalls = ballsRef.current.map(ball => {
    let { x, y, dx, dy, prevX, prevY } = ball;

    prevX = prevX !== undefined ? prevX : x;
    prevY = prevY !== undefined ? prevY : y;

    dx = Math.max(-MAX_SPEED, Math.min(dx, MAX_SPEED));
    dy = Math.max(-MAX_SPEED, Math.min(dy, MAX_SPEED));

    let newX = x;
    let newY = y;
    let newDx = dx;
    let newDy = dy;

    for (let step = 0; step < SUB_STEPS; step++) {
      const stepDx = newDx / SUB_STEPS;
      const stepDy = newDy / SUB_STEPS;

      const nextX = newX + stepDx;
      const nextY = newY + stepDy;

      // Wall collisions
      if (nextX <= 0) {
        newDx = Math.abs(newDx);
        newX = 0;
      } else if (nextX + BALL_SIZE >= GAME_WIDTH) {
        newDx = -Math.abs(newDx);
        newX = GAME_WIDTH - BALL_SIZE;
      } else {
        newX = nextX;
      }

      if (nextY <= 0) {
        newDy = Math.abs(newDy);
        newY = 0;
      } else {
        newY = nextY;
      }

      // Continuous paddle collision detection:
      // Check if ball path crossed paddle zone vertically
      const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 50;
      const paddleBottom = paddleTop + PADDLE_HEIGHT;
      const paddleLeft = paddleX;
      const paddleRight = paddleX + currentPaddleWidth;

      // Ball box previous frame
      const ballPrevLeft = newX - stepDx;
      const ballPrevRight = ballPrevLeft + BALL_SIZE;
      const ballPrevBottom = newY - stepDy + BALL_SIZE;
      const ballPrevTop = ballPrevBottom - BALL_SIZE;

      // Ball box current frame
      const ballCurrLeft = newX;
      const ballCurrRight = newX + BALL_SIZE;
      const ballCurrBottom = newY + BALL_SIZE;
      const ballCurrTop = newY;

      // Check if the vertical path crossed paddle zone
      const crossedPaddleVertically =
        (ballPrevBottom <= paddleTop && ballCurrBottom >= paddleTop) ||
        (ballPrevTop >= paddleBottom && ballCurrTop <= paddleBottom);

      // Check horizontal overlap at either previous or current x position
      const horizontalOverlap =
        (ballPrevRight >= paddleLeft && ballPrevLeft <= paddleRight) ||
        (ballCurrRight >= paddleLeft && ballCurrLeft <= paddleRight);

      if (crossedPaddleVertically && horizontalOverlap && newDy > 0) {
        // Ball hit the paddle somewhere between last and current frame

        // Place ball on top of paddle
        newY = paddleTop - BALL_SIZE;
        newDy = -Math.abs(newDy);

        // Calculate hit position for angle using current ball center
        const ballCenterX = newX + BALL_SIZE / 2;
        const hitPos = (ballCenterX - paddleLeft) / currentPaddleWidth;
        const maxBounceAngle = Math.PI / 3;
        const angle = (hitPos - 0.5) * 2 * maxBounceAngle;

        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        newDx = speed * Math.sin(angle);
        newDy = -Math.abs(speed * Math.cos(angle));
      }

      // Prevent ball from passing paddle edges horizontally near paddle
      if (
        newY + BALL_SIZE >= paddleTop &&
        newY + BALL_SIZE <= paddleBottom
      ) {
        if (newX + BALL_SIZE > paddleRight) {
          newX = paddleRight - BALL_SIZE;
          newDx = -Math.abs(newDx);
        } else if (newX < paddleLeft) {
          newX = paddleLeft;
          newDx = Math.abs(newDx);
        }
      }

      // Brick collisions (same as before)
      outerLoop:
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (!newBricks[r][c]) continue;

          const brickX = c * (BRICK_WIDTH + BRICK_MARGIN) + BRICK_MARGIN;
          const brickY = r * (BRICK_HEIGHT + BRICK_MARGIN) + BRICK_TOP_OFFSET;
          const brickRight = brickX + BRICK_WIDTH;
          const brickBottom = brickY + BRICK_HEIGHT;

          if (
            newX + BALL_SIZE >= brickX &&
            newX <= brickRight &&
            newY + BALL_SIZE >= brickY &&
            newY <= brickBottom
          ) {
            newBricks[r][c] = false;
            bricksChanged = true;
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

            const ballCenterX = newX + BALL_SIZE / 2;
            const ballCenterY = newY + BALL_SIZE / 2;
            const brickCenterX = brickX + BRICK_WIDTH / 2;
            const brickCenterY = brickY + BRICK_HEIGHT / 2;

            const dxCenter = ballCenterX - brickCenterX;
            const dyCenter = ballCenterY - brickCenterY;
            const absDx = Math.abs(dxCenter);
            const absDy = Math.abs(dyCenter);

            if (absDx > absDy) {
              newDx = -newDx;
            } else {
              newDy = -newDy;
            }
            break outerLoop;
          }
        }
      }
    }

    return { x: newX, y: newY, dx: newDx, dy: newDy, prevX: x, prevY: y };
  });

  ballsRef.current = newBalls;
  setBalls([...newBalls]);

  if (bricksChanged) {
    bricksRef.current = newBricks;
    setBricks(newBricks);
    checkWin(newBricks);
  }

  const activeBalls = newBalls.filter(ball => ball.y + BALL_SIZE < GAME_HEIGHT);
  if (activeBalls.length === 0) {
    gameOver();
    return;
  }
  ballsRef.current = activeBalls;
  setBalls([...activeBalls]);

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
        // Increase speed of all balls
        ballsRef.current = ballsRef.current.map(ball => ({
          ...ball,
          dx: ball.dx * 1.3,
          dy: ball.dy * 1.3
        }));
        setBalls([...ballsRef.current]);
        
        timer = setTimeout(() => {
          ballsRef.current = ballsRef.current.map(ball => ({
            ...ball,
            dx: ball.dx / 1.3,
            dy: ball.dy / 1.3
          }));
          setBalls([...ballsRef.current]);
        }, 7000);
        break;
      case 'slow':
        // Decrease speed of all balls
        ballsRef.current = ballsRef.current.map(ball => ({
          ...ball,
          dx: ball.dx * 0.7,
          dy: ball.dy * 0.7
        }));
        setBalls([...ballsRef.current]);
        
        timer = setTimeout(() => {
          ballsRef.current = ballsRef.current.map(ball => ({
            ...ball,
            dx: ball.dx / 0.7,
            dy: ball.dy / 0.7
          }));
          setBalls([...ballsRef.current]);
        }, 7000);
        break;
      case 'multi':
        // Add two new balls with different trajectories
        const newBalls = [...ballsRef.current];
        
        // Create new balls with slightly different angles
        newBalls.push({
          x: ballsRef.current[0].x,
          y: ballsRef.current[0].y,
          dx: ballsRef.current[0].dx * 0.8,
          dy: -Math.abs(ballsRef.current[0].dy) // Ensure upward direction
        });
        
        newBalls.push({
          x: ballsRef.current[0].x,
          y: ballsRef.current[0].y,
          dx: -ballsRef.current[0].dx * 0.8,
          dy: -Math.abs(ballsRef.current[0].dy) // Ensure upward direction
        });
        
        ballsRef.current = newBalls;
        setBalls([...newBalls]);
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
        { 
          text: 'Next Level', 
          onPress: () => {
            setLevel(l => l + 1);
            showLevelAnimation();
          }
        },
        { text: 'Quit', onPress: () => onClose(coins) },
      ]);
    }
  };

  const gameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    Alert.alert('Game Over', `You earned ${coins} coins`, [
      { text: 'Retry', onPress: () => {
          resetGame();
          setCoins(0);
          setLevel(1);
        } 
      },
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

      {/* Safely render bricks */}
      {bricks && bricks.map((row, r) =>
        row && row.map(
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

      {/* Safely render balls */}
      {balls && balls.map((ball, index) => (
        <View
          key={index}
          style={[
            styles.ball,
            {
              left: ball.x,
              top: ball.y,
              backgroundColor: index === 0 ? 'blue' : 
                index === 1 ? 'red' : 'green',
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.paddle,
          {
            left: paddleX,
            width: currentPaddleWidth,
          },
        ]}
      />

      {/* Safely render power-ups */}
      {powerUps && powerUps.map((pu, index) => (
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
