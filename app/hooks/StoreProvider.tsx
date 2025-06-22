// hooks/StoreProvider.tsx
import React, { createContext, useContext, useState } from 'react';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [coins, setCoins] = useState(100);
  // ... other state

  const earnCoins = (amount) => {
    setCoins(prev => {
      const newAmount = prev + amount;
      console.log(`Updating coins to ${newAmount}`);
      return newAmount;
    });
  };

  return (
    <StoreContext.Provider value={{ coins, earnCoins /* ... */ }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

export default StoreProvider;