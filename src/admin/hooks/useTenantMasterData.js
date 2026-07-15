import { useCallback, useEffect, useState } from "react";
import {
  createMasterDataItem,
  deleteMasterDataItem,
  fetchMasterCategories,
  fetchMasterData,
  updateMasterDataItem,
} from "../api/admin.js";

export function useTenantMasterData(category) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!category) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchMasterData(category);
      setItems(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createItem = useCallback(
    async (payload) => {
      const item = await createMasterDataItem({ ...payload, category });
      await reload();
      return item;
    },
    [category, reload]
  );

  const updateItem = useCallback(
    async (id, payload) => {
      const item = await updateMasterDataItem(id, payload);
      await reload();
      return item;
    },
    [reload]
  );

  const deleteItem = useCallback(
    async (id) => {
      setItems((current) => current.filter((item) => String(item.id) !== String(id)));
      await deleteMasterDataItem(id);
      await reload();
    },
    [reload]
  );

  const activeItems = items.filter((i) => i.status === "active");

  return { items, activeItems, loading, error, reload, createItem, updateItem, deleteItem };
}

export function useMasterCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterCategories()
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
