import { useState, useEffect } from 'react';
import { getTokenPriceUSD } from '../lib/utils/usd-pricing';
import { SURVIVOR_ADDRESS_MAINNET } from '../lib/constants';

export function useSurvivorToUSD() {
  const [survivorPriceUSD, setSurvivorPriceUSD] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getTokenPriceUSD(SURVIVOR_ADDRESS_MAINNET);
        setSurvivorPriceUSD(price);
      } catch (error) {
        console.error('Error fetching SURVIVOR price:', error);
        setSurvivorPriceUSD(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const convertToUSD = (survivorAmount: number): number => {
    if (!survivorPriceUSD) return survivorAmount;
    return survivorAmount * survivorPriceUSD;
  };

  return { convertToUSD, survivorPriceUSD, loading };
}

