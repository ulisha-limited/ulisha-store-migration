export interface ProductImage {
  original_url?: string;
  local_path: string;
}

export interface ProductVariant {
  variant_name?: string;
  name?: string;
  title?: string;
  price?: number;
  stock?: number;
  image_url?: string | string[] | null;
  video_url?: string | string[] | null;
  color?: string | null;
  size?: string | null;
  barcode?: string | null;
  sku?: string | null;
}

export interface Product {
  id: string | number;
  name: string;
  short_description?: string | null;
  description?: string | null;

  category: string;
  category_ulid?: string | null;

  brand?: string | null;
  is_active?: boolean | number | string;

  price?: number;
  store_id?: string | number;
  created_at?: string;

  variants: ProductVariant[];
  images: ProductImage[];
}
