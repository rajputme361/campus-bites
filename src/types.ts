export type CanteenId = 'block-2' | 'apple-bees';

export type FoodCategory =
  | 'Breakfast'
  | 'Snacks'
  | 'Fast Food'
  | 'Main Course'
  | 'Beverages'
  | 'Desserts';

export type OrderStatus =
  | 'Order Placed'
  | 'Order Accepted'
  | 'Preparing Your Food'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type PaymentMethod = 'Cash' | 'UPI';

export interface Canteen {
  id: CanteenId;
  name: string;
  tagline: string;
  description: string;
  location: string;
  timings: string;
  avgPrepMinutes: number;
  image: string;
  upiId: string;
  upiMerchantName: string;
  isOpen: boolean;
}

export interface MenuItem {
  id: string;
  canteenId: CanteenId;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  isVeg: boolean;
  available: boolean;
  prepTimeMinutes: number;
  image: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image: string;
}

export interface Order {
  id: string;
  canteenId: CanteenId;
  canteenName: string;
  userId: string;
  studentName: string;
  rollNumber: string;
  mobileNumber: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  pickupTime: string;
  paymentMethod: PaymentMethod;
  upiTransactionRef?: string;
  status: OrderStatus;
  estimatedPrepMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  role: 'student' | 'admin';
  fullName: string;
  rollNumber?: string;
  email: string;
  mobileNumber?: string;
  createdAt: string;
}

export interface AdminCanteenMetrics {
  canteenId: CanteenId;
  todayOrders: number;
  todayRevenue: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
}
