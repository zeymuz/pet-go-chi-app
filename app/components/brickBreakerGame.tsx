import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_WIDTH = SCREEN_WIDTH * 0.95;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.7;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 15;
const POWERUP_SIZE = 20;
const PADDLE_Y_OFFSET = 20;
const SHIELD_HEIGHT = 10;
const BRICK_MARGIN = 1;
const BRICK_HEIGHT = 14; // Smaller bricks

// Enhanced level configurations with significantly increased difficulty
const LEVELS = [
  { 
    rows: 6, cols: 9, speed: 4.5, powerUpChance: 0.25,
    unbreakableRatio: 0.1, moveDownInterval: null, obstacles: 1,
    brickHealth: 1, ballSpeedMultiplier: 1.0
  },
  { 
    rows: 7, cols: 10, speed: 5.0, powerUpChance: 0.2,
    unbreakableRatio: 0.2, moveDownInterval: 35000, obstacles: 3,
    brickHealth: 2, ballSpeedMultiplier: 1.1
  },
  { 
    rows: 8, cols: 11, speed: 5.5, powerUpChance: 0.15,
    unbreakableRatio: 0.3, moveDownInterval: 30000, obstacles: 5,
    brickHealth: 2, ballSpeedMultiplier: 1.2
  },
  { 
    rows: 9, cols: 12, speed: 6.0, powerUpChance: 0.1,
    unbreakableRatio: 0.4, moveDownInterval: 25000, obstacles: 7,
    brickHealth: 3, ballSpeedMultiplier: 1.3
  },
  { 
    rows: 10, cols: 13, speed: 6.5, powerUpChance: 0.05,
    unbreakableRatio: 0.5, moveDownInterval: 20000, obstacles: 9,
    brickHealth: 3, ballSpeedMultiplier: 1.5
  },
  { 
    rows: 11, cols: 14, speed: 7.0, powerUpChance: 0.03,
    unbreakableRatio: 0.6, moveDownInterval: 15000, obstacles: 11,
    brickHealth: 4, ballSpeedMultiplier: 1.7
  },
];

type PowerUpType = 
  | 'expand'
  | 'shrink'
  | 'fastBall'
  | 'slowBall'
  | 'multiBall'
  | 'shield'
  | 'sticky'
  | 'metalBall';

type Brick = {
  x: number;
  y: number;
  alive: boolean;
  unbreakable: boolean;
  metal: boolean;
  health: number;
  originalHealth: number;
};

type PowerUp = {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
};

type Ball = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  stuckToPaddle: boolean;
  metal: boolean;
};

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  moving: boolean;
  speed: number;
};

