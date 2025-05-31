import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import  COLORS  from '../constants/colors';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 40;
const PLATFORM_HEIGHT = 20;
const GRAVITY = 1;
const JUMP_FORCE = -20;
const INITIAL_PLATFORM_SPEED = 3;

interface PlatformJumperGameProps {
  onClose: () => void;
}

export default function PlatformJumperGame({ onClose }: PlatformJumperGameProps) {
  const [playerPosition, setPlayerPosition] = useState(height - 100);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [platforms, setPlatforms] = useState<{ x: number; width: number; moving: boolean }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [platformSpeed, setPlatformSpeed] = useState(INITIAL_PLATFORM_SPEED);
  
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const platformLoopRef = useRef<NodeJS.Timeout>();
  const playerVelocityRef = useRef(0);
  const isJumpingRef = useRef(false);

  const jump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      startGame();
      return;
    }
    
    // Can only jump when on a platform
    if (!isJumpingRef.current) {
      playerVelocityRef.current = JUMP_FORCE;
      isJumpingRef.current = true;
    }
  };

  const startGame = () => {
    setPlatforms([]);
    setScore(0);
    setPlayerPosition(height - 100);
    setGameOver(false);
    setPlatformSpeed(INITIAL_PLATFORM_SPEED);
    isJumpingRef.current = false;
    
    // Initial platform
    setPlatforms([{ x: width / 2 - 50, width: 100, moving: false }]);
    
    // Game loop
    gameLoopRef.current = setInterval(() => {
      setPlayerPosition(prev => {
        const newPosition = prev + playerVelocityRef.current;
        playerVelocityRef.current += GRAVITY;
        
        // Check if player hits the ground
        if (newPosition >= height - PLAYER_SIZE) {
          endGame();
          return prev;
        }
        
        // Check if player lands on a platform
        let onPlatform = false;
        platforms.forEach(platform => {
          if (
            newPosition + PLAYER_SIZE >= height - 100 - PLATFORM_HEIGHT &&
            newPosition + PLAYER_SIZE <= height - 100 &&
            width / 2 - PLAYER_SIZE / 2 >= platform.x - platform.width / 2 &&
            width / 2 - PLAYER_SIZE / 2 <= platform.x + platform.width / 2
          ) {
            onPlatform = true;
            isJumpingRef.current = false;
            playerVelocityRef.current = 0;
            return height - 100 - PLAYER_SIZE;
          }
        });
        
        if (!onPlatform) {
          isJumpingRef.current = true;
        }
        
        return newPosition;
      });
    }, 20);
    
    // Platform generation loop
    platformLoopRef.current = setInterval(() => {
      setPlatforms(prev => {
        const newPlatforms = [...prev];
        
        // Remove platforms that are off screen
        newPlatforms.forEach((platform, index) => {
          if (platform.x + platform.width / 2 < 0) {
            newPlatforms.splice(index, 1);
            setScore(prevScore => prevScore + 1);
            setPlatformSpeed(prev => prev + 0.1);
          }
        });
        
        // Add new platform
        if (newPlatforms.length < 5) {
          const isMoving = Math.random() > 0.7;
          newPlatforms.push({
            x: width,
            width: Math.random() * 100 + 50,
            moving: isMoving,
          });
        }
        
        // Move platforms
        return newPlatforms.map(platform => ({
          ...platform,
          x: platform.x - (platform.moving ? platformSpeed * 1.5 : platformSpeed),
        }));
      });
    }, 20);
  };

  const endGame = () => {
    clearInterval(gameLoopRef.current);
    clearInterval(platformLoopRef.current);
    setGameOver(true);
    setGameStarted(false);
  };

  useEffect(() => {
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(platformLoopRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      
      <Text style={styles.score}>Score: {score}</Text>
      
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Final Score: {score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={startGame}>
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.gameArea} 
        activeOpacity={1} 
        onPress={jump}
      >
        <Image
          source={require('../../assets/images/adaptive-icon.png')}
          style={[
            styles.player,
            {
              bottom: height - playerPosition - PLAYER_SIZE,
            },
          ]}
        />
        
        {platforms.map((platform, index) => (
          <View
            key={index}
            style={[
              styles.platform,
              {
                left: platform.x - platform.width / 2,
                width: platform.width,
                backgroundColor: platform.moving ? '#FF5722' : COLORS.primary,
              },
            ]}
          />
        ))}
        
        <View style={styles.spikes} />
      </TouchableOpacity>
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
  closeButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: '#fff',
  },
  score: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    left: width / 2 - PLAYER_SIZE / 2,
    resizeMode: 'contain',
    zIndex: 10,
  },
  platform: {
    position: 'absolute',
    height: PLATFORM_HEIGHT,
    bottom: 80,
    borderRadius: 5,
  },
  spikes: {
    position: 'absolute',
    height: 20,
    width: '100%',
    bottom: 60,
    backgroundColor: '#F44336',
  },
  gameOverContainer: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  gameOverText: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  finalScore: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
  },
  restartButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#fff',
  },
});