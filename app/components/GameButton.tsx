import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

interface GameButtonProps {
  icon: string;
  text: string;
  onPress: () => void;
}

export default function GameButton({ icon, text, onPress }: GameButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={icon as any} size={32} color={COLORS.primary} />
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
    marginBottom: 20,
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
  },
});