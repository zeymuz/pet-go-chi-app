// app/coins.tsx
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import COLORS from '../constants/colors';

export default function CoinsScreen() {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setupRevenueCat();
    }
  }, [isFocused]);

  const setupRevenueCat = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      Purchases.setDebugLogsEnabled(true);
      Purchases.configure({
        apiKey: "appl_YOUR_REVENUECAT_API_KEY", // Replace with your actual RevenueCat API key
        appUserID: null,
      });

      const offerings = await Purchases.getOfferings();
      setOfferings(offerings.current);
    } catch (error) {
      console.log('RevenueCat Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageIdentifier: string) => {
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(packageIdentifier);
      
      if (customerInfo.entitlements.active['premium']) {
        Alert.alert('Success', 'Your purchase was successful!');
      }
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
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['premium']) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading coin packages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buy Coins</Text>
      </View>

      {offerings ? (
        <View style={styles.packagesContainer}>
          {offerings.availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={styles.coinPackage}
              onPress={() => handlePurchase(pkg.identifier)}
              disabled={isLoading}
            >
              <Text style={styles.coinAmount}>{pkg.product.title}</Text>
              <Text style={styles.coinPrice}>{pkg.product.priceString}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.errorText}>No coin packages available at this time.</Text>
      )}

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestorePurchases}
        disabled={isLoading}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40c4ff',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PressStart2P',
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 20,
  },
  packagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinPackage: {
    backgroundColor: '#fff9b0',
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }
    }),
  },
  coinAmount: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 5,
  },
  coinPrice: {
    fontFamily: 'PressStart2P',
    fontSize: 16,
    color: COLORS.primary,
  },
  restoreButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: 'white',
  },
});