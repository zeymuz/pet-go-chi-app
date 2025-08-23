// hooks/PetContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface PetState {
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  level: number;
  experience: number;
  isSleeping: boolean;
}

interface PetContextType extends PetState {
  updatePetState: (updates: Partial<PetState>) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [petState, setPetState] = useState<PetState>({
    happiness: 70,
    hunger: 30,
    energy: 80,
    cleanliness: 90,
    level: 1,
    experience: 0,
    isSleeping: false,
  });

  const updatePetState = useCallback((updates: Partial<PetState>) => {
    setPetState(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...petState,
    updatePetState,
  }), [petState, updatePetState]);

  return (
    <PetContext.Provider value={contextValue}>
      {children}
    </PetContext.Provider>
  );
};

export const usePetContext = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePetContext must be used within a PetProvider');
  }
  return context;
};

export default PetContext;