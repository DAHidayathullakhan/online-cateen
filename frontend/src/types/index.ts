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
  role: 'Student' | "Master's Student" | 'Canteen Operator' | 'Kitchen Staff' | 'Delivery Staff' | 'Branch Manager' | 'Admin';
  studentId?: string;
  department?: string;
  course?: string;
  walletBalance?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  studentName: string;
  studentId: string;
  items: { item: FoodItem; quantity: number }[];
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Completed' | 'Cancelled';
  orderType: 'Pickup' | 'Room Delivery';
  pickupWindow?: string;
  deliveryLocation?: string;
  roomNumber?: string;
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
