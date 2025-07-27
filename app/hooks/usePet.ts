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

  // Load all pet data on app start
  useEffect(() => {
    const loadPetState = async () => {
      const storedPet = await SecureStore.getItemAsync('petState');
      if (storedPet) {
        const { 
          happiness: storedHappiness,
          hunger: storedHunger,
          energy: storedEnergy,
          cleanliness: storedCleanliness,
          level: storedLevel,
          experience: storedExp,
          showOutfits: storedShowOutfits,
          showFood: storedShowFood,
          isSleeping: storedIsSleeping,
          sleepStartTime: storedSleepStartTime
        } = JSON.parse(storedPet);
        
        setHappiness(storedHappiness ?? 70);
        setHunger(storedHunger ?? 30);
        setEnergy(storedEnergy ?? 80);
        setCleanliness(storedCleanliness ?? 90);
        setLevel(storedLevel ?? 1);
        setExperience(storedExp ?? 0);
        setShowOutfits(storedShowOutfits ?? false);
        setShowFood(storedShowFood ?? false);
        setIsSleeping(storedIsSleeping ?? false);
        setSleepStartTime(storedSleepStartTime ?? null);
      }

      const storedSleep = await SecureStore.getItemAsync('petSleep');
      if (storedSleep) {
        const { isSleeping, sleepStartTime } = JSON.parse(storedSleep);
        if (isSleeping) {
          const now = Date.now();
          const elapsedHours = (now - sleepStartTime) / (1000 * 60 * 60);
          if (elapsedHours >= 1.5) {
            setEnergy(100);
            setIsSleeping(false);
            await SecureStore.deleteItemAsync('petSleep');
          } else {
            setIsSleeping(true);
            setSleepStartTime(sleepStartTime);
            const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
            setEnergy(energyToAdd);
          }
        }
      }
    };
    loadPetState();
  }, []);

  // Save pet state whenever it changes
  useEffect(() => {
    const savePetState = async () => {
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
        sleepStartTime
      };
      await SecureStore.setItemAsync('petState', JSON.stringify(petState));
    };
    savePetState();
  }, [happiness, hunger, energy, cleanliness, level, experience, showOutfits, showFood, isSleeping, sleepStartTime]);

  // Update energy while sleeping
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSleeping && sleepStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedHours = (now - sleepStartTime) / (1000 * 60 * 60);
        const energyToAdd = Math.min(100, Math.floor(elapsedHours * (100 / 1.5)));
        setEnergy(energyToAdd);
        
        if (elapsedHours >= 1.5) {
          wakeUp();
          clearInterval(interval);
        }
      }, 10000); // Update every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isSleeping, sleepStartTime]);

  // Decrease stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSleeping) {
        setHappiness(prev => Math.max(0, prev - 1));
        setHunger(prev => Math.min(100, prev + 2));
        setEnergy(prev => Math.max(0, prev - 1));
        setCleanliness(prev => Math.max(0, prev - 0.5));
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Check for level up
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
        setEnergy(prev => Math.min(100, prev + foodItem.energyRestore!));
      }
      
      setHappiness(prev => Math.min(100, prev + 5));
      setExperience(prev => prev + 10);
      consumeFood(foodItem.id);
    }
  };

  const play = () => {
    if (energy <= 15 || hunger > 85) return;
    setHappiness(prev => Math.min(100, prev + 15));
    setEnergy(prev => Math.max(0, prev - 10));
    setHunger(prev => Math.min(100, prev + 5));
    setExperience(prev => prev + 15);
  };

  const sleep = async () => {
    if (isSleeping) return;
    setIsSleeping(true);
    const now = Date.now();
    setSleepStartTime(now);
    await SecureStore.setItemAsync('petSleep', JSON.stringify({
      isSleeping: true,
      sleepStartTime: now
    }));
  };

  const wakeUp = async () => {
    setIsSleeping(false);
    setSleepStartTime(null);
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
    isSleeping
  };
};

export default usePet;