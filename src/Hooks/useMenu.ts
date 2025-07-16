import { useAxiosHandler } from "@/helper/fetcher";

interface QueryParam {
  [key: string]: string | number | boolean;
}

interface ApiResponse<T = any> {
  data: T | null;
  status: number;
  error: string | null;
}

export function useTopics() {
  const BASE_URL = `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/topics/`;
  console.log("BASE_URL", BASE_URL);
  const { getAxiosHandler } = useAxiosHandler();

  const handleGetTopics = async (): Promise<ApiResponse> => {
    const { data, status, error } = await getAxiosHandler({
      url: BASE_URL,
    });
    return { data, status, error };
  };

  return { handleGetTopics };
}
