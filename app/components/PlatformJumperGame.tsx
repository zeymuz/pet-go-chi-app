import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';

const window = Dimensions.get('window');
const screenWidth = window.width;
const screenHeight = Platform.OS === 'ios' ? window.height : window.height - 24;

// Game constants
const PLAYER_SIZE = 50;
const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const GRAVITY = 1;
const JUMP_VELOCITY = -20;
const PLATFORM_SPACING = 150;
const NUM_INITIAL_PLATFORMS = 5;
const CLOUD_WIDTH = 100;
const CLOUD_HEIGHT = 60;
const MAX_PLATFORMS = 15;
const JUMP_COOLDOWN = 300;
const STAR_COUNT = 30;
const BIG_STAR_COUNT = 5;
const ROD_WIDTH = 10;
const ROD_HEIGHT = 30;

type Platform = { id: string; x: number; y: number; special: boolean; lastJumpTime: number };
type Cloud = { id: string; x: number; y: number; speed: number };
type Star = { id: string; x: number; y: number; size: number; opacity: number };
type BigStar = { id: string; x: number; y: number; size: number };
type Rod = { id: string; x: number; y: number; speed: number };

interface PlatformJumperGameProps {
  onExit: (score: number) => void;
}

export default function PlatformJumperGame({ onExit }: PlatformJumperGameProps) {
  // Game state refs
  const playerX = useRef(screenWidth / 2 - PLAYER_SIZE / 2);
  const playerY = useRef(screenHeight - PLAYER_SIZE - 100);
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const currentModeRef = useRef<'sky' | 'space' | 'sun' | 'galaxy' | 'monster'>('sky');

  // Animation queue refs
  const triggeredAnimations = useRef({
    sun: false,
    galaxy: false,
    monster: false,
  });
  const animationQueue = useRef<string[]>([]);
  const playingGif = useRef(false);

  // Game objects
  const platforms = useRef<Platform[]>([]);
  const clouds = useRef<Cloud[]>([]);
  const stars = useRef<Star[]>([]);
  const bigStars = useRef<BigStar[]>([]);
  const rods = useRef<Rod[]>([]);
  
  // Scores
  const score = useRef(0);
  const highScore = useRef(0);
  const coinsEarned = useRef(0);
  const totalCoinsRef = useRef(0); // Track total coins across games

  // UI states
  const [, forceUpdate] = useState(0);
  const [scoreUI, setScoreUI] = useState(0);
  const [highScoreUI, setHighScoreUI] = useState(0);
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [backgroundMode, setBackgroundMode] = useState<'sky' | 'space' | 'sun' | 'galaxy' | 'monster'>('sky');
  const [displayCoins, setDisplayCoins] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({
    x: screenWidth / 2 - PLAYER_SIZE / 2,
    y: screenHeight - PLAYER_SIZE - 100
  });
  const [totalCoinsUI, setTotalCoinsUI] = useState(0); // State for displaying total coins

  // Animations
  const skyFadeAnim = useRef(new Animated.Value(1)).current;
  const spaceFadeAnim = useRef(new Animated.Value(0)).current;
  const sunFadeAnim = useRef(new Animated.Value(0)).current;
  const galaxyFadeAnim = useRef(new Animated.Value(0)).current;
  const monsterFadeAnim = useRef(new Animated.Value(0)).current;
  const starPulseAnim = useRef(new Animated.Value(1)).current;
  const monsterPulseAnim = useRef(new Animated.Value(1)).current;
  const monsterSwayAnim = useRef(new Animated.Value(0)).current;
  const sunGlowAnim = useRef(new Animated.Value(0)).current;
  const spaceToSunAnim = useRef(new Animated.Value(0)).current;
  const dayToNightAnim = useRef(new Animated.Value(0)).current;

  // GIF container refs
  const sunRef = useRef(null);
  const galaxyRef = useRef(null);
  const monsterRef = useRef(null);

  // Update the ref whenever backgroundMode changes
  useEffect(() => {
    currentModeRef.current = backgroundMode;
  }, [backgroundMode]);

  // Pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        playerX.current = Math.max(0, Math.min(screenWidth - PLAYER_SIZE, playerX.current + gestureState.dx * 0.15));
        setPlayerPosition(prev => ({
          ...prev,
          x: playerX.current
        }));
      },
    })
  ).current;

  // Game loop ref
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef(0);
  const rodSpawnTimer = useRef<NodeJS.Timeout>();
  const redRodSpawnTimer = useRef<NodeJS.Timeout>();


  // Initialize game objects
  const initGameObjects = useCallback(() => {
    // Platforms
    platforms.current = Array.from({ length: NUM_INITIAL_PLATFORMS }, (_, i) => ({
      id: `platform-${i}`,
      x: i === 0 ? screenWidth / 2 - PLATFORM_WIDTH / 2 : Math.random() * (screenWidth - PLATFORM_WIDTH),
      y: screenHeight - 80 - i * PLATFORM_SPACING,
      special: i > 0 && Math.random() < 0.1,
      lastJumpTime: 0,
    }));

    // Clouds - slower speed
    clouds.current = Array.from({ length: 3 }, (_, i) => ({
      id: `cloud-${i}`,
      x: Math.random() * (screenWidth - CLOUD_WIDTH),
      y: Math.random() * (screenHeight / 2),
      speed: 0.05 + Math.random() * 0.05,
    }));

    // Stars
    stars.current = Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: `star-${i}`,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
    }));

    // Big stars
    bigStars.current = Array.from({ length: BIG_STAR_COUNT }, (_, i) => ({
      id: `bigstar-${i}`,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: 2 + Math.random() * 3,
    }));

    // Clear rods
    rods.current = [];
    if (rodSpawnTimer.current) clearInterval(rodSpawnTimer.current);
  }, []);

  // Reset game state
  const resetGame = useCallback(() => {
    playerX.current = screenWidth / 2 - PLAYER_SIZE / 2;
    playerY.current = screenHeight - PLAYER_SIZE - 100;
    setPlayerPosition({
      x: screenWidth / 2 - PLAYER_SIZE / 2,
      y: screenHeight - PLAYER_SIZE - 100
    });
    velocityY.current = 0;
    isJumping.current = false;
    score.current = 0;
    coinsEarned.current = 0;
    setDisplayCoins(0);
    setBackgroundMode('sky');
    currentModeRef.current = 'sky';
    
    // Reset animations
    skyFadeAnim.setValue(1);
    spaceFadeAnim.setValue(0);
    sunFadeAnim.setValue(0);
    galaxyFadeAnim.setValue(0);
    monsterFadeAnim.setValue(0);
    sunGlowAnim.setValue(0);
    spaceToSunAnim.setValue(0);
    dayToNightAnim.setValue(0);
    
    // Reset animation queue state
    triggeredAnimations.current = {
      sun: false,
      galaxy: false,
      monster: false,
    };
    animationQueue.current = [];
    playingGif.current = false;
    
    initGameObjects();
    setScoreUI(0);
    setHighScoreUI(highScore.current);
  }, [initGameObjects, skyFadeAnim, spaceFadeAnim, sunFadeAnim, galaxyFadeAnim, monsterFadeAnim, spaceToSunAnim]);

  const startGame = useCallback(() => {
    resetGame();
    setGameStatus('playing');
    
    // Start animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(starPulseAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(starPulseAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    
    // Monster sway animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(monsterSwayAnim, { 
          toValue: 1, 
          duration: 5000,
          useNativeDriver: true 
        }),
        Animated.timing(monsterSwayAnim, { 
          toValue: -1, 
          duration: 5000,
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Monster pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(monsterPulseAnim, { 
          toValue: 0.98, 
          duration: 3000,
          useNativeDriver: true 
        }),
        Animated.timing(monsterPulseAnim, { 
          toValue: 1.02, 
          duration: 3000,
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Sun glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true
        }),
        Animated.timing(sunGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true
        }),
      ])
    ).start();
  }, [resetGame, starPulseAnim, monsterSwayAnim, monsterPulseAnim]);

  const endGame = useCallback(() => {
    setGameStatus('gameover');
    if (score.current > highScore.current) {
      highScore.current = score.current;
      setHighScoreUI(highScore.current);
    }
    // Add current game coins to total
    totalCoinsRef.current += coinsEarned.current;
    setTotalCoinsUI(totalCoinsRef.current);
  }, []);

  const handleExit = useCallback(() => {
    // Pass total coins including current game if still playing
    const finalCoins = totalCoinsRef.current + 
      (gameStatus === 'playing' ? coinsEarned.current : 0);
    onExit(finalCoins);
  }, [onExit, gameStatus]);

  // Add red rods
  const addRods = useCallback((count: number, speed: number) => {
    const newRods = Array.from({ length: count }, (_, i) => ({
      id: `rod-${Date.now()}-${i}`,
      x: Math.random() * (screenWidth - ROD_WIDTH),
      y: -ROD_HEIGHT,
      speed: speed,
    }));
    rods.current = [...rods.current, ...newRods].slice(-20); // Limit to 20 rods
  }, []);

  // Start rod spawning
  const startRodSpawning = useCallback(() => {
    if (rodSpawnTimer.current) clearInterval(rodSpawnTimer.current);
    rodSpawnTimer.current = setInterval(() => {
      if (currentModeRef.current === 'monster' && gameStatus === 'playing') {
        addRods(1, 5 + (scoreUI - 20000) / 1000);
      }
    }, 1000);
  }, [gameStatus, scoreUI, addRods]);

  // Check rod collision
  const checkRodCollision = useCallback(() => {
    const playerLeft = playerX.current;
    const playerRight = playerX.current + PLAYER_SIZE;
    const playerTop = playerY.current;
    const playerBottom = playerY.current + PLAYER_SIZE;

    for (const rod of rods.current) {
      const rodLeft = rod.x;
      const rodRight = rod.x + ROD_WIDTH;
      const rodTop = rod.y;
      const rodBottom = rod.y + ROD_HEIGHT;

      if (
        playerRight > rodLeft &&
        playerLeft < rodRight &&
        playerBottom > rodTop &&
        playerTop < rodBottom
      ) {
        return true;
      }
    }
    return false;
  }, []);

  // Optimized game loop
  const gameTick = useCallback((timestamp: number) => {
    if (!lastUpdateTime.current) lastUpdateTime.current = timestamp;
    const deltaTime = timestamp - lastUpdateTime.current;
    
    if (deltaTime >= 16) {
      lastUpdateTime.current = timestamp;
      
      // Physics update
      velocityY.current += GRAVITY;
      playerY.current += velocityY.current;

      // Platform collision
      const now = Date.now();
      let landed = false;
      const playerBottom = playerY.current + PLAYER_SIZE;
      
      for (let i = 0; i < platforms.current.length; i++) {
        const p = platforms.current[i];
        if (
          velocityY.current > 0 &&
          playerBottom >= p.y &&
          playerBottom <= p.y + PLATFORM_HEIGHT + 10 &&
          playerX.current + PLAYER_SIZE > p.x + 5 &&
          playerX.current < p.x + PLATFORM_WIDTH - 5 &&
          now - p.lastJumpTime > JUMP_COOLDOWN
        ) {
          playerY.current = p.y - PLAYER_SIZE;
          velocityY.current = p.special ? JUMP_VELOCITY * 1.5 : JUMP_VELOCITY;
          landed = true;
          p.lastJumpTime = now;
          break;
        }
      }
      isJumping.current = !landed;

      // Update rods
      if (currentModeRef.current === 'monster') {
        rods.current = rods.current.map(rod => ({
          ...rod,
          y: rod.y + rod.speed
        })).filter(rod => rod.y < screenHeight + ROD_HEIGHT);

        // Check rod collision
        if (checkRodCollision()) {
          endGame();
          return;
        }
      }

      // Camera follow
      if (playerY.current < screenHeight / 3) {
        const diff = screenHeight / 3 - playerY.current;
        playerY.current = screenHeight / 3;

        // Move platforms and clouds
        platforms.current = platforms.current.map(p => ({
          ...p,
          y: p.y + diff
        })).filter(p => p.y < screenHeight + PLATFORM_HEIGHT * 2);

        clouds.current = clouds.current.map(c => ({
          ...c,
          y: c.y + diff * 0.5
        })).filter(c => c.y < screenHeight + CLOUD_HEIGHT);

        rods.current = rods.current.map(r => ({
          ...r,
          y: r.y + diff
        })).filter(r => r.y < screenHeight + ROD_HEIGHT);

        const scoreDiff = Math.floor(diff);
        score.current += scoreDiff;
        coinsEarned.current = Math.floor(score.current / 1000);
        setDisplayCoins(coinsEarned.current);
        setTotalCoinsUI(totalCoinsRef.current + coinsEarned.current);
        setScoreUI(prev => prev + scoreDiff);
      }

      // Move clouds
      clouds.current = clouds.current.map(c => ({
        ...c,
        x: (c.x + c.speed) % (screenWidth + CLOUD_WIDTH) - CLOUD_WIDTH
      }));

      // Generate new platforms
      if (platforms.current.length > 0 && platforms.current.length < MAX_PLATFORMS) {
        const lastPlatform = platforms.current[platforms.current.length - 1];
        if (lastPlatform.y > 0) {
          platforms.current.push({
            id: `platform-${Date.now()}`,
            x: Math.random() * (screenWidth - PLATFORM_WIDTH),
            y: lastPlatform.y - PLATFORM_SPACING,
            special: Math.random() < 0.1,
            lastJumpTime: 0,
          });
        }
      }

      // Game over check
      if (playerY.current > screenHeight) {
        endGame();
        return;
      }

      // Update player position for rendering
      setPlayerPosition({
        x: playerX.current,
        y: playerY.current
      });
    }

    // Handle red rods between 20000 and 40000 score
    // Red rods fall from 20,000 to 40,000
    if (score.current >= 20000 && score.current <= 40000) {
      if (!redRodSpawnTimer.current) {
        redRodSpawnTimer.current = setInterval(() => {
          rods.current.push({
            id: `red-rod-${Date.now()}`,
            x: Math.random() * (screenWidth - ROD_WIDTH),
            y: -ROD_HEIGHT,
            speed: 6,
          });
          if (rods.current.length > 30) {
            rods.current = rods.current.slice(-30); // Limit rod count
          }
        }, 1500); // spawn every 0.5 seconds
      }

      // Move rods
      rods.current = rods.current.map(rod => ({
        ...rod,
        y: rod.y + rod.speed,
      })).filter(rod => rod.y < screenHeight + ROD_HEIGHT);

      // Check collision
      const playerLeft = playerX.current;
      const playerRight = playerX.current + PLAYER_SIZE;
      const playerTop = playerY.current;
      const playerBottom = playerY.current + PLAYER_SIZE;

      for (const rod of rods.current) {
        const rodLeft = rod.x;
        const rodRight = rod.x + ROD_WIDTH;
        const rodTop = rod.y;
        const rodBottom = rod.y + ROD_HEIGHT;

        if (
          playerRight > rodLeft &&
          playerLeft < rodRight &&
          playerBottom > rodTop &&
          playerTop < rodBottom
        ) {
          endGame();
          return;
        }
      }
    } else {
      if (redRodSpawnTimer.current) {
        clearInterval(redRodSpawnTimer.current);
        redRodSpawnTimer.current = undefined;
        rods.current = [];
      }
    }

    animationFrameId.current = requestAnimationFrame(gameTick);
  }, [endGame, checkRodCollision]);

  // Game loop management
  useEffect(() => {
    if (gameStatus === 'playing') {
      lastUpdateTime.current = 0;
      animationFrameId.current = requestAnimationFrame(gameTick);
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    }
  }, [gameStatus, gameTick]);

  // Play next GIF in queue
  const playNextGif = useCallback(() => {
    if (playingGif.current || animationQueue.current.length === 0) return;
    const next = animationQueue.current.shift();
    if (!next) return;
    
    playingGif.current = true;

    switch (next) {
      case 'sun':
        triggeredAnimations.current.sun = true;
        setBackgroundMode('sun');
        Animated.timing(sunFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            playingGif.current = false;
            playNextGif();
          }, 4000);
        });
        break;

      case 'galaxy':
        triggeredAnimations.current.galaxy = true;
        setBackgroundMode('galaxy');
        Animated.timing(galaxyFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            playingGif.current = false;
            playNextGif();
          }, 4000);
        });
        break;

      case 'monster':
        triggeredAnimations.current.monster = true;
        setBackgroundMode('monster');
        Animated.timing(monsterFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            playingGif.current = false;
            playNextGif();
          }, 4000);
          startRodSpawning();
        });
        break;
    }
  }, [sunFadeAnim, galaxyFadeAnim, monsterFadeAnim, startRodSpawning]);

  // Background transitions for space (5000 points) and GIF queue
  useEffect(() => {
    // Handle space transition at 5000 points
    if (scoreUI >= 5000 && currentModeRef.current !== 'space') {
      setBackgroundMode('space');
      Animated.parallel([
        Animated.timing(dayToNightAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(skyFadeAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(spaceFadeAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Handle GIF animations queue
    if (scoreUI >= 10000 && !triggeredAnimations.current.sun) {
  triggeredAnimations.current.sun = true;
  setBackgroundMode('sun');
  Animated.timing(sunFadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}

if (scoreUI >= 15000 && !triggeredAnimations.current.galaxy) {
  triggeredAnimations.current.galaxy = true;
  setBackgroundMode('galaxy');
  
  // fade in galaxy
  Animated.timing(galaxyFadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  // fade out sun
  Animated.timing(sunFadeAnim, {
    toValue: 0,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}

if (scoreUI >= 20000 && !triggeredAnimations.current.monster) {
  triggeredAnimations.current.monster = true;
  setBackgroundMode('monster');

  // fade in monster
  Animated.timing(monsterFadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  // fade out galaxy
  Animated.timing(galaxyFadeAnim, {
    toValue: 0,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  startRodSpawning();
}

if (scoreUI >= 40000) {
  // fade out monster
  Animated.timing(monsterFadeAnim, {
    toValue: 0,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}

    playNextGif();
  }, [scoreUI, playNextGif]);

  // Clean up animations
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rodSpawnTimer.current) clearInterval(rodSpawnTimer.current);
    };
  }, []);

  // Background style - now with smooth day-to-night transition
  const getBackgroundStyle = () => {
    if (backgroundMode === 'space' && dayToNightAnim._value < 1) {
      return {
        backgroundColor: dayToNightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['#87CEEB', '#000033']
        })
      };
    }
    
    switch(backgroundMode) {
      case 'monster': return styles.monsterBackground;
      case 'galaxy': return styles.galaxyBackground;
      case 'sun': return styles.sunBackground;
      case 'space': return styles.spaceBackground;
      default: return styles.skyBackground;
    }
  };

  // Memoized render methods
  const renderClouds = useCallback(() => (
    <Animated.View style={{ opacity: skyFadeAnim }}>
      {clouds.current.map((cloud) => (
        <View
          key={cloud.id}
          style={[styles.cloud, { left: cloud.x, top: cloud.y }]}
        />
      ))}
    </Animated.View>
  ), [skyFadeAnim]);

  const renderStars = useCallback(() => (
    <Animated.View style={{ 
      opacity: backgroundMode === 'monster' ? 
        Animated.subtract(1, monsterFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.3]
        })) : 
        spaceFadeAnim
    }}>
      {stars.current.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </Animated.View>
  ), [backgroundMode, spaceFadeAnim, monsterFadeAnim]);

  const renderBigStars = useCallback(() => (
    <Animated.View style={{ 
      opacity: backgroundMode === 'monster' ? 
        Animated.subtract(1, monsterFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.2]
        })) : 
        spaceFadeAnim
    }}>
      {bigStars.current.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.bigStar,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              transform: [{ scale: starPulseAnim }],
            },
          ]}
        />
      ))}
    </Animated.View>
  ), [backgroundMode, spaceFadeAnim, starPulseAnim, monsterFadeAnim]);

  // Fixed GIF rendering with persistent containers
  const renderSun = useCallback(() => (
    <Animated.View
      ref={sunRef}
      style={[
        styles.sunContainer,
        {
          opacity: sunFadeAnim,
          transform: [{
            scale: sunFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.2]
            })
          }]
        },
      ]}
      collapsable={false}
    >
      <Image
        source={require('../../assets/images/sun.gif')}
        style={styles.sunImage}
        resizeMode="contain"
      />
    </Animated.View>
  ), [sunFadeAnim]);

  const renderGalaxy = useCallback(() => (
    <Animated.View
      ref={galaxyRef}
      style={[
        styles.galaxyContainer,
        {
          opacity: galaxyFadeAnim,
          transform: [
            { 
              scale: galaxyFadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }
          ],
        },
      ]}
      collapsable={false}
    >
      <Image
        source={require('../../assets/images/galaxy.gif')}
        style={styles.galaxyImage}
        resizeMode="contain"
      />
    </Animated.View>
  ), [galaxyFadeAnim]);

  const renderMonster = useCallback(() => (
    <Animated.View
      ref={monsterRef}
      style={[
        styles.monsterContainer,
        { 
          opacity: monsterFadeAnim,
          transform: [
            { scale: monsterPulseAnim },
            { 
              translateX: monsterSwayAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: [-20, 20]
              }) 
            }
          ]
        }
      ]}
      collapsable={false}
    >
      <Image
        source={require('../../assets/images/monster.gif')}
        style={styles.monsterImage}
        resizeMode="contain"
      />
    </Animated.View>
  ), [monsterFadeAnim, monsterPulseAnim, monsterSwayAnim]);

  const renderPlatforms = useCallback(() => (
    <>
      {platforms.current
        .filter(p => p.y > -PLATFORM_HEIGHT && p.y < screenHeight)
        .map((platform) => (
          <View
            key={platform.id}
            style={[
              styles.platform,
              {
                left: platform.x,
                top: platform.y,
                backgroundColor: platform.special ? '#FFD700' : '#4CAF50',
              },
            ]}
          />
        ))}
    </>
  ), []);

  const renderRods = useCallback(() => (
    <>
      {rods.current.map((rod) => (
        <View
          key={rod.id}
          style={[
            styles.rod,
            {
              left: rod.x,
              top: rod.y,
            },
          ]}
        />
      ))}
    </>
  ), []);

  const renderPlayer = useCallback(() => (
    <View
      style={[
        styles.characterContainer,
        {
          left: playerPosition.x,
          top: playerPosition.y,
        }
      ]}
    >
      <Image
        source={require('../../assets/images/favicon.png')}
        style={styles.character}
        resizeMode="contain"
      />
    </View>
  ), [playerPosition]);

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Background with smooth day-to-night transition */}
      <Animated.View style={[StyleSheet.absoluteFill, getBackgroundStyle()]} />

      <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>

      {renderClouds()}
      {renderStars()}
      {renderBigStars()}
      
      {/* Render all GIFs persistently but control visibility with opacity */}
      <View pointerEvents="none" style={styles.gifContainer}>
        {renderSun()}
        {renderGalaxy()}
        {renderMonster()}
      </View>
      
      {renderPlatforms()}
      {renderRods()}

      {gameStatus === 'playing' && renderPlayer()}

      <View style={styles.scoreContainer}>
        <Text style={styles.score}>Score: {scoreUI}</Text>
        <Text style={styles.highScore}>High Score: {highScoreUI}</Text>
        <Text style={styles.coins}>Game Coins: {displayCoins}</Text>
        <Text style={styles.totalCoins}>Total Coins: {totalCoinsUI}</Text>
      </View>

      {gameStatus === 'ready' && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Cosmic Jumper</Text>
          <Text style={styles.instructions}>
            Drag to move left/right{'\n'}
            Land on platforms to jump higher!{'\n'}
            Gold platforms give extra boost!{'\n\n'}
            Reach 5,000 for space{'\n'}
            10,000 for sun{'\n'}
            15,000 for galaxy{'\n'}
            20,000 for... something else{'\n\n'}
            Earn coins based on your score!
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
          <Text style={styles.coins}>+{displayCoins} coins</Text>
          {scoreUI >= 20000 && (
            <Text style={styles.monsterWarning}>You awakened the ancient one!</Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              resetGame();
              setGameStatus('playing');
            }}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Add this at the top 
// Then update the styles to use these dimensions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  skyBackground: {
    backgroundColor: '#87CEEB',
  },
  spaceBackground: {
    backgroundColor: '#000033',
  },
  sunBackground: {
    backgroundColor: '#000033',
  },
  galaxyBackground: {
    backgroundColor: '#000033',
  },
  monsterBackground: {
    backgroundColor: '#000010',
  },
  cloud: {
    position: 'absolute',
    width: scale(100),
    height: verticalScale(60),
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: scale(30),
  },
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  bigStar: {
    position: 'absolute',
    backgroundColor: 'white',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: scale(5),
    shadowOpacity: 0.8,
  },
  sunContainer: {
    position: 'absolute',
    left: screenWidth / 2 - scale(100),
    top: verticalScale(50),
    width: scale(200),
    height: verticalScale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunImage: {
    width: '100%',
    height: '100%',
  },
  galaxyContainer: {
    position: 'absolute',
    left: screenWidth / 2 - scale(191),
    top: screenHeight / 2 - verticalScale(250),
    width: scale(350),
    height: verticalScale(300),
  },
  galaxyImage: {
    width: '100%',
    height: '100%',
  },
  monsterContainer: {
    position: 'absolute',
    left: screenWidth / 2 - scale(170),
    top: screenHeight / 2 - verticalScale(500),
    width: scale(300),
    height: verticalScale(400),
    zIndex: 5,
  },
  monsterImage: {
    width: '110%',
    height: '110%',
  },
  platform: {
    position: 'absolute',
    width: scale(100),
    height: verticalScale(20),
    borderRadius: scale(10),
    zIndex: 10,
  },
  characterContainer: {
    position: 'absolute',
    width: scale(50),
    height: verticalScale(50),
    zIndex: 20,
  },
  character: {
    width: '100%',
    height: '100%',
  },
  rod: {
    position: 'absolute',
    width: scale(10),
    height: verticalScale(30),
    backgroundColor: '#ff0000',
    zIndex: 15,
  },
  scoreContainer: {
    position: 'absolute',
    top: verticalScale(20),
    left: scale(20),
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: verticalScale(10),
    borderRadius: scale(10),
    zIndex: 30,
  },
  score: {
    fontSize: scaleFont(18),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  highScore: {
    fontSize: scaleFont(16),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  coins: {
    fontSize: scaleFont(16),
    color: 'gold',
    fontFamily: 'PressStart2P',
  },
  totalCoins: {
    fontSize: scaleFont(16),
    color: '#ff9900',
    fontFamily: 'PressStart2P',
    marginTop: verticalScale(5),
  },
  monsterWarning: {
    fontSize: scaleFont(14),
    color: '#ff0000',
    marginVertical: verticalScale(10),
    fontStyle: 'italic',
    fontFamily: 'PressStart2P',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    zIndex: 40,
  },
  title: {
    fontSize: scaleFont(36),
    color: '#fff',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    fontFamily: 'PressStart2P',
  },
  instructions: {
    fontSize: scaleFont(16),
    color: '#fff',
    marginBottom: verticalScale(40),
    textAlign: 'center',
    lineHeight: verticalScale(24),
    fontFamily: 'PressStart2P',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(50),
    borderRadius: scale(30),
  },
  buttonText: {
    fontSize: scaleFont(20),
    color: '#fff',
    fontFamily: 'PressStart2P',
  },
  exitButton: {
    position: 'absolute',
    top: verticalScale(10),
    right: scale(15),
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: scale(20),
    width: scale(35),
    height: verticalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontSize: scaleFont(24),
    lineHeight: verticalScale(24),
    fontFamily: 'PressStart2P',
  },
  gifContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  }
});