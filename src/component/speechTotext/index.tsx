import React, { useState, useEffect, useRef } from "react";
import { styled, keyframes } from "@mui/system";
import MicIcon from "@mui/icons-material/Mic";
import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
  LinearProgress,
  TextField,
} from "@mui/material";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { orange } from "@mui/material/colors";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { UseContext } from "@/state/provider";
import SendIcon from "@mui/icons-material/Send";
import TimerDisplay from "../timer";
import { School } from "@mui/icons-material";
import axios from "axios";
import { getGreeting } from "../common";

const { saveAs } = require("file-saver");

export interface Message {
  image_path: any;
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isOwn?: boolean;
  type?: string;
  answer?: boolean;
  image?: string;
  audio?: string;
  language?: string;
}

interface SpeechRecognizerProps {
  onTranscriptChange?: (transcript: string) => void;
  sttMethod: string;
  connectrobot: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  curLectureId: string | null;
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;

  isStart: boolean;
  ws: WebSocket | null;
  curTopicId: string | null;
  disabledTyping: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showText: boolean;
  language: string;
  languageToSTTMap: any;
  STTToLanguageMap: any;
  isLastMessage: boolean;
  setIsLastMessage: (isLastMessage: boolean) => void;
}

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 61, 0, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 61, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 61, 0, 0);
  }
`;

const equalize = keyframes`
  0% { height: 6px; }
  50% { height: 18px; }
  100% { height: 6px; }
`;

interface AnimatedFabProps {
  islistening: string;
}

const AnimatedFab = styled(Fab, {
  shouldForwardProp: (prop) => prop !== "islistening",
})<AnimatedFabProps>(({ theme, islistening }) => ({
  position: "fixed",
  bottom: 24,
  right: 24,
  backgroundColor: islistening === "true" ? "#ff3d00" : "#1976d2",
  color: "white",
  "&:hover": {
    backgroundColor: islistening === "true" ? "#ff3d00" : "#1565c0",
  },
  animation: islistening === "true" ? `${pulse} 1.5s infinite` : "none",
  transition: "all 0.3s ease",
}));

interface BarProps {
  delay: string;
}

const Bar = styled(Box)<BarProps>(({ delay }) => ({
  width: 6,
  height: 6, // initial height
  backgroundColor: "#9F5DE7",
  borderRadius: 2,
  animation: `${equalize} 1.2s ease-in-out infinite`,
  animationDelay: delay,
}));

const thinkingKeyframes = keyframes`
  0% { opacity: 0.2; transform: scale(1); }
  20% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0.2; transform: scale(1); }
