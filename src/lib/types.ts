export type Locale = "ar" | "fr" | "en";

export interface ProductRow {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  brand: string;
  gender: "men" | "women" | "unisex";
  category_id: string | null;
  price_dzd: number;
  discount_price_dzd: number | null;
  stock: number;
  images: string[];
  specs: Record<string, string>;
  featured: boolean;
  is_new: boolean;
  is_limited: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  sort_order: number;
}

export interface WilayaRow {
  code: number;
  name_ar: string;
  name_fr: string;
  delivery_home_dzd: number;
  delivery_office_dzd: number;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled";
export type DeliveryType = "home" | "office";

export interface OrderRow {
  id: string;
  order_number: string;
  customer_user_id: string | null;
  full_name: string;
  phone: string;
  wilaya_code: number;
  commune: string;
  address: string | null;
  delivery_type: DeliveryType;
  subtotal_dzd: number;
  delivery_dzd: number;
  total_dzd: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  image_url: string | null;
}

export const ORDER_STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: "في الانتظار",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  shipping: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};
