// hooks/useAxiosHandler.ts
import { useCallback } from "react";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

type NotifyType = {
  success: (msg: string) => void;
  error: (msg: string) => void;
};

type ApiResponse<T = any> = {
  data: T | null;
  status: number;
  success: boolean;
  error: string | null;
  message: string | null;
};

type ApiHandlerParams = {
  url: string;
  method?: AxiosRequestConfig["method"];
  DATA?: any;
  extra?: Record<string, string>;
  queryParam?: Record<string, any>;
  signal?: AbortSignal;
};

type GetHandlerParams = Omit<ApiHandlerParams, "method" | "DATA"> & {
  notify?: boolean;
};

type PostPutDeleteHandlerParams = Omit<ApiHandlerParams, "method"> & {
  notify?: boolean;
  successMessage?: string;
};

const Notify = (): NotifyType => ({
  success: (msg: string) => console.log("success", msg),
  error: (msg: string) => console.error("error", msg),
});

const handleAPICall = async <T = any,>({
  url,
  method = "get",
  DATA,
  extra,
  queryParam,
  signal,
}: ApiHandlerParams): Promise<ApiResponse<T>> => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(extra || {}),
    };

    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      data: DATA,
      params: queryParam,
      signal,
    };

    const response: AxiosResponse<T> = await axios(config);
    return {
      data: response.data,
      status: response.status,
      success: true,
      error: null,
      message: (response.data as any)?.message || "Request successful",
    };
  } catch (err) {
    const error = err as AxiosError;
    return {
      data: null,
      status: error?.response?.status || 500,
      success: false,
      error:
        (error?.response?.data as any)?.message || error.message || "Error",
      message: null,
    };
  }
};

export const useAxiosHandler = () => {
  const getAxiosHandler = useCallback(
    async <T = any,>({
      url,
      notify = true,
      extra,
      queryParam,
      signal,
    }: GetHandlerParams): Promise<{
      data: T | null;
      status: number;
      error: string | null;
    }> => {
      const { data, status, error } = await handleAPICall<T>({
        url,
        method: "get",
        extra,
        queryParam,
        signal,
      });

      if (notify && error) Notify().error(error);
      return { data, status, error };
    },
    []
  );

  const postAxiosHandler = async <T = any,>({
    url,
    notify = true,
    DATA,
    successMessage,
  }: PostPutDeleteHandlerParams): Promise<ApiResponse<T>> => {
    const { data, status, error, success, message } = await handleAPICall<T>({
      url,
      method: "post",
      DATA,
    });

    if (notify && success) Notify().success(successMessage || message || "");
    if (notify && error) Notify().error(error || "");
    return { data, status, error, success, message };
  };

  const putAxiosHandler = async <T = any,>({
    url,
    notify = true,
    DATA,
    successMessage,
  }: PostPutDeleteHandlerParams): Promise<ApiResponse<T>> => {
    const { data, status, error, success, message } = await handleAPICall<T>({
      url,
      method: "put",
      DATA,
    });

    if (notify && success) Notify().success(successMessage || message || "");
    if (notify && error) Notify().error(error || "");
    return { data, status, error, success, message };
  };

  const deleteAxiosHandler = async <T = any,>({
    url,
    notify = true,
    DATA,
    successMessage,
  }: PostPutDeleteHandlerParams): Promise<ApiResponse<T>> => {
    const { data, status, error, success, message } = await handleAPICall<T>({
      url,
      method: "delete",
      DATA,
    });

    if (notify && success) Notify().success(successMessage || message || "");
    if (notify && error) Notify().error(error || "");
    return { data, status, error, success, message };
  };

  return {
    getAxiosHandler,
    postAxiosHandler,
    putAxiosHandler,
    deleteAxiosHandler,
  };
};
