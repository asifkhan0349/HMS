import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export const useCrud = (apiClient, mapFromApi, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, globalRefreshTime } = useApp();
  const { enabled = true } = options;

  const loadData = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.list();
      setData(mapFromApi ? response.map(mapFromApi) : response);
    } catch (error) {
      if (showToast) showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiClient, enabled, mapFromApi, showToast, globalRefreshTime]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addData = async (payload) => {
    try {
      const created = await apiClient.create(payload);
      const normalized = mapFromApi ? mapFromApi(created) : created;
      setData((prev) => [normalized, ...prev]);
      return normalized;
    } catch (error) {
      if (showToast) showToast(error.message || 'Failed to create record', 'error');
      throw error;
    }
  };

  const updateData = async (id, payload) => {
    try {
      const updated = await apiClient.update(id, payload);
      const normalized = mapFromApi ? mapFromApi(updated) : updated;
      setData((prev) =>
        prev.map((item) => (String(item.apiId) === String(id) ? normalized : item))
      );
      return normalized;
    } catch (error) {
      if (showToast) showToast(error.message || 'Failed to update record', 'error');
      throw error;
    }
  };

  const removeData = async (id) => {
    try {
      await apiClient.remove(id);
      setData((prev) => prev.filter((item) => String(item.apiId) !== String(id)));
    } catch (error) {
      if (showToast) showToast(error.message || 'Failed to delete record', 'error');
      throw error;
    }
  };

  return { data, loading, addData, updateData, removeData, loadData };
};
