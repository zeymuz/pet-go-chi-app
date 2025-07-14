import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

  const storeItems = [...outfits, ...foods];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.coins} testID="coins-display">
          Coins: {displayCoins}
        </Text>
      </View>

      <FlatList
        data={storeItems}
        renderItem={({ item }) => (
          <StoreItem
            item={item}
            onPurchase={() => purchaseItem(item.id)}
            onEquip={() => equipOutfit(item.id)}
            isEquipped={equippedOutfits[item.type] === item.id}
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
  listContent: {
    paddingBottom: 20,
  },
});