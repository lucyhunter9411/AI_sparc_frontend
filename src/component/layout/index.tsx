"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  Typography,
  CssBaseline,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  ListItemButton,
  ListItemIcon,
  Avatar,
  Chip,
  IconButton,
  AppBar,
  Stack,
  LinearProgress,
  useMediaQuery,
  Collapse,
  Accordion,
  AccordionSummary,
  Badge,
  AccordionDetails,
  Input,
  TextField,
  Button,
  Tooltip,
  Theme,
  Fade,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  Menu,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  School as StudentsIcon,
  QuestionAnswer as HandsUpIcon,
  Star as SelectedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import EastIcon from "@mui/icons-material/East";
import { alpha, styled, useTheme } from "@mui/material/styles";
import { SimpleTreeView, TreeItem, treeItemClasses } from "@mui/x-tree-view";
import axios from "axios";
import { useLectures, useTopics } from "@/Hooks/useMenu";
import SettingsPanel from "../language settings";
import { UseContext } from "@/state/provider";
import LectureEditor from "../lecture edit";
import ContentCreator from "../edit Content";

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

const headerStyles = (theme: Theme) => ({
  transition: theme.transitions.create(["height", "opacity"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  height: 64,
  opacity: 1,
  overflow: "hidden",
  "&.hidden": {
    height: 0,
    opacity: 0,
  },
  "&::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
    backgroundColor: "white",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "gray",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "white",
  },
});

const scrollbarStyles = {
  "&::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
    backgroundColor: "white",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "gray",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "white",
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

interface Lecture {
  _id: string;
  title: string;
}

interface Topic {
  _id: string;
  title: string;
  lecture_id: string;
}

import type { Message } from "../speechTotext";
import SnackbarAlert from "../snackbar";
import { parseVersionAndDate } from "@/helper/parseVersionAndDate";
import DevicesCardUI from "../teleVision";
import { getMe } from "@/app/auth/auth";
import { safeLocalStorage } from "@/app/utils/storage";
import { useRouter } from "next/navigation";

interface WebSocketData {
  image_path: null;
  questionResponse?: string;
  text?: string;
  type?: string;
  audio?: string;
  image?: string;
}

const languageToSTTMap: Record<string, string> = {
  English: "gpt-4o-transcribe",
  Hindi: "hi-IN",
  Telugu: "te-IN",
};

const STTToLanguageMap: Record<string, string> = {
  "gpt-4o-transcribe": "English",
  "hi-IN": "Hindi",
  "te-IN": "Telugu",
};

const drawerWidth = 280;
const BASE_URL = process.env.NEXT_PUBLIC_V2_SERVER_URL;

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const {
    state: { doc },
  } = UseContext();
  const router = useRouter();

  const { version, date } = parseVersionAndDate(
    process.env.NEXT_PUBLIC_VERSION
  );

  const [username, setUsername] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [mode, setMode] = useState<"sprac" | "admin">("sprac");

  const [editMode, setEditMode] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [lessonLoading, setLessonLoading] = useState<boolean>(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStart, setIsStart] = useState<boolean>(false);
  const [curLectureId, setCurLectureId] = useState<string | null>(null);
  const [curTopicId, setCurTopicId] = useState<string | null>(null);
  const [disabledTyping, setDisabledTyping] = useState<boolean>(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );

  const [selectedTopic, setSelectedTopic] = useState<any>({});

  const [ws, setWs] = useState<WebSocket | null>(null);

  const [language, setLanguage] = useState<string>("English");
  const [sttMethod, setSTTmethod] = useState<string>(
    languageToSTTMap[language]
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Timer state
  const [seconds, setSeconds] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  console.log(username, "username");

  useEffect(() => {
    const token = safeLocalStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const userResponse = await getMe(token);
        setUsername(userResponse.username);
      } catch (error: any) {
        console.error("Failed to fetch user data:", error);
        if (error?.response?.status === 401) {
          safeLocalStorage.removeItem("token");
          router.push("/login");
        }
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  useEffect(() => {
    if (editMode) {
      if (ws) {
        ws.close();
        setWs(null);
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      setMessages([]);
      setIsStart(false);
      setCurLectureId(null);
      setCurTopicId(null);
    } else {
      setSelectedTopic({});
    }
  }, [editMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    if (ws) {
      ws.close();
      setWs(null);
    }
    router.push("/login");
    setAnchorEl(null);
    setIsStart(false);
    setMessages([]);
    setCurLectureId(null);
    setSelectedTopic({});
    setLanguage("English");
    setLectures([]);
    setTopics([]);
    safeLocalStorage.removeItem("drawerOpen");
  };
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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

  const setupRobot = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConnectrobot(e.target.value);
  };

  const handleStart = useCallback(
    (lectureId: string, topicId: string) => {
      if (ws) {
        ws.close();
        console.log("Previous WebSocket connection closed");
      }

      setMessages([]);
      setSeconds(0);
      setMinutes(0);
      setCurLectureId(lectureId);
      setCurTopicId(topicId);
      setCurLectureId(lectureId);

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      axios
        .post(
          `${BASE_URL}/selectLanguage/${lectureId}/${connectrobot}`,
          new URLSearchParams({ languageName: language }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(() => {
          axios
            .post(
              `${BASE_URL}/startLecture/${lectureId}/${topicId}`,
              new URLSearchParams({ connectrobot: connectrobot }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            )
            .then((res) => {
              setIsStart(true);
              const websocket = new WebSocket(
                `${process.env.NEXT_PUBLIC_V2_SERVER_URL_WS}/ws/${lectureId}/${connectrobot}`
              );
              websocket.onopen = () => {
                console.log("WebSocket connection opened");
              };
              websocket.onmessage = (event) => {
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
                      image_path: null,
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
                      .catch((err) =>
                        console.error("Error playing audio:", err)
                      );
                  }
                } else if (data.text !== "") {
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
                        image_path: data.image_path ?? null,
                        language: language,
                        length: data.text ? data.text.length : 0,
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
                        image_path: null,
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
    },
    [language, connectrobot]
  );

  const handleLanguageChange = async (lang: string) => {
    if (language === lang) return;

    setIsLoading(true);
    try {
      setLanguage(lang);
      setSTTmethod(languageToSTTMap[lang]);

      if (curLectureId) {
        await axios.post(
          `${BASE_URL}/changeLanguage/${curLectureId}/${connectrobot}`,
          new URLSearchParams({ languageName: lang }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (ws && curLectureId && curTopicId) {
          ws.close();
        }
      }
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSTTMethodChange = (method: string) => {
    setSTTmethod(method);
    handleLanguageChange(STTToLanguageMap[method]);
  };

  const [userOpen, setUserOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("drawerOpen");
      return saved ? saved === "true" : false;
    }
    return false;
  });

  const effectiveOpen = !doc && userOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLessonLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_V2_SERVER_URL}/lectures/`, {
        headers: { "Content-Type": "application/json" },
      })
      .then(function (res) {
        setLectures(res.data.lecture);
        setLessonLoading(false);
      })
      .catch(function (error) {
        console.log("Network Error!!!");
        setLessonLoading(false);
      });
    axios
      .get(`${process.env.NEXT_PUBLIC_V2_SERVER_URL}/topics/`, {
        headers: { "Content-Type": "application/json" },
      })
      .then(function (res) {
        setTopics(res.data.topic);
      })
      .catch(function (error) {
        console.log("Network Error!!!");
      });
  }, []);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    if (doc) {
      setUserOpen(false);
    }
  }, [doc]);

  const handleDrawerToggle = () => {
    const newOpen = !userOpen;
    setUserOpen(newOpen);
    localStorage.setItem("drawerOpen", String(newOpen));
    setShowSettingsPanel(newOpen);
  };

  const handleStartWithLoading = (lectureId: string, topicId: string) => {
    setIsLoading(true);
    if (isMobile) setMobileOpen(false);
    handleStart(lectureId, topicId);
  };

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setMessages([]);

    if (!editMode) {
      if (ws) ws.close();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    } else {
      setSelectedTopic({});
    }
  };

  if (!mounted) return null;

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "auto",
      }}
    >
      {!isMobile && (
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: theme.palette.primary.main,
            color: "white",
          }}
        >
          <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
            {effectiveOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Toolbar>
      )}
      {!editMode && (
        <Box sx={{ p: 2 }}>
          <TextField
            id="standard-basic"
            label="Connect Robot"
            variant="standard"
            value={connectrobot}
            onChange={setupRobot}
            sx={{ width: 250 }}
            InputProps={{
              sx: {
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "inherit",
                color: "text.primary",
                letterSpacing: "0.01em",
              },
              inputProps: {
                style: {
                  fontSize: "0.8rem",
                  letterSpacing: "0.03em",
                },
              },
            }}
            InputLabelProps={{
              sx: {
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "inherit",
                color: "text.secondary",
                letterSpacing: "0.01em",
              },
            }}
          />
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.action.disabled,
            borderRadius: "4px",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",

            zIndex: 10,
            backgroundColor: "background.paper",
          }}
        >
          {editMode ? (
            <Fade in={editMode}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: "#3d403e",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                }}
              >
                Lesson Editor
              </Typography>
            </Fade>
          ) : (
            <Fade in={!editMode}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  background: "#3d403e",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                  mr: 1,
                }}
              >
                Lessons
              </Typography>
            </Fade>
          )}

          <IconButton disabled={isLoading} onClick={toggleEditMode}>
            {editMode ? (
              <Chip
                disabled={isLoading}
                label={"Lessons"}
                color={"primary"}
                variant={"filled"}
                icon={<EastIcon />}
                sx={{
                  borderTopLeftRadius: 24,
                  borderBottomLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderBottomRightRadius: 24,
                  fontSize: "0.7rem",
                }}
              />
            ) : (
              <EditIcon sx={{ color: "#0E68CE" }} />
            )}
          </IconButton>
        </Box>
        {editMode ? (
          <LectureEditor
            key="editor"
            lectures={lectures}
            topics={topics}
            // setTopics={setTopics}
            setTopics={(newTopics) => {
              setTopics(newTopics);
              setExpandedItems((prev) => [
                ...prev,
                ...newTopics
                  .filter((topic) => !topics.some((t) => t._id === topic._id))
                  .map((topic) => topic._id),
              ]);
            }}
            setLectures={(newLectures) => {
              setLectures(newLectures);
              setExpandedItems((prev) => [
                ...prev,
                ...newLectures
                  .filter(
                    (lecture) => !lectures.some((l) => l._id === lecture._id)
                  )
                  .map((lecture) => lecture._id),
              ]);
            }}
            onStartLecture={handleStartWithLoading}
            expandedItems={expandedItems}
            onExpandedItemsChange={(_event: any, newExpanded: string[]) => {
              if (Array.isArray(newExpanded)) {
                setExpandedItems(newExpanded);
              }
            }}
            CustomTreeItem={CustomTreeItem}
            editMode={editMode}
            setEditMode={setEditMode}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            snackbar={snackbar}
            setSnackbar={setSnackbar}
          />
        ) : lessonLoading ? (
          <>
            <Box sx={{ p: 2 }}>
              {/* Lecture skeleton */}
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="rounded"
                  width="80%"
                  height={40}
                  sx={{ mb: 1 }}
                />
                {/* Topics skeletons */}
                <Box sx={{ pl: 3 }}>
                  <Skeleton
                    variant="rounded"
                    width="70%"
                    height={30}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width="70%"
                    height={30}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="rounded" width="70%" height={30} />
                </Box>
              </Box>
              {/* Second lecture skeleton */}
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="rounded"
                  width="80%"
                  height={40}
                  sx={{ mb: 1 }}
                />
                {/* Topics skeletons */}
                <Box sx={{ pl: 3 }}>
                  <Skeleton
                    variant="rounded"
                    width="70%"
                    height={30}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="rounded" width="70%" height={30} />
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <SimpleTreeView
            expandedItems={Array.isArray(expandedItems) ? expandedItems : []}
            onExpandedItemsChange={(_event: any, newExpanded: string[]) => {
              if (Array.isArray(newExpanded)) {
                setExpandedItems(newExpanded);
              }
            }}
            sx={{ minHeight: "100%" }}
          >
            {lectures.length > 0 &&
              lectures.map((lecture) => {
                const lectureTopics = topics.filter(
                  (topic) => topic.lecture_id === lecture._id
                );

                return (
                  <CustomTreeItem
                    key={`lecture-${lecture._id}`}
                    itemId={lecture._id}
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            flexGrow: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pr: 1,
                          }}
                        >
                          {lecture.title}
                        </Typography>
                        <Chip
                          label={lectureTopics.length}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: "20px",
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    }
                  >
                    {lectureTopics.map((topic) => (
                      <CustomTreeItem
                        key={`topic-${topic._id}`}
                        itemId={topic._id}
                        label={topic.title}
                        onClick={() =>
                          handleStartWithLoading(lecture._id, topic._id)
                        }
                      />
                    ))}
                  </CustomTreeItem>
                );
              })}
          </SimpleTreeView>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <CssBaseline />
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
      <Box sx={headerStyles(theme)} className={doc ? "hidden" : ""}>
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: "white",
            color: "text.primary",
            boxShadow: "none",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar
            sx={{
              minHeight: 40,
              px: 1,
              py: 0.5,
              gap: 1,
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={isMobile ? handleMobileMenuToggle : handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontFamily: "monospace",
                letterSpacing: "0.3rem",
                textAlign: "left",
                padding: "0.5rem 0",
                margin: "0 auto",
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: "1.3rem",
              }}
            >
              SPARC
            </Typography>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode) setMode(newMode);
              }}
              size="small"
              sx={{
                mr: 2,
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: 1,
                "& .MuiToggleButton-root:first-of-type": {
                  borderTopLeftRadius: 16,
                  borderBottomLeftRadius: 16,
                },
                "& .MuiToggleButton-root:last-of-type": {
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 16,
                },
                "& .MuiToggleButton-root": {
                  px: 2,
                  py: 0.5,
                  fontSize: "0.50rem",
                },
              }}
            >
              <ToggleButton value="sprac" disabled>
                Sprac
              </ToggleButton>
              <ToggleButton value="admin" disabled>
                Admin
              </ToggleButton>
            </ToggleButtonGroup>

            <Chip
              label={
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {version}
                  </Box>
                  {date && (
                    <Box
                      component="span"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.90em",
                        ml: 1,
                        borderLeft: "1px solid",
                        borderColor: "divider",
                        pl: 1,
                      }}
                    >
                      {date}
                    </Box>
                  )}
                </Box>
              }
              size="small"
              variant="outlined"
              sx={{
                fontWeight: 200,
                fontSize: "0.75rem",
                bgcolor: "background.paper",
                borderColor: "divider",
                px: 1.5,
              }}
            />

            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.secondary.main,
                }}
              >
                {username ? (
                  username.charAt(0).toUpperCase()
                ) : (
                  <PersonIcon fontSize="small" />
                )}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&:before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ChevronLeftIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>

          {isMobile && (
            <Collapse in={mobileOpen} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  height: "calc(100vh - 64px)",
                  overflow: "auto",
                  p: 2,
                  backgroundColor: theme.palette.background.paper,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {drawerContent}
              </Box>
            </Collapse>
          )}
        </AppBar>
      </Box>
      {mode === "sprac" && (
        <>
          {!isMobile && (
            <Drawer
              variant="persistent"
              open={effectiveOpen}
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                  width: drawerWidth,
                  boxSizing: "border-box",
                },
              }}
            >
              {drawerContent}
            </Drawer>
          )}
        </>
      )}

      {mode === "admin" && <DevicesCardUI connectrobot={connectrobot} />}

      {mode === "sprac" && (
        <>
          {editMode ? (
            <Fade in={editMode}>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  ml: !isMobile && effectiveOpen ? `${drawerWidth}px` : 0,
                  transition: theme.transitions.create(
                    ["margin", "padding-top"],
                    {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.enteringScreen,
                    }
                  ),
                  p: { xs: 1, sm: 1 },
                  pt: 0,
                  display: "flex",
                  flexDirection: "column",
                  height: "calc(100vh - 64px)",
                  overflow: "auto",
                }}
              >
                <ContentCreator
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  lectures={lectures}
                  topics={topics}
                  setTopics={setTopics}
                  setLectures={setLectures}
                  editMode={editMode}
                  snackbar={snackbar}
                  setSnackbar={setSnackbar}
                />
              </Box>
            </Fade>
          ) : (
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                ml: !isMobile && effectiveOpen ? `${drawerWidth}px` : 0,
                transition: theme.transitions.create(
                  ["margin", "padding-top"],
                  {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }
                ),
                p: { xs: 1, sm: 1 },
                pt: 0,
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 64px)",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <SettingsPanel
                languageToSTTMap={languageToSTTMap}
                STTToLanguageMap={STTToLanguageMap}
                language={language}
                onLanguageChange={handleLanguageChange}
                sttMethod={sttMethod}
                onSTTMethodChange={handleSTTMethodChange}
                setLanguage={setLanguage}
                connectrobot={connectrobot}
                messages={messages}
                setMessages={setMessages}
                setCurrentAudio={setCurrentAudio}
                curLectureId={curLectureId}
                currentAudio={currentAudio}
                isStart={isStart}
                ws={ws}
                curTopicId={curTopicId}
                disabledTyping={disabledTyping}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                showTopControls={showSettingsPanel}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
