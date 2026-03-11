export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "EDITOR"
  | "SUPPORT"
  | "CUSTOMER";

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  quantity: number;
  status: ProductStatus;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId?: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  isGuest: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

