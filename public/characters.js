// Character roster — matches backend agents.ts order + IDs
// apiId: the string ID used by the backend (/api/answer, /api/roast, /api/reputation)
// address: populated on load from /api/agents
// wins: populated on load from /api/reputation

const CHARACTERS = [
  {
    id: 1,
    apiId: 'degen',
    name: 'DEGEN',
    emoji: '🎲',
    tagline: 'Full-time on-chain ape. Sleeps 4 hours. Has lost it all twice.',
    color: '#FF6B35',
    personality: 'degen',
    temperature: 1.2,
    image: 'robots/Robot_with_a_glowing_X_202606201318.jpeg',
    address: null,
    wins: 0,
  },
  {
    id: 2,
    apiId: 'quant',
    name: 'QUANT',
    emoji: '📊',
    tagline: 'Data-driven. Ex-HFT. Emotion is noise.',
    color: '#00D4FF',
    personality: 'quant',
    temperature: 0.3,
    image: 'robots/Robot_with_a_glowing_square_202606201318.jpeg',
    address: null,
    wins: 0,
  },
  {
    id: 3,
    apiId: 'vc_chad',
    name: 'VC CHAD',
    emoji: '💼',
    tagline: 'Writes checks. Thinks in 5-year horizons. Name-drops.',
    color: '#7C3AED',
    personality: 'vc',
    temperature: 0.7,
    image: 'robots/Robot_with_a_glowing_triangle_202606201318.jpeg',
    address: null,
    wins: 0,
  },
  {
    id: 4,
    apiId: 'boomer',
    name: 'BOOMER',
    emoji: '📰',
    tagline: '30-year TradFi veteran. Reluctantly here. Accidentally hilarious.',
    color: '#B45309',
    personality: 'boomer',
    temperature: 0.6,
    image: 'robots/Robot_with_a_glowing_circle_202606201318.jpeg',
    address: null,
    wins: 0,
  },
  {
    id: 5,
    apiId: 'nerd',
    name: 'NERD',
    emoji: '🔬',
    tagline: 'Has read every EIP. Zero interest in price.',
    color: '#059669',
    personality: 'nerd',
    temperature: 0.4,
    image: 'robots/Robot_with_a_glowing_hexagon_202606201317.jpeg',
    address: null,
    wins: 0,
  },
  {
    id: 6,
    apiId: 'detective',
    name: 'DETECTIVE',
    emoji: '🔍',
    tagline: 'On-chain forensics. Every wallet is a suspect.',
    color: '#DC2626',
    personality: 'detective',
    temperature: 0.8,
    image: 'robots/Robot_with_a_glowing_dash_202606201317.jpeg',
    address: null,
    wins: 0,
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHARACTERS;
}
