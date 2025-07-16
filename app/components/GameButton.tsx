import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
    backgroundColor: COLORS.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center',
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