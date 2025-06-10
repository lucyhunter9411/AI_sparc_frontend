import { useAxiosHandler } from "@/helper/fetcher";
import axios, { AxiosResponse } from "axios";
import { useState } from "react";

interface Topic {
  id: string;
  [key: string]: any;
}

interface DeleteTopicResponse {
  topic: Topic[];
}

export const useDeleteTopic = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  const deleteTopic = async (topicID: string): Promise<void> => {
    setLoading(true);

    const send_data = new URLSearchParams();
    send_data.append("topicID", topicID);
    const apiUrl = `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/deleteTopic/`;

    try {
      const response: AxiosResponse<DeleteTopicResponse> = await axios.post(
        "http://localhost:8000/deleteTopic/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      setTopics(response.data.topic);
      setConfirm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteTopic, loading, topics, confirm };
};