`;

const ThinkingDots = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  height: 24,
  "& span": {
    display: "inline-block",
    width: 8,
    height: 8,
    margin: "0 2px",
    borderRadius: "50%",
    background: "#9F5DE7",
    opacity: 0.2,
    animation: `${thinkingKeyframes} 1.4s infinite`,
  },
  "& span:nth-of-type(1)": { animationDelay: "0s" },
  "& span:nth-of-type(2)": { animationDelay: "0.2s" },
  "& span:nth-of-type(3)": { animationDelay: "0.4s" },
});

const CenteredOverlayLoading = ({
  type,
}: {
  type: "listening" | "thinking";
}) => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      bgcolor: "#E1E9EF",
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto",
    }}
  >
    <Box
      sx={{
        borderRadius: 3,
        p: 4,
        minWidth: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {type === "listening" ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Listening...
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 0.5,
              height: 24,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <Bar key={i} delay={`${i * 0.1}s`} />
            ))}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="secondary" sx={{ mb: 2 }}>
            Thinking...
          </Typography>
          <ThinkingDots>
            <span />
            <span />
            <span />
          </ThinkingDots>
        </Box>
      )}
    </Box>
  </Box>
);
const SpeechRecognizer: React.FC<SpeechRecognizerProps> = ({
  languageToSTTMap,
  STTToLanguageMap,
  language,
  setIsLastMessage,
  isLastMessage,
  onTranscriptChange,
  sttMethod,
  connectrobot,
  messages,
  setMessages,
  curLectureId,
  currentAudio,
  setCurrentAudio,
  isStart,
  ws,
  curTopicId,
  disabledTyping,
  isLoading,
  setIsLoading,
  showText,
}) => {
  const {
    state: { doc },
    setDoc,
  } = UseContext();
  const wsRef = useRef<WebSocket | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [updateMessage, setUpdateMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [status, setStatus] = useState("Click to start listening");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<
    number | null
  >(null);

  type WebSocketState = "connected" | "disconnected" | "error" | "connecting";
  const [webSocketState, setWebSocketState] =
    useState<WebSocketState>("disconnected");
  const isOverallLoading = isLoading || webSocketState === "connecting";

  const showOverlay = isListening || isThinking;

  const [micUsed, setMicUsed] = useState(false);

  const mediaRecorderRef = useRef<{
    stream: MediaStream;
    processor: ScriptProcessorNode;
    audioContext: AudioContext;
  } | null>(null);

  const audioChunksRef = useRef<Int16Array[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  interface SlideContainerProps {
    isfullscreen: string;
  }

  const SlideContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isfullscreen",
  })<SlideContainerProps>(({ theme, isfullscreen }) => ({
    position: isfullscreen === "true" ? "fixed" : "relative",
    width: "100%",
    height: isfullscreen === "true" ? "100vh" : "100%",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: isfullscreen === "true" ? "flex-start" : "center",
    justifyContent: "center",
    backgroundColor:
      isfullscreen === "true" ? "rgba(0, 0, 0, 0.9)" : "transparent",
    zIndex: isfullscreen === "true" ? 2000 : 1,
    overflow: "hidden",
    padding: theme.spacing(isfullscreen === "true" ? 0 : 2),
  }));

  const SlideContent = styled(Paper, {
    shouldForwardProp: (prop) => prop !== "isfullscreen",
  })<SlideContainerProps>(({ theme, isfullscreen }) => ({
    position: "relative",
    margin: theme.spacing(isfullscreen === "true" ? 0 : 0),
    padding: theme.spacing(3),
    borderRadius: isfullscreen === "true" ? 0 : "5px",
    width: "100%",
    maxWidth: "1200px",
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    backgroundColor:
      isfullscreen === "true"
        ? "rgba(0, 0, 0, 0.9)"
        : theme.palette.background.paper,
  }));

  const ContentWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isfullscreen",
  })<SlideContainerProps>(({ theme, isfullscreen }) => ({
    flex: 1,
    overflowY: "auto",
    paddingRight: "8px",
    paddingTop: theme.spacing(1),
    color: isfullscreen === "true" ? theme.palette.common.white : "inherit",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor:
        isfullscreen === "true" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
      borderRadius: "4px",
    },
    paddingBottom: theme.spacing(2),
  }));

  const ImageContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isfullscreen",
  })<SlideContainerProps>(({ theme, isfullscreen }) => ({
    position: "relative",
    marginBottom: theme.spacing(2),
    borderRadius: "12px",
    overflow: "hidden",
    flexShrink: 0,
    maxHeight: isfullscreen === "true" ? "calc(80vh - 100px)" : "60vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      isfullscreen === "true" ? "transparent" : theme.palette.grey[100],
    width: "100%",
  }));

  const FullScreenButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== "isfullscreen",
  })<SlideContainerProps>(({ theme, isfullscreen }) => ({
    position: "absolute",
    top: theme.spacing(isfullscreen === "true" ? 3 : 1),
    right: theme.spacing(isfullscreen === "true" ? 3 : 1),
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 2001,
    "&:hover": {
      backgroundColor: "rgba(255,255,255,1)",
    },
  }));

  const EmptyStateContainer = styled(Box)({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    minHeight: "300px",
    width: "100%",
    textAlign: "center",
  });

  const ListeningContainer = styled(Box)({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    color: "white",
  });

  const MessageBubble = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isOwn",
  })<{ isOwn: boolean }>(({ theme, isOwn }) => ({
    maxWidth: "70%",
    alignSelf: isOwn ? "flex-start" : "flex-end",
    background: isOwn ? "#7F8F9A" : "#8BA0AE",
    color: "#fff",
    borderRadius: 16,
    borderBottomLeftRadius: isOwn ? 4 : 16,
    borderBottomRightRadius: isOwn ? 16 : 4,
    padding: theme.spacing(1.2, 2),
    margin: theme.spacing(0.5, 0),
  }));

  const isLessonMode = !!curLectureId;
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setIsLoading(false);
    }
  }, [messages, setIsLoading]);

  useEffect(() => {
    setIsLastMessage(currentSlideIndex === messages.length - 1);
  }, [currentSlideIndex, messages]);

  useEffect(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  }, [language, sttMethod]);

  const LoadingSpinner = () => (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1,
      }}
    >
      <CircularProgress />
    </Box>
  );

  const handleDislike = (index: any) => {
    setSelectedMessageIndex((prevIndex) =>
      prevIndex === index ? null : index
    );
  };

  const handleUpdateTyping = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setUpdateMessage(event.target.value);
  };

  useEffect(() => {
    setCurrentSlideIndex(messages.length - 1);
  }, [messages]);

  useEffect(() => {
    if (currentAudio) {
      const handleAudioEnded = () => {
        setIsLoading(false);
        setCurrentAudio(null);
      };
      currentAudio.addEventListener("ended", handleAudioEnded);

      return () => {
        currentAudio.removeEventListener("ended", handleAudioEnded);
      };
    }
  }, [currentAudio, setIsLoading, setCurrentAudio]);

  const handleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    setDoc(newFullScreenState);
  };

  const handleUpdateResponse = () => {
    if (!updateMessage.trim()) return; // Don't send empty feedback

    const answer = updateMessage.trim();

    const qna = {
      question: messages[currentSlideIndex]?.text || "", // Get the question from the current message
      answer: answer,
      model: "",
      prompt: "",
    };

    setIsLoading(true); // Show loading state

    axios
      .put(`${process.env.NEXT_PUBLIC_V2_SERVER_URL}/qna/update/`, qna, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(function (res) {
        const resp = res.data.response?.trim();
        if (resp) {
          setMessages((prevMessages: Message[]) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: resp,
              sender: "Teacher Bot",
              timestamp: new Date().toISOString(),
              isOwn: false,
              answer: false,
              length: resp.length,
              image_path: null,
            },
          ]);
        }
        setUpdateMessage("");
        setSelectedMessageIndex(null);
      })
      .catch(function (error) {
        console.error("Error submitting feedback:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const sendAudioToBackend = (audioBlob: Blob) => {
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (!curLectureId) {
      setWebSocketState("connecting");

      const wsk = new WebSocket(
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL_WS}/ws/${connectrobot}/before/lecture`
      );
      wsRef.current = wsk;

      wsk.onopen = async () => {
        setWebSocketState("connected");

        console.log("WebSocket connection established, sending audio...");
        wsk.send(
          JSON.stringify({
            type: "register",
            data: {
              robot_id: connectrobot, // Use the correct variable for robot_id
              client: "frontend", // Lets server distinguish roles
            },
            ts: Date.now(), // Use Date.now() for the current timestamp
          })
        );

        // const reader = new FileReader();
        // reader.readAsDataURL(audioBlob);
        // reader.onloadend = () => {
        //   const base64Audio = (reader.result as string).split(",")[1];

        //   wsk.send(
        //     JSON.stringify({
        //       type: "speech",
        //       data: {
        //         robot_id: connectrobot,
        //         audio: base64Audio,
        //         backend: sttMethod,
        //       },
        //       ts: Date.now(), // Use Date.now() for the current timestamp
        //     })
        //   );
        // };

        // Convert the Blob to an ArrayBuffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        // Convert the ArrayBuffer to a Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);
        // Convert Uint8Array to a regular array for JSON serialization
        const byteArray = Array.from(uint8Array);
        // Send the byte array as part of the JSON message
        wsk.send(
          JSON.stringify({
            type: "speech",
            data: {
              robot_id: connectrobot,
              audio: byteArray,
              backend: sttMethod,
            },
            ts: Date.now(), // Use Date.now() for the current timestamp
          })
        );
      };

      wsk.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("Received  data:", data); // Log to check the data structure

        // Handle the incoming audio response from the backend
        if (data.type === "user" && data.text) {
          setIsThinking(false);
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: data.text,
              sender: "You",
              timestamp: new Date().toISOString(),
              isOwn: true,
              language: language,
              image_path: data.image_path,
              length: data.text ? data.text.length : 0,
            },
          ]);
        } else if (data.type === "model" && data.text) {
          setIsThinking(false);
          // Process the response text and audio
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: data.text,
              sender: "Teacher Bot",
              timestamp: new Date().toISOString(),
              type: "model",
              isOwn: false,
              answer: true,
              image_path: data.image_path,
              language: language,
              length: data.text ? data.text.length : 0,
            },
          ]);
          if (data.audio) {
            // const audio = new Audio(`data:audio/webm;base64,${data.audio}`);

            const byteArray = new Uint8Array(data.audio); // Convert list of bytes to Uint8Array
            const blob = new Blob([byteArray], { type: "audio/webm" }); // Create a Blob from the Uint8Array
            const url = URL.createObjectURL(blob); // Create an Object URL from the Blob
            const audio = new Audio(url); // Use the Object URL to create the Audio object

            setCurrentAudio(audio);
            audio.play().catch((error) => {
              console.error("Error playing audio:", error);
            });
          }
        } else {
          console.warn("Unknown message type received:", data.type);
        }
      };

      wsk.onerror = (error) => {
        setWebSocketState("error");
        console.error("WebSocket error:", error);
      };

      wsk.onclose = () => {
        setWebSocketState("disconnected");
        console.log("WebSocket connection closed");
      };
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("Lecture Question Time.....");
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(",")[1];

        ws.send(
          JSON.stringify({
            audio: base64Audio,
            robot_id: connectrobot,
            backend: sttMethod,
            client: "client",
            style: "audio",
            language: STTToLanguageMap[sttMethod],
            currentLanguage: language,
          })
        );
        console.log("Audio sent to backend");
      };
    }
  };

  const toggleListening = () => {
    if (!micUsed) setMicUsed(true);
    if (isListening) {
      stopRecording();
      setIsListening(false);
      setIsThinking(true);
    } else {
      startRecording();
      setIsListening(true);
      setIsThinking(false);
    }
  };

  const startRecording = async () => {
    try {
      setStatus("Listening...");
      audioChunksRef.current = [];

      if (mediaRecorderRef.current) {
        const { stream, processor, audioContext } = mediaRecorderRef.current;
        processor.disconnect();
        if (audioContext.state !== "closed") {
          audioContext.close();
        }
        stream.getTracks().forEach((track) => track.stop());
      }

      // Start a new stream and audio context for recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000, // Same sample rate as backend
      });

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0); // Get PCM data
        const outputData = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          // Convert from float [-1, 1] to 16-bit PCM [-32768, 32767]
          outputData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }

        audioChunksRef.current.push(outputData); // Push processed data to buffer
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      mediaRecorderRef.current = { stream, processor, audioContext };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsListening(false);
      setStatus("Microphone access error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      const { stream, processor, audioContext } = mediaRecorderRef.current;

      processor.disconnect();
      if (audioContext.state !== "closed") {
        audioContext.close();
      }
      stream.getTracks().forEach((track) => track.stop());

      // Flatten the audioChunks into a single array of PCM data
      const pcmData: number[] = audioChunksRef.current.reduce<number[]>(
        (acc, chunk) => acc.concat(Array.from(chunk)),
        []
      );

      const audioBlob = encodeWav(pcmData, 16000);
      // saveAs(audioBlob, "recorded_audio.wav");
      // console.log("Audio file saved:", "recorded_audio.wav");

      sendAudioToBackend(audioBlob);
      setStatus("Processing...");
    }
  };

  // Function to convert PCM data to WAV format
  const encodeWav = (pcmData: number[], sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2); // 44 bytes for header
    const view = new DataView(buffer);

    // Write the WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + pcmData.length * 2, true); // File size
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels (mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(view, 36, "data");
    view.setUint32(40, pcmData.length * 2, true); // Subchunk2Size

    // Write the PCM data
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(offset, pcmData[i], true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  };

  // Helper function to write strings to ArrayBuffer
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const currentMessage = messages[currentSlideIndex] || {};

  interface FullScreenViewProps {
    currentMessage: Message;
    handleFullScreen: () => void;
    isLoading: boolean;
    isListening: boolean;
    isLessonMode: boolean;
    messages: Message[];
    showText: boolean;
    showOverlay: boolean;
  }

  const FullScreenView: React.FC<FullScreenViewProps> = ({
    currentMessage,
    handleFullScreen,
    isLoading,
    isListening,
    isLessonMode,
    messages,
    showText,
    showOverlay,
  }) => (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: "1200px",
          padding: 4,
          display: "flex",
          flexDirection: "column",
          color: "white",
        }}
      >
        <FullScreenButton
          isfullscreen="true"
          onClick={handleFullScreen}
          size="small"
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            backgroundColor: "rgba(255,255,255,0.9)",
            zIndex: 2001,
          }}
        >
          <FullscreenExitIcon />
        </FullScreenButton>

        {isLessonMode ? (
          // Lesson UI (existing)
          <>
            {isLoading && (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  minHeight: "300px",
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {currentMessage.text ? (
              <ContentWrapper isfullscreen="true">
                {currentMessage.image && (
                  <ImageContainer isfullscreen="true">
                    <img
                      src={`${process.env.NEXT_PUBLIC_V2_SERVER_URL}/static/image/${currentMessage.image}`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "70vh",
                        objectFit: "contain",
                      }}
                      alt="Content visual"
                    />
                  </ImageContainer>
                )}
                {showText && (
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                  >
                    {currentMessage.text}
                  </Typography>
                )}
              </ContentWrapper>
            ) : (
              <EmptyStateContainer sx={{ color: "white" }}>
                <Typography variant="h6" sx={{ fontStyle: "italic", px: 4 }}>
                  {!isLoading &&
                    "I am SPARC. Select a lesson or tap the mic to speak to me."}
                </Typography>
              </EmptyStateContainer>
            )}
          </>
        ) : (
          // Chat UI (new)
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
              p: 2,
              overflowY: "auto",
              position: "relative",
            }}
          >
            {showText &&
              messages.map((msg, idx) => (
                <Box
                  key={msg.id || idx}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.isOwn ? "flex-start" : "flex-end",
                  }}
                >
                  {!msg.isOwn && msg.image_path && (
                    <Box
                      sx={{
                        width: "70%",
                        mb: 1,
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <img
                        src={`${msg.image_path}`}
                        alt="Message visual"
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          objectFit: "cover",
                          background: "#eee",
                        }}
                      />
                    </Box>
                  )}
                  <MessageBubble isOwn={!!msg.isOwn}>
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {msg.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: msg.isOwn ? "left" : "right",
                        opacity: 0.6,
                        mt: 0.5,
                      }}
                    >
                      {msg.isOwn
                        ? "You"
                        : msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Typography>
                  </MessageBubble>
                </Box>
              ))}
            {showOverlay && (
              <CenteredOverlayLoading
                type={isListening ? "listening" : "thinking"}
              />
            )}
            {/* <div ref={messagesEndRef} /> */}
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isFullScreen ? (
        <FullScreenView
          currentMessage={currentMessage}
          handleFullScreen={handleFullScreen}
          isLoading={isLoading}
          isListening={isListening}
          isLessonMode={isLessonMode}
          messages={messages}
          showText={showText}
          showOverlay={showOverlay}
          // messagesEndRef={messagesEndRef}
        />
      ) : (
        <SlideContainer isfullscreen={isFullScreen.toString()}>
          <SlideContent
            isfullscreen={isFullScreen.toString()}
            elevation={isFullScreen ? 0 : 3}
          >
            {messages.length === 0 &&
              !isListening &&
              !isLoading &&
              webSocketState === "disconnected" &&
              !micUsed && (
                <EmptyStateContainer>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {getGreeting().greeting}
                      </Typography>
                      {getGreeting().icon}
                    </Box>
                    <Typography variant="h6" sx={{ px: 4 }}>
                      {getGreeting().message}
                    </Typography>
                  </Box>
                </EmptyStateContainer>
              )}
            {isLessonMode ? (
              <>
                {isLoading && (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      minHeight: "300px",
                    }}
                  >
                    <LoadingSpinner />
                  </Box>
                )}

                {currentMessage.text && (
                  <>
                    <FullScreenButton
                      isfullscreen={isFullScreen.toString()}
                      onClick={handleFullScreen}
                      size="small"
                    >
                      {isFullScreen ? (
                        <FullscreenExitIcon />
                      ) : (
                        <FullscreenIcon />
                      )}
                    </FullScreenButton>

                    <ContentWrapper isfullscreen={isFullScreen.toString()}>
                      {currentMessage.image && (
                        <ImageContainer isfullscreen={isFullScreen.toString()}>
                          <img
                            src={`${process.env.NEXT_PUBLIC_V2_SERVER_URL}/static/image/${currentMessage.image}`}
                            className="lecture-img"
                            style={{
                              maxWidth: "100%",
                              maxHeight: isFullScreen ? "75vh" : "50vh",
                              objectFit: "contain",
                            }}
                            alt="Content visual"
                          />
                        </ImageContainer>
                      )}
                      {showText && (
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                        >
                          {currentMessage.text}
                        </Typography>
                      )}
                    </ContentWrapper>

                    {/* commented due to feedback feature not being used */}
                    {/* {currentMessage.id && (
                <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                  <IconButton size="small">
                    <ThumbDownIcon
                      key={currentSlideIndex}
                      fontSize="small"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedMessageIndex((prevIndex) =>
                          prevIndex === currentSlideIndex
                            ? null
                            : currentSlideIndex
                        );
                        setUpdateMessage("");
                      }}
                    />
                  </IconButton>
                </Box>
              )} */}
                    {/* {selectedMessageIndex === currentSlideIndex && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    // disabled={disabledTyping}
                    placeholder="Type your feedback..."
                    value={updateMessage}
                    id="feedbackmessage"
                    onChange={(e) => handleUpdateTyping(e)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleUpdateResponse()
                    }
                  />
                  <IconButton
                    color="primary"
                    onClick={handleUpdateResponse}
                    disabled={!updateMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              )} */}
                  </>
                )}
              </>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    width: "100%",
                    p: 2,
                    overflowY: "auto",
                    bgcolor: "background.default",
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(0,0,0,0.2)",
                      borderRadius: "4px",
                    },
                  }}
                >
                  <FullScreenButton
                    isfullscreen={isFullScreen.toString()}
                    onClick={handleFullScreen}
                    size="small"
                    sx={{
                      top: 8,
                      right: 8,
                      position: "absolute",
                      zIndex: 10,
                    }}
                  >
                    {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </FullScreenButton>
                  {!showText &&
                    (() => {
                      const lastImageMsg = [...messages]
                        .reverse()
                        .find((msg) => msg.image_path);
                      return lastImageMsg ? (
                        <Box
                          key={lastImageMsg.id}
                          sx={{
                            width: "100%",
                            height: "100%",
                            minHeight: 240,
                            mb: 1,
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "stretch",
                            position: "relative",
                          }}
                        >
                          <img
                            src={`${lastImageMsg.image_path}`}
                            alt="Message visual"
                            style={{
                              width: "100%",
                              height: "100%",
                              minHeight: 240,
                              borderRadius: 12,
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        </Box>
                      ) : null;
                    })()}
                  {showText &&
                    messages.map((msg, idx) => (
                      <Box
                        key={msg.id || idx}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: msg.isOwn ? "flex-start" : "flex-end",
                        }}
                      >
                        {!msg.isOwn && msg.image_path && (
                          <Box
                            sx={{
                              width: "70%",
                              mb: 1,
                              display: "flex",
                              justifyContent: "flex-start",
                            }}
                          >
                            <img
                              src={`${msg.image_path}`}
                              alt="Message visual"
                              style={{
                                width: "100%",
                                borderRadius: 12,
                                objectFit: "cover",
                                // maxHeight: 180,
                                background: "#eee",
                              }}
                            />
                          </Box>
                        )}
                        <MessageBubble isOwn={!!msg.isOwn}>
                          <Typography
                            variant="body2"
                            sx={{ wordBreak: "break-word" }}
                          >
                            {msg.text}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: msg.isOwn ? "left" : "right",
                              opacity: 0.6,
                              mt: 0.5,
                            }}
                          >
                            {msg.isOwn
                              ? "You"
                              : msg.timestamp
                              ? new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </Typography>
                        </MessageBubble>
                      </Box>
                    ))}

                  {showOverlay && (
                    <CenteredOverlayLoading
                      type={isListening ? "listening" : "thinking"}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </Box>
              </>
            )}
          </SlideContent>
        </SlideContainer>
      )}
      {/* <TimerDisplay minutes={minutes} seconds={seconds} /> */}

      {currentAudio && !currentAudio.paused ? (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1201,
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
          }}
        >
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "black",
                  animation: "dotFlashing 1s infinite linear",
                  animationDelay: `${i * 0.2}s`,
                  "@keyframes dotFlashing": {
                    "0%": { opacity: 0.2 },
                    "50%": { opacity: 1 },
                    "100%": { opacity: 0.2 },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <AnimatedFab
          disabled={
            !!(
              !isLastMessage ||
              isStart ||
              isLoading ||
              isThinking ||
              (!isListening &&
                messages.length > 0 &&
                messages[messages.length - 1]?.isOwn === true) ||
              (currentAudio && !currentAudio.paused)
            )
          }
          islistening={isListening.toString()}
          onClick={toggleListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          <MicIcon />
        </AnimatedFab>
      )}
    </>
  );
};

export default SpeechRecognizer;
