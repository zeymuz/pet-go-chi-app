import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
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
    backgroundColor: '#FFD700',
    padding: verticalScale(20),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(15),
    width: '80%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  gameImage: {
    width: scale(80),
    height: scale(80),
    marginBottom: verticalScale(10),
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(14),
    color: COLORS.text,
    textAlign: 'center',
  },
});