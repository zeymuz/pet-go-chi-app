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

const { width, height } = Dimensions.get('window');

interface BrickBreakerProps {
  onClose: (score: number) => void;
}

const PADDLE_WIDTH = width * 0.2;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 12;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_MARGIN = 1;
const totalMargin = BRICK_MARGIN * (BRICK_COLS + 1);
const availableWidth = width - totalMargin;
const BRICK_WIDTH = Math.floor(availableWidth / BRICK_COLS);
const BRICK_HEIGHT = 12; // Reduced height
const BRICK_TOP_OFFSET = height * 0.1;
const POWERUP_SIZE = 20;
const POWERUP_SPEED = 3;

type PowerUpType = 'expand' | 'shrink' | 'speed' | 'slow' | 'multi';

export default function BrickBreaker({ onClose }: BrickBreakerProps) {
  const [ballX, setBallX] = useState(width / 2);
  const [ballY, setBallY] = useState(height * 0.7);
  const [paddleX, setPaddleX] = useState(width / 2 - PADDLE_WIDTH / 2);
  const [ballDX, setBallDX] = useState(4);
  const [ballDY, setBallDY] = useState(-4);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameRunning, setGameRunning] = useState(false);
  const [showLevelText, setShowLevelText] = useState(true);
  const [currentPaddleWidth, setCurrentPaddleWidth] = useState(PADDLE_WIDTH);
  const [powerUps, setPowerUps] = useState<{x: number, y: number, type: PowerUpType}[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<{type: PowerUpType, timer: NodeJS.Timeout}[]>([]);
  const levelAnim = useRef(new Animated.Value(1)).current;

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize bricks
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
    setBallX(width / 2);
    setBallY(height * 0.7);
    setPaddleX(width / 2 - currentPaddleWidth / 2);
    setBallDX(4);
    setBallDY(-4);
    setPowerUps([]);
    setCurrentPaddleWidth(PADDLE_WIDTH);
    setGameRunning(true);

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(gameLoop, 16);
  };

  const gameLoop = () => {
    // Ball movement
    let newBallX = ballX + ballDX;
    let newBallY = ballY + ballDY;
    
    // Wall collisions
    if (newBallX <= 0 || newBallX + BALL_SIZE >= width) {
      setBallDX(-ballDX);
      newBallX = ballX + ballDX;
    }
    
    if (newBallY <= 0) {
      setBallDY(-ballDY);
      newBallY = ballY + ballDY;
    }
    
    // Paddle collision
    if (
      newBallY + BALL_SIZE >= height - PADDLE_HEIGHT - 50 &&
      newBallX + BALL_SIZE >= paddleX &&
      newBallX <= paddleX + currentPaddleWidth
    ) {
      // Calculate bounce angle based on where ball hits paddle
      const hitPosition = (newBallX + BALL_SIZE/2 - paddleX) / currentPaddleWidth;
      const angle = hitPosition * Math.PI - Math.PI/2;
      const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
      
      setBallDX(Math.cos(angle) * speed);
      setBallDY(-Math.abs(Math.sin(angle) * speed));
      newBallY = ballY + ballDY;
    }
    
    // Bottom collision (game over)
    if (newBallY + BALL_SIZE >= height) {
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
            
            // Create power-up with 20% chance
            if (Math.random() < 0.2) {
              const types: PowerUpType[] = ['expand', 'shrink', 'speed', 'slow', 'multi'];
              const type = types[Math.floor(Math.random() * types.length)];
              setPowerUps(powerUps => [...powerUps, {
                x: brickX + BRICK_WIDTH/2,
                y: brickY,
                type
              }]);
            }
            
            // Calculate bounce direction
            const ballCenterX = newBallX + BALL_SIZE/2;
            const ballCenterY = newBallY + BALL_SIZE/2;
            const brickCenterX = brickX + BRICK_WIDTH/2;
            const brickCenterY = brickY + BRICK_HEIGHT/2;
            
            const dx = ballCenterX - brickCenterX;
            const dy = ballCenterY - brickCenterY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
              setBallDX(-ballDX);
            } else {
              setBallDY(-ballDY);
            }
          }
        }
      }
      
      if (brickHit) {
        checkWin(newBricks);
      }
      
      return newBricks;
    });
    
    // Power-up movement and collection
    setPowerUps(prev => {
      return prev
        .map(pu => ({ ...pu, y: pu.y + POWERUP_SPEED }))
        .filter(pu => {
          // Check if collected by paddle
          if (
            pu.y + POWERUP_SIZE >= height - PADDLE_HEIGHT - 50 &&
            pu.x + POWERUP_SIZE >= paddleX &&
            pu.x <= paddleX + currentPaddleWidth
          ) {
            applyPowerUp(pu.type);
            return false;
          }
          
          // Remove if off screen
          return pu.y < height;
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
        // Create two additional balls
        setPowerUps(prev => [
          ...prev, 
          { x: ballX, y: ballY, type: 'multi' },
          { x: ballX, y: ballY, type: 'multi' }
        ]);
        break;
    }
    
    if (timer) {
      powerUpTimersRef.current.push(timer);
      setActivePowerUps(prev => [...prev, { type, timer }]);
    }
  };

  const checkWin = (bricks: boolean[][]) => {
    const allCleared = bricks.flat().every(b => !b);
    if (allCleared) {
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
    setPaddleX(Math.max(0, Math.min(touchX - currentPaddleWidth / 2, width - currentPaddleWidth)));
  };

  // Get color for power-up
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

  // Get icon for power-up
  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'expand': return 'resize';
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
      
      {/* Active power-ups indicator */}
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

      {/* Bricks - now smaller */}
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
                  }
                ]}
              />
            )
        )
      )}

      {/* Ball - now visible with blue color */}
      <View
        style={[
          styles.ball,
          {
            left: ballX,
            top: ballY,
            backgroundColor: 'blue', // Changed to blue for visibility
          }
        ]}
      />

      {/* Paddle */}
      <View
        style={[
          styles.paddle,
          {
            left: paddleX,
            width: currentPaddleWidth,
          }
        ]}
      />

      {/* Falling power-ups */}
      {powerUps.map((pu, index) => (
        <View
          key={index}
          style={[
            styles.powerUp,
            {
              left: pu.x - POWERUP_SIZE/2,
              top: pu.y,
              backgroundColor: getPowerUpColor(pu.type),
            }
          ]}
        >
          <Ionicons 
            name={getPowerUpIcon(pu.type) as any} 
            size={POWERUP_SIZE * 0.8} 
            color="white" 
          />
        </View>
      ))}

      {/* Level overlay */}
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
    fontSize: width > 400 ? 20 : 16,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 40,
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: width > 400 ? 14 : 12,
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
    zIndex: 10, // Ensure ball is above bricks
  },
  paddle: {
    position: 'absolute',
    bottom: 50,
    height: PADDLE_HEIGHT,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    zIndex: 10, // Ensure paddle is above everything
  },
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15, // Highest zIndex
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