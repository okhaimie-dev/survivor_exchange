import { getQuotes } from '@avnu/avnu-sdk';
import { USDC_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { normalizeContractAddress } from './normalization';

export async function getTokenUSDValue(amount: number, tokenAddress: string): Promise<number> {
  try {
    const tokenInfo = SUPPORTED_TOKENS.find(t => normalizeContractAddress(t.address).toLowerCase() === normalizeContractAddress(tokenAddress).toLowerCase());
    const tokenDecimals = tokenInfo?.decimals || 18;
    const amountInWei = BigInt(Math.floor(amount * Math.pow(10, tokenDecimals)));
    
    const quotes = await getQuotes({
      sellTokenAddress: tokenAddress,
      buyTokenAddress: USDC_ADDRESS,
      sellAmount: amountInWei,
      takerAddress: '0x0',
    });
    
    if (!quotes || quotes.length === 0) {
      return 0;
    }
    
    const bestQuote = quotes[0];
    return Number(bestQuote.buyAmount) / 1e6;
  } catch (error) {
    console.error('Error getting token USD value:', error);
    return 0;
  }
}

export async function getTokenAmountForUSD(usdAmount: number, tokenAddress: string): Promise<number> {
  try {
    const usdcAmountWei = BigInt(Math.floor(usdAmount * 1e6));
    
    const quotes = await getQuotes({
      sellTokenAddress: USDC_ADDRESS,
      buyTokenAddress: tokenAddress,
      sellAmount: usdcAmountWei,
      takerAddress: '0x0',
    });
    
    if (!quotes || quotes.length === 0) {
      return 0;
    }
    
    const bestQuote = quotes[0];
    const tokenInfo = SUPPORTED_TOKENS.find(t => normalizeContractAddress(t.address).toLowerCase() === normalizeContractAddress(tokenAddress).toLowerCase());
    const decimals = tokenInfo?.decimals || 18;
    
    return Number(bestQuote.buyAmount) / Math.pow(10, decimals);
  } catch (error) {
    console.error('Error getting token amount for USD:', error);
    return 0;
  }
}

export async function getTokenPriceUSD(tokenAddress: string): Promise<number> {
  try {
    const tokenInfo = SUPPORTED_TOKENS.find(t => normalizeContractAddress(t.address).toLowerCase() === normalizeContractAddress(tokenAddress).toLowerCase());
    const tokenDecimals = tokenInfo?.decimals || 18;
    const oneTokenWei = BigInt(Math.pow(10, tokenDecimals));
    
    const quotes = await getQuotes({
      sellTokenAddress: tokenAddress,
      buyTokenAddress: USDC_ADDRESS,
      sellAmount: oneTokenWei,
      takerAddress: '0x0',
    });
    
    if (!quotes || quotes.length === 0) {
      return 0;
    }
    
    const bestQuote = quotes[0];
    return Number(bestQuote.buyAmount) / 1e6;
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
    const usdcAmountWei = BigInt(Math.floor(usdcAmount * Math.pow(10, 6)));
    
    // Get swap quote from USDC to target token
    const quotes = await getQuotes({
      sellTokenAddress: USDC_ADDRESS,
      buyTokenAddress: targetTokenAddress,
      sellAmount: usdcAmountWei,
      takerAddress: '0x0',
    });
    
    if (!quotes || quotes.length === 0) {
      return 0;
    }
    
    const bestQuote = quotes[0];
    
    // Convert result from wei to human-readable format
    return Number(bestQuote.buyAmount) / Math.pow(10, targetDecimals);
  } catch (error) {
    console.error('Error converting USDC to token:', error);
    return 0;
  }
}

