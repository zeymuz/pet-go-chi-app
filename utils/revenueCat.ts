// utils/revenueCat.ts
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesOffering
} from 'react-native-purchases';

// Type for RevenueCat error objects
type RevenueCatError = {
  code: PURCHASES_ERROR_CODE;
  message: string;
  userCancelled: boolean;
  readableErrorCode: string;
};

// Configuration
let isConfigured = false;
const APIKeys = {
  ios: 'appl_RFfBKhGVnSyVXbigoEGvjQYhtkH',
  android: 'goog_your_android_api_key_here'
};

export function configureRevenueCat() {
  if (isConfigured) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? APIKeys.ios : APIKeys.android,
    usesStoreKit2IfAvailable: true
  });

  // Enable sandbox testing if in development
  if (__DEV__) {
    Purchases.setSimulatesAskToBuyInSandbox(true);
  }

  isConfigured = true;
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      console.warn('No current offering - check your RevenueCat dashboard');
      return null;
    }
    
    return offerings.current;
  } catch (error) {
    const rcError = error as RevenueCatError;
    console.error('Offerings error:', {
      code: rcError.readableErrorCode,
      message: rcError.message,
      userCancelled: rcError.userCancelled
    });
    return null;
  }
}

export async function purchasePackage(packageId: string): Promise<CustomerInfo> {
  try {
    // First check if products are available
    const products = await Purchases.getProducts([packageId]);
    if (products.length === 0) {
      throw new Error('Product not available in store');
    }

    const offerings = await Purchases.getOfferings();
    const packageToPurchase = offerings.current?.availablePackages.find(
      pkg => pkg.identifier === packageId
    );

    if (!packageToPurchase) {
      throw new Error('Package not found in offerings');
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    const rcError = error as RevenueCatError;
    
    // Special handling for unapproved IAPs
    if (rcError.readableErrorCode === 'PRODUCT_NOT_AVAILABLE') {
      throw new Error(
        'In-app purchase not approved yet. ' +
        'Please try again later or contact support.'
      );
    }

    if (rcError.userCancelled) {
      throw new Error('Purchase cancelled by user');
    }

    throw new Error(`Purchase failed: ${rcError.message}`);
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    const rcError = error as RevenueCatError;
    throw new Error(`Restore failed: ${rcError.message}`);
  }
}

export function addPurchaseListener(
  listener: (customerInfo: CustomerInfo) => void
) {
  return Purchases.addCustomerInfoUpdateListener(listener);
}

export async function getProducts(): Promise<string[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages.map(pkg => pkg.identifier) || [];
}

// Helper to debug IAP status
export async function debugIAPStatus() {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('Offerings:', JSON.stringify(offerings, null, 2));
    
    const products = await Purchases.getProducts(['coins_100']);
    console.log('Product availability:', products.map(p => ({
      id: p.identifier,
      price: p.priceString,
      available: true
    })));
    
    return {
      offerings: offerings.current?.availablePackages || [],
      products
    };
  } catch (error) {
    console.error('Debug error:', error);
    throw error;
  }
}