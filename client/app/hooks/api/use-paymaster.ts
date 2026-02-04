/**
 * Hook for AVNU Paymaster integration with fallback to user-paid gas
 * Enables gasless transactions for users when paymaster has credits
 *
 * Uses the official pattern from Avnu docs:
 * - PaymasterRpc points to local proxy (keeps API key server-side)
 * - account.executePaymasterTransaction() for SNIP-9 compatible wallets (Braavos)
 * - Manual build/sign/execute flow for non-SNIP-9 wallets (Cartridge)
 */

import { useCallback, useMemo, useState } from "react";
import { PaymasterRpc } from "starknet";
import type { AccountInterface, Call, PaymasterInterface } from "starknet";

interface ExecuteResult {
  transaction_hash: string;
}

interface UsePaymasterReturn {
  executeWithPaymaster: (
    account: AccountInterface,
    calls: Call | Call[]
  ) => Promise<ExecuteResult>;
  isPaymasterAvailable: boolean;
  lastUsedPaymaster: boolean;
}

// Extended account type with paymaster support
type AccountWithPaymaster = AccountInterface & {
  paymaster?: PaymasterInterface;
};

const PAYMASTER_ENABLED = process.env.NEXT_PUBLIC_PAYMASTER_ENABLED === "true";

// Check if error is SNIP-9 incompatibility
function isSnip9Error(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('SNIP-9') || error.message.includes('not compatible');
  }
  return false;
}

export function usePaymaster(): UsePaymasterReturn {
  const [lastUsedPaymaster, setLastUsedPaymaster] = useState(false);

  // Create PaymasterRpc pointing to our proxy (API key stays server-side)
  const paymasterRpc = useMemo(() => {
    if (!PAYMASTER_ENABLED) {
      console.log("[Paymaster] Disabled via env");
      return null;
    }

    // Use local proxy endpoint - API key is added server-side
    const proxyUrl = typeof window !== "undefined"
      ? `${window.location.origin}/api/paymaster`
      : "/api/paymaster";

    console.log("[Paymaster] Creating PaymasterRpc with proxy:", proxyUrl);

    try {
      return new PaymasterRpc({ nodeUrl: proxyUrl });
    } catch (error) {
      console.error("[Paymaster] Failed to create PaymasterRpc:", error);
      return null;
    }
  }, []);

  // Manual build/sign/execute flow for wallets that don't support SNIP-9 (e.g., Cartridge)
  const executeManualPaymasterFlow = useCallback(
    async (
      account: AccountInterface,
      callsArray: Call[]
    ): Promise<ExecuteResult> => {
      if (!paymasterRpc) {
        throw new Error("PaymasterRpc not initialized");
      }

      console.log("[Paymaster] Using manual build/sign/execute flow...");

      // Build transaction
      const buildResponse = await paymasterRpc.buildTransaction(
        {
          type: "invoke",
          invoke: {
            userAddress: account.address,
            calls: callsArray,
          },
        },
        { version: '0x1', feeMode: { mode: 'sponsored' } }
      );

      console.log("[Paymaster] Transaction built, signing...");

      // Type guard for invoke transaction response
      if (buildResponse.type !== 'invoke') {
        throw new Error('Unexpected transaction type from paymaster');
      }

      // Sign the typed data
      const signature = await account.signMessage(buildResponse.typed_data);
      const signatureArray = Array.isArray(signature)
        ? signature.map(String)
        : [signature.r.toString(), signature.s.toString()];

      console.log("[Paymaster] Signed, executing...");

      // Execute through paymaster
      const executeResponse = await paymasterRpc.executeTransaction(
        {
          type: "invoke",
          invoke: {
            userAddress: account.address,
            typedData: buildResponse.typed_data,
            signature: signatureArray,
          },
        },
        { version: '0x1', feeMode: { mode: 'sponsored' } }
      );

      console.log("[Paymaster] Manual flow successful:", executeResponse.transaction_hash);
      return { transaction_hash: executeResponse.transaction_hash };
    },
    [paymasterRpc]
  );

  const executeWithPaymaster = useCallback(
    async (
      account: AccountInterface,
      calls: Call | Call[]
    ): Promise<ExecuteResult> => {
      const callsArray = Array.isArray(calls) ? calls : [calls];
      const accountWithPaymaster = account as AccountWithPaymaster;

      console.log("[Paymaster] executeWithPaymaster called", {
        enabled: PAYMASTER_ENABLED,
        paymasterExists: !!paymasterRpc,
        hasExecutePaymasterTransaction: typeof accountWithPaymaster.executePaymasterTransaction === 'function',
        callsCount: callsArray.length,
      });

      // Try sponsored transaction if paymaster is available
      if (PAYMASTER_ENABLED && paymasterRpc) {
        // First, try executePaymasterTransaction (for SNIP-9 compatible wallets like Braavos)
        if (typeof accountWithPaymaster.executePaymasterTransaction === 'function') {
          try {
            console.log("[Paymaster] Trying executePaymasterTransaction (SNIP-9)...");

            // Set the paymaster on the account
            accountWithPaymaster.paymaster = paymasterRpc;

            const response = await accountWithPaymaster.executePaymasterTransaction(
              callsArray,
              { feeMode: { mode: 'sponsored' } }
            );

            setLastUsedPaymaster(true);
            console.log("[Paymaster] SNIP-9 transaction successful:", response.transaction_hash);
            return response;
          } catch (snip9Error) {
            // If SNIP-9 not supported (e.g., Cartridge), try manual flow
            if (isSnip9Error(snip9Error)) {
              console.log("[Paymaster] Wallet doesn't support SNIP-9, trying manual flow...");
              try {
                const result = await executeManualPaymasterFlow(account, callsArray);
                setLastUsedPaymaster(true);
                return result;
              } catch (manualError) {
                console.error("[Paymaster] Manual flow failed:", manualError);
                // Fall through to user-paid gas
              }
            } else {
              console.error("[Paymaster] executePaymasterTransaction failed:", snip9Error);
              // Fall through to user-paid gas
            }
          }
        } else {
          // Account doesn't have executePaymasterTransaction, try manual flow directly
          try {
            const result = await executeManualPaymasterFlow(account, callsArray);
            setLastUsedPaymaster(true);
            return result;
          } catch (manualError) {
            console.error("[Paymaster] Manual flow failed:", manualError);
            // Fall through to user-paid gas
          }
        }
      } else {
        console.log("[Paymaster] Skipping paymaster:", {
          reason: !PAYMASTER_ENABLED ? "disabled via env" : "not initialized",
        });
      }

      // Fallback to regular execution (user pays gas)
      console.log("[Paymaster] Falling back to user-paid gas");
      setLastUsedPaymaster(false);
      const response = await account.execute(callsArray);
      return response;
    },
    [paymasterRpc, executeManualPaymasterFlow]
  );

  return {
    executeWithPaymaster,
    isPaymasterAvailable: PAYMASTER_ENABLED && !!paymasterRpc,
    lastUsedPaymaster,
  };
}
