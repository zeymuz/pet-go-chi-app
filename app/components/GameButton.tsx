import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

interface GameButtonProps {
  image: any;
  text: string;
  onPress: () => void;
}

export default function GameButton({ image, text, onPress }: GameButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Image
        source={image}
        style={styles.gameImage}
        resizeMode="contain"
      />
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff9b0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
    ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }
            }),
  },
  gameImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
});