export default function BrickBreakerGame({ onExit }: { onExit?: () => void }) {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - 100 / 2);
  const [paddleWidth, setPaddleWidth] = useState(100);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [stickyActive, setStickyActive] = useState(false);
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState(1);
  const [coins, setCoins] = useState(0);
  const [brickWidth, setBrickWidth] = useState(0);
  const [bricksMovingDown, setBricksMovingDown] = useState(false);
  const [shieldUsed, setShieldUsed] = useState(false);

  const animationFrameId = useRef<number | null>(null);
  const powerUpTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const moveDownTimeout = useRef<NodeJS.Timeout | null>(null);
  const powerUpId = useRef(0);
  const shieldActiveRef = useRef(shieldActive);
  const levelConfig = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];

  // Initialize game
  useEffect(() => {
    resetBricks();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      Object.values(powerUpTimeouts.current).forEach(clearTimeout);
      if (moveDownTimeout.current) clearTimeout(moveDownTimeout.current);
    };
  }, [currentLevel]);

  // Update ref for shield active state
  useEffect(() => {
    shieldActiveRef.current = shieldActive;
  }, [shieldActive]);

  // Game loop
  useEffect(() => {
    function gameStep() {
      if (gameOver) return;
      
      setBalls((prevBalls) => {
        let newBalls = [...prevBalls];
        let shieldUsedThisFrame = false;

        // Move balls
        newBalls = newBalls.map((ball) => {
          if (ball.stuckToPaddle) {
            return {
              ...ball,
              x: paddleX + paddleWidth / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_SIZE,
            };
          }

          let newX = ball.x + ball.dx * ballSpeedMultiplier * levelConfig.ballSpeedMultiplier;
          let newY = ball.y + ball.dy * ballSpeedMultiplier * levelConfig.ballSpeedMultiplier;

          // Wall collisions
          if (newX <= 0) {
            newX = 0;
            ball.dx = -ball.dx;
          } else if (newX + BALL_SIZE >= GAME_WIDTH) {
            newX = GAME_WIDTH - BALL_SIZE;
            ball.dx = -ball.dx;
          }

          // Ceiling
          if (newY <= 0) {
            newY = 0;
            ball.dy = -ball.dy;
          }

          // Paddle collision
          const paddleTop = GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
          const paddleBottom = GAME_HEIGHT - PADDLE_Y_OFFSET;
          const paddleLeft = paddleX;
          const paddleRight = paddleX + paddleWidth;

          if (
            newY + BALL_SIZE >= paddleTop && 
            newY <= paddleBottom &&
            newX + BALL_SIZE >= paddleLeft && 
            newX <= paddleRight
          ) {
            newY = paddleTop - BALL_SIZE;
            
            if (stickyActive) {
              ball.stuckToPaddle = true;
              ball.dx = 0;
              ball.dy = 0;
            } else {
              const hitPos = (newX + BALL_SIZE/2 - paddleLeft) / paddleWidth;
              const angle = (hitPos - 0.5) * Math.PI/2;
              const speed = Math.hypot(ball.dx, ball.dy) || levelConfig.speed;
              ball.dx = speed * Math.sin(angle);
              ball.dy = -Math.abs(speed * Math.cos(angle));
            }
          }

          // Obstacle collision
          let hitObstacle = false;
          for (const obstacle of obstacles) {
            if (
              newX + BALL_SIZE > obstacle.x &&
              newX < obstacle.x + obstacle.width &&
              newY + BALL_SIZE > obstacle.y &&
              newY < obstacle.y + obstacle.height
            ) {
              hitObstacle = true;
              
              // Determine which side was hit
              const ballRight = newX + BALL_SIZE;
              const ballBottom = newY + BALL_SIZE;
              const obstacleRight = obstacle.x + obstacle.width;
              const obstacleBottom = obstacle.y + obstacle.height;
              
              const dx = obstacle.x - ballRight;
              const dx2 = obstacleRight - newX;
              const dy = obstacle.y - ballBottom;
              const dy2 = obstacleBottom - newY;
              
              // Find the minimum overlap to determine side
              const minOverlap = Math.min(Math.abs(dx), Math.abs(dx2), Math.abs(dy), Math.abs(dy2));
              
              if (minOverlap === Math.abs(dx)) {
                // Left side
                newX = obstacle.x - BALL_SIZE;
                ball.dx = -Math.abs(ball.dx);
              } else if (minOverlap === Math.abs(dx2)) {
                // Right side
                newX = obstacleRight;
                ball.dx = Math.abs(ball.dx);
              } else if (minOverlap === Math.abs(dy)) {
                // Top side
                newY = obstacle.y - BALL_SIZE;
                ball.dy = -Math.abs(ball.dy);
              } else {
                // Bottom side
                newY = obstacleBottom;
                ball.dy = Math.abs(ball.dy);
              }
              break;
            }
          }

          // Brick collision
          if (!hitObstacle) {
            for (let i = 0; i < bricks.length; i++) {
              const brick = bricks[i];
              if (
                brick.alive &&
                newX + BALL_SIZE > brick.x &&
                newX < brick.x + brickWidth &&
                newY + BALL_SIZE > brick.y &&
                newY < brick.y + BRICK_HEIGHT
              ) {
                if (brick.unbreakable && !ball.metal) {
                  // Bounce off unbreakable brick
                  ball.dy = -ball.dy;
                  break;
                } else {
                  // Breakable brick - reduce health
                  const updatedBricks = [...bricks];
                  updatedBricks[i] = {
                    ...brick,
                    health: brick.health - 1,
                    alive: brick.health > 1
                  };
                  setBricks(updatedBricks);
                  
                  // Only bounce if not destroyed
                  if (updatedBricks[i].alive) {
                    if (!ball.metal) {
                      ball.dy = -ball.dy;
                    }
                  } else {
                    // Brick destroyed
                    if (Math.random() < levelConfig.powerUpChance) {
                      spawnPowerUp(brick.x + brickWidth / 2, brick.y + BRICK_HEIGHT / 2);
                    }
                    
                    if (Math.random() < 0.5) {
                      setCoins(c => c + 1);
                    }
                  }
                  break;
                }
              }
            }
          }

          // Shield bounce (one-time use)
          const shieldTop = GAME_HEIGHT - SHIELD_HEIGHT;
          if (newY + BALL_SIZE >= shieldTop && shieldActiveRef.current && !shieldUsedThisFrame) {
            ball.dy = -Math.abs(ball.dy);
            newY = shieldTop - BALL_SIZE;
            shieldUsedThisFrame = true;
            setShieldActive(false);
            setShieldUsed(true);
          }
          
          // Ball falls below
          if (newY > GAME_HEIGHT) {
            if (shieldActiveRef.current && !shieldUsedThisFrame) {
              ball.dy = -Math.abs(ball.dy);
              newY = GAME_HEIGHT - BALL_SIZE - 1;
              shieldUsedThisFrame = true;
              setShieldActive(false);
              setShieldUsed(true);
            } else {
              return null;
            }
          }

          return { ...ball, x: newX, y: newY };
        }).filter(ball => ball !== null) as Ball[];

        // Game over if no balls left
        if (newBalls.length === 0) {
          setGameOver(true);
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
          return [];
        }

        return newBalls;
      });

      // Move obstacles horizontally
      setObstacles(prev => 
        prev.map(obs => {
          if (!obs.moving) return obs;
          
          let newX = obs.x + obs.speed;
          if (newX <= 0 || newX + obs.width >= GAME_WIDTH) {
            return {...obs, speed: -obs.speed};
          }
          return {...obs, x: newX};
        })
      );

      // Move power-ups
      setPowerUps((prevPowerUps) => {
        let updated = prevPowerUps
          .map((pu) => ({ ...pu, y: pu.y + 3 }))
          .filter((pu) => pu.y < GAME_HEIGHT);

        // Collect power-ups
        updated.forEach((pu) => {
          const paddleTop = GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
          if (
            pu.y + POWERUP_SIZE >= paddleTop && 
            pu.x + POWERUP_SIZE / 2 >= paddleX &&
            pu.x - POWERUP_SIZE / 2 <= paddleX + paddleWidth
          ) {
            applyPowerUp(pu.type);
            pu.active = false;
          }
        });

        return updated.filter((pu) => pu.active !== false);
      });

      animationFrameId.current = requestAnimationFrame(gameStep);
    }

    if (!gameOver) {
      animationFrameId.current = requestAnimationFrame(gameStep);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    paddleX,
    paddleWidth,
    bricks,
    obstacles,
    shieldActive,
    stickyActive,
    ballSpeedMultiplier,
    gameOver,
    brickWidth,
    levelConfig
  ]);

  // Schedule bricks to move down for certain levels
  useEffect(() => {
    if (levelConfig.moveDownInterval && !bricksMovingDown) {
      setBricksMovingDown(true);
      
      moveDownTimeout.current = setTimeout(() => {
        moveBricksDown();
        setBricksMovingDown(false);
      }, levelConfig.moveDownInterval);
    }
    
    return () => {
      if (moveDownTimeout.current) {
        clearTimeout(moveDownTimeout.current);
      }
    };
  }, [levelConfig, bricksMovingDown]);

  // Move bricks down by one row
  const moveBricksDown = () => {
    setBricks(prev => {
      const newBricks = [...prev];
      let gameOver = false;
      
      for (let i = 0; i < newBricks.length; i++) {
        newBricks[i].y += BRICK_HEIGHT + BRICK_MARGIN;
        
        // Check if brick has reached the paddle level
        if (newBricks[i].y + BRICK_HEIGHT >= GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT) {
          gameOver = true;
        }
      }
      
      if (gameOver) {
        setGameOver(true);
      }
      
      return newBricks;
    });
    
    // Also move obstacles down
    setObstacles(prev => 
      prev.map(obs => ({
        ...obs,
        y: obs.y + BRICK_HEIGHT + BRICK_MARGIN
      }))
    );
  };

  // Reset bricks for current level
  function resetBricks() {
    const { rows, cols, unbreakableRatio, obstacles: numObstacles, brickHealth } = levelConfig;
    const newBrickWidth = (GAME_WIDTH - (cols + 1) * BRICK_MARGIN) / cols;
    setBrickWidth(newBrickWidth);
    
    // Generate bricks
    const tempBricks: Brick[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const unbreakable = Math.random() < unbreakableRatio;
        tempBricks.push({
          x: BRICK_MARGIN + col * (newBrickWidth + BRICK_MARGIN),
          y: row * (BRICK_HEIGHT + BRICK_MARGIN) + 20,
          alive: true,
          unbreakable,
          metal: false,
          health: unbreakable ? 999 : brickHealth,
          originalHealth: brickHealth
        });
      }
    }
    setBricks(tempBricks);
    
    // Generate obstacles
    const tempObstacles: Obstacle[] = [];
    for (let i = 0; i < numObstacles; i++) {
      tempObstacles.push({
        x: Math.random() * (GAME_WIDTH - 60),
        y: Math.random() * (GAME_HEIGHT / 2),
        width: 40 + Math.random() * 40,
        height: 10,
        moving: i % 2 === 0, // Every other obstacle moves
        speed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1)
      });
    }
    setObstacles(tempObstacles);
    
    // Reset balls
    setBalls([
      {
        x: GAME_WIDTH / 2 - BALL_SIZE / 2,
        y: GAME_HEIGHT / 2,
        dx: levelConfig.speed,
        dy: -levelConfig.speed,
        stuckToPaddle: false,
        metal: false,
      },
    ]);
    
    // Reset paddle
    setPaddleX(GAME_WIDTH / 2 - 100 / 2);
    setPaddleWidth(100);
    
    // Clear power-ups
    setPowerUps([]);
    setShieldActive(false);
    setShieldUsed(false);
    setStickyActive(false);
    setBallSpeedMultiplier(1);
    
    // Clear timeouts
    Object.values(powerUpTimeouts.current).forEach(clearTimeout);
    powerUpTimeouts.current = {};
    
    if (moveDownTimeout.current) {
      clearTimeout(moveDownTimeout.current);
      moveDownTimeout.current = null;
    }
    setBricksMovingDown(false);
  }

  // Check level completion
  useEffect(() => {
    if (bricks.length > 0 && bricks.every(brick => !brick.alive || brick.unbreakable)) {
      if (currentLevel < LEVELS.length - 1) {
        // Go to next level
        setCurrentLevel(prev => prev + 1);
      } else {
        // Game won!
        setGameWon(true);
        setGameOver(true);
      }
    }
  }, [bricks]);

  // Paddle drag
  function onMove(evt: GestureResponderEvent) {
    let x = evt.nativeEvent.locationX - paddleWidth / 2;
    if (x < 0) x = 0;
    if (x + paddleWidth > GAME_WIDTH) x = GAME_WIDTH - paddleWidth;
    setPaddleX(x);

    // Move sticky balls with paddle
    if (stickyActive) {
      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.stuckToPaddle) {
            return {
              ...ball,
              x: x + paddleWidth / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_SIZE,
            };
          }
          return ball;
        })
      );
    }
  }

  // Spawn power-up
  function spawnPowerUp(x: number, y: number) {
    const types: PowerUpType[] = [
      'expand',
      'shrink',
      'fastBall',
      'slowBall',
      'multiBall',
      'shield',
      'sticky',
      'metalBall',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    setPowerUps((prev) => [...prev, { 
      id: powerUpId.current++, 
      x, 
      y, 
      type, 
      active: true 
    }]);
  }

  // Apply power-up effects
  function applyPowerUp(type: PowerUpType) {
    clearTimeout(powerUpTimeouts.current[type]);
    
    switch (type) {
      case 'expand':
        setPaddleWidth((w) => Math.min(w + 40, GAME_WIDTH));
        powerUpTimeouts.current[type] = setTimeout(() => 
          setPaddleWidth(100), 10000
        );
        break;
      case 'shrink':
        setPaddleWidth((w) => Math.max(w - 40, 40));
        powerUpTimeouts.current[type] = setTimeout(() => 
          setPaddleWidth(100), 10000
        );
        break;
      case 'fastBall':
        setBallSpeedMultiplier(2);
        powerUpTimeouts.current[type] = setTimeout(() => 
          setBallSpeedMultiplier(1), 7000
        );
        break;
      case 'slowBall':
        setBallSpeedMultiplier(0.5);
        powerUpTimeouts.current[type] = setTimeout(() => 
          setBallSpeedMultiplier(1), 7000
        );
        break;
      case 'multiBall':
        setBalls((prev) => {
          const paddleCenter = paddleX + paddleWidth / 2;
          const ballY = GAME_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_SIZE;
          
          return [
            ...prev, 
            { 
              x: paddleCenter - BALL_SIZE/2, 
              y: ballY, 
              dx: 3, 
              dy: -3, 
              stuckToPaddle: false,
              metal: false 
            },
            { 
              x: paddleCenter - BALL_SIZE/2, 
              y: ballY, 
              dx: -3, 
              dy: -3, 
              stuckToPaddle: false,
              metal: false 
            }
          ];
        });
        break;
      case 'shield':
        setShieldActive(true);
        setShieldUsed(false);
        break;
      case 'sticky':
        setStickyActive(true);
        setBalls((prev) =>
          prev.map((ball) => ({
            ...ball,
            stuckToPaddle: true,
            dx: 0,
            dy: 0,
          }))
        );
        break;
      case 'metalBall':
        setBalls((prev) =>
          prev.map((ball) => ({
            ...ball,
            metal: true,
          }))
        );
        powerUpTimeouts.current[type] = setTimeout(() => {
          setBalls((prev) =>
            prev.map((ball) => ({
              ...ball,
              metal: false,
            }))
          );
        }, 7000);
        break;
    }
  }

  // Release sticky balls
  function releaseSticky() {
    if (stickyActive) {
      setStickyActive(false);
      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.stuckToPaddle) {
            return {
              ...ball,
              stuckToPaddle: false,
              dx: levelConfig.speed * (Math.random() > 0.5 ? 1 : -1),
              dy: -levelConfig.speed,
            };
          }
          return ball;
        })
      );
    }
  }

  // Restart game
  function restart() {
    setGameOver(false);
    setGameWon(false);
    setCurrentLevel(0);
    setCoins(0);
    resetBricks();
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(() => {
      if (!gameOver) {
        animationFrameId.current = requestAnimationFrame(restart as FrameRequestCallback);
      }
    });
  }

  const powerUpColors: Record<PowerUpType, string> = {
    expand: '#0f0', 
    shrink: '#f00',
    multiBall: '#f0f', 
    slowBall: '#0ff', 
    fastBall: '#fa0',
    sticky: '#fff', 
    shield: '#ff0',
    metalBall: '#aaa'
  };

  const powerUpSymbols: Record<PowerUpType, string> = {
    expand: '⬛', 
    shrink: '⬜',
    multiBall: '🎱', 
    slowBall: '🐢', 
    fastBall: '⚡',
    sticky: '🤚', 
    shield: '🛡️',
    metalBall: '⚙️'
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.exitButton} onPress={onExit}>
        <Text style={styles.exitText}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.coins}>Coins: {coins}</Text>
        <Text style={styles.level}>Level: {currentLevel + 1}/{LEVELS.length}</Text>
      </View>
      
      <View
        style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
        onStartShouldSetResponder={() => true}
        onResponderMove={onMove}
        onResponderRelease={releaseSticky}
      >
        {/* Shield area */}
        {shieldActive && (
          <View style={[styles.shield, { 
            bottom: 0, 
            width: GAME_WIDTH,
            height: SHIELD_HEIGHT
          }]} />
        )}
        
        {/* Paddle */}
        <View
          style={[
            styles.paddle,
            { 
              width: paddleWidth, 
              left: paddleX, 
              bottom: PADDLE_Y_OFFSET 
            },
            shieldActive && { backgroundColor: 'lightblue' }
          ]}
        />

        {/* Balls */}
        {balls.map((ball, i) => (
          <View
            key={i}
            style={[
              styles.ball,
              {
                left: ball.x,
                top: ball.y,
                backgroundColor: ball.metal ? 'silver' : 'yellow',
                borderWidth: ball.metal ? 2 : 0,
                borderColor: ball.metal ? 'white' : undefined,
              },
            ]}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map((obs, i) => (
          <View
            key={i}
            style={[
              styles.obstacle,
              {
                left: obs.x,
                top: obs.y,
                width: obs.width,
                height: obs.height,
              }
            ]}
          />
        ))}

        {/* Bricks */}
        {bricks.map(
          (brick, i) =>
            brick.alive && (
              <View
                key={i}
                style={[
                  styles.brick,
                  {
                    left: brick.x,
                    top: brick.y,
                    width: brickWidth,
                    height: BRICK_HEIGHT,
                    backgroundColor: brick.unbreakable ? '#888' : 
                      brick.health === 1 ? `hsl(${Math.floor(i / levelConfig.cols) * 60},70%,50%)` :
                      brick.health === 2 ? `hsl(${Math.floor(i / levelConfig.cols) * 60},70%,40%)` :
                      `hsl(${Math.floor(i / levelConfig.cols) * 60},70%,30%)`,
                    borderColor: brick.unbreakable ? '#555' : '#000',
                    borderWidth: 1
                  },
                ]}
              />
            )
        )}

        {/* Power-ups */}
        {powerUps.map((pu) => (
          <View
            key={pu.id}
            style={[
              styles.powerUp,
              {
                left: pu.x - POWERUP_SIZE / 2,
                top: pu.y,
                backgroundColor: powerUpColors[pu.type],
              },
            ]}
          >
            <Text style={styles.powerUpText}>
              {powerUpSymbols[pu.type]}
            </Text>
          </View>
        ))}
      </View>

      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>
            {gameWon ? "You Win!" : "Game Over"}
          </Text>
          <Text style={styles.coinsText}>Coins: {coins}</Text>
          <Text style={styles.levelText}>Level: {currentLevel + 1}/{LEVELS.length}</Text>
          
          <TouchableOpacity onPress={restart} style={styles.button}>
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExit} style={[styles.button, styles.exitBtn]}>
            <Text style={styles.buttonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Drag paddle to move. Tap screen to release sticky ball.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: GAME_WIDTH,
    marginBottom: 10,
  },
  coins: {
    color: '#ff0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  level: {
    color: '#0ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameArea: {
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 5,
    overflow: 'hidden',
  },
  paddle: {
    position: 'absolute',
    height: PADDLE_HEIGHT,
    backgroundColor: 'hotpink',
    borderRadius: 8,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
  },
  brick: {
    position: 'absolute',
    borderRadius: 2,
  },
  obstacle: {
    position: 'absolute',
    backgroundColor: '#555',
    borderRadius: 3,
  },
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 3,
    backgroundColor: '#000a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: GAME_WIDTH,
  },
  gameOverText: {
    fontSize: 30,
    color: 'white',
    marginBottom: 10,
  },
  coinsText: {
    fontSize: 20,
    color: '#ff0',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 18,
    color: '#0ff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'tomato',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  exitBtn: {
    backgroundColor: '#900',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructions: {
    marginTop: 20,
    width: GAME_WIDTH,
  },
  instructionsText: {
    color: 'white', 
    textAlign: 'center', 
    fontSize: 12
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
  },
  exitText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
  },
  shield: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 200, 255, 0.5)',
    zIndex: 2,
  },
});