// hooks/usePet.ts
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { usePetContext } from './PetContext';
import useStore from './useStore';

const usePet = () => {
  const {
    happiness,
    hunger,
    energy,
    cleanliness,
    level,
    experience,
    isSleeping,
    updatePetState
  } = usePetContext();

  const [showOutfits, setShowOutfits] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState<number | null>(null);
  const { foodQuantities, consumeFood } = useStore();

  // Add this state to track when stats were last updated
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Load pet state on component mount
  useEffect(() => {
    const loadPetState = async () => {
      try {
        const [storedPet, storedSleep] = await Promise.all([
          SecureStore.getItemAsync('petState'),
          SecureStore.getItemAsync('petSleep')
        ]);

        if (storedPet) {
          const parsedPet = JSON.parse(storedPet);
          updatePetState({
            happiness: parsedPet.happiness ?? 70,
            hunger: parsedPet.hunger ?? 30,
            energy: parsedPet.energy ?? 80,
            cleanliness: parsedPet.cleanliness ?? 90,
            level: parsedPet.level ?? 1,
            experience: parsedPet.experience ?? 0,
            isSleeping: parsedPet.isSleeping ?? false,
          });
          setShowOutfits(parsedPet.showOutfits ?? false);
          setShowFood(parsedPet.showFood ?? false);
          setSleepStartTime(parsedPet.sleepStartTime ?? null);
          setLastUpdateTime(parsedPet.lastUpdateTime ?? Date.now());
        }

        if (storedSleep) {
          const { isSleeping: storedIsSleeping, sleepStartTime: storedSleepStart } = JSON.parse(storedSleep);
          if (storedIsSleeping && storedSleepStart) {
            const now = Date.now();
            const elapsedHours = (now - storedSleepStart) / (1000 * 60 * 60);
            
            if (elapsedHours >= 1.5) {
              updatePetState({ energy: 100, isSleeping: false });
              await SecureStore.deleteItemAsync('petSleep');
            } else {
              updatePetState({ isSleeping: true });
              setSleepStartTime(storedSleepStart);
              const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
              updatePetState({ energy: energyToAdd });
            }
          }
        }
      } catch (error) {
        console.error('Error loading pet state:', error);
      }
    };

    loadPetState();
  }, [updatePetState]);

  // Save pet state whenever it changes
  useEffect(() => {
    const savePetState = async () => {
      try {
        const petState = {
          happiness,
          hunger,
          energy,
          cleanliness,
          level,
          experience,
          showOutfits,
          showFood,
          isSleeping,
          sleepStartTime,
          lastUpdateTime
        };
        await SecureStore.setItemAsync('petState', JSON.stringify(petState));
      } catch (error) {
        console.error('Error saving pet state:', error);
      }
    };

    savePetState();
  }, [happiness, hunger, energy, cleanliness, level, experience, showOutfits, showFood, isSleeping, sleepStartTime, lastUpdateTime]);

  // Handle sleep timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSleeping && sleepStartTime) {
      const updateEnergyFromSleep = () => {
        const now = Date.now();
        const elapsedHours = (now - sleepStartTime) / (1000 * 60 * 60);
        const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
        updatePetState({ energy: energyToAdd });
        setLastUpdateTime(Date.now());
        
        if (elapsedHours >= 1.5) {
          wakeUp();
          clearInterval(interval);
        }
      };

      updateEnergyFromSleep();
      interval = setInterval(updateEnergyFromSleep, 60000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSleeping, sleepStartTime, updatePetState]);

  // Degradation over time with immediate update on mount
  useEffect(() => {
    const updateDegradation = () => {
      const now = Date.now();
      const minutesPassed = (now - lastUpdateTime) / (1000 * 60);
      
      if (minutesPassed >= 1 && !isSleeping) {
        const degradationFactor = Math.floor(minutesPassed);
        
        updatePetState({
          happiness: Math.max(0, happiness - degradationFactor),
          hunger: Math.min(100, hunger + (2 * degradationFactor)),
          energy: Math.max(0, energy - degradationFactor),
          cleanliness: Math.max(0, cleanliness - (0.5 * degradationFactor)),
        });
        setLastUpdateTime(now);
      }
    };

    updateDegradation();
    const interval = setInterval(updateDegradation, 60000);

    return () => clearInterval(interval);
  }, [isSleeping, lastUpdateTime, happiness, hunger, energy, cleanliness, updatePetState]);

  // Level up check
  useEffect(() => {
    if (experience >= level * 100) {
      updatePetState({ level: level + 1, experience: 0 });
    }
  }, [experience, level, updatePetState]);

  const feed = useCallback((foodItem?: { id: string; hungerRestore: number; energyRestore?: number }) => {
    if (foodItem && foodQuantities[foodItem.id] > 0) {
      const updates: any = {
        happiness: Math.min(100, happiness + 5),
        experience: experience + 10,
      };
      
      if (foodItem.hungerRestore) {
        updates.hunger = Math.max(0, hunger - foodItem.hungerRestore);
      }
      
      if (foodItem.energyRestore) {
        updates.energy = Math.min(100, energy + (foodItem.energyRestore || 0));
      }
      
      updatePetState(updates);
      consumeFood(foodItem.id);
      setLastUpdateTime(Date.now());
      return true;
    }
    return false;
  }, [foodQuantities, consumeFood, happiness, hunger, energy, experience, updatePetState]);

  const play = useCallback(() => {
    if (energy <= 15 || hunger > 85) {
      return false;
    }
    
    updatePetState({
      happiness: Math.min(100, happiness + 15),
      energy: Math.max(0, energy - 10),
      hunger: Math.min(100, hunger + 5),
      experience: experience + 15,
    });
    setLastUpdateTime(Date.now());
    return true;
  }, [energy, hunger, happiness, experience, updatePetState]);

  const sleep = useCallback(async () => {
    if (isSleeping) return;
    
    updatePetState({ isSleeping: true });
    const now = Date.now();
    setSleepStartTime(now);
    setLastUpdateTime(now);
    
    await SecureStore.setItemAsync('petSleep', JSON.stringify({
      isSleeping: true,
      sleepStartTime: now,
      initialEnergy: energy
    }));
  }, [isSleeping, energy, updatePetState]);

  const wakeUp = useCallback(async () => {
    updatePetState({ isSleeping: false });
    setSleepStartTime(null);
    setLastUpdateTime(Date.now());
    await SecureStore.deleteItemAsync('petSleep');
  }, [updatePetState]);

  const clean = useCallback(() => {
    updatePetState({
      cleanliness: 100,
      happiness: Math.min(100, happiness + 10),
      experience: experience + 5,
    });
    setLastUpdateTime(Date.now());
  }, [happiness, experience, updatePetState]);

  return {
    feed,
    play,
    sleep,
    wakeUp,
    clean,
    happiness,
    hunger,
    energy,
    cleanliness,
    level,
    experience,
    showOutfits,
    setShowOutfits,
    showFood,
    setShowFood,
    isSleeping,
  };
};

export default usePet;