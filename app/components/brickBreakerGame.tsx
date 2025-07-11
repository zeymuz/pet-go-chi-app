import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_WIDTH = SCREEN_WIDTH * 0.95;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.7;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 15;
const BRICK_ROWS = 5;
const BRICK_COLS = 7;
const BRICK_MARGIN = 1;
const BRICK_WIDTH = (GAME_WIDTH - (BRICK_COLS + 1) * BRICK_MARGIN) / BRICK_COLS;
const BRICK_HEIGHT = 20;
const POWERUP_SIZE = 20;
const PADDLE_Y_OFFSET = 50;

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

export default function BrickBreakerGame({ onExit }: { onExit?: () => void }) {
  // Paddle position
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - 100 / 2);
  const [paddleWidth, setPaddleWidth] = useState(100);

  // Balls state
  const [balls, setBalls] = useState<Ball[]>([
    {
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT / 2,
      dx: 4,
      dy: -4,
      stuckToPaddle: false,
      metal: false,
    },
  ]);

  // Bricks state
  const [bricks, setBricks] = useState<Brick[]>([]);

  // Power-ups falling
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Game states
  const [gameOver, setGameOver] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [stickyActive, setStickyActive] = useState(false);
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState(1);
  const [coins, setCoins] = useState(0);

  const animationFrameId = useRef<number | null>(null);
  const powerUpTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const powerUpId = useRef(0);

  // Init bricks on mount or restart
  useEffect(() => {
    resetBricks();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      Object.values(powerUpTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Game loop
  useEffect(() => {
    function gameStep() {
      setBalls((prevBalls) => {
        let newBalls = [...prevBalls];

        // Move balls
        newBalls = newBalls.map((ball) => {
          if (ball.stuckToPaddle) {
            // Keep ball on paddle center
            return {
              ...ball,
              x: paddleX + paddleWidth / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_SIZE,
            };
          }

          let newX = ball.x + ball.dx * ballSpeedMultiplier;
          let newY = ball.y + ball.dy * ballSpeedMultiplier;

          // Wall collisions left/right
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

          // Paddle collision with improved hit detection
          const pt = GAME_HEIGHT - PADDLE_Y_OFFSET;
          const pl = paddleX;
          const pr = pl + paddleWidth;

          if (
            newY + BALL_SIZE >= pt && 
            newX + BALL_SIZE >= pl && 
            newX <= pr
          ) {
            newY = pt - BALL_SIZE;
            
            if (stickyActive) {
              ball.stuckToPaddle = true;
              ball.dx = 0;
              ball.dy = 0;
            } else {
              // Calculate bounce angle based on hit position
              const hitPos = (newX + BALL_SIZE/2 - pl) / paddleWidth;
              const angle = (hitPos - 0.5) * Math.PI/2;
              const speed = Math.hypot(ball.dx, ball.dy) || 4;
              ball.dx = speed * Math.sin(angle);
              ball.dy = -Math.abs(speed * Math.cos(angle));
            }
          }

          // Brick collision
          let hitBrick = false;
          for (let i = 0; i < bricks.length; i++) {
            const brick = bricks[i];
            if (
              brick.alive &&
              newX + BALL_SIZE > brick.x &&
              newX < brick.x + BRICK_WIDTH &&
              newY + BALL_SIZE > brick.y &&
              newY < brick.y + BRICK_HEIGHT
            ) {
              hitBrick = true;

              // If metal ball, it goes through but breaks brick, no bounce
              if (!ball.metal) {
                ball.dy = -ball.dy;
              }

              // Remove brick
              removeBrick(i);

              // Spawn power-up sometimes
              if (Math.random() < 0.3) {
                spawnPowerUp(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2);
              }
              
              // Add coins sometimes
              if (Math.random() < 0.5) {
                setCoins(c => c + 1);
              }
              
              break;
            }
          }

          // Ball falls below paddle - lose ball or game over
          if (newY > GAME_HEIGHT) {
            if (shieldActive) {
              // Use shield to save ball
              setShieldActive(false);
              // Reset ball to stuck state on paddle
              ball.stuckToPaddle = true;
              ball.dx = 0;
              ball.dy = 0;
              newX = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
              newY = GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_SIZE;
            } else {
              // Remove this ball
              ball.dx = 0;
              ball.dy = 0;
              ball.stuckToPaddle = false;
              ball.x = -1000; // move off screen
              ball.y = -1000;
            }
          }

          return { ...ball, x: newX, y: newY };
        });

        // Remove balls that fell off
        newBalls = newBalls.filter((b) => !(b.x === -1000 && b.y === -1000));

        // If no balls left => game over
        if (newBalls.length === 0) {
          setGameOver(true);
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
        }

        return newBalls;
      });

      // Move power-ups down
      setPowerUps((prevPowerUps) => {
        let updated = prevPowerUps
          .map((pu) => ({ ...pu, y: pu.y + 3 }))
          .filter((pu) => pu.y < GAME_HEIGHT);

        // Check paddle collect
        updated.forEach((pu) => {
          if (
            pu.y + POWERUP_SIZE >= GAME_HEIGHT - PADDLE_Y_OFFSET &&
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
    shieldActive,
    stickyActive,
    ballSpeedMultiplier,
    gameOver,
  ]);

  // Paddle drag
  function onMove(evt: GestureResponderEvent) {
    let x = evt.nativeEvent.locationX - paddleWidth / 2;
    if (x < 0) x = 0;
    if (x + paddleWidth > GAME_WIDTH) x = GAME_WIDTH - paddleWidth;
    setPaddleX(x);

    // If sticky ball active and ball stuck, move ball with paddle
    if (stickyActive) {
      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.stuckToPaddle) {
            return {
              ...ball,
              x: x + paddleWidth / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_SIZE,
            };
          }
          return ball;
        })
      );
    }
  }

  // Spawn power-up helper
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

  // Remove brick by index
  function removeBrick(i: number) {
    setBricks((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], alive: false };
      return copy;
    });
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
          // add 2 more balls
          const paddleCenter = paddleX + paddleWidth / 2;
          const ballY = GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_SIZE;
          
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
        break;
      case 'sticky':
        setStickyActive(true);
        // Make all balls stuck to paddle
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

  // Release sticky balls on tap
  function releaseSticky() {
    if (stickyActive) {
      setStickyActive(false);
      setBalls((prev) =>
        prev.map((ball) => {
          if (ball.stuckToPaddle) {
            return {
              ...ball,
              stuckToPaddle: false,
              dx: 4 * (Math.random() > 0.5 ? 1 : -1),
              dy: -4,
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
    setShieldActive(false);
    setStickyActive(false);
    setBallSpeedMultiplier(1);
    setPaddleWidth(100);
    setPowerUps([]);
    setCoins(0);
    resetBricks();
    setBalls([
      {
        x: GAME_WIDTH / 2 - BALL_SIZE / 2,
        y: GAME_HEIGHT / 2,
        dx: 4,
        dy: -4,
        stuckToPaddle: false,
        metal: false,
      },
    ]);
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(() => {
      if (!gameOver) {
        animationFrameId.current = requestAnimationFrame(restart as FrameRequestCallback);
      }
    });
  }

  // Reset bricks helper
  function resetBricks() {
    const tempBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        tempBricks.push({
          x: BRICK_MARGIN + col * (BRICK_WIDTH + BRICK_MARGIN),
          y: row * (BRICK_HEIGHT + BRICK_MARGIN) + 20,
          alive: true,
        });
      }
    }
    setBricks(tempBricks);
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
      <Text style={styles.coins}>Coins: {coins}</Text>
      
      <View
        style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
        onStartShouldSetResponder={() => true}
        onResponderMove={onMove}
        onResponderRelease={releaseSticky}
      >
        {/* Paddle */}
        <View
          style={[
            styles.paddle,
            { 
              width: paddleWidth, 
              left: paddleX, 
              bottom: 0 
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
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    backgroundColor: `hsl(${Math.floor(i / BRICK_COLS) * 60},70%,50%)`
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
          <Text style={styles.gameOverText}>Game Over</Text>
          <Text style={styles.coinsText}>Coins: {coins}</Text>
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
    borderRadius: 3,
  },
  powerUp: {
    position: 'absolute',
    width: POWERUP_SIZE,
    height: POWERUP_SIZE,
    borderRadius: POWERUP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
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
    zIndex: 5,
  },
  exitText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
  },
  coins: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: '#ff0',
    fontWeight: 'bold',
    zIndex: 5,
  },
});