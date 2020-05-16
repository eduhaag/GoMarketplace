import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const keyStorage = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsLoaded = await AsyncStorage.getItem(keyStorage);

      if (productsLoaded) {
        setProducts(JSON.parse(productsLoaded));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        const updatedProducts = [...products];

        updatedProducts[productIndex].quantity += 1;

        setProducts(updatedProducts);

        await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);
      const productsUpdated = [...products];

      if (products[index].quantity === 1) {
        productsUpdated.splice(index, 1);
      } else {
        productsUpdated[index].quantity -= 1;
      }

      setProducts(productsUpdated);

      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const { id } = product;
      const productExists = products.find(item => item.id === id);

      if (productExists) {
        increment(product.id);
      } else {
        const productAdd = {
          ...product,
          quantity: 1,
        };

        await setProducts(state => [...state, productAdd]);
      }

      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    },

    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
