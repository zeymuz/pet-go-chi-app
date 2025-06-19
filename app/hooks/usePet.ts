// usePet.ts
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

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

  // Load sleep state on app start
  useEffect(() => {
    const loadSleepState = async () => {
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
    loadSleepState();
  }, []);

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

  const feed = (foodItem?: { hungerRestore: number }) => {
    if (foodItem) {
      setHunger(prev => Math.max(0, prev - foodItem.hungerRestore));
      setHappiness(prev => Math.min(100, prev + 5));
      setExperience(prev => prev + 10);
    }
    setShowFood(!showFood);
  };

  const play = () => {
    if (energy < 15 || hunger > 85) return;
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

  const clean = () => {
    setCleanliness(prev => Math.min(100, prev + 30));
    setHappiness(prev => Math.min(100, prev + 10));
    setExperience(prev => prev + 5);
  };

  return {
    feed,
    play,
    sleep,
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
}

export default usePet;