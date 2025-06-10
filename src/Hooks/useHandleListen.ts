import { useState } from "react";
import axios from "axios";
import useTimer from "./useTimer";

const BASE_URL = process.env.NEXT_PUBLIC_V2_SERVER_URL;

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  type?: string;
  answer?: boolean;
  image?: string;
  audio?: string;
}

interface WebSocketData {
  questionResponse?: string;
  text?: string;
  type?: string;
  audio?: string;
  image?: string;
}

const useLectureStarter = ({
  curLanguage,
  connectrobot,
}: {
  curLanguage: string;
  connectrobot: string;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStart, setIsStart] = useState<boolean>(false);
  const [curLectureId, setCurLectureId] = useState<string | null>(null);
  const [curTopicId, setCurTopicId] = useState<string | null>(null);
  const [disabledTyping, setDisabledTyping] = useState<boolean>(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [ws, setWs] = useState<WebSocket | null>(null);

  const { minutes, seconds, start: startTimer, stop: stopTimer } = useTimer();

  const handleStart = (lectureId: string, topicId: string) => {
    if (ws) {
      ws.close();
      console.log("Previous WebSocket connection closed");
    }

    setMessages([]);
    setCurLectureId(lectureId);
    setCurTopicId(topicId);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    axios
      .post(
        `${BASE_URL}/selectLanguage/${lectureId}`,
        new URLSearchParams({ languageName: curLanguage }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(() => {
        axios
          .post(
            `${BASE_URL}/startLecture/${lectureId}/${topicId}`,
            new URLSearchParams({ connectrobot }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          )
          .then((res) => {
            console.log("Lecture started:", res.data);
            setIsStart(true);
            startTimer();

            const websocket = new WebSocket(
              `ws://localhost:8000/ws/${lectureId}/${connectrobot}`
            );

            websocket.onopen = () => {
              console.log("WebSocket connection opened");
            };

            websocket.onmessage = (event) => {
              console.log("Raw message from server:", event.data);
              const data: WebSocketData = JSON.parse(event.data);

              if (data.questionResponse) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: prev.length + 1,
                    text: data.questionResponse ?? "",
                    sender: "You",
                    timestamp: new Date().toISOString(),
                    isOwn: true,
                  },
                ]);
              }

              if (data.text === "question") {
                setDisabledTyping(false);
              } else if (data.type === "stop") {
                if (currentAudio) {
                  currentAudio.pause();
                  currentAudio.currentTime = 0;
                }
                if (data.audio) {
                  const audio = new Audio(
                    `data:audio/wav;base64,${data.audio}`
                  );
                  setCurrentAudio(audio);
                  audio
                    .play()
                    .catch((err) => console.error("Error playing audio:", err));
                }
              } else if (data.text !== "") {
                console.log("Message from server:", data);

                if (data.type === "model") {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      text: data.text ?? "",
                      sender: "Teacher Bot",
                      timestamp: new Date().toISOString(),
                      type: "model",
                      isOwn: false,
                      answer: true,
                    },
                  ]);
                  if (data.audio) {
                    const audio = new Audio(
                      `data:audio/wav;base64,${data.audio}`
                    );
                    setCurrentAudio(audio);
                    audio
                      .play()
                      .catch((err) =>
                        console.error("Error playing audio:", err)
                      );
                  }
                } else if (data.type === "static") {
                  setDisabledTyping(true);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      text: data.text ?? "",
                      sender: "Teacher Bot",
                      timestamp: new Date().toISOString(),
                      image: data.image,
                      audio: data.audio,
                      type: "static",
                      isOwn: false,
                    },
                  ]);
                  if (data.audio) {
                    const audio = new Audio(
                      `data:audio/wav;base64,${data.audio}`
                    );
                    setCurrentAudio(audio);
                    audio
                      .play()
                      .catch((err) =>
                        console.error("Error playing audio:", err)
                      );
                  }
                }
              }
            };

            websocket.onerror = (error) => {
              console.error("WebSocket error:", error);
            };

            websocket.onclose = () => {
              console.log("WebSocket connection closed");
              setIsStart(false);
              stopTimer();
            };

            setWs(websocket);
          })
          .catch((err) => {
            console.error("Network Error!", err);
          });
      })
      .catch((err) => {
        console.error("Error changing language:", err);
      });
  };

  console.log("messages", messages);
  return {
    handleStart,
    messages,
    setMessages,
    currentAudio,
    setCurrentAudio,
    isStart,
    seconds,
    minutes,
    curLectureId,
    curTopicId,
    disabledTyping,
    ws,
  };
};

export default useLectureStarter;
