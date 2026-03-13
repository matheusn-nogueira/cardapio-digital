export interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  color: string;
  category: string;
  shelf: 'top' | 'ofertas' | 'craft';
}

export interface CartItem extends Product {
  qty: number;
}

export interface Category {
  id: string;
  icon: string;
  label: string;
  bg: string;
}

export interface Brand {
  name: string;
  bg: string;
  color: string;
  size?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}
