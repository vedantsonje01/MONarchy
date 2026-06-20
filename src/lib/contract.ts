// Contract config — fill NEXT_PUBLIC_CONTRACT_ADDRESS after deploying tomorrow

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const BOUNTY_ESCROW_ABI = [
  {
    name: "postBounty",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "awardBounty",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "nextBountyId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "bounties",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "asker", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "paid", type: "bool" },
    ],
  },
  {
    name: "BountyPosted",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "asker", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "BountyAwarded",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
