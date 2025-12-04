import { getSwapQuote } from '../api/ekubo';
import { USDC_ADDRESS, SUPPORTED_TOKENS } from '../constants';

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

/**
 * Converts a USDC amount to an equivalent amount in another token
 * @param usdcAmount - Amount in USDC (human-readable, not wei)
 * @param targetTokenAddress - Address of the target token to convert to
 * @returns Equivalent amount in target token (human-readable)
 */
export async function convertUSDCToToken(usdcAmount: number, targetTokenAddress: string): Promise<number> {
  try {
    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === targetTokenAddress.toLowerCase());
    const targetDecimals = tokenInfo?.decimals || 18;
    
    // Convert USDC amount to wei (6 decimals)
    const usdcAmountWei = usdcAmount * Math.pow(10, 6);
    
    // Get swap quote from USDC to target token
    const quote = await getSwapQuote(usdcAmountWei, USDC_ADDRESS, targetTokenAddress);
    
    // Convert result from wei to human-readable format
    return quote.total / Math.pow(10, targetDecimals);
  } catch (error) {
    console.error('Error converting USDC to token:', error);
    return 0;
  }
}

