"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Switch,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
  IconButton,
  Slide,
} from "@mui/material";
import {
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Mic as MicIcon,
} from "@mui/icons-material";
import SpeechRecognizer, { Message } from "../speechTotext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { orange, blue } from "@mui/material/colors";
import { UseContext } from "@/state/provider";
import axios from "axios";

import { Dispatch, SetStateAction } from "react";

interface SettingsPanelProps {
  connectrobot: any;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setCurrentAudio: (audio: any) => void;
  curLectureId: string | null;
  currentAudio: any;

  isStart: boolean;
  ws: WebSocket | null;
  curTopicId: string | null;
  disabledTyping: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  language: string;
  setLanguage: (language: string) => void;
  onLanguageChange: (lang: string) => void;
  sttMethod: string;
  onSTTMethodChange: (method: string) => void;
  languageToSTTMap: Record<string, string>;
  STTToLanguageMap: Record<string, string>;
}

interface LanguageOption {
  value: string;
  label: string;
}

interface STTMethodOption {
  value: string;
  label: string;
}

const SettingsPanel = ({
  languageToSTTMap,
  STTToLanguageMap,
  language,
  setLanguage,
  onLanguageChange,
  sttMethod,
  onSTTMethodChange,
  connectrobot,
  messages,
  setMessages,
  setCurrentAudio,
  curLectureId,
  currentAudio,
  isStart,
  ws,
  curTopicId,
  disabledTyping,
  isLoading,
  setIsLoading,
}: SettingsPanelProps) => {
  const [showText, setShowText] = useState<boolean>(false);
  const [isLastMessage, setIsLastMessage] = useState<boolean>(false);

  const { state: doc } = UseContext();

  const theme = useTheme();

  const [saveConversation, setSaveConversation] = useState<boolean>(true);

  const handleSaveConv = (event: { target: { checked: boolean } }) => {
    setSaveConversation(event.target.checked);
    if (event.target.checked) {
      axios.post(
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/saveConv/${connectrobot}`,
        new URLSearchParams({ saveConv: "save" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    } else {
      axios.post(
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/saveConv/${connectrobot}`,
        new URLSearchParams({ saveConv: "unsave" }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    }
  };

  const formatTime = (minutes: number, seconds: number): string => {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const handleLanguageChange = (lang: string) => {
    onLanguageChange(lang);

    onSTTMethodChange(languageToSTTMap[lang]);
  };

  const handleSTTMethodChange = (method: string) => {
    onSTTMethodChange(method);
    onLanguageChange(STTToLanguageMap[method]);
  };

  const controlsDisabled =
    !isLastMessage ||
    isStart ||
    isLoading ||
    (currentAudio && !currentAudio.paused);

  const languages: LanguageOption[] = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Telugu", label: "Telugu" },
  ];

  const sttMethods: STTMethodOption[] = [
    { value: "gpt-4o-transcribe", label: "Auto" },
    { value: "hi-IN", label: "Hindi" },
    { value: "te-IN", label: "Telugu" },
  ];

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {doc.doc ? null : (
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={2}
              sx={{
                position: "relative",
                p: 2,
                borderRadius: 0,
                width: "100%",
                zIndex: 1200,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                rowGap: 2,
                columnGap: 3,
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "3px",
                },
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                divider={
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ display: { xs: "none", sm: "block" } }}
                  />
                }
                alignItems="center"
                flexWrap="wrap"
                rowGap={2}
                sx={{ flex: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {languages.map((langOption) => (
                    <Chip
                      key={langOption.value}
                      label={langOption.label}
                      onClick={() => handleLanguageChange(langOption.value)}
                      disabled={controlsDisabled}
                      icon={<LanguageIcon fontSize="small" />}
                      color={
                        language === langOption.value ? "primary" : "default"
                      }
                      variant={
                        language === langOption.value ? "filled" : "outlined"
                      }
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        "& .MuiChip-label": { fontSize: "0.85rem" },
                      }}
                    />
                  ))}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">Show Text</Typography>
                    <Switch
                      size="small"
                      checked={showText}
                      onChange={() => setShowText(!showText)}
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">Save Conversation</Typography>
                    <Switch
                      size="small"
                      checked={saveConversation}
                      onChange={handleSaveConv}
                      color="primary"
                    />
                  </Box>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {sttMethods.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    onClick={() => handleSTTMethodChange(item.value)}
                    icon={<MicIcon fontSize="small" />}
                    color={sttMethod === item.value ? "primary" : "default"}
                    variant={sttMethod === item.value ? "filled" : "outlined"}
                    size="small"
                    sx={{
                      textTransform: "capitalize",
                      "& .MuiChip-label": { fontSize: "0.75rem" },
                    }}
                    disabled={controlsDisabled}
                  />
                ))}
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          borderRadius: 0,
          boxShadow: "none",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SpeechRecognizer
          languageToSTTMap={languageToSTTMap}
          STTToLanguageMap={STTToLanguageMap}
          language={language}
          showText={showText}
          connectrobot={connectrobot}
          sttMethod={sttMethod}
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
          setIsLastMessage={setIsLastMessage}
          isLastMessage={isLastMessage}
        />
      </Paper>
    </>
  );
};

export default SettingsPanel;
