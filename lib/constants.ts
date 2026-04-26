// Static editorial content (curated copy + hero images for category pages).
// Card + price data is fetched live from the DB via lib/queries.ts.

export const SERIES = [
  {
    category: "one-piece" as const,
    name: "One Piece",
    setsTracked: 20,
    trend: 22.4,
    badge: "Most Active",
    description:
      "OP-05 and Romance Dawn sets are seeing unprecedented volume increases this quarter.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCY2cLAzvDpzOx6tSu7xpuDwbdYdLnzqSdYrEvj8mLESrxF0seeiZ4kFPUafsGl5t4D7MgqQ8EKsrbF7QQMi9eL7rVtc7naWTWEk_-hfX1YuiPrgbkl2F8oBHKoMuXgc-uvZpHGpzC2lZwMfb-3wyDRBwRafCU4g0SxH02BleIl0DCtlfDDCfuAj1IxtKb0WMlXPogbqtC-JXKcIde0FNEfuzTyJUY2R-dUD8vF4fPwrUGJdr2XUy7B72v7Kr85Qcz7-jzGQUCt4nnj",
  },
  {
    category: "naruto" as const,
    name: "Naruto",
    setsTracked: 4,
    trend: 8.1,
    description: "Kayou Tier 4 indexing now live.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3H9RdNIyuQWj0jfsuW3sF0y2tBVVfGm3mizXw4wc7b4g0dE8d5Jua0cE4-_JqPMU3zTqhkEF5SWW0HzS9QQzQafQ4Eo7tBza-PWAjoCyeNYYnFHJ8dmWKLIldQqinEAKJx-N3dWUsVHVqsxTsLvn4GiEKFe5SsTPETRlG7b_2ndXqnzFYWZmabaqKq0gpUleafHOeu4VUOAxm3uRS18vqV1nwM4d_g7-zh0ki9fMtJqG9CszCm8FinzR9UMx6VG5NGpzfEferUzT5",
  },
  {
    category: "pokemon" as const,
    name: "Pokémon",
    setsTracked: 18,
    trend: -1.2,
    description: "Full Scarlet & Violet base set historical data archive complete.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCmqEzatR8YOOdvDWmqvtxco_PAPf5QWH4jjOvhME7NY_XdMj6WoVfzSs7mLby66RZc0eqNS4G5-PvtI1B_CXJewD1_nToAvrOUUfM-PKUzEAfidf86ZxZLDKWqmRRP1B1petXdLD_pFe43qusAXMqAWhu2DUWsoxjw2Bx5u3JUxmYoX-SwvCvJyD8LY6W7LfbI4V4LwsNPxh136gjlVOUbnDCw4sSowbJlQqIKP6d_bL70TYmb8jBG1proKXCNAdw8H7UVjh38-s-s",
  },
];
