'use client';

import { useState } from 'react';
import api from '../lib/axios';

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

interface UseApiResult<T> {
  response: T | null;
  error: string | null;
  isLoading: boolean;
  callApi: (options: UseApiOptions) => Promise<T | null>;
}

const useApi = <T = any>(): UseApiResult<T> => {
  const [response, setResponse] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const callApi = async ({
    method = 'GET',
    url,
    data,
    headers = {},
  }: UseApiOptions): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Pull token from storage if available
      const token =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('access_token')
          : null;

      const res = await api.request<T>({
        method,
        url,
        data,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      });

      setResponse(res.data);
      return res.data;
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Request failed';

      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { response, error, isLoading, callApi };
};

export default useApi;
