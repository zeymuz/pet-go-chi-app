import { useEffect, useState } from 'react';

const usePet = () => {
  const [happiness, setHappiness] = useState(70);
  const [hunger, setHunger] = useState(30);
  const [energy, setEnergy] = useState(80);
  const [cleanliness, setCleanliness] = useState(90);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [showOutfits, setShowOutfits] = useState(false);

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
  };
}

export default usePet;