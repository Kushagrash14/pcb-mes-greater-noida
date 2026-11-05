
import { useEffect, useState } from "react";
import { notification } from "antd";
import api from "../../services/API/api";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const res = await api.get("/products/all");
        const rows = res?.data?.data || [];

        if (!cancelled) {
          setProducts(Array.isArray(rows) ? rows : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          notification.error({
            message: "Failed to load products",
            description:
              err?.response?.data?.message ||
              "Could not fetch active products.",
            placement: "topRight",
          });
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);

        const res = await api.get("/production-orders/my-line");
        const rows = res?.data?.data || [];

        if (!cancelled) {
          setOrders(Array.isArray(rows) ? rows : []);
        }
      } catch (err) {
        if (!cancelled) {
          setOrders([]);
          notification.error({
            message: "Failed to load running production orders",
            description:
              err?.response?.data?.message ||
              "Could not fetch production orders for your line.",
            placement: "topRight",
          });
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    fetchProducts();
    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    products,
    orders,
    productsLoading,
    ordersLoading,
  };
}
