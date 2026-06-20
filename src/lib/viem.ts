// Server-side viem public client — used by /api/reputation
// Do NOT import this in client components (it reads server-only env vars)

import { createPublicClient, http } from "viem";

const monadTestnet = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "10143"),
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz"],
    },
  },
} as const;

export function getPublicClient() {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });
}
