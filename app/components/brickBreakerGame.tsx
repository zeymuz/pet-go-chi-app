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
const POWERUP_SIZE = 24;

const BASE_PADDLE_WIDTH = GAME_WIDTH * 0.2;
const BRICK_WIDTH = (GAME_WIDTH - (BRICK_COLS + 1) * BRICK_MARGIN) / BRICK_COLS;

type PowerUpType = 'expand' | 'shrink' | 'multi' | 'slow' | 'fast' | 'sticky' | 'shield';

interface Ball {
  x: number; y: number; dx: number; dy: number;
  stuck?: boolean;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
}

interface Props {
  onExit?: () => void;
}

export default function BrickBreakerGame({ onExit }: Props) {
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - BASE_PADDLE_WIDTH / 2);
  const [paddleWidth, setPaddleWidth] = useState(BASE_PADDLE_WIDTH);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<boolean[][]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [coins, setCoins] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [shielded, setShielded] = useState(false);

  const ballsRef = useRef(balls);
  const paddleXRef = useRef(paddleX);
  const paddleWidthRef = useRef(paddleWidth);
  const bricksRef = useRef(bricks);
  const powerUpsRef = useRef(powerUps);
  const shieldRef = useRef(shielded);
  const animationFrame = useRef<number>();
  const powerUpTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const powerUpId = useRef(0);

  useEffect(() => {
    startNewGame();
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      Object.values(powerUpTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => { ballsRef.current = balls }, [balls]);
  useEffect(() => { paddleXRef.current = paddleX }, [paddleX]);
  useEffect(() => { paddleWidthRef.current = paddleWidth }, [paddleWidth]);
  useEffect(() => { bricksRef.current = bricks }, [bricks]);
  useEffect(() => { powerUpsRef.current = powerUps }, [powerUps]);
  useEffect(() => { shieldRef.current = shielded }, [shielded]);

  const startNewGame = () => {
    setGameActive(true);
    setShielded(false);
    const startBall = [{ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, dx: 3, dy: -3 }];
    setBalls(startBall); ballsRef.current = startBall;
    setPaddleWidth(BASE_PADDLE_WIDTH);
    setCoins(0);
    setPowerUps([]); powerUpsRef.current = [];
    createBricks();
    setShielded(false);
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const createBricks = () => {
    const arr = Array.from({ length: BRICK_ROWS }, () => Array(BRICK_COLS).fill(true));
    setBricks(arr); bricksRef.current = arr;
  };

  const gameLoop = () => {
    if (!gameActive) return;
    let updated = bricksRef.current.map(r => [...r]);
    let newBalls: Ball[] = [];
    let newPowerUps = [...powerUpsRef.current];

    ballsRef.current.forEach(ball => {
      let { x, y, dx, dy, stuck } = ball;

      if (!stuck) {
        x += dx; y += dy;
        if (x <= 0 || x + BALL_SIZE >= GAME_WIDTH) dx = -dx;
        if (y <= 0) dy = -dy;
      } else {
        const px = paddleXRef.current + paddleWidthRef.current / 2 - BALL_SIZE / 2;
        x = px; y = GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_SIZE - 1;
      }

      const pt = GAME_HEIGHT - PADDLE_Y_OFFSET;
      const pl = paddleXRef.current;
      const pr = pl + paddleWidthRef.current;

      if (y + BALL_SIZE >= pt && x + BALL_SIZE >= pl && x <= pr) {
        if (ball.stuck) {
          stuck = false;
          const speed = Math.hypot(dx, dy) || 3;
          dx = speed * (Math.random() < 0.5 ? 1: -1);
          dy = -Math.abs(speed);
        } else {
          const pos = (x + BALL_SIZE/2 - pl) / paddleWidthRef.current;
          const angle = (pos - 0.5) * Math.PI/2;
          const speed = Math.hypot(dx, dy);
          dx = speed * Math.sin(angle);
          dy = -Math.abs(speed * Math.cos(angle));
        }
        y = pt - BALL_SIZE;
      }

      const row = Math.floor((y - PADDLE_Y_OFFSET) / (BRICK_HEIGHT + BRICK_MARGIN));
      const col = Math.floor(x / (BRICK_WIDTH + BRICK_MARGIN));
      if (row>=0 && row<BRICK_ROWS && col>=0 && col<BRICK_COLS && updated[row][col]) {
        updated[row][col] = false;
        dy = -dy;
        if (Math.random() < 0.5) setCoins(c=>c+1);
        if (Math.random() < 0.3) {
          const types: PowerUpType[] = ['expand','shrink','multi','slow','fast','sticky','shield'];
          const type = types[Math.floor(Math.random()*types.length)];
          newPowerUps.push({ id: powerUpId.current++, x: col*(BRICK_WIDTH+BRICK_MARGIN)+BRICK_WIDTH/2, y: row*(BRICK_HEIGHT+BRICK_MARGIN)+PADDLE_Y_OFFSET + BRICK_HEIGHT/2, type });
        }
      }

      if (y <= GAME_HEIGHT) newBalls.push({ x,y,dx,dy,stuck });
    });

    newPowerUps = newPowerUps
      .map(p => ({ ...p, y: p.y + 2 }))
      .filter(p => {
        if (p.y + POWERUP_SIZE/2 >= GAME_HEIGHT - PADDLE_Y_OFFSET && p.x >= paddleXRef.current && p.x <= paddleXRef.current + paddleWidthRef.current) {
          applyPowerUp(p.type);
          return false;
        }
        return p.y < GAME_HEIGHT;
      });

    if (!newBalls.length) {
      if (shieldRef.current) {
        setShielded(false);
      } else {
        setGameActive(false);
        Alert.alert('Game Over', `Coins: ${coins}`, [{ text:'Again',onPress:startNewGame },{ text:'Exit',onPress:onExit }]);
        return;
      }
    }

    setBalls(newBalls);
    setBricks(updated);
    setPowerUps(newPowerUps);
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const applyPowerUp = (type: PowerUpType) => {
    clearTimeout(powerUpTimeouts.current[type]);
    switch(type) {
      case 'expand':
        setPaddleWidth(BASE_PADDLE_WIDTH * 1.5);
        powerUpTimeouts.current[type] = setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'shrink':
        setPaddleWidth(BASE_PADDLE_WIDTH * 0.6);
        powerUpTimeouts.current[type] = setTimeout(() => setPaddleWidth(BASE_PADDLE_WIDTH), 10000);
        break;
      case 'multi':
        if (ballsRef.current.length < 5) {
          const b0 = ballsRef.current[0];
          const s = Math.hypot(b0.dx,b0.dy) || 3;
          setBalls(bs => [...bs, { x:b0.x,y:b0.y,dx:s,dy:-s }, { x:b0.x,y:b0.y,dx:-s,dy:-s }]);
        }
        break;
      case 'slow':
        setBalls(bs => bs.map(b => ({ ...b, dx:b.dx*0.7, dy:b.dy*0.7 })));
        break;
      case 'fast':
        setBalls(bs => bs.map(b => ({ ...b, dx:b.dx*1.3, dy:b.dy*1.3 })));
        break;
      case 'sticky':
        setBalls(bs => bs.map((b, i) => i===0 ? { ...b, stuck: true } : b));
        break;
      case 'shield':
        setShielded(true);
        break;
    }
  };

  const handleTouch = (e: GestureResponderEvent) => {
    const x0 = e.nativeEvent.locationX;
    const nx = Math.max(0, Math.min(x0 - paddleWidthRef.current/2, GAME_WIDTH - paddleWidthRef.current));
    setPaddleX(nx);
  };

  const colors: Record<PowerUpType, string> = {
    expand: '#0f0', shrink: '#f00',
    multi: '#f0f', slow: '#0ff', fast: '#fa0',
    sticky: '#fff', shield: '#ff0',
  };

  const symbols: Record<PowerUpType, string> = {
    expand: '⬛', shrink: '⬜',
    multi: '🎱', slow: '🐢', fast: '⚡',
    sticky: '🤚', shield: '🛡️',
  };

  return (
    <View style={styles.container} onStartShouldSetResponder={()=>true} onResponderMove={handleTouch}>
      <TouchableOpacity style={styles.exitButton} onPress={onExit}><Text style={styles.exitText}>✕</Text></TouchableOpacity>
      <Text style={styles.coins}>Coins: {coins}</Text>
      {bricks.map((r,ri) => r.map((b,ci)=>b && (
        <View key={`${ri}-${ci}`} style={[styles.brick,{
          top:PADDLE_Y_OFFSET + ri*(BRICK_HEIGHT+BRICK_MARGIN),
          left:BRICK_MARGIN + ci*(BRICK_WIDTH+BRICK_MARGIN),
          backgroundColor:`hsl(${ri*60},70%,50%)`
        }]} />
      )))}
      {balls.map((b,i)=>(
        <View key={i} style={[styles.ball,{left:b.x,top:b.y}]} />
      ))}
      <View style={[styles.paddle,{left:paddleX,width:paddleWidth}]} />
      {powerUps.map(p=>(
        <View key={p.id} style={[styles.powerUp,{
          left:p.x-POWERUP_SIZE/2,
          top:p.y-POWERUP_SIZE/2,
          backgroundColor:colors[p.type],
        }]}>
          <Text style={styles.powerText}>{symbols[p.type]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width:GAME_WIDTH, height:GAME_HEIGHT, backgroundColor:'#222', alignSelf:'center', position:'relative', marginTop:50 },
  brick: { position:'absolute', width:BRICK_WIDTH, height:BRICK_HEIGHT, borderRadius:2 },
  ball: { position:'absolute', width:BALL_SIZE, height:BALL_SIZE, borderRadius:BALL_SIZE/2, backgroundColor:'cyan' },
  paddle: { position:'absolute', bottom:PADDLE_Y_OFFSET, height:PADDLE_HEIGHT, backgroundColor:'hotpink', borderRadius:10 },
  powerUp: { position:'absolute', width:POWERUP_SIZE, height:POWERUP_SIZE, borderRadius:POWERUP_SIZE/2, justifyContent:'center', alignItems:'center', zIndex:4 },
  powerText: { fontSize:18, color:'#000', fontWeight:'bold' },
  exitButton: { position:'absolute', top:8,right:8,width:28,height:28,backgroundColor:'#900',borderRadius:14,justifyContent:'center',alignItems:'center',zIndex:5 },
  exitText: { color:'#fff', fontSize:20 },
  coins: { position:'absolute', top:10,left:10,color:'#ff0',fontWeight:'bold' },
});
