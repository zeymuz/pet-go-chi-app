import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import COLORS from '../constants/colors';

interface StatusBarProps {
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  experience: number;
}

export default function StatusBar({
  happiness,
  hunger,
  energy,
  cleanliness,
  experience,
}: StatusBarProps) {
  const renderBar = (label: string, value: number, color: string) => {
    return (
      <View style={styles.barContainer}>
        <Text style={styles.label}>{label}:</Text>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${value}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.value}>{value}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderBar('Happy', happiness, COLORS.happiness)}
      {renderBar('Hunger', hunger, COLORS.hunger)}
      {renderBar('Energy', energy, COLORS.energy)}
      {renderBar('Clean', cleanliness, COLORS.cleanliness)}
      <View style={styles.experienceContainer}>
        <Text style={styles.label}>XP:</Text>
        <View style={styles.experienceBar}>
          <View
            style={[
              styles.experienceFill,
              { width: `${experience % 100}%` },
            ]}
          />
        </View>
        <Text style={styles.value}>{Math.floor(experience / 100)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff9b0',
    borderRadius: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    marginRight: 8,
    minWidth: 50,
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  value: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: COLORS.text,
    marginLeft: 8,
    minWidth: 30,
    textAlign: 'right',
  },
  experienceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  experienceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});