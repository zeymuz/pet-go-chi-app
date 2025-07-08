import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface BrickBreakerProps {
  onClose: (score: number) => void;
}

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 15;
const BRICK_ROWS = 5;
const BRICK_COLS = 6;
const BRICK_WIDTH = width / BRICK_COLS;
const BRICK_HEIGHT = 30;

export default function BrickBreaker({ onClose }: BrickBreakerProps) {
  const [ballX, setBallX] = useState(width / 2);
  const [ballY, setBallY] = useState(height - 200);
  const [paddleX, setPaddleX] = useState(width / 2 - PADDLE_WIDTH / 2);
  const [ballDX, setBallDX] = useState(4);
  const [ballDY, setBallDY] = useState(-4);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [coins, setCoins] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    resetGame();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  const resetGame = () => {
    setBallX(width / 2);
    setBallY(height - 200);
    setPaddleX(width / 2 - PADDLE_WIDTH / 2);
    setBallDX(4);
    setBallDY(-4);
    setBricks(Array.from({ length: BRICK_ROWS }, () => Array(BRICK_COLS).fill(true)));
    setGameRunning(true);

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(gameLoop, 16);
  };

  const gameLoop = () => {
    setBallX((x) => x + ballDX);
    setBallY((y) => y + ballDY);

    setBallX((x) => {
      if (x <= 0 || x + BALL_SIZE >= width) setBallDX(-ballDX);
      return Math.max(0, Math.min(x, width - BALL_SIZE));
    });

    setBallY((y) => {
      if (y <= 0) setBallDY(-ballDY);
      else if (y + BALL_SIZE >= height) {
        gameOver();
      }
      return y;
    });

    if (
      ballY + BALL_SIZE >= height - 50 &&
      ballX + BALL_SIZE >= paddleX &&
      ballX <= paddleX + PADDLE_WIDTH
    ) {
      setBallDY(-ballDY);
    }

    setBricks((prev) => {
      const newBricks = prev.map((row) => [...row]);
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (!newBricks[r][c]) continue;
          const bx = c * BRICK_WIDTH;
          const by = r * BRICK_HEIGHT + 60;
          if (
            ballX + BALL_SIZE >= bx &&
            ballX <= bx + BRICK_WIDTH &&
            ballY + BALL_SIZE >= by &&
            ballY <= by + BRICK_HEIGHT
          ) {
            newBricks[r][c] = false;
            setBallDY(-ballDY);
            setCoins((c) => c + 1);
            checkWin(newBricks);
            return newBricks;
          }
        }
      }
      return newBricks;
    });
  };

  const checkWin = (bricks: boolean[][]) => {
    const allCleared = bricks.flat().every((b) => !b);
    if (allCleared) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      Alert.alert('You win!', `You earned ${coins} coins`, [
        { text: 'Play Again', onPress: resetGame },
        { text: 'Quit', onPress: () => onClose(coins) },
      ]);
    }
  };

  const gameOver = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    Alert.alert('Game Over', 'Try again?', [
      { text: 'Retry', onPress: resetGame },
      { text: 'Quit', onPress: () => onClose(coins) },
    ]);
  };

  const handleTouch = (e: any) => {
    const touchX = e.nativeEvent.locationX;
    setPaddleX(Math.max(0, Math.min(touchX - PADDLE_WIDTH / 2, width - PADDLE_WIDTH)));
  };

  return (
    <View style={styles.container} onTouchStart={handleTouch} onTouchMove={handleTouch}>
      <Text style={styles.title}>Brick Breaker</Text>
      <Text style={styles.coins}>Coins: {coins}</Text>

      {bricks.map((row, r) =>
        row.map(
          (brick, c) =>
            brick && (
              <View
                key={`brick-${r}-${c}`}
                style={{
                  position: 'absolute',
                  top: r * BRICK_HEIGHT + 60,
                  left: c * BRICK_WIDTH,
                  width: BRICK_WIDTH - 2,
                  height: BRICK_HEIGHT - 2,
                  backgroundColor: COLORS.accent,
                }}
              />
            )
        )
      )}

      <View
        style={{
          position: 'absolute',
          left: ballX,
          top: ballY,
          width: BALL_SIZE,
          height: BALL_SIZE,
          borderRadius: BALL_SIZE / 2,
          backgroundColor: 'white',
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 30,
          left: paddleX,
          width: PADDLE_WIDTH,
          height: PADDLE_HEIGHT,
          backgroundColor: COLORS.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
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
});
