import { useState, useEffect } from 'react';
import { Pet } from '../types/types';
import { PETS } from '../constants/pets';

const usePet = () => {
  const [pet, setPet] = useState<Pet>(PETS[0]);
  const [happiness, setHappiness] = useState(70);
  const [hunger, setHunger] = useState(30);
  const [energy, setEnergy] = useState(80);
  const [cleanliness, setCleanliness] = useState(90);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [equippedOutfit, setEquippedOutfit] = useState<string | null>(null);

  // Decrease stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      setHappiness(prev => Math.max(0, prev - 1));
      setHunger(prev => Math.min(100, prev + 2));
      setEnergy(prev => Math.max(0, prev - 1));
      setCleanliness(prev => Math.max(0, prev - 0.5));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Check for level up
  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(prev => prev + 1);
      setExperience(0);
      // Unlock new pet skin every 10 levels
      if (level % 10 === 0) {
        const newPetIndex = Math.min(Math.floor(level / 10), PETS.length - 1);
        setPet(PETS[newPetIndex]);
      }
    }
  }, [experience, level]);

  const feed = () => {
    setHunger(prev => Math.max(0, prev - 30));
    setHappiness(prev => Math.min(100, prev + 5));
    setExperience(prev => prev + 10);
  };

  const play = () => {
    setHappiness(prev => Math.min(100, prev + 15));
    setEnergy(prev => Math.max(0, prev - 10));
    setHunger(prev => Math.min(100, prev + 5));
    setExperience(prev => prev + 15);
  };

  const sleep = () => {
    setEnergy(prev => Math.min(100, prev + 30));
    setHappiness(prev => Math.min(100, prev + 5));
    setExperience(prev => prev + 5);
  };

  const clean = () => {
    setCleanliness(prev => Math.min(100, prev + 30));
    setHappiness(prev => Math.min(100, prev + 10));
    setExperience(prev => prev + 5);
  };

  const equipOutfit = (outfitId: string) => {
    setEquippedOutfit(outfitId);
  };

  return {
    pet,
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
    equippedOutfit,
    equipOutfit,
  };
}

export default usePet;
