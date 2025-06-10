import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { PlayArrow, Stop, Save, Add, School } from "@mui/icons-material";
import axios from "axios";

interface ContentItem {
  image?: string;
  text: string;
  EnglishText: string;
  HindiText: string;
  TeluguText: string;
}

interface TopicType {
  title: any;
  _id: string;
  content?: ContentItem[];
}

interface ContentCreatorProps {
  selectedTopic: TopicType;
  setSelectedTopic: React.Dispatch<React.SetStateAction<TopicType>>;
  lectures: any;
  topics: any;
  setTopics: any;
  setLectures: any;
  editMode: boolean;
}

interface AudioState {
  isPlaying: boolean;
  audio: HTMLAudioElement | null;
}

interface PlayingIndexes {
  [index: number]: {
    [lang: string]: AudioState;
  };
}

interface TTSResponse {
  audio: string;
}

interface GeneratedTextResponse {
  English: string;
  Hindi: string;
  Telugu: string;
}

interface Topic {
  _id?: string;
  content?: ContentItem[];
}

interface ModifiedFields {
  text?: boolean;
  EnglishText?: boolean;
  HindiText?: boolean;
  TeluguText?: boolean;
  image?: boolean;
}

const CompactImage = styled(Paper)(({ theme }) => ({
  height: "200px",
  backgroundColor: theme.palette.grey[100],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
}));

const CompactTextArea = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    height: "100%",
    backgroundColor: theme.palette.background.paper,
    alignItems: "flex-start",
    "& textarea": {
      height: "100% !important",
      minHeight: "100% !important",
      overflow: "auto !important",
      padding: "6px !important",
      fontSize: "13px !important",
      lineHeight: "1.4 !important",
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary,
      scrollbarWidth: "thin",
      scrollbarColor: `${theme.palette.grey[400]} transparent`,
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: theme.palette.grey[400],
        borderRadius: "3px",
      },
      "&::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "&::-webkit-scrollbar-button": {
        display: "none",
      },
      "&::-webkit-scrollbar-corner": {
        display: "none",
      },
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
    transform: "translate(12px, 12px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -6px) scale(0.75)",
    },
  },
  "& .MuiFormHelperText-root": {
    fontSize: "8px",
    marginLeft: 0,
    marginRight: 0,
  },
  "& .Mui-focused": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: "1px",
    },
  },
}));

