// Button.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

interface ButtonProps {
  icon: string;
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function Button({ icon, text, onPress, disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.disabledButton]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={24} color={disabled ? '#ccc' : COLORS.primary} />
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff9b0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 60,
    ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }
        }),
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    marginTop: 4,
  },
  disabledText: {
    color: '#999',
  },
});