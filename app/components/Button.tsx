import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

interface ButtonProps {
  icon: string;
  text: string;
  onPress: () => void;
}

export default function Button({ icon, text, onPress }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 60,
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    marginTop: 4,
  },
});