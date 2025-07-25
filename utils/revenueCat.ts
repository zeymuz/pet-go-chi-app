// utils/revenueCat.ts
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export const configureRevenueCat = () => {
  Purchases.configure({
    apiKey: Platform.OS === 'ios' 
      ? "appl_dIsyngMoPJOuOqFKzckdSCPNhgf" // Replace with your iOS key
      : "public_YOUR_ANDROID_API_KEY", // Replace with your Android key
    appUserID: null,
  });
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('Offerings:', offerings);
    return offerings.current;
  } catch (error) {
    console.log('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageIdentifier: string) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageIdentifier);
    return customerInfo;
  } catch (error) {
    throw error;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    throw error;
  }
};

export const getCustomerInfo = async () => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.log('Error getting customer info:', error);
    return null;
  }
};