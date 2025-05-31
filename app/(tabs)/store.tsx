import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import StoreItem from '../components/StoreItem';
import COLORS from '../constants/colors';
import useStore from './../hooks/useStore';

export default function StoreScreen() {
  const { outfits, pets, coins, purchaseItem, equippedOutfit, equipOutfit } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.coins}>Coins: {coins}</Text>
      </View>

      <Text style={styles.sectionTitle}>Outfits</Text>
      <FlatList
        data={outfits}
        renderItem={({ item }) => (
          <StoreItem
            item={item}
            onPurchase={() => purchaseItem(item.id, 'outfit')}
            onEquip={() => equipOutfit(item.id)}
            isEquipped={equippedOutfit === item.id}
            owned={item.owned}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />

      <Text style={styles.sectionTitle}>Pets</Text>
      <FlatList
        data={pets}
        renderItem={({ item }) => (
          <StoreItem
            item={item}
            onPurchase={() => purchaseItem(item.id, 'pet')}
            onEquip={() => {}}
            isEquipped={false}
            owned={item.owned}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: COLORS.primary,
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: COLORS.text,
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
});