import type {
  AdminCanteenMetrics,
  Canteen,
  CanteenId,
  FoodCategory,
  MenuItem,
  Order,
  OrderStatus,
  PaymentMethod,
  UserProfile,
} from '../types';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getCanteens: () => apiFetch<{ canteens: Canteen[] }>('/api/canteens'),

  updateCanteen: (
    id: CanteenId,
    payload: Partial<Pick<Canteen, 'upiId' | 'upiMerchantName' | 'isOpen' | 'avgPrepMinutes' | 'timings'>>
  ) =>
    apiFetch<{ canteen: Canteen }>(`/api/canteens/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getMenu: (canteenId?: CanteenId) =>
    apiFetch<{ items: MenuItem[] }>(canteenId ? `/api/menu?canteenId=${canteenId}` : '/api/menu'),

  createMenuItem: (payload: {
    canteenId: CanteenId;
    name: string;
    description: string;
    price: number;
    category: FoodCategory;
    isVeg: boolean;
    available: boolean;
    prepTimeMinutes: number;
    image: string;
  }) =>
    apiFetch<{ item: MenuItem }>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMenuItem: (id: string, payload: Partial<MenuItem>) =>
    apiFetch<{ item: MenuItem }>(`/api/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteMenuItem: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/menu/${id}`, {
      method: 'DELETE',
    }),

  uploadFoodImage: (dataUrl: string, filename: string) =>
    apiFetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename }),
    }),

  getAuthStatus: () =>
    apiFetch<{ adminClaimed: boolean; envPasscodeConfigured: boolean }>('/api/auth/status'),

  registerStudent: (payload: {
    fullName: string;
    rollNumber: string;
    email: string;
    mobileNumber: string;
    password: string;
  }) =>
    apiFetch<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginStudent: (payload: { identifier: string; password: string }) =>
    apiFetch<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  claimAdmin: (payload: { fullName: string; email: string; password: string }) =>
    apiFetch<{ user: UserProfile; token: string }>('/api/auth/admin/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginAdmin: (payload: { email: string; password: string }) =>
    apiFetch<{ user: UserProfile; token: string }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  placeOrder: (payload: {
    canteenId: CanteenId;
    studentName: string;
    rollNumber: string;
    mobileNumber: string;
    items: { menuItemId: string; quantity: number }[];
    pickupTime: string;
    paymentMethod: PaymentMethod;
    upiTransactionRef?: string;
    notes?: string;
  }) =>
    apiFetch<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => apiFetch<{ orders: Order[] }>('/api/orders/mine'),

  trackOrder: (orderId: string) =>
    apiFetch<{ order: Order; canCancel: boolean }>(`/api/orders/track/${encodeURIComponent(orderId)}`),

  cancelOrder: (orderId: string) =>
    apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
    }),

  getAdminOrders: (canteenId: CanteenId) =>
    apiFetch<{ orders: Order[]; metrics: AdminCanteenMetrics }>(`/api/orders/admin/${canteenId}`),

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    apiFetch<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
