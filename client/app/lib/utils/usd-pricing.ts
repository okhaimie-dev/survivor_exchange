import { getSwapQuote } from '../api/ekubo';
import { USDC_ADDRESS, SUPPORTED_TOKENS, type TokenInfo } from '../constants';

export async function getTokenUSDValue(amount: number, tokenAddress: string): Promise<number> {
  try {
    const amountInWei = amount * 1e18;
    
    const quote = await getSwapQuote(amountInWei, tokenAddress, USDC_ADDRESS);
    
    return quote.total / 1e6;
  } catch (error) {
    console.error('Error getting token USD value:', error);
    return 0;
  }
}

export async function getTokenAmountForUSD(usdAmount: number, tokenAddress: string): Promise<number> {
  try {
    const usdcAmount = usdAmount * 1e6;
    
    const quote = await getSwapQuote(usdcAmount, USDC_ADDRESS, tokenAddress);
    
    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    const decimals = tokenInfo?.decimals || 18;
    
    return quote.total / Math.pow(10, decimals);
  } catch (error) {
    console.error('Error getting token amount for USD:', error);
    return 0;
  }
}

export async function getTokenPriceUSD(tokenAddress: string): Promise<number> {
  try {
    const oneToken = 1e18;
    const quote = await getSwapQuote(oneToken, tokenAddress, USDC_ADDRESS);
    
    return quote.total / 1e6;
  } catch (error) {
    console.error('Error getting token price:', error);
    return 0;
  }
}

