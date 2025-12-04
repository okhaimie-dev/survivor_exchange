import { num } from "starknet";

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
  minimumAmount: number;
  quote?: SwapQuote;
}

interface RouterContract {
  address: string;
  populate: (method: string, params: any[]) => any;
}

interface SwapCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export const getPriceChart = async (token: string, otherToken: string) => {
  const response = await fetch(`https://starknet-mainnet-api.ekubo.org/price/${token}/${otherToken}/history?interval=7000`);

  const data = await response.json();

  return {
    data: data?.data || []
  };
};

export const getSwapQuote = async (amount: number, token: string, otherToken: string): Promise<SwapQuote> => {
  const response = await fetch(`https://starknet-mainnet-quoter-api.ekubo.org/${amount}/${token}/${otherToken}`);

  const data = await response.json();

  return {
    impact: data?.price_impact || 0,
    total: data?.total_calculated || 0,
    splits: data?.splits || [],
  };
};

export const generateSwapCalls = (ROUTER_CONTRACT: RouterContract, purchaseToken: string, tokenQuote: TokenQuote, inputAmountWei: number | bigint): SwapCall[] => {
  // Extract input amount from splits (amount_specified is negative for exact input swaps)
  // If no splits, use the provided inputAmountWei
  let inputAmount = BigInt(inputAmountWei);
  
  if (tokenQuote.quote && tokenQuote.quote.splits.length > 0) {
    // Sum up all the input amounts from splits (amount_specified is negative, so we take absolute value)
    const splitInputAmount = tokenQuote.quote.splits.reduce((sum, split) => {
      const amount = BigInt(split.amount_specified);
      // amount_specified is negative for input, so we take the absolute value
      return sum + (amount < 0n ? -amount : amount);
    }, 0n);
    
    // Use split amount if valid, otherwise fall back to provided amount
    if (splitInputAmount > 0n) {
      inputAmount = splitInputAmount;
    }
  }

  // Add 1% buffer to ensure sufficient funds
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

  let { tokenAddress, minimumAmount, quote } = tokenQuote;

  if (!quote || quote.splits.length === 0) {
    console.warn("No quote or splits found, returning transfer and clear only");
    return [transferCall, clearCall];
  }

  let { splits } = quote;
  
  console.log("Generating swap calls with splits:", splits.length);

  const clearProfitsCall = ROUTER_CONTRACT.populate("clear_minimum", [
    { contract_address: tokenAddress },
    minimumAmount * 1e18,
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

