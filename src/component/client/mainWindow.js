"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Modal,
  Input,
  Alert,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { styled, alpha, display } from "@mui/system";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { FiSend } from "react-icons/fi";
import axios from "axios";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import Checkbox from "@mui/material/Checkbox";
import MicIcon from "@mui/icons-material/Mic";

const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  height: "90vh",
  gap: 2,
  padding: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    height: "100vh",
  },
}));

const MessageArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: "100%",
});

const MessageContainer = styled(Box)(`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-height: calc(100vh - 200px); 
`);

const Message = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isOwn",
})(({ theme, isOwn }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  alignSelf: isOwn ? "flex-end" : "flex-start",
  backgroundColor: isOwn
    ? theme.palette.primary.main
    : theme.palette.grey?.[100] || "#f5f5f5",
  color: isOwn ? theme.palette.primary.contrastText : "inherit",
}));

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const messageEndRef = useRef(null);
  const [disabledTyping, setDisabledTyping] = useState(true);
  const [isStart, setIsStart] = useState(false);
  const [seconds, setSeconds] = useState(0); // Track seconds
  const [minutes, setMinutes] = useState(0); // Track minutes
  const [ws, setWs] = useState(null); // WebSocket reference
  const [currentAudio, setCurrentAudio] = useState(null);
  const [open, setOpen] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const [myPrompt, setPrompt] = useState("");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  //scroll down....
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    const timer = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);
  const [curLanguage, setCurLanguage] = React.useState("English");
  const [curLectureId, setCurLectureId] = useState("");
  const [curTopicId, setCurTopicId] = useState("");

  // Function to generate a timestamp string
  const generateTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");
    const millisecond = String(now.getMilliseconds()).padStart(3, "0");

    return `robot_${year}${month}${day}${hour}${minute}${second}${millisecond}`;
  };

  const [connectrobot, setConnectrobot] = useState(generateTimestamp());
  const setupRobot = (e) => {
    setConnectrobot(e.target.value);
  };

  const handleStart = (lectureId, topicId) => {
    // Close the existing WebSocket if it's open
    if (ws) {
      ws.close(); // Close previous WebSocket connection
      console.log("Previous WebSocket connection closed");
    }

    setMessages([]);
    setSeconds(0);
    setMinutes(0);
    setCurLectureId(lectureId);
    setCurTopicId(topicId);
    if (currentAudio) {
      currentAudio.pause(); // Pause the current audio
      currentAudio.currentTime = 0; // Reset the audio time
    }
    axios
      .post(
        `https://app-ragbackend-dev-wus-001.azurewebsites.net/selectLanguage/${lectureId}`,
        new URLSearchParams({ languageName: curLanguage }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(() => {
        // Start the lecture with POST request
        axios
          .post(
            `https://app-ragbackend-dev-wus-001.azurewebsites.net/startLecture/${lectureId}/${topicId}`,
            new URLSearchParams({ connectrobot: connectrobot }),
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          )
          .then(function (res) {
            console.log("Lecture started:", res.data); // Log the backend response
            setIsStart(true); // Update state to reflect that the lecture has started

            // Open WebSocket connection
            const websocket = new WebSocket(
              `wss://app-ragbackend-dev-wus-001.azurewebsites.net/ws/${lectureId}/${connectrobot}`
            ); // Ensure lecture ID is in WebSocket URL

            // WebSocket event handlers
            websocket.onopen = () => {
              console.log("WebSocket connection opened");
            };

            websocket.onmessage = (event) => {
              console.log("Raw message from server:", event.data);
              const data = JSON.parse(event.data);
              if (data.questionResponse) {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  {
                    id: prevMessages.length + 1,
                    text: data.questionResponse,
                    sender: "You",
                    timestamp: new Date().toISOString(),
                    isOwn: true,
                  },
                ]);
              }
              // Handle incoming messages based on the type
              if (data.text === "question") {
                setDisabledTyping(false); // Enable typing when it's a question
              } else if (data.type === "stop") {
                if (currentAudio) {
                  currentAudio.pause(); // Pause the current audio
                  currentAudio.currentTime = 0; // Reset the audio time
                }
                if (data.audio) {
                  const audio = new Audio(
                    `data:audio/wav;base64,${data.audio}`
                  );
                  setCurrentAudio(audio); // Store the audio element in state

                  // Play the audio
                  audio.play().catch((error) => {
                    console.error("Error playing audio:", error);
                  });
                }
              } else {
                // Handle other message types, including AI response and static content
                if (data.text !== "") {
                  console.log("Message from server:", data);
                  // Disable typing when content is being processed

                  if (data.type === "model") {
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
                      },
                    ]);
                    if (data.audio) {
                      const audio = new Audio(
                        `data:audio/wav;base64,${data.audio}`
                      );
                      setCurrentAudio(audio); // Store the audio element in state

                      // Play the audio
                      audio.play().catch((error) => {
                        console.error("Error playing audio:", error);
                      });
                    }
                  } else if (data.type === "static") {
                    setDisabledTyping(true);
                    setMessages((prevMessages) => [
                      ...prevMessages,
                      {
                        id: prevMessages.length + 1,
                        text: data.text,
                        sender: "Teacher Bot",
                        timestamp: new Date().toISOString(),
                        image: data.image,
                        audio: data.audio,
                        type: "static",
                        isOwn: false,
                      },
                    ]);
                    if (data.audio) {
                      console.log(data.connectrobot, data.connected_clients);
                      const audio = new Audio(
                        `data:audio/wav;base64,${data.audio}`
                      );
                      setCurrentAudio(audio); // Store the audio element in state

                      // Play the audio
                      audio.play().catch((error) => {
                        console.error("Error playing audio:", error);
                      });
                    }
                  }
                }
              }
            };

            websocket.onerror = (error) => {
              console.error("WebSocket error:", error);
            };

            websocket.onclose = () => {
              console.log("WebSocket connection closed");
              setIsStart(false); // Reset isStart when WebSocket closes
            };

            // Store the WebSocket reference to close it later if necessary
            setWs(websocket);
          })
          .catch(function (error) {
            console.log("Network Error!!!", error);
          });
      })
      .catch((error) => {
        console.log(
          "Error changing language before starting the lecture:",
          error
        );
      });
  };
  // Handle changing language
  const handleCurLanguageChange = (event) => {
    const newLanguage = event.target.value;
    const oldLanguage = curLanguage;
    setCurLanguage(newLanguage);
    // Update the language on the server during the lecture
    if (isStart && ws) {
      // Send the language change request
      axios
        .post(
          `https://app-ragbackend-dev-wus-001.azurewebsites.net/changeLanguage/${curLectureId}`,
          new URLSearchParams({ languageName: newLanguage }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then((response) => {
          console.log("Language updated during the lecture:", response.data);
          // You can also send a WebSocket message to notify the client of the change
          if (response.data.selectedLanguageName) {
            ws.send(
              JSON.stringify({
                type: "language",
                language: newLanguage,
              })
            );
          } else {
            setCurLanguage(oldLanguage);
          }
        })
        .catch((error) => {
          console.log("Error changing language during the lecture:", error);
        });
    }
  };
  //If user is typing, stop speech!
  //Send message.
  const handleTyping = (event) => {
    setNewMessage(event.target.value);
  };

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // Reset audio chunks and media recorder reference
      audioChunksRef.current = [];
      if (mediaRecorderRef.current) {
        const { stream, processor, audioContext } = mediaRecorderRef.current;
        processor.disconnect();
        if (audioContext.state !== "closed") {
          audioContext.close();
        }
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000, // Set the sample rate to 16kHz
      });

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const outputData = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }

        audioChunksRef.current.push(outputData);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      mediaRecorderRef.current = { stream, processor, audioContext };
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
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

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/wav",
      });

      sendAudioToBackend(audioBlob);
      setRecording(false);
    }
  };

  // Function to save the audio as a file
  const saveAudioToFile = (audioBlob) => {
    const url = URL.createObjectURL(audioBlob); // Create a URL for the audio Blob
    const a = document.createElement("a"); // Create a temporary <a> element to trigger download

    // Set up the download
    a.href = url;
    a.download = "recorded_audio.webm"; // Save the audio as a .webm file
    document.body.appendChild(a); // Append the link to the body (it must be in the DOM to work)
    a.click(); // Trigger the download
    document.body.removeChild(a); // Clean up the DOM
    URL.revokeObjectURL(url); // Release the object URL to free up memory
  };

  const sendAudioToBackend = (audioBlob) => {
    if (!curLectureId) {
      const wsk = new WebSocket(
        "wss://app-ragbackend-dev-wus-001.azurewebsites.net/ws/before/lecture"
      );

      wsk.onopen = () => {
        console.log("WebSocket connection established, sending audio...");

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob); // Convert Blob to base64
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1]; // Extract base64 part

          wsk.send(
            JSON.stringify({
              audio: base64Audio, // Send base64 string instead of Blob
              robot_id: connectrobot,
              backend: sttMethod,
              client: "client",
              style: "audio",
            })
          );
        };
      };

      wsk.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type) {
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
            },
          ]);
          if (data.audio) {
            const audio = new Audio(`data:audio/webm;base64,${data.audio}`);
            setCurrentAudio(audio); // Store the audio element in state

            // Play the audio
            audio.play().catch((error) => {
              console.error("Error playing audio:", error);
            });
          }
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: data.text,
              sender: "You",
              timestamp: new Date().toISOString(),
              isOwn: true,
            },
          ]);
        }
      };

      wsk.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsk.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("Lecture Question Time.....");
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(",")[1]; // Extract base64 part

        ws.send(
          JSON.stringify({
            audio: base64Audio, // Send base64 string instead of Blob
            robot_id: connectrobot,
            backend: sttMethod,
            client: "client",
            style: "audio",
          })
        );
        console.log("Audio sent to backend");
      };
    }
  };

  //Select LLM
  const [curModel, setCurModel] = React.useState("GPT-4o-mini");
  const handleCurModelChange = (event) => {
    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/selectModel/",
        new URLSearchParams({ modelName: event.target.value }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(function (res) {
        setCurModel(event.target.value);
      })
      .catch(function (error) {
        console.log("Network Error!!!");
      });
  };

  //Select language
  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "L") {
      setOpen(true); // Show the modal when Ctrl+Shift+P is pressed
      axios
        .get("https://app-ragbackend-dev-wus-001.azurewebsites.net/prompt/", {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
        .then(function (res) {
          console.log("promptResponse", res.data.prompt);
          setPrompt(res.data.prompt);
        })
        .catch(function (error) {
          console.log("Network Error!!!");
        });
    }
  };
  const handleModelKeyDown = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "M") {
      setOpenModel(true);
    }
  };
  const handleModelApply = () => {
    setOpenModel(false);
  };
  const handleCancel = () => {
    setOpen(false);
  };
  //shot Key setting
  useEffect(() => {
    window.addEventListener("keydown", handleModelKeyDown);

    // Cleanup event listener when the component is unmounted
    return () => {
      window.removeEventListener("keydown", handleModelKeyDown);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener when the component is unmounted
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const goToAdmin = () => {
    window.location.href = "/admin";
  };

  const handleChange = (event) => {
    setPrompt(event.target.value);
  };

  // Function to close the modal
  const handleApply = () => {
    setOpen(false);
    axios.post(
      "https://app-ragbackend-dev-wus-001.azurewebsites.net/prompt/",
      new URLSearchParams({ prompt: myPrompt }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  };

  const handleDislike = (index) => {
    setSelectedMessageIndex((prevIndex) =>
      prevIndex === index ? null : index
    );
  };

  const handleUpdateTyping = (event) => {
    setUpdateMessage(event.target.value);
  };
  const handleUpdateResponse = () => {
    const answer = updateMessage;
    console.log("answer", updateMessage);

    const qna = {
      question: newMessage,
      answer: answer,
      model: "",
      prompt: "",
    };

    axios
      .put(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/qna/update/",
        qna,
        {
          headers: {
            "Content-Type": "application/json", // Use application/json
          },
        }
      )
      .then(function (res) {
        const resp = res.data.response.trim();
        if (resp) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: resp,
              sender: "Teacher Bot",
              timestamp: new Date().toISOString(),
              isOwn: false,
              answer: false,
            },
          ]);
        }
      })
      .catch(function (error) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            text: "Connection Error!!!",
            sender: "Teacher Bot",
            timestamp: new Date().toISOString(),
            isOwn: false,
          },
        ]);
        console.error("Error in API request:", error);
      });
  };

  //Display Clock
  useEffect(() => {
    let intervalId;
    if (isStart) {
      intervalId = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 59) {
            setMinutes((prevMinutes) => prevMinutes + 1);
            return 0;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    } else {
      setSeconds(0);
      setMinutes(0); // Reset time when lecture stops
    }

    return () => clearInterval(intervalId); // Clear interval when component unmounts or lecture stops
  }, [isStart]);
  const formatTime = (minutes, seconds) => {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  //Lecture List
  const [lectures, setLectures] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    axios
      .get("https://app-ragbackend-dev-wus-001.azurewebsites.net/lectures/", {
        headers: { "Content-Type": "application/json" },
      })
      .then(function (res) {
        setLectures(res.data.lecture);
      })
      .catch(function (error) {
        console.log("Network Error!!!");
      });
    axios
      .get("https://app-ragbackend-dev-wus-001.azurewebsites.net/topics/", {
        headers: { "Content-Type": "application/json" },
      })
      .then(function (res) {
        setTopics(res.data.topic);
      })
      .catch(function (error) {
        console.log("Network Error!!!");
      });
  }, []);

  const [expandedItems, setExpandedItems] = useState([]);
  useEffect(() => {
    setExpandedItems([
      ...lectures.map((lecture) => `${lecture._id}`),
      ...topics.map((topic) => `${topic._id}`),
    ]);
  }, [lectures, topics]);

  //Customize treeItem.
  const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
    color: theme.palette.grey[200],
    [`& .${treeItemClasses.content}`]: {
      borderRadius: theme.spacing(0.5),
      padding: theme.spacing(0.5, 1),
      margin: theme.spacing(0.2, 0),
      [`& .${treeItemClasses.label}`]: {
        fontSize: "0.8rem",
        fontWeight: 500,
      },
    },
    [`& .${treeItemClasses.iconContainer}`]: {
      borderRadius: "20%",
      backgroundColor: theme.palette.primary.dark,
      ...theme.applyStyles("light", {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
      }),
      ...theme.applyStyles("dark", {
        color: theme.palette.primary.contrastText,
      }),
    },
    [`& .${treeItemClasses.groupTransition}`]: {
      marginLeft: 15,
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
    ...theme.applyStyles("light", {
      color: theme.palette.grey[800],
    }),
  }));

  //Hide Text
  const [isHideChecked, setIsHideChecked] = React.useState(false);

  const handleHideText = (event) => {
    setIsHideChecked(event.target.checked);
  };

  //Save Conversation
  const [isSaveConv, setIsSaveConv] = React.useState(true);

  const handleSaveConv = (event) => {
    setIsSaveConv(event.target.checked);
    if (event.target.checked) {
      axios.post(
        `https://app-ragbackend-dev-wus-001.azurewebsites.net/saveConv/${connectrobot}`,
        new URLSearchParams({ saveConv: "save" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      console.log(event.target.checked);
    } else {
      axios.post(
        `https://app-ragbackend-dev-wus-001.azurewebsites.net/saveConv/${connectrobot}`,
        new URLSearchParams({ saveConv: "unsave" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      console.log(event.target.checked);
    }
  };

  const [userName, setUserName] = React.useState("");
  const handleUserName = (event) => {
    setUserName(event.target.value);
  };

  const [totalCount, setTotalCount] = React.useState();
  const handleTotalCount = (event) => {
    setTotalCount(event.target.value);
  };

  const [handsUpCount, setHandsUpCount] = React.useState();
  const handleHandsUpCount = (event) => {
    setHandsUpCount(event.target.value);
  };
  // alert
  const [openError, setOpenError] = React.useState(false);

  const handleErrorClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenError(false);
  };

  const [sttMethod, setSTTmethod] = React.useState("gpt-4o-transcribe");
  const handleSTTMethod = (event) => {
    setSTTmethod(event.target.value);
    if (event.target.value === "hi-IN") {
      setCurLanguage("Hindi");
    }
    if (event.target.value === "te-IN") {
      setCurLanguage("Telugu");
    }
    console.log(event.target.value);
  };

  return (
    <ChatContainer style={{ marginTop: "30px" }}>
      <div></div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: " center",
        }}
      >
        <Snackbar
          open={openError}
          autoHideDuration={3000}
          onClose={handleErrorClose}
        >
          <Alert
            onClose={handleErrorClose}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            Enter the Students Information.
          </Alert>
        </Snackbar>
        <Modal
          open={open}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              borderRadius: "8px",
              boxShadow: 24,
              p: 4,
              width: 600,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              Effective Prompt Design
            </Typography>
            <Typography id="modal-description" sx={{ mt: 2 }}>
              <textarea
                style={{ width: "100%", height: "500px" }}
                value={myPrompt}
                onChange={handleChange}
              ></textarea>
            </Typography>
            <Button
              onClick={handleApply}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              APPLY
            </Button>
            <Button
              onClick={handleCancel}
              variant="contained"
              color="primary"
              sx={{ mt: 2, ml: 3, mr: 5 }}
            >
              CANCEL
            </Button>
          </Box>
        </Modal>
        {/* selctModel */}
        <Modal
          open={openModel}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              borderRadius: "8px",
              boxShadow: 24,
              p: 4,
              width: 600,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              SPARC v 4/24/2025 7:20
            </Typography>
            <Typography id="modal-description" sx={{ mt: 2 }}>
              <FormControl
                style={{
                  display: "flex",
                }}
              >
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  style={{
                    margin: "auto",
                  }}
                  value={curModel}
                  onChange={handleCurModelChange}
                >
                  <FormControlLabel
                    value="GPT-4o-mini"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="GPT-4o-mini"
                  />
                  <FormControlLabel
                    value="GPT-35-Turbo"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="GPT-3.5-Turbo"
                  />
                  <FormControlLabel
                    value="GPT-4"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="GPT-4"
                  />
                </RadioGroup>
              </FormControl>
            </Typography>
            <Button
              onClick={handleModelApply}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              OK
            </Button>
          </Box>
        </Modal>
        <Paper
          elevation={10}
          sx={{ width: 300, overflowY: "auto", height: "100%" }}
          style={{ margin: "5px" }}
          className="right-bar"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center",
                  paddingTop: "20px",
                }}
              >
                <input value={connectrobot} onChange={setupRobot} />
              </div>
              <Divider textAlign="left" sx={{ marginTop: 2, marginBottom: 2 }}>
                <b>Students Info</b>
              </Divider>
              <Typography
                sx={{
                  display: "flex",
                  fontSize: "15px",
                  alignItems: "center",
                  justifyContent: " center",
                }}
                gutterBottom
              >
                Total number of students :
                <Input
                  value={totalCount}
                  onChange={handleTotalCount}
                  sx={{ width: "60px", ml: 2, mr: 2 }}
                />
              </Typography>
              <Typography
                sx={{
                  display: "flex",
                  fontSize: "15px",
                  alignItems: "center",
                  justifyContent: " center",
                }}
                gutterBottom
              >
                Hands up students :
                <Input
                  value={handsUpCount}
                  onChange={handleHandsUpCount}
                  sx={{ width: "60px", ml: 2, mr: 2 }}
                />
              </Typography>
              <Typography
                sx={{
                  display: "flex",
                  fontSize: "15px",
                  alignItems: "center",
                  justifyContent: " center",
                }}
                gutterBottom
              >
                Seleted student :
                <Input
                  value={userName}
                  onChange={handleUserName}
                  sx={{ width: "120px", ml: 2, mr: 2, fontSize: "15px" }}
                />
              </Typography>
              <Divider
                textAlign="left"
                sx={{ marginTop: 3, marginBottom: 2, marginRight: 3 }}
              >
                <b>Lecture List---- </b>
                <Button onClick={goToAdmin} size="small" variant="outlined">
                  Edit
                </Button>
              </Divider>
              <SimpleTreeView
                expandedItems={
                  Array.isArray(expandedItems) ? expandedItems : []
                }
                onExpandedItemsChange={(newExpanded) => {
                  if (Array.isArray(newExpanded)) {
                    setExpandedItems(newExpanded);
                  }
                }}
              >
                {lectures.length > 0 &&
                  lectures.map((lecture) => {
                    // Collect IDs for lesson order
                    const lectureId = lecture._id;
                    const lectureTopics = topics.filter(
                      (topic) => topic.lecture_id === lectureId
                    );

                    return (
                      <div>
                        <CustomTreeItem
                          key={lectureId}
                          itemId={lectureId}
                          label={lecture.title}
                        >
                          {lectureTopics.length > 0 &&
                            lectureTopics.map((topic) => {
                              const topicId = topic._id;

                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <CustomTreeItem
                                    key={topicId}
                                    itemId={topicId}
                                    label={topic.title}
                                    onClick={() =>
                                      handleStart(lectureId, topicId)
                                    }
                                  />
                                </div>
                              );
                            })}
                        </CustomTreeItem>
                      </div>
                    );
                  })}
              </SimpleTreeView>
            </div>
          </div>
        </Paper>

        <MessageArea style={{ margin: "5px", height: "100%" }}>
          <Paper
            elevation={10}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              height: "100vh",
              width: "1200px",
            }}
            className="messagebox"
          >
            <Divider textAlign="right" sx={{ marginTop: 2, marginBottom: 2 }}>
              <b>Select Language</b>
            </Divider>
            <FormControl
              style={{
                display: "flex",
              }}
            >
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "0 50px",
                }}
                value={curLanguage}
                onChange={handleCurLanguageChange}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isHideChecked}
                      onChange={handleHideText}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                  label="Show Text"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSaveConv}
                      onChange={handleSaveConv}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                  label="Save Conversation"
                />
                <div>
                  <FormControlLabel
                    value="English"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="English"
                  />
                  <FormControlLabel
                    value="Hindi"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="Hindi"
                  />
                  <FormControlLabel
                    value="Telugu"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="Telugu"
                  />
                </div>
              </RadioGroup>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "0 50px",
                }}
                value={sttMethod}
                onChange={handleSTTMethod}
              >
                <div>
                  <FormControlLabel
                    value="gpt-4o-transcribe"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="Garlic"
                  />
                  <FormControlLabel
                    value="hi-IN"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="Grape-hi"
                  />
                  <FormControlLabel
                    value="te-IN"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 15,
                            width: 60,
                          },
                        }}
                      />
                    }
                    label="Grape-te"
                  />
                </div>
              </RadioGroup>
            </FormControl>

            <Divider textAlign="right" sx={{ marginTop: 1, fontSize: 30 }}>
              <b>{formatTime(minutes, seconds)}</b>
            </Divider>
            <MessageContainer>
              {messages.map((message, key) => (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    flexDirection: message.isOwn ? "row-reverse" : "row",
                    mb: 2,
                  }}
                >
                  <Avatar alt={message.sender} sx={{ mx: 1 }} />
                  <Box>
                    <Message isOwn={message.isOwn}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                      >
                        <div></div>

                        {message.image && (
                          <img
                            src={
                              "https://app-ragbackend-dev-wus-001.azurewebsites.net/static/image/" +
                              message.image
                            }
                            onError={(e) => {
                              e.currentTarget.src = ``;
                            }}
                            className="lecture-img"
                          />
                        )}
                        <div></div>
                      </div>
                      {message.isOwn ? (
                        <Typography variant="body1">{message.text}</Typography>
                      ) : (
                        <Typography variant="body">
                          {isHideChecked && message.text}
                        </Typography>
                      )}
                    </Message>
                    <div className="feedback-group">
                      <Typography
                        variant="caption"
                        sx={{ ml: 1, color: "text.secondary" }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                      {message.answer && (
                        <div className="like-dislike">
                          <ThumbDownIcon
                            fontSize="large"
                            key={key}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDislike(key)} // Pass index (key)
                          />
                        </div>
                      )}
                    </div>
                    {selectedMessageIndex === key && (
                      <TextField
                        fullWidth
                        variant="outlined"
                        disabled={disabledTyping}
                        placeholder="Type a message..."
                        value={updateMessage}
                        id="feedbackmessage"
                        onChange={(e) => handleUpdateTyping(e)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleUpdateResponse()
                        }
                      />
                    )}
                  </Box>
                </Box>
              ))}
              <div ref={messageEndRef} />
              <IconButton
                sx={{
                  position: "absolute",
                  bottom: 30,
                  right: 30,
                  transform: "scale(3)",
                }}
                size="large"
                onClick={recording ? stopRecording : startRecording}
              >
                <MicIcon color={recording ? "error" : "primary"} />
              </IconButton>
            </MessageContainer>
          </Paper>
        </MessageArea>
      </div>
    </ChatContainer>
  );
};

export default ChatUI;
