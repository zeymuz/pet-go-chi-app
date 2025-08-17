// app/coins.tsx
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesOffering } from 'react-native-purchases';
import { configureRevenueCat, getOfferings, purchasePackage, restorePurchases } from '../../utils/revenueCat';
import { scale, scaleFont, verticalScale } from '../../utils/scaling';
import COLORS from '../constants/colors';
import useStore from '../hooks/useStore';

const MOCK_PACKAGES = [
  {
    identifier: 'coins_100',
    product: { title: '100 Coins', priceString: '$0.99', price: 0.99 }
  },
  {
    identifier: 'coins_500',
    product: { title: '500 Coins', priceString: '$3.99', price: 3.99 }
  },
  {
    identifier: 'coins_1200',
    product: { title: '1,200 Coins', priceString: '$7.99', price: 7.99 }
  },
  {
    identifier: 'coins_2500',
    product: { title: '2,500 Coins', priceString: '$12.99', price: 12.99 }
  },
  {
    identifier: 'coins_5000',
    product: { title: '5,000 Coins', priceString: '$19.99', price: 19.99 }
  },
  {
    identifier: 'coins_10000',
    product: { title: '10,000 Coins', priceString: '$29.99', price: 29.99 }
  }
];

export default function CoinsScreen() {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const isFocused = useIsFocused();
  const { earnCoins } = useStore();

  useEffect(() => {
    if (isFocused) {
      setupRevenueCat();
    }
  }, [isFocused]);

  const setupRevenueCat = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      setUsingMockData(true);
      setIsLoading(false);
      return;
    }

    try {
      configureRevenueCat();
      const offerings = await getOfferings();
      
      if (offerings && offerings.availablePackages.length > 0) {
        setOfferings(offerings);
      } else {
        setUsingMockData(true);
      }
    } catch (error) {
      console.log('RevenueCat Error:', error);
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageIdentifier: string) => {
    try {
      setIsLoading(true);
      
      if (usingMockData) {
        const coins = parseInt(packageIdentifier.replace(/\D/g, ''));
        earnCoins(coins);
        Alert.alert('Success', `Added ${coins} coins to your balance!`);
        return;
      }

      const customerInfo = await purchasePackage(packageIdentifier);
      const coins = parseInt(packageIdentifier.replace(/\D/g, ''));
      earnCoins(coins);
      Alert.alert('Success', `Added ${coins} coins to your balance!`);
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', 'There was an error with your purchase. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      
      if (usingMockData) {
        Alert.alert('Mock Restore', 'No purchases to restore in development mode');
        return;
      }

      const customerInfo = await restorePurchases();
      const restoredCoins = customerInfo.allPurchasedProductIdentifiers
        .reduce((total, id) => total + (parseInt(id.replace(/\D/g, '')) || 0), 0);
      
      earnCoins(restoredCoins);
      Alert.alert('Success', `Restored ${restoredCoins} coins to your balance!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTerms = () => {
    // Replace with your actual terms URL
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const handleOpenPrivacyPolicy = () => {
    // Replace with your actual privacy policy URL
    Linking.openURL('https://www.freeprivacypolicy.com/live/b305aad1-99d2-41ac-b4ff-1e63659b8118');
  };

  const getPackages = () => {
    if (usingMockData) {
      return MOCK_PACKAGES;
    }
    return offerings?.availablePackages || [];
  };

  const getBestValuePackage = () => {
    const packages = getPackages();
    if (packages.length === 0) return null;
    
    return packages.reduce((best, pkg) => {
      const coins = parseInt(pkg.product.title.replace(/\D/g, ''));
      const value = coins / pkg.product.price;
      return value > best.value ? { pkg, value } : best;
    }, { pkg: packages[0], value: 0 }).pkg;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading coin packages...</Text>
      </View>
    );
  }

  const bestValuePackage = getBestValuePackage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buy Coins</Text>
        <Text style={styles.subtitle}>Get coins to buy food and outfits for your pet!</Text>
      </View>

      {bestValuePackage && (
        <View style={styles.bestValueContainer}>
          <Text style={styles.bestValueBadge}>BEST VALUE</Text>
          <TouchableOpacity
            style={[styles.coinPackage, styles.bestValuePackage]}
            onPress={() => handlePurchase(bestValuePackage.identifier)}
            disabled={isLoading}
          >
            <Text style={styles.coinAmount}>{bestValuePackage.product.title}</Text>
            <Text style={styles.coinPrice}>{bestValuePackage.product.priceString}</Text>
            <Text style={styles.coinBonus}>+30% Bonus!</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.packagesContainer}>
        {getPackages().map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            style={[
              styles.coinPackage,
              pkg.identifier === bestValuePackage?.identifier && styles.hiddenPackage
            ]}
            onPress={() => handlePurchase(pkg.identifier)}
            disabled={isLoading}
          >
            <Text style={styles.coinAmount}>{pkg.product.title}</Text>
            <Text style={styles.coinPrice}>{pkg.product.priceString}</Text>
            {pkg.identifier.includes('5000') && (
              <Text style={styles.coinBonus}>+20% Bonus!</Text>
            )}
            {pkg.identifier.includes('2500') && (
              <Text style={styles.coinBonus}>+15% Bonus!</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Payment will be charged to your Apple ID/Google Play account at confirmation of purchase.
        </Text>
        

        <View style={styles.legalLinksContainer}>
          <TouchableOpacity onPress={handleOpenTerms}>
            <Text style={styles.legalLinkText}>Terms of Use</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: verticalScale(20),
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(24),
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(8),
  },
  loadingText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(16),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
  bestValueContainer: {
    marginBottom: verticalScale(20),
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: verticalScale(-10),
    right: scale(20),
    backgroundColor: '#FFD700',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: scale(10),
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: '#000',
    zIndex: 1,
  },
  packagesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  coinPackage: {
    backgroundColor: '#fff9b0',
    padding: verticalScale(3),
    borderRadius: scale(12),
    marginVertical: verticalScale(8),
    width: '100%',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: '#40c4ff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.25,
        shadowRadius: scale(3.84),
      },
      android: {
        elevation: 5,
      }
    }),
  },
  bestValuePackage: {
    backgroundColor: '#FFD700',
    borderColor: '#FF6B6B',
    borderWidth: scale(3),
  },
  hiddenPackage: {
    display: 'none',
  },
  coinAmount: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(20),
    color: COLORS.text,
    marginBottom: verticalScale(5.5),
  },
  coinPrice: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(18),
    color: COLORS.primary,
  },
  coinBonus: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(12),
    color: '#4CAF50',
    marginTop: verticalScale(5),
  },
  footer: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(40),
    alignItems: 'center',
  },
  disclaimer: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  restoreButton: {
    backgroundColor: '#FF6B6B',
    padding: verticalScale(15),
    borderRadius: scale(8),
    width: '80%',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  restoreButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(14),
    color: 'white',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  legalLinkText: {
    fontFamily: 'PressStart2P',
    fontSize: scaleFont(10),
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});