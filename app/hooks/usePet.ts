// hooks/usePet.ts
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import useStore from './useStore';

const usePet = () => {
  const [happiness, setHappiness] = useState(70);
  const [hunger, setHunger] = useState(30);
  const [energy, setEnergy] = useState(80);
  const [cleanliness, setCleanliness] = useState(90);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [showOutfits, setShowOutfits] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState<number | null>(null);
  const { foodQuantities, consumeFood } = useStore();

  // Add this state to track when energy was last updated
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState(Date.now());

  useEffect(() => {
    const loadPetState = async () => {
      try {
        const [storedPet, storedSleep] = await Promise.all([
          SecureStore.getItemAsync('petState'),
          SecureStore.getItemAsync('petSleep')
        ]);

        if (storedPet) {
          const parsedPet = JSON.parse(storedPet);
          setHappiness(parsedPet.happiness ?? 70);
          setHunger(parsedPet.hunger ?? 30);
          setEnergy(parsedPet.energy ?? 80);
          setCleanliness(parsedPet.cleanliness ?? 90);
          setLevel(parsedPet.level ?? 1);
          setExperience(parsedPet.experience ?? 0);
          setShowOutfits(parsedPet.showOutfits ?? false);
          setShowFood(parsedPet.showFood ?? false);
          setIsSleeping(parsedPet.isSleeping ?? false);
          setSleepStartTime(parsedPet.sleepStartTime ?? null);
          setLastEnergyUpdate(parsedPet.lastEnergyUpdate ?? Date.now());
        }

        if (storedSleep) {
          const { isSleeping: storedIsSleeping, sleepStartTime: storedSleepStart } = JSON.parse(storedSleep);
          if (storedIsSleeping && storedSleepStart) {
            const now = Date.now();
            const elapsedHours = (now - storedSleepStart) / (1000 * 60 * 60);
            
            if (elapsedHours >= 1.5) {
              setEnergy(100);
              setIsSleeping(false);
              await SecureStore.deleteItemAsync('petSleep');
            } else {
              setIsSleeping(true);
              setSleepStartTime(storedSleepStart);
              const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
              setEnergy(energyToAdd);
            }
          }
        }
      } catch (error) {
        console.error('Error loading pet state:', error);
      }
    };

    loadPetState();
  }, []);

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
          lastEnergyUpdate
        };
        await SecureStore.setItemAsync('petState', JSON.stringify(petState));
      } catch (error) {
        console.error('Error saving pet state:', error);
      }
    };

    savePetState();
  }, [happiness, hunger, energy, cleanliness, level, experience, showOutfits, showFood, isSleeping, sleepStartTime, lastEnergyUpdate]);

  // Handle sleep timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSleeping && sleepStartTime) {
      const updateEnergyFromSleep = () => {
        const now = Date.now();
        const elapsedHours = (now - sleepStartTime) / (1000 * 60 * 60);
        const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
        setEnergy(energyToAdd);
        setLastEnergyUpdate(Date.now());
        
        if (elapsedHours >= 1.5) {
          wakeUp();
          clearInterval(interval);
        }
      };

      // Immediate update
      updateEnergyFromSleep();
      
      // Set up interval for periodic updates
      interval = setInterval(updateEnergyFromSleep, 60000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSleeping, sleepStartTime]);

  // Degradation over time
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSleeping) {
        setHappiness(prev => Math.max(0, prev - 1));
        setHunger(prev => Math.min(100, prev + 2));
        setEnergy(prev => Math.max(0, prev - 1));
        setCleanliness(prev => Math.max(0, prev - 0.5));
        setLastEnergyUpdate(Date.now());
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Level up check
  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(prev => prev + 1);
      setExperience(0);
    }
  }, [experience, level]);

  const feed = (foodItem?: { id: string; hungerRestore: number; energyRestore?: number }) => {
    if (foodItem && foodQuantities[foodItem.id] > 0) {
      if (foodItem.hungerRestore) {
        setHunger(prev => Math.max(0, prev - foodItem.hungerRestore));
      }
      
      if (foodItem.energyRestore) {
        setEnergy(prev => Math.min(100, prev + (foodItem.energyRestore || 0)));
        setLastEnergyUpdate(Date.now());
      }
      
      setHappiness(prev => Math.min(100, prev + 5));
      setExperience(prev => prev + 10);
      consumeFood(foodItem.id);
      return true;
    }
    return false;
  };

  const play = () => {
    if (energy <= 15 || hunger > 85) return false;
    setHappiness(prev => Math.min(100, prev + 15));
    setEnergy(prev => Math.max(0, prev - 10));
    setHunger(prev => Math.min(100, prev + 5));
    setExperience(prev => prev + 15);
    setLastEnergyUpdate(Date.now());
    return true;
  };

  const sleep = async () => {
    if (isSleeping) return;
    setIsSleeping(true);
    const now = Date.now();
    setSleepStartTime(now);
    setLastEnergyUpdate(now);
    await SecureStore.setItemAsync('petSleep', JSON.stringify({
      isSleeping: true,
      sleepStartTime: now
    }));
  };

  const wakeUp = async () => {
    setIsSleeping(false);
    setSleepStartTime(null);
    setLastEnergyUpdate(Date.now());
    await SecureStore.deleteItemAsync('petSleep');
  };

  const clean = () => {
    setCleanliness(100);
    setHappiness(prev => Math.min(100, prev + 10));
    setExperience(prev => prev + 5);
  };

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
    lastEnergyUpdate
  };
};

export default usePet;