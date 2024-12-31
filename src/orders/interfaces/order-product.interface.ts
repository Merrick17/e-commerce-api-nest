import { Product } from '../../products/schemas/product.schema';

export interface OrderProduct {
  product: Product | string;
  quantity: number;
  price: number;
} 