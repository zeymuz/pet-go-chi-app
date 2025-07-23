import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
import StoreItem from '../components/StoreItem';
import COLORS from '../constants/colors';
import useStore from '../hooks/useStore';


export default function StoreScreen() {
  const isFocused = useIsFocused();
  const { coins, outfits, foods, purchaseItem, equippedOutfits, equipOutfit } = useStore();
  const [displayCoins, setDisplayCoins] = useState(coins);

  useEffect(() => {
    if (isFocused) {
      setDisplayCoins(coins);
      console.log('StoreScreen updated, current coins:', coins);
    }
  }, [isFocused, coins]);

  // Group outfits by type
  const groupedOutfits = outfits.reduce((acc: Record<string, any[]>, outfit) => {
    if (!acc[outfit.type]) {
      acc[outfit.type] = [];
    }
    acc[outfit.type].push(outfit);
    return acc;
  }, {});

  const storeSections = [
    {
      title: 'FOOD',
      data: foods,
      renderItem: ({ item }: { item: any }) => (
        <StoreItem
          item={item}
          onPurchase={(quantity) => purchaseItem(item.id, quantity)}
          onEquip={() => equipOutfit(item.id)}
          isEquipped={equippedOutfits[item.type] === item.id}
          owned={true} // All food is always available to purchase
          quantity={0} // Not used for food in store
        />
      )
    },
    ...Object.entries(groupedOutfits).map(([type, items]) => ({
      title: type.toUpperCase(),
      data: items,
      renderItem: ({ item }: { item: any }) => (
        <StoreItem
          item={item}
          onPurchase={(quantity) => purchaseItem(item.id, quantity)}
          onEquip={() => equipOutfit(item.id)}
          isEquipped={equippedOutfits[item.type] === item.id}
          owned={item.owned}
          quantity={0}
        />
      )
    }))
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.coins} testID="coins-display">
          Coins: {displayCoins}
        </Text>
      </View>

      <ScrollView style={styles.listContent}>
  {storeSections.map((section, index) => (
    <View key={index}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <FlatList
        data={section.data}
        keyExtractor={(item) => item.id}
        renderItem={section.renderItem}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
      />
    </View>
  ))}
</ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40c4ff',
    padding: verticalScale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(24),
    color: COLORS.primary,
  },
  coins: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(16),
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  sectionHeader: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(20),
    color: COLORS.text,
    backgroundColor: '#40c4ff',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    marginTop: verticalScale(15),
    borderBottomWidth: scale(2),
    borderBottomColor: '#FFD700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: scale(8),
  },
});