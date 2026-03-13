'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QTY'; payload: { id: number; qty: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType extends CartState {
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
}

const initialState: CartState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  total: 0,
};

const calculateTotals = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { items, itemCount, subtotal, total: subtotal };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems;
  switch (action.type) {
    case 'ADD_ITEM':
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        newItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, qty: 1 }];
      }
      return calculateTotals(newItems);
    case 'REMOVE_ITEM':
      newItems = state.items.filter((item) => item.id !== action.payload);
      return calculateTotals(newItems);
    case 'UPDATE_QTY':
      if (action.payload.qty <= 0) {
        newItems = state.items.filter((item) => item.id !== action.payload.id);
      } else {
        newItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, qty: action.payload.qty } : item
        );
      }
      return calculateTotals(newItems);
    case 'CLEAR_CART':
      return initialState;
    case 'LOAD_CART':
      return calculateTotals(action.payload);
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('zeCart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD_CART', payload: parsed });
        }
      } catch (e) {
        console.error('Failed to parse cart from session storage', e);
      }
    }
  }, []);

  // Save to session storage on change
  useEffect(() => {
    sessionStorage.setItem('zeCart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: Product) => dispatch({ type: 'ADD_ITEM', payload: product });
  const removeItem = (id: number) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQty = (id: number, qty: number) => dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
