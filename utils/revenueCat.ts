// utils/revenueCat.ts
import Purchases from 'react-native-purchases';

export const configureRevenueCat = () => {
  if (Platform.OS === 'ios') {
    Purchases.configure({
      apiKey: "appl_YOUR_REVENUECAT_API_KEY", // Replace with your actual RevenueCat API key
      appUserID: null,
    });
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
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