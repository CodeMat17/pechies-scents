"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { CartLine } from "@/lib/store";

type Stored = { id: Id<"products">; qty: number };

/** Lightweight "added to bag" confirmation shown instead of hijacking the screen. */
export type Toast = { key: number; id: Id<"products">; qty: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: Id<"products">, qty?: number) => void;
  setQty: (id: Id<"products">, qty: number) => void;
  remove: (id: Id<"products">) => void;
  clear: () => void;
  toast: Toast | null;
  dismissToast: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "pechies-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Stored[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read after hydration
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  // Live product data: prices/stock stay in sync with the dashboard
  const products = useQuery(api.products.list);

  const lines = useMemo<CartLine[]>(() => {
    if (!products) return [];
    return items.flatMap((i) => {
      const product = products.find((p) => p._id === i.id);
      return product ? [{ product, qty: i.qty }] : [];
    });
  }, [items, products]);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const add = useCallback((id: Id<"products">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      return found
        ? prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { id, qty }];
    });
    clearTimeout(timer.current);
    setToast({ key: Date.now(), id, qty });
    timer.current = setTimeout(() => setToast(null), 3200);
    try {
      navigator.vibrate?.(12);
    } catch {}
  }, []);

  const setQty = useCallback((id: Id<"products">, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback(
    (id: Id<"products">) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const openCart = useCallback((v: boolean) => {
    if (v) {
      clearTimeout(timer.current);
      setToast(null);
    }
    setOpen(v);
  }, []);

  const value: CartCtx = {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    total: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
    open,
    setOpen: openCart,
    add,
    setQty,
    remove,
    clear,
    toast,
    dismissToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
