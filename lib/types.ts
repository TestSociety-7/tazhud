export type ID = string;

export interface ColorOption {
  name: string;
  hex: string;
  /** One of the product's photos showing this colour. */
  image?: string;
}

export interface Category {
  id: ID;
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface Product {
  id: ID;
  slug: string;
  name: string;
  /** Short line shown under the product name. */
  tagline: string;
  description: string;
  /** Bullet points: fabric, fit, care. */
  details: string[];
  price: number;
  /** Optional reduced price. Must be lower than `price` to take effect. */
  salePrice?: number | null;
  images: string[];
  categoryId: ID;
  sizes: string[];
  colors: ColorOption[];
  stock: number;
  sku: string;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundleItem {
  productId: ID;
  quantity: number;
}

export interface Bundle {
  id: ID;
  slug: string;
  name: string;
  description: string;
  image: string;
  items: BundleItem[];
  /** The price the customer pays for the whole bundle. */
  price: number;
  active: boolean;
  /** Short note shown on the card, e.g. "Choose colours on WhatsApp". */
  note: string;
}

export type CouponType = "percent" | "fixed" | "free_delivery";

export interface Coupon {
  id: ID;
  code: string;
  description: string;
  type: CouponType;
  /** Percent (0-100) or fixed amount. Ignored for free delivery. */
  value: number;
  minSubtotal: number;
  active: boolean;
  /** ISO date (yyyy-mm-dd) or empty for no expiry. */
  expiresOn: string;
}

export interface Policy {
  id: ID;
  title: string;
  body: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  /** International format, digits only, e.g. 15550102030. */
  whatsappNumber: string;
  instagramUrl: string;
  instagramHandle: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  currency: string;
  locale: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryNote: string;
  lowStockThreshold: number;
  /** When off, the home promo banner and the coupon box in the cart are hidden. */
  couponsEnabled: boolean;
  policies: Policy[];
}

export type HomeSectionKey =
  | "categories"
  | "newArrivals"
  | "bestsellers"
  | "bundles"
  | "promo"
  | "story"
  | "follow";

export interface HomeSection {
  key: HomeSectionKey;
  enabled: boolean;
  title: string;
  subtitle: string;
}

export interface HomepageContent {
  announcement: {
    enabled: boolean;
    messages: string[];
    link: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
    secondaryImage: string;
  };
  promo: {
    eyebrow: string;
    title: string;
    body: string;
    couponCode: string;
    ctaLabel: string;
    ctaHref: string;
  };
  story: {
    title: string;
    body: string;
    image: string;
  };
  sections: HomeSection[];
}

export type OrderStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface OrderLine {
  kind: "product" | "bundle";
  refId: ID;
  name: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderInquiry {
  id: ID;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  };
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string;
  currency: string;
  adminNote: string;
  /** True for starter examples shipped with the demo. */
  sample?: boolean;
}

export interface StoreData {
  version: 1;
  settings: StoreSettings;
  homepage: HomepageContent;
  categories: Category[];
  products: Product[];
  bundles: Bundle[];
  coupons: Coupon[];
  orders: OrderInquiry[];
  orderSequence: number;
  subscribers: Subscriber[];
}

export interface Subscriber {
  email: string;
  createdAt: string;
}
