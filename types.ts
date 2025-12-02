

export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export type BoxCategory = 'ALL' | 'STREETWEAR' | 'TECH' | 'POKEMON' | 'GIFT_CARDS' | 'GAME_CODES' | 'FOOD' | 'SUBSCRIPTIONS' | 'CRYPTO' | 'SPORTS';

export interface LootItem {
  id: string;
  name: string;
  image: string;
  value: number; // In USD/Credits
  rarity: Rarity;
  odds: number; // Percentage 0-100
  shippingStatus?: 'PROCESSING' | 'SHIPPED' | 'DELIVERED'; // Status for items being shipped
}

export interface LootBox {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  description: string;
  items: LootItem[];
  color: string;
  category: BoxCategory;
  tags?: ('HOT' | 'NEW' | 'FEATURED' | 'SALE')[];
}

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type ShipmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export interface Shipment {
  id: string;
  items: LootItem[];
  address: ShippingAddress;
  status: ShipmentStatus;
  trackingNumber?: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  inventory: LootItem[];
  shipments: Shipment[];
  avatar?: string;
  clientSeed?: string;
  nonce?: number;
  serverSeedHash?: string;
  freeBoxClaimed?: boolean;
  totalWagered?: number; // Total amount spent on boxes
  totalProfit?: number; // (Total item value won) - (Total spent)
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'PURCHASE' | 'SHIPPING';
  amount: number;
  timestamp: number;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  boxId: string;
  items: LootItem[];
  totalPrice: number;
  timestamp: number;
}

export interface LiveDrop {
  id: string;
  username: string;
  itemName: string;
  itemImage: string;
  boxName: string;
  value: number;
  rarity: Rarity;
  timeAgo: string;
}

export interface BattlePlayerResult {
  id: string;
  items: LootItem[];
  totalValue: number;
}

export interface Battle {
  id: string;
  boxId: string;
  price: number;
  playerCount: 2 | 4 | 6;
  players: (Partial<User> | null)[]; // Null is an empty slot
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  roundCount: number;
  mode?: 'STANDARD' | 'CRAZY';
  // Runtime Data
  currentRound?: number;
  results?: { [playerId: string]: BattlePlayerResult };
  winnerId?: string;
}

export interface ViewState {
  page: 'HOME' | 'BOX_DETAIL' | 'OPENING' | 'PROFILE' | 'BATTLES' | 'BATTLE_ARENA' | 'RACES' | 'AFFILIATES' | 'ADMIN';
  data?: any;
}

export interface AffiliateTier {
  name: string;
  rate: number;
  color: string;
  minWagerVolume: number;
}

export interface AffiliateReferral {
  id: string;
  referred_user_id: string;
  total_wagers: number;
  deposit_bonus_paid: boolean;
  deposit_bonus_amount: number;
  first_deposit_amount: number;
  first_deposit_at: string | null;
  created_at: string;
  users?: {
    username: string;
    avatar?: string;
  };
}

export interface AffiliateEarning {
  id: string;
  type: 'DEPOSIT_BONUS' | 'WAGER_COMMISSION';
  amount: number;
  commission_rate?: number;
  wager_amount?: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface AffiliateStats {
  code: string | null;
  referralCount: number;
  totalWagerVolume: number;
  currentTier: AffiliateTier | null;
  unclaimedEarnings: number;
  totalEarnings: number;
  claimedEarnings: number;
  recentEarnings: AffiliateEarning[];
  referrals: AffiliateReferral[];
}