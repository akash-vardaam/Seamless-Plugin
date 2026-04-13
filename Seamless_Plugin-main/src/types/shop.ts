export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children: ShopCategory[];
}

export interface ShopCategoryReference {
  id: string;
  name: string;
  slug: string;
}

export interface ShopVariantOption {
  id: string;
  value: string;
  swatch: string;
  image: string;
  images: string[];
  stockQuantity: number;
  isAvailable: boolean;
}

export interface ShopVariantGroup {
  attributeType: string;
  options: ShopVariantOption[];
}

export interface ShopProduct {
  id: string;
  slug: string;
  title: string;
  name: string;
  sku: string;
  shortDescription: string;
  descriptionHtml: string;
  excerpt: string;
  price: number | null;
  priceLabel: string;
  currencySymbol: string;
  featuredImage: string;
  gallery: string[];
  productType: string;
  stockQuantity: number;
  isAvailable: boolean;
  availabilityStatus: 'available' | 'unavailable';
  hasVariants: boolean;
  variants: ShopVariantGroup[];
  categories: ShopCategoryReference[];
  featured: boolean;
  sortTimestamp: number;
  url: string;
  raw: Record<string, unknown>;
}

export interface ShopVariantSelection {
  attributeType: string;
  attributeLabel: string;
  value: string;
  valueLabel: string;
}

export interface ShopCartItem {
  key: string;
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  subtotal: number;
  total: number;
  unitPrice: number;
  imageUrl: string;
  canIncrement: boolean;
  maxQuantity: number;
  stockMessage: string;
  variantSelections: ShopVariantSelection[];
  raw: Record<string, unknown>;
}

export interface ShopCart {
  items: ShopCartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  guestToken: string;
  raw: Record<string, unknown> | null;
}

export interface ShopRuntimeConfig {
  apiDomain: string;
  siteUrl: string;
  shopListEndpoint: string;
  singleProductEndpoint: string;
  shopCartEndpoint: string;
  shopProductTypeLabel: string;
  shopAvailabilityLabel: string;
  isLoggedIn: boolean;
  amsUserId: string;
}

export interface ShopRichTextBlock {
  type: 'paragraph' | 'list';
  heading?: string;
  text?: string;
  items?: string[];
}
