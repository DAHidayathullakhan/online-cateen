export interface FoodItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Beverages' | 'Meals' | 'Fast Food' | 'Healthy Food' | 'Special Items' | string;
  image: string;
  vegetarian: boolean;
  available: boolean;
  stock: number;
  preparationTime: number;
  isPopular: boolean;
  isSpecial: boolean;
  dailyLimit?: number;
  discountPercentage?: number;
  collegeId?: string;
  ingredients?: string[];
  allergens?: string[];
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | "Master's Student" | 'Canteen Operator' | 'Kitchen Staff' | 'Delivery Staff' | 'Branch Manager' | 'College Administrator' | 'Platform Super Administrator' | 'Admin';
  studentId?: string;
  department?: string;
  course?: string;
  walletBalance?: number;
  collegeId?: string;
}

export interface CollegeSchedule {
  openTime: string;
  closeTime: string;
  breakfastWindow?: { start: string; end: string; enabled: boolean };
  lunchWindow?: { start: string; end: string; enabled: boolean };
  snacksWindow?: { start: string; end: string; enabled: boolean };
  dinnerWindow?: { start: string; end: string; enabled: boolean };
  onlineOrderingEnabled: boolean;
  ordersPaused: boolean;
  pauseMessage?: string;
  weeklyOffDays?: string[];
  specialHolidays?: { date: string; name: string }[];
}

export interface College {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  isActive: boolean;
  schedule?: CollegeSchedule;
}

export interface Order {
  id: string;
  orderNumber: string;
  studentName: string;
  studentId: string;
  items: { item: FoodItem; quantity: number }[];
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered' | 'Completed' | 'Cancelled';
  orderType: 'Pickup' | 'Room Delivery';
  pickupWindow?: string;
  deliveryLocation?: string;
  roomNumber?: string;
  collegeId?: string;
  branch: string;
  tokenNumber: string;
  createdAt: string;
  paymentMethod?: 'CASH' | 'ONLINE';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  tokenStatus?: 'ACTIVE' | 'USED' | 'EXPIRED';
  tokenUsedAt?: string;
  qrCodeData?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  branch: string;
  costPerUnit: number;
  lastRestocked: string;
}

export interface StockTransfer {
  id: string;
  item: string;
  quantity: number;
  sourceBranch: string;
  destBranch: string;
  status: 'Requested' | 'Approved' | 'Dispatched' | 'Received';
  requestedAt: string;
}

export interface FoodWasteLog {
  id: string;
  foodName: string;
  wastedQuantity: number;
  reason: 'Expired' | 'Overproduction' | 'Damaged' | 'Spilled';
  cost: number;
  date: string;
  branch: string;
}

export interface TrackingStage {
  key: string;
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

export interface TrackingQueue {
  ordersAhead: number;
  totalActiveInCanteen: number;
  loadLevel: 'LOW' | 'NORMAL' | 'BUSY';
  estimatedWaitMinutes: number;
  expectedReadyTime: string;
  isApproximate: boolean;
}

export interface StatusHistoryEntry {
  id?: string;
  order_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  note?: string;
  created_at: string;
}

export interface OrderTrackingData {
  order: Order & {
    acceptedAt?: string | null;
    preparingAt?: string | null;
    readyAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
    estimatedPrepMinutes?: number;
    rejectionReason?: string;
  };
  queue: TrackingQueue;
  timeline: {
    currentStatus: string;
    isCancelled: boolean;
    cancelledAt: string | null;
    rejectionReason: string;
    stages: TrackingStage[];
  };
  history: StatusHistoryEntry[];
}

