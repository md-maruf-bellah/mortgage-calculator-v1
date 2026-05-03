import { useState, useEffect, useCallback } from 'react';

// ─── useLoanTerms ──────────────────────────────────────────────────────────────
export function useLoanTerms() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/loan-terms');
      const data = await res.json();
      if (data.success) setTerms(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const create = async (term) => {
    const res = await fetch('/api/loan-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(term),
    });
    const data = await res.json();
    if (data.success) { setTerms(p => [...p, data.data]); return data.data; }
    throw new Error(data.error);
  };

  const update = async (id, updates) => {
    const res = await fetch('/api/loan-terms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await res.json();
    if (data.success) { setTerms(p => p.map(t => t._id === id ? data.data : t)); return data.data; }
    throw new Error(data.error);
  };

  const remove = async (id) => {
    await fetch(`/api/loan-terms?id=${id}`, { method: 'DELETE' });
    setTerms(p => p.filter(t => t._id !== id));
  };

  return { terms, loading, error, create, update, remove, refetch: fetch_ };
}

// ─── useCustomFields ───────────────────────────────────────────────────────────
export function useCustomFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fields')
      .then(r => r.json())
      .then(d => { if (d.success) setFields(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const create = async (field) => {
    const res = await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(field),
    });
    const data = await res.json();
    if (data.success) { setFields(p => [...p, data.data]); return data.data; }
    throw new Error(data.error);
  };

  const update = async (id, updates) => {
    const res = await fetch('/api/fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await res.json();
    if (data.success) { setFields(p => p.map(f => f._id === id ? data.data : f)); return data.data; }
    throw new Error(data.error);
  };

  const remove = async (id) => {
    await fetch(`/api/fields?id=${id}`, { method: 'DELETE' });
    setFields(p => p.filter(f => f._id !== id));
  };

  return { fields, loading, create, update, remove, activeFields: fields.filter(f => f.isActive) };
}

// ─── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── useLocalStorage ───────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch {}
  };

  return [storedValue, setValue];
}

// ─── useMortgageCalculator ────────────────────────────────────────────────────
export function useMortgageCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculate = useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { calculate, isLoading, error };
}
