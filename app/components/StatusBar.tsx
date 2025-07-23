import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
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
    padding: verticalScale(10),
    backgroundColor: '#FFD700',
    borderRadius: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      }
    }),
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    marginRight: scale(8),
    minWidth: scale(50),
  },
  barBackground: {
    flex: 1,
    height: verticalScale(10),
    backgroundColor: 'lightgrey',
    borderRadius: scale(5),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: scale(5),
  },
  value: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    marginLeft: scale(8),
    minWidth: scale(30),
    textAlign: 'right',
  },
  experienceBar: {
    flex: 1,
    height: verticalScale(8),
    backgroundColor: 'lightgrey',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  experienceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: scale(4),
  },
});