const ScrollableContainer = styled(Container)(({ theme }) => ({
  py: 1,
  height: "100vh",
  overflow: "auto",
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.grey[400]} transparent`,
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400],
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-button": {
    display: "none",
  },
  "&::-webkit-scrollbar-corner": {
    display: "none",
  },
}));

const ContentCreator: React.FC<ContentCreatorProps> = ({
  selectedTopic,
  setSelectedTopic,
  lectures,
  topics,
  setTopics,
  setLectures,
  editMode,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddContent, setAddContent] = useState(false);
  const [playingIndexes, setPlayingIndexes] = useState<PlayingIndexes>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<string | null>("");
  const [isLoading, setIsLoading] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<
    Record<number, ModifiedFields>
  >({});

  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  const [buttonLoading, setButtonLoading] = useState({
    upload: false,
    update: false,
    save: false,
    generate: false,
    add: false,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const handleSnackbarOpen = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    setAddContent(true);
    setNewContent("");
    setSelectedImage(null);
  };

  const handleCloseModal = () => setAddContent(false);

  const [newImage, setNewImage] = useState("");
  const handleImageAdd = async (file: string | Blob) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post(
        "http://localhost:8000/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadedImageUrl = response.data.imageUrl;

      uploadedImageUrl &&
        handleSnackbarOpen("Image uploaded successfully!", "success");

      setNewImage(uploadedImageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageUpload = async (file: string | Blob, index: number) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post(
        "http://localhost:8000/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedImageUrl = response.data.imageUrl;

      const updatedTopic = { ...selectedTopic };
      const updatedContent = [...(updatedTopic.content || [])];

      updatedContent[index] = {
        ...updatedContent[index],
        ["image"]: uploadedImageUrl,
      };

      updatedTopic.content = updatedContent;

      setModifiedFields((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          image: true,
        },
      }));

      axios.post("http://localhost:8000/imageUpdate/", updatedTopic, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setSelectedTopic(updatedTopic as TopicType);
      setTopics((prevTopics: any[]) => {
        if (Array.isArray(prevTopics)) {
          return prevTopics.map((topic) =>
            topic._id === updatedTopic._id ? updatedTopic : topic
          );
        } else {
          console.error("prevTopics is not an array:", prevTopics);
          return [];
        }
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: any
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);

      if (index === "-") {
        setSelectedImage(imageUrl);
        handleImageAdd(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const updatedTopic = { ...selectedTopic };
          const updatedContent = [...(updatedTopic.content || [])];

          updatedContent[index] = {
            ...updatedContent[index],
            image: e.target?.result as string,
          };

          setSelectedTopic(updatedTopic as TopicType);
          handleImageUpload(file, Number(index));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDataChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: keyof ContentItem
  ) => {
    if (selectedTopic.content) {
      const updatedTopic = { ...selectedTopic };
      const updatedContent = [...selectedTopic.content];
      updatedContent[index] = {
        ...updatedContent[index],
        [field]: event.target.value,
      };
      updatedTopic.content = updatedContent;
      setSelectedTopic(updatedTopic);
      setModifiedFields((prev) => ({
        ...prev,
        [index]: {
          ...(prev[index] || {}),
          [field]: true,
        },
      }));
      if (setTopics) {
        setTopics((prevTopics: any[]) => {
          if (Array.isArray(prevTopics)) {
            return prevTopics.map((topic) =>
              topic._id === updatedTopic._id ? updatedTopic : topic
            );
          } else {
            console.error("prevTopics is not an array:", prevTopics);
            return prevTopics || [];
          }
        });
      }
    }
  };

  let curReadingText = "";
  const handleTTSClick = (text: string, lang: string, index: number) => {
    if (
      playingIndexes[index] &&
      playingIndexes[index][lang] &&
      playingIndexes[index][lang].isPlaying
    ) {
      const currentAudio = playingIndexes[index][lang].audio;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;

        setPlayingIndexes((prevState) => {
          const newState = { ...prevState };
          newState[index] = {
            ...newState[index],
            [lang]: { isPlaying: false, audio: null },
          };
          return newState;
        });

        setActiveIndex(null);
        setActiveLang(null);
        setIsLoading(false);
      }
    } else {
      Object.entries(playingIndexes).forEach(([i, langs]) => {
        Object.entries(langs).forEach(([l, state]) => {
          const audioState = state as AudioState;
          if (audioState.isPlaying && audioState.audio) {
            audioState.audio.pause();
            audioState.audio.currentTime = 0;
          }
        });
      });

      setActiveIndex(index);
      setActiveLang(lang);
      setIsLoading(true);

      handleTTS(text, lang, index);
    }
  };

  const handleTTS = (text: string, lang: string, index: number): void => {
    curReadingText = text;

    const payload = JSON.stringify({ text, lang });

    axios
      .post<TTSResponse>("http://localhost:8000/gtts/", payload, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        const audioData = `data:audio/wav;base64,${res.data.audio}`;
        const newAudio = new Audio(audioData);

        newAudio.onended = () => {
          setPlayingIndexes((prevState) => {
            const newState = { ...prevState };
            if (newState[index]) {
              newState[index][lang] = { isPlaying: false, audio: null };
            }
            return newState;
          });

          setActiveIndex(null);
          setActiveLang(null);
          setIsLoading(false);
        };

        newAudio.onerror = () => {
          setPlayingIndexes((prevState) => {
            const newState = { ...prevState };
            if (newState[index]) {
              newState[index][lang] = { isPlaying: false, audio: null };
            }
            return newState;
          });
          setActiveIndex(null);
          setActiveLang(null);
          setIsLoading(false);
        };

        newAudio
          .play()
          .then(() => {
            setPlayingIndexes((prevState) => {
              const newState = { ...prevState };
              if (!newState[index]) {
                newState[index] = {};
              }
              newState[index][lang] = { isPlaying: true, audio: newAudio };
              return newState;
            });
            setIsLoading(false);
          })
          .catch((error) => {
            setIsLoading(false);
          });
      })
      .catch((error) => {
        setIsLoading(false);
      });
  };
  const handleDataUpdate = (index: number) => {
    axios
      .post("http://localhost:8000/topicsUpdate/", selectedTopic, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(function (res) {
        handleSnackbarOpen("Successfully Updated !", "success");
        setModifiedFields((prev) => {
          const newState = { ...prev };
          if (newState[index]) {
            newState[index] = {};
          }
          return newState;
        });
      })
      .catch(function (error) {
        handleSnackbarOpen("Error while update!", "error");
        console.error("Error:", error);
      });
  };

  const generateData = async (text: string, index: number): Promise<void> => {
    setGeneratingIndex(index);
    axios
      .post<GeneratedTextResponse>(
        "http://localhost:8000/generateText/",
        new URLSearchParams({ text }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(async (res) => {
        res && handleSnackbarOpen("Generated succesfully!", "success");

        if (!selectedTopic.content) return;

        const updatedTopic: TopicType = {
          ...selectedTopic,
          _id: selectedTopic._id,
          content: [...selectedTopic.content],
        };

        if (updatedTopic.content) {
          updatedTopic.content[index] = {
            ...updatedTopic.content[index],
            EnglishText: res.data.English,
            HindiText: res.data.Hindi,
            TeluguText: res.data.Telugu,
          };
        }
        setModifiedFields((prev) => ({
          ...prev,
          [index]: {
            ...(prev[index] || {}),
            EnglishText: true,
            HindiText: true,
            TeluguText: true,
          },
        }));

        setSelectedTopic(updatedTopic);

        try {
          await axios.post(
            "http://localhost:8000/topicsUpdate/",
            updatedTopic,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          handleSnackbarOpen("Generated successfully!", "success");
        } catch (error) {
          console.error("Failed to update topic on server:", error);
          handleSnackbarOpen(
            "Generation succeeded but update failed",
            "warning"
          );
        }

        if (setTopics) {
          setTopics((prevTopics: Topic[] | undefined) => {
            if (!Array.isArray(prevTopics)) {
              console.error("prevTopics is not an array:", prevTopics);
              return [];
            }
            return prevTopics.map((topic) =>
              topic._id === updatedTopic._id ? updatedTopic : topic
            );
          });
        }
        setGeneratingIndex(null);
      })
      .catch((error) => {
        console.error("Error generating text:", error);
        handleSnackbarOpen("Error generating text!", "error");
        setGeneratingIndex(null);
      });
  };

  const handleSave = async () => {
    setButtonLoading((prev) => ({ ...prev, save: true }));

    const newData = {
      text: newContent,
      image: newImage,
      time: 0,
      audio: "",
      EnglishText: "",
      HindiText: "",
      TeluguText: "",
      EnglishTime: 0,
      HindiTime: 0,
      TeluguTime: 0,
    };

    const updatedTopic = { ...selectedTopic };
    const updatedContent = [...(updatedTopic.content || [])];
    updatedContent.push(newData);
    updatedTopic.content = updatedContent;

    try {
      const res = await axios.post(
        "http://localhost:8000/newContent/",
        updatedTopic,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      handleSnackbarOpen("Content added successfully!", "success");
      setSelectedTopic(res.data.message);
      setTopics((prevTopics: any[]) => {
        if (Array.isArray(prevTopics)) {
          return prevTopics.map((topic) =>
            topic._id === res.data.message._id ? res.data.message : topic
          );
        } else {
          console.error("prevTopics is not an array:", prevTopics);
          return [];
        }
      });
      setAddContent(false);
    } catch (error) {
      console.log("Network Error!!!");
      handleSnackbarOpen("Failed to add content", "error");
    } finally {
      setButtonLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const hasModifiedFields = (
    index: number,
    fields: (keyof ModifiedFields)[]
  ): boolean => {
    if (!modifiedFields[index]) return false;
    return fields.some((field) => modifiedFields[index][field]);
  };

  const handleAddChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setNewContent(event.target.value);
  };
  if (!selectedTopic || !selectedTopic.content) {
    return (
      <Container
        maxWidth={false}
        sx={{
          py: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: 500,
            p: 4,
            borderRadius: 2,
            backgroundColor: "background.paper",
            boxShadow: 1,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            No Topic Selected
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please select a topic from the menu to view or edit its content.
          </Typography>
          <School
            sx={{
              fontSize: 80,
              color: "primary.main",
              opacity: 0.7,
              mb: 2,
            }}
          />
        </Box>
      </Container>
    );
  }

  return (
    <ScrollableContainer maxWidth={false} sx={{ py: 1 }}>
      {selectedTopic.content && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleOpenModal}
            sx={{ fontSize: "0.75rem", textTransform: "capitalize" }}
          >
            Add Content
          </Button>
        </Box>
      )}
      {selectedTopic.content.map((eachContent, index) => (
        <React.Fragment key={index}>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={12} md={5}>
              <CompactImage
                onClick={() =>
                  document.getElementById(`image-upload-${index}`)?.click()
                }
              >
                <img
                  src={
                    eachContent.image
                      ? eachContent.image.startsWith("data:image") ||
                        eachContent.image.startsWith("blob:")
                        ? eachContent.image
                        : `http://localhost:8000/static/image/${eachContent.image}`
                      : "http://localhost:8000/static/camera.png"
                  }
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "http://localhost:8000/static/camera.png";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  alt="Content"
                />
                <input
                  id={`image-upload-${index}`}
                  type="file"
                  onChange={(event) => handleImageSelect(event, index)}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </CompactImage>
            </Grid>

            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <CompactTextArea
                  variant="outlined"
                  multiline
                  rows={8}
                  value={eachContent.text}
                  onChange={(event) => handleDataChange(event, index, "text")}
                  fullWidth
                  sx={{ mb: 1 }}
                />

                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      activeIndex === index && activeLang === "st" ? (
                        isLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Stop fontSize="small" />
                        )
                      ) : (
                        <PlayArrow fontSize="small" />
                      )
                    }
                    disabled={activeIndex !== null && activeIndex !== index}
                    onClick={() =>
                      activeIndex === index && activeLang === "st"
                        ? handleTTSClick(eachContent.text, "st", index)
                        : handleTTSClick(eachContent.text, "st", index)
                    }
                    sx={{
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {activeIndex === index && activeLang === "st"
                      ? isLoading
                        ? "Playing"
                        : "Stop"
                      : "Play"}
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleDataUpdate(index)}
                    sx={{
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => generateData(eachContent.text, index)}
                    disabled={generatingIndex !== null}
                    startIcon={
                      generatingIndex === index ? (
                        <CircularProgress size={16} />
                      ) : null
                    }
                    sx={{
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {generatingIndex === index
                      ? "Generating"
                      : "Generate spoken text"}
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid container spacing={1} sx={{ width: "100%", mt: 1 }}>
              {["EnglishText", "HindiText", "TeluguText"].map((field, i) => (
                <Grid item xs={12} md={4} key={field}>
                  <Box sx={{ height: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {field.replace("Text", "")}
                    </Typography>
                    <CompactTextArea
                      variant="outlined"
                      multiline
                      rows={5}
                      value={eachContent[field as keyof ContentItem] as string}
                      onChange={(e) =>
                        handleDataChange(e, index, field as keyof ContentItem)
                      }
                      fullWidth
                      sx={{ mb: 0.5 }}
                    />
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          activeIndex === index &&
                          activeLang === field.slice(0, 2).toLowerCase() ? (
                            isLoading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Stop fontSize="small" />
                            )
                          ) : (
                            <PlayArrow fontSize="small" />
                          )
                        }
                        disabled={activeIndex !== null && activeIndex !== index}
                        onClick={() =>
                          handleTTSClick(
                            eachContent[field as keyof ContentItem] as string,
                            field.slice(0, 2).toLowerCase(),
                            index
                          )
                        }
                        sx={{
                          fontSize: "0.75rem",
                          textTransform: "capitalize",
                        }}
                      >
                        {activeIndex === index &&
                        activeLang === field.slice(0, 2).toLowerCase()
                          ? isLoading
                            ? "Playing"
                            : "Stop"
                          : "Play"}
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleDataUpdate(index)}
                        disabled={
                          !hasModifiedFields(index, [
                            field as keyof ModifiedFields,
                          ])
                        }
                        sx={{
                          fontSize: "0.75rem",
                          textTransform: "capitalize",
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {selectedTopic.content &&
            selectedTopic.content.length > 1 &&
            index < selectedTopic.content.length - 1 && (
              <Divider
                sx={{ my: 3, borderColor: "divider", borderBottomWidth: 2 }}
              />
            )}
        </React.Fragment>
      ))}

      <Dialog
        open={isAddContent}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 24px 16px 24px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          Add New Content
          <Box sx={{ display: "flex", gap: 2 }}>
            <Chip
              label={`Topic: ${selectedTopic?.title}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                Content
              </Typography>
              <TextField
                variant="outlined"
                multiline
                rows={10}
                value={newContent}
                onChange={handleAddChange}
                fullWidth
                placeholder="Enter your content here..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "& textarea": {
                      padding: "16px",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                Image
              </Typography>
              <Box
                component="label"
                htmlFor="image-upload"
                sx={{
                  height: "300px",
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "background.paper",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <input
                  id="image-upload"
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => handleImageSelect(event, "-")}
                />
                {selectedImage ? (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={selectedImage}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.src = `http://localhost:8000/static/camera.png`;
                      }}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                      onLoad={() => {
                        URL.revokeObjectURL(selectedImage);
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Drag & drop an image here or click to browse
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              textTransform: "capitalize",
              padding: "8px 16px",
              borderRadius: "6px",
              color: "text.secondary",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!newContent.trim() || buttonLoading.save}
            sx={{
              textTransform: "capitalize",
              padding: "8px 16px",
              borderRadius: "6px",
              boxShadow: "none",
            }}
            startIcon={
              buttonLoading.save ? <CircularProgress size={20} /> : null
            }
          >
            {buttonLoading.save ? "Adding..." : "Add Content"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ScrollableContainer>
  );
};

export default ContentCreator;
