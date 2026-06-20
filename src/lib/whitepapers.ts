// Whitepaper context — injected into every agent system prompt via buildPrompt()
// Short distillations of key technical + economic concepts from primary sources.
// The model has seen full whitepapers in training; these prompts surface that knowledge
// and establish the framing the game plan requires.

export const WHITEPAPER_CONTEXT = `=== WHITEPAPER CONTEXT ===
You have studied the following protocol whitepapers and must reference them where relevant to the question.

BITCOIN (Nakamoto, 2008): Peer-to-peer electronic cash. Key innovations: proof-of-work consensus, UTXO model, 21M hard-capped supply, ~10-min block times, difficulty adjustment every 2016 blocks. No programmability beyond basic Script. Security model: longest chain wins; 51% attack requires majority hash rate. Store-of-value thesis rests on scarcity + Lindy effect. Lightning Network handles micropayments off-chain via HTLCs. No native staking or yield — miners earn block subsidy + fees.

ETHEREUM (Buterin et al., 2014 / ongoing): Programmable blockchain via EVM. Turing-complete smart contracts enable DeFi, NFTs, DAOs, and restaking. Transitioned from PoW to PoS in Sept 2022 (The Merge) — validators stake 32 ETH, slashing punishes misbehavior. Gas fees in ETH/Gwei; EIP-1559 burns base fee making ETH deflationary under high load. L2s (Arbitrum, Optimism, Base, zkSync) handle scale via rollups. EigenLayer extends Ethereum security via restaking. ETH is simultaneously: gas token, staking collateral, DeFi collateral, and deflationary money.

SOLANA (Yakovenko, 2017): High-throughput L1. Key innovation: Proof of History (PoH) — cryptographic clock that timestamps transactions before consensus, enabling ~65k TPS theoretical. Tower BFT builds on PoH for fast finality. Fees typically under $0.001. Trade-offs: higher validator hardware requirements, history of network outages (2021–2022), more centralized validator set than Ethereum. Strong consumer-app and DeFi ecosystem. SOL used for gas + staking yield (~6-7% APY). Firedancer client (Jump Crypto) aims to fix reliability.

MONAD (2023 whitepaper): EVM-compatible L1 with parallel execution. Three core innovations: (1) Pipelined execution — consensus, execution, and state persistence overlap instead of sequential; (2) MonadDB — custom storage layer with async I/O enabling parallel state reads; (3) Deferred execution — transactions scheduled optimistically and re-executed on conflict. Claims 10,000 TPS with full EVM compatibility at sub-cent fees. Still in testnet as of mid-2025. Thesis: Ethereum composability at Solana-class throughput. Existing Solidity contracts deploy unchanged. Native token MON used for gas and staking.

UNISWAP v3 (Adams et al., 2021): Concentrated liquidity AMM. LPs set custom price ranges — capital efficiency up to 4000x vs v2 for tight ranges. Fee tiers: 0.01% (stablecoins), 0.05% (correlated pairs), 0.3% (standard), 1% (exotic). Impermanent loss (IL) is amplified in narrow ranges — active management required. Out-of-range LPs earn zero fees. v4 introduces hooks: custom logic per pool (limit orders, dynamic fees, TWAMM). Key LP metrics: fee APR vs IL, volume/TVL ratio, active liquidity %, time in range. Protocol revenue accrues to LPs; UNI governance token captures no direct cash flow currently.
=== END WHITEPAPER CONTEXT ===`;
