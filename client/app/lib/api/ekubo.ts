import { num } from "starknet";
import { STARKNET_MAINNET_CHAIN_ID, STARKNET_MAINNET_CHAIN_ID_DECIMAL, EKUBO_API_BASE_URL, EKUBO_QUOTER_API_BASE_URL } from "../constants";

interface SwapQuote {
  impact: number;
  total: number;
  splits: SwapSplit[];
}

interface SwapSplit {
  amount_specified: string;
  route: RouteNode[];
}

interface RouteNode {
  pool_key: {
    token0: string;
    token1: string;
    fee: string;
    tick_spacing: string;
    extension: string;
  };
  sqrt_ratio_limit: string;
  skip_ahead: string;
}

interface TokenQuote {
  tokenAddress: string;
  minimumAmount: number | bigint;
  quote?: SwapQuote;
  outputTokenDecimals?: number;
}

interface RouterContract {
  address: string;
  populate: (method: string, params: unknown[]) => SwapCall;
}

interface SwapCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export const getPriceChart = async (token: string, otherToken: string, chainId: string = STARKNET_MAINNET_CHAIN_ID) => {
  const response = await fetch(`${EKUBO_API_BASE_URL}/price/${chainId}/${token}/${otherToken}/history?interval=7000`);

  if (!response.ok) {
    throw new Error(`Failed to fetch price chart: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    data: data?.data || []
  };
};

export const getSwapQuote = async (amount: number, token: string, otherToken: string, chainId: string = STARKNET_MAINNET_CHAIN_ID_DECIMAL): Promise<SwapQuote> => {
  const negativeAmount = -Math.abs(amount);
  const response = await fetch(`${EKUBO_QUOTER_API_BASE_URL}/${chainId}/${negativeAmount}/${token}/${otherToken}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch swap quote: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    impact: data?.price_impact || 0,
    total: Math.abs(Number(data?.total_calculated || 0)),
    splits: data?.splits || [],
  };
};

export const generateSwapCalls = (ROUTER_CONTRACT: RouterContract, purchaseToken: string, tokenQuote: TokenQuote, inputAmountWei: number | bigint): SwapCall[] => {
  let inputAmount = BigInt(inputAmountWei);
  
  if (tokenQuote.quote && tokenQuote.quote.splits.length > 0) {
    const splitInputAmount = tokenQuote.quote.splits.reduce((sum, split) => {
      const amount = BigInt(split.amount_specified);
      return sum + (amount < 0n ? -amount : amount);
    }, 0n);
    
    if (splitInputAmount > 0n) {
      inputAmount = splitInputAmount;
    }
  }

  const totalWithBuffer = inputAmount * 101n / 100n;

  const transferCall: SwapCall = {
    contractAddress: purchaseToken,
    entrypoint: "transfer",
    calldata: [ROUTER_CONTRACT.address, num.toHex(totalWithBuffer), "0x0"],
  };

  const clearCall: SwapCall = {
    contractAddress: ROUTER_CONTRACT.address,
    entrypoint: "clear",
    calldata: [purchaseToken],
  };

  const { tokenAddress, minimumAmount, quote, outputTokenDecimals = 18 } = tokenQuote;

  if (!quote || quote.splits.length === 0) {
    return [transferCall, clearCall];
  }

  const { splits } = quote;

  let minimumAmountWei: bigint;
  if (typeof minimumAmount === 'bigint') {
    minimumAmountWei = minimumAmount;
  } else if (quote.total && quote.total > 0) {

    const expectedOutput = BigInt(Math.floor(quote.total));
    minimumAmountWei = expectedOutput * 99n / 100n;
  } else {
    const decimals = outputTokenDecimals;
    minimumAmountWei = BigInt(Math.floor(minimumAmount * Math.pow(10, decimals)));
  }

  const clearProfitsCall = ROUTER_CONTRACT.populate("clear_minimum", [
    { contract_address: tokenAddress },
    minimumAmountWei,
    0,
  ]);

  let swapCalls: SwapCall[];

  if (splits.length === 1) {
    const split = splits[0];

    swapCalls = [
      {
        contractAddress: ROUTER_CONTRACT.address,
        entrypoint: "multihop_swap",
        calldata: [
          num.toHex(split.route.length),
          ...split.route.reduce((memo: { token: string; encoded: string[] }, routeNode: RouteNode) => {
            const isToken1 = BigInt(memo.token) === BigInt(routeNode.pool_key.token1);

            return {
              token: isToken1 ? routeNode.pool_key.token0 : routeNode.pool_key.token1,
              encoded: memo.encoded.concat([
                routeNode.pool_key.token0,
                routeNode.pool_key.token1,
                routeNode.pool_key.fee,
                num.toHex(routeNode.pool_key.tick_spacing),
                routeNode.pool_key.extension,
                num.toHex(BigInt(routeNode.sqrt_ratio_limit) % 2n ** 128n),
                num.toHex(BigInt(routeNode.sqrt_ratio_limit) >> 128n),
                routeNode.skip_ahead,
              ]),
            };
          }, {
            token: tokenAddress,
            encoded: [],
          }).encoded,
          purchaseToken,
          num.toHex(BigInt(split.amount_specified) < 0n ? -BigInt(split.amount_specified) : BigInt(split.amount_specified)),
          "0x0",
        ],
      },
      clearProfitsCall,
    ];
  } else {
    swapCalls = [
      {
        contractAddress: ROUTER_CONTRACT.address,
        entrypoint: "multi_multihop_swap",
        calldata: [
          num.toHex(splits.length),
          ...splits.reduce((memo: string[], split: SwapSplit) => {
            return memo.concat([
              num.toHex(split.route.length),
              ...split.route.reduce((memo: { token: string; encoded: string[] }, routeNode: RouteNode) => {
                const isToken1 = BigInt(memo.token) === BigInt(routeNode.pool_key.token1);

                return {
                  token: isToken1 ? routeNode.pool_key.token0 : routeNode.pool_key.token1,
                  encoded: memo.encoded.concat([
                    routeNode.pool_key.token0,
                    routeNode.pool_key.token1,
                    routeNode.pool_key.fee,
                    num.toHex(routeNode.pool_key.tick_spacing),
                    routeNode.pool_key.extension,
                    num.toHex(BigInt(routeNode.sqrt_ratio_limit) % 2n ** 128n),
                    num.toHex(BigInt(routeNode.sqrt_ratio_limit) >> 128n),
                    routeNode.skip_ahead,
                  ]),
                };
              },
                {
                  token: tokenAddress,
                  encoded: [],
                }
              ).encoded,
              purchaseToken,
              num.toHex(BigInt(split.amount_specified) < 0n ? -BigInt(split.amount_specified) : BigInt(split.amount_specified)),
              "0x0",
            ]);
          }, []),
        ],
      },
      clearProfitsCall
    ];
  }

  return [
    transferCall,
    ...swapCalls,
    clearCall
  ];
};

export type { SwapQuote, SwapSplit, RouteNode, TokenQuote, RouterContract, SwapCall };