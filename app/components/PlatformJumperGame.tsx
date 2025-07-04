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
  View,
} from 'react-native';

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
const STAR_COUNT = 50;
const BIG_STAR_COUNT = 8;
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
  const lastPlayerX = useRef(playerX.current);
  const lastPlayerY = useRef(playerY.current);
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const currentModeRef = useRef<'sky' | 'space' | 'sun' | 'galaxy' | 'monster'>('sky');

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

  // UI states
  const [, forceUpdate] = useState(0);
  const [scoreUI, setScoreUI] = useState(0);
  const [highScoreUI, setHighScoreUI] = useState(0);
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [backgroundMode, setBackgroundMode] = useState<'sky' | 'space' | 'sun' | 'galaxy' | 'monster'>('sky');
  const [displayCoins, setDisplayCoins] = useState(0);

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
      },
    })
  ).current;

  // Game loop ref
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef(0);
  const rodSpawnTimer = useRef<NodeJS.Timeout>();

  // Initialize game objects
  const initGameObjects = useCallback(() => {
    // Platforms
    platforms.current = Array.from({ length: NUM_INITIAL_PLATFORMS }, (_, i) => ({
      id: `platform-${i}-${Math.random().toString(36).substr(2, 9)}`,
      x: i === 0 ? screenWidth / 2 - PLATFORM_WIDTH / 2 : Math.random() * (screenWidth - PLATFORM_WIDTH),
      y: screenHeight - 80 - i * PLATFORM_SPACING,
      special: i > 0 && Math.random() < 0.1,
      lastJumpTime: 0,
    }));

    // Clouds - slower speed
    clouds.current = Array.from({ length: 3 }, (_, i) => ({
      id: `cloud-${i}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.random() * (screenWidth - CLOUD_WIDTH),
      y: Math.random() * (screenHeight / 2),
      speed: 0.05 + Math.random() * 0.05,
    }));

    // Stars
    stars.current = Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: `star-${i}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
    }));

    // Big stars
    bigStars.current = Array.from({ length: BIG_STAR_COUNT }, (_, i) => ({
      id: `bigstar-${i}-${Math.random().toString(36).substr(2, 9)}`,
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
    lastPlayerX.current = playerX.current;
    lastPlayerY.current = playerY.current;
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
  }, []);

  const handleExit = useCallback(() => {
    onExit(coinsEarned.current);
  }, [onExit]);

  // Add red rods
  const addRods = useCallback((count: number, speed: number) => {
    for (let i = 0; i < count; i++) {
      rods.current.push({
        id: `rod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: Math.random() * (screenWidth - ROD_WIDTH),
        y: -ROD_HEIGHT,
        speed: speed,
      });
    }
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
        platforms.current.forEach(p => p.y += diff);
        platforms.current = platforms.current.filter(p => p.y < screenHeight + PLATFORM_HEIGHT * 2);

        clouds.current.forEach(c => c.y += diff * 0.5);
        clouds.current = clouds.current.filter(c => c.y < screenHeight + CLOUD_HEIGHT);

        rods.current.forEach(r => r.y += diff);
        rods.current = rods.current.filter(r => r.y < screenHeight + ROD_HEIGHT);

        const scoreDiff = Math.floor(diff);
        score.current += scoreDiff;
        coinsEarned.current = Math.floor(score.current / 100);
        setScoreUI(prev => prev + scoreDiff);
        setDisplayCoins(coinsEarned.current);
      }

      // Move clouds
      clouds.current.forEach(c => {
        c.x = (c.x + c.speed) % (screenWidth + CLOUD_WIDTH) - CLOUD_WIDTH;
      });

      // Generate new platforms
      if (platforms.current.length > 0 && platforms.current.length < MAX_PLATFORMS) {
        const lastPlatform = platforms.current[platforms.current.length - 1];
        if (lastPlatform.y > 0) {
          platforms.current.push({
            id: `platform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

      // Only update when player moves significantly
      if (Math.abs(playerY.current - lastPlayerY.current) > 1 || 
          Math.abs(playerX.current - lastPlayerX.current) > 1) {
        lastPlayerY.current = playerY.current;
        lastPlayerX.current = playerX.current;
        forceUpdate(n => n + 1);
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

  // Background transitions with smooth fading
  useEffect(() => {
    if (scoreUI >= 40000 && currentModeRef.current !== 'galaxy') {
      // Monster leaves - smooth fade out but immediately set to galaxy mode
      setBackgroundMode('galaxy');
      Animated.parallel([
        Animated.timing(monsterFadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(galaxyFadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
      if (rodSpawnTimer.current) clearInterval(rodSpawnTimer.current);
    } else if (scoreUI >= 20000 && currentModeRef.current !== 'monster') {
      // Monster appears - smooth fade in but immediately set to monster mode
      setBackgroundMode('monster');
      Animated.parallel([
        Animated.timing(galaxyFadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(monsterFadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
      startRodSpawning();
    } else if (scoreUI >= 15000 && currentModeRef.current !== 'galaxy') {
      // Galaxy appears - smooth transition but immediately set to galaxy mode
      setBackgroundMode('galaxy');
      Animated.parallel([
        Animated.timing(sunFadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(galaxyFadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (scoreUI >= 10000 && currentModeRef.current !== 'sun') {
      // Sun appears - smooth transition but immediately set to sun mode
      setBackgroundMode('sun');
      Animated.parallel([
        Animated.timing(spaceFadeAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sunFadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(spaceToSunAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (scoreUI >= 5000 && currentModeRef.current !== 'space') {
      // Smooth day to night transition but immediately set to space mode
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
    } else if (scoreUI < 5000 && currentModeRef.current !== 'sky') {
      // Sky transition - reset all but immediately set to sky mode
      setBackgroundMode('sky');
      Animated.parallel([
        Animated.timing(skyFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(spaceFadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sunFadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(galaxyFadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(monsterFadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(spaceToSunAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dayToNightAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scoreUI, startRodSpawning]);

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

  // Optimized render methods
  const renderClouds = useCallback(() => (
    <Animated.View style={{ opacity: skyFadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    }) }}>
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
        monsterFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.3]
        }) : 
        spaceFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        })
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
        monsterFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.2]
        }) : 
        spaceFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        })
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

  const renderSun = useCallback(() => (
    <Animated.View
      style={[
        styles.sunContainer,
        {
          opacity: sunFadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          }),
          transform: [{
            scale: sunFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.2]
            })
          }]
        },
      ]}
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
      style={[
        styles.galaxyContainer,
        {
          opacity: galaxyFadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          }),
          transform: [
            { scale: galaxyFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })}
          ],
        },
      ]}
    >
      <Image
        source={require('../../assets/images/galaxy.gif')}
        style={styles.galaxyImage}
        resizeMode="contain"
      />
    </Animated.View>
  ), [galaxyFadeAnim]);

  const renderMonster = useCallback(() => (
    <Animated.View style={[
      styles.monsterContainer,
      { 
        opacity: monsterFadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        }),
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
    ]}>
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
      {backgroundMode === 'sun' && renderSun()}
      {backgroundMode === 'galaxy' && renderGalaxy()}
      {backgroundMode === 'monster' && renderMonster()}
      {renderPlatforms()}
      {backgroundMode === 'monster' && renderRods()}

      {gameStatus === 'playing' && (
        <Image
          source={require('../../assets/images/favicon.png')}
          style={[styles.character, { left: playerX.current, top: playerY.current }]}
          resizeMode="contain"
        />
      )}

      <View style={styles.scoreContainer}>
        <Text style={styles.score}>Score: {scoreUI}</Text>
        <Text style={styles.highScore}>High Score: {highScoreUI}</Text>
        <Text style={styles.coins}>Coins: {displayCoins}</Text>
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
    width: CLOUD_WIDTH,
    height: CLOUD_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 30,
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
    shadowRadius: 5,
    shadowOpacity: 0.8,
  },
  sunContainer: {
    position: 'absolute',
    left: screenWidth / 2 - 100,
    top: 50,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunImage: {
    width: '100%',
    height: '100%',
  },
  galaxyContainer: {
    position: 'absolute',
    left: screenWidth / 2 - 150,
    top: screenHeight / 2 - 150,
    width: 300,
    height: 300,
  },
  galaxyImage: {
    width: '100%',
    height: '100%',
  },
  monsterContainer: {
    position: 'absolute',
    left: screenWidth / 2 - 150,
    top: screenHeight / 2 - 200,
    width: 300,
    height: 400,
    zIndex: 5,
  },
  monsterImage: {
    width: '100%',
    height: '100%',
  },
  platform: {
    position: 'absolute',
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    borderRadius: 10,
    zIndex: 10,
  },
  character: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    zIndex: 20,
  },
  rod: {
    position: 'absolute',
    width: ROD_WIDTH,
    height: ROD_HEIGHT,
    backgroundColor: '#ff0000',
    zIndex: 15,
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
    zIndex: 30,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  highScore: {
    fontSize: 16,
    color: '#fff',
  },
  coins: {
    fontSize: 16,
    color: 'gold',
    fontWeight: 'bold',
  },
  monsterWarning: {
    fontSize: 14,
    color: '#ff0000',
    marginVertical: 10,
    fontStyle: 'italic',
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
    paddingHorizontal: 20,
    zIndex: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
  },
});