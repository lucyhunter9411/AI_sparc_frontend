import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  Drawer,
  Modal,
  Button,
  Input,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import { styled, alpha } from "@mui/system";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import axios from "axios";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import CircularProgress from "@mui/material/CircularProgress";
import AddBoxIcon from "@mui/icons-material/AddBox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";

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
  @media screen and (max-width: 900px) {
    max-height: none; 
  }
`);
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  color: theme.palette.text.black,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));
const Message = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isOwn",
})(({ theme }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  alignSelf: "flex-start",
  backgroundColor: "#f5f5f5",
  color: "inherit",
}));

const AdminPage = () => {
  //   const [startPos, setStartPos] = useState("");
  const [lectures, setLectures] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState({});
  let currentAudio = null;
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [playingIndexes, setPlayingIndexes] = useState({}); //State to Track Playing Status
  const [openTTS, setTTSOpen] = useState(false);
  const [myPrompt, setPrompt] = useState("");
  const [open, setOpen] = useState(false);

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

  const handleSelectTopicEvent = (id) => {
    setSelectedTopic(topics.filter((u) => u._id === id)[0]);
    // console.log("topic", topics.filter((u) => u._id === id)[0]);
    // console.log(selectedTopic);
  };
  console.log(lectures);

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

  let curReadingText = "";
  const [activeIndex, setActiveIndex] = useState(null); // Track active index
  const [activeLang, setActiveLang] = useState(null); // Track active language
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const handleTTSClick = (text, lang, index) => {
    if (
      playingIndexes[index] &&
      playingIndexes[index][lang] &&
      playingIndexes[index][lang].isPlaying
    ) {
      const currentAudio = playingIndexes[index][lang].audio;
      if (currentAudio) {
        console.log("Stopping audio...");
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

        setActiveIndex(null); // Reset active state
        setActiveLang(null);
        setIsLoading(false);
      }
    } else {
      setActiveIndex(index);
      setActiveLang(lang);
      setIsLoading(true);

      console.log("Play audio for index", index);
      console.log(text, lang, index);
      handleTTS(text, lang, index);
    }
  };

  const handleTTS = (text, lang, index) => {
    curReadingText = text;

    const payload = JSON.stringify({ text: text, lang: lang });

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/gtts/",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((res) => {
        const newAudio = new Audio(`data:audio/wav;base64,${res.data.audio}`);

        newAudio.onended = () => {
          setPlayingIndexes((prevState) => {
            const newState = { ...prevState };
            newState[index] = {
              ...newState[index],
              [lang]: { isPlaying: false, audio: null },
            };
            return newState;
          });

          setActiveIndex(null); // Reset active state after playback
          setActiveLang(null);
          setIsLoading(false);
        };

        newAudio.play();

        setPlayingIndexes((prevState) => {
          const newState = { ...prevState };
          if (!newState[index]) newState[index] = {};
          newState[index][lang] = { isPlaying: true, audio: newAudio };
          return newState;
        });

        setIsLoading(false);
      });
  };
  const handleDataChange = (event, index, lang) => {
    const updatedTopic = { ...selectedTopic };
    const updatedContent = [...updatedTopic.content];

    updatedContent[index] = {
      ...updatedContent[index],
      [lang]: event.target.value,
    };

    updatedTopic.content = updatedContent;

    setSelectedTopic(updatedTopic);
    setTopics((prevTopics) => {
      if (Array.isArray(prevTopics)) {
        return prevTopics.map((topic) =>
          topic._id === updatedTopic._id ? updatedTopic : topic
        );
      } else {
        console.error("prevTopics is not an array:", prevTopics);
        return [];
      }
    });
  };
  const handleDataUpdate = () => {
    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/topicsUpdate/",
        selectedTopic,
        {
          headers: {
            "Content-Type": "application/json", // Set content type as JSON
          },
        }
      )
      .then(function (res) {
        alert("Successfully Updated!");
      })
      .catch(function (error) {
        console.error("Error:", error); // Log any errors to see what went wrong
      });
  };
  const handleImageSelect = (e, index) => {
    // console.log(index);
    const file = e.target.files[0];
    if (file) {
      if (index === "-") {
        handleImageAdd(file);
      } else {
        handleImageUpload(file, index);
      }
    }
  };
  const handleImageUpload = async (file, index) => {
    const formData = new FormData();
    formData.append("image", file);
    // console.log(formData);
    try {
      const response = await axios.post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedImageUrl = response.data.imageUrl;

      const updatedTopic = { ...selectedTopic };
      const updatedContent = [...updatedTopic.content];

      updatedContent[index] = {
        ...updatedContent[index],
        ["image"]: uploadedImageUrl,
      };

      updatedTopic.content = updatedContent;
      //   console.log(updatedTopic);

      axios.post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/imageUpdate/",
        updatedTopic,
        {
          headers: {
            "Content-Type": "application/json", // Set content type as JSON
          },
        }
      );

      setSelectedTopic(updatedTopic);
      setTopics((prevTopics) => {
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
  const goToLecture = () => {
    window.location.href = "/";
  };
  const generateData = (text, index) => {
    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/generateText/",
        new URLSearchParams({ text: text }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(function (res) {
        console.log(res.data);

        const updatedTopic = { ...selectedTopic };
        const updatedContent = [...updatedTopic.content];

        updatedContent[index] = {
          ...updatedContent[index],
          ["EnglishText"]: res.data.English,
          ["HindiText"]: res.data.Hindi,
          ["TeluguText"]: res.data.Telugu,
        };

        updatedTopic.content = updatedContent;

        setSelectedTopic(updatedTopic);

        axios.post(
          "https://app-ragbackend-dev-wus-001.azurewebsites.net/topicsUpdate/",
          updatedTopic,
          {
            headers: {
              "Content-Type": "application/json", // Set content type as JSON
            },
          }
        );
        setTopics((prevTopics) => {
          if (Array.isArray(prevTopics)) {
            return prevTopics.map((topic) =>
              topic._id === updatedTopic._id ? updatedTopic : topic
            );
          } else {
            console.error("prevTopics is not an array:", prevTopics);
            return [];
          }
        });
      })
      .catch(function (error) {
        console.error("Error:", error); // Log any errors to see what went wrong
      });
  };
  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "L") {
      setOpen(true); // Show the modal when Ctrl+Shift+P is pressed
      axios
        .get(
          "https://app-ragbackend-dev-wus-001.azurewebsites.net/promptGenerate/",
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        )
        .then(function (res) {
          console.log("promptResponse", res.data.prompt);
          setPrompt(res.data.prompt);
        })
        .catch(function (error) {
          console.log("Network Error!!!");
        });
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener when the component is unmounted
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const handleChange = (event) => {
    setPrompt(event.target.value);
  };

  // Function to close the modal
  const handleApply = () => {
    setOpen(false);
    axios.post(
      "https://app-ragbackend-dev-wus-001.azurewebsites.net/promptGenerate/",
      new URLSearchParams({ prompt: myPrompt }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  };
  //Add Content
  const [isAddContent, setAddContent] = useState(false);
  const addContent = () => {
    setNewImage("");
    setNewContent("");
    setAddContent(true);
  };

  const [newImage, setNewImage] = useState("");
  const handleImageAdd = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadedImageUrl = response.data.imageUrl;
      setNewImage(uploadedImageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const [newContent, setNewContent] = useState("");
  const handleAddChange = (event) => {
    setNewContent(event.target.value);
  };
  const handleCancel = () => {
    setAddContent(false);
  };
  const handleSave = () => {
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
    const updatedContent = [...updatedTopic.content];
    updatedContent.push(newData);
    updatedTopic.content = updatedContent;
    console.log(updatedTopic);

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/newContent/",
        updatedTopic,
        {
          headers: {
            "Content-Type": "application/json", // Set content type as JSON
          },
        }
      )
      .then(function (res) {
        console.log(res.data);

        setSelectedTopic(res.data.message);
        setTopics((prevTopics) => {
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
      })
      .catch(function (error) {
        console.log("Network Error!!!");
      });
  };
  //Add Topic
  const [isAddTopic, setAddTopic] = useState(false);
  const [curAddLectureID, setAddLectureID] = useState("");
  const addTopic = (lecture_id) => {
    setAddContentTitle("");
    setAddQATime(0);
    setAddTopic(true);
    setAddLectureID(lecture_id);
  };

  const handleAddTopicCancel = () => {
    setAddTopic(false);
  };

  const handleAddTopic = () => {
    let send_data = new URLSearchParams(); // Use URLSearchParams correctly

    send_data.append("lecture_id", curAddLectureID);
    send_data.append(
      "title",
      curField === "intro"
        ? "Introduction"
        : curField === "q_a"
        ? "Q&A Time"
        : addContentTitle
    );
    send_data.append("qna_time", parseInt(addQATime) || 0);

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/addTopic/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      )
      .then(function (res) {
        console.log(res.data.topic);

        setTopics(res.data.topic);
        setAddTopic(false);
      });
  };

  const [curField, setCurField] = useState("content");
  const handleCurFieldlChange = (event) => {
    setCurField(event.target.value);
  };

  const [addContentTitle, setAddContentTitle] = useState("");
  const handleContentTitleChange = (event) => {
    setAddContentTitle(event.target.value);
  };
  const [addQATime, setAddQATime] = useState("");
  const handleQATimeChange = (event) => {
    setAddQATime(event.target.value);
  };

  //add lecture
  const [isAddLecture, setIsAddLecture] = useState(false);
  const setAddLecture = () => {
    setIsAddLecture(!isAddLecture);
  };

  const [newLectureTitle, setNewLectureTitle] = useState("");
  const addNewLectureTitle = (event) => {
    setNewLectureTitle(event.target.value);
  };

  const handleAddLecture = () => {
    const send_data = new URLSearchParams();
    send_data.append("title", newLectureTitle); // Send title as form data

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/addLecture/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      )
      .then(function (res) {
        setLectures(res.data.lecture);
        setAddLecture(false);
      });
  };

  //Delete Topic Dialog
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [deleteTopicId, setDeleteTopicId] = React.useState("");

  const handleDeleteTopicOpen = (topicId) => {
    setOpenDeleteDialog(true);
    setDeleteTopicId(topicId);
  };

  const handleDeleteTopicClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteTopic = () => {
    const send_data = new URLSearchParams();
    send_data.append("topicID", deleteTopicId); // Send title as form data

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/deleteTopic/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      )
      .then(function (res) {
        setTopics(res.data.topic);
        setOpenDeleteDialog(false);
      });
  };

  //Delete Lecture
  const [openDeleteLectureDialog, setOpenDeleteLectureDialog] =
    React.useState(false);
  const [deleteLectureId, setDeleteLectureId] = React.useState("");

  const handleDeleteLectureOpen = (lectureId) => {
    setOpenDeleteLectureDialog(true);
    setDeleteLectureId(lectureId);
  };

  const handleDeleteLectureClose = () => {
    setOpenDeleteLectureDialog(false);
  };

  const handleDeleteLecture = () => {
    const send_data = new URLSearchParams();
    send_data.append("lectureID", deleteLectureId); // Send title as form data

    axios
      .post(
        "https://app-ragbackend-dev-wus-001.azurewebsites.net/deleteLecture/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      )
      .then(function (res) {
        setLectures(res.data.lecture);
        setOpenDeleteLectureDialog(false);
      });
  };

  return (
    <ChatContainer style={{ marginTop: "30px" }} className="chat-container">
      <div></div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: " center",
        }}
      >
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
          </Box>
        </Modal>
        <Modal
          open={isAddContent}
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
              width: 800,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              Add New Content
            </Typography>
            <Divider sx={{ marginBottom: 4, marginTop: 4 }}></Divider>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Item>
                  <textarea
                    style={{ width: "100%", height: "260px" }}
                    value={newContent}
                    onChange={handleAddChange}
                  ></textarea>
                </Item>
              </Grid>
            </Grid>
            <Button
              onClick={handleCancel}
              variant="contained"
              color="primary"
              sx={{ mt: 2, ml: 3, mr: 5, float: "right" }}
            >
              CANCEL
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              sx={{ mt: 2, float: "right" }}
            >
              ADD
            </Button>
          </Box>
        </Modal>
        <Modal
          open={isAddTopic}
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
              width: 500,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              Add New Topic
            </Typography>
            <Divider sx={{ marginBottom: 2, marginTop: 2 }}></Divider>
            <Typography id="modal-description" sx={{ mt: 2 }}>
              <FormControl>
                <RadioGroup
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={curField}
                  onChange={handleCurFieldlChange}
                >
                  <FormControlLabel
                    value="intro"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 18,
                            ml: 2,
                          },
                        }}
                      />
                    }
                    label="Introduction"
                  />
                  <FormControlLabel
                    value="content"
                    sx={{ mt: 3 }}
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 18,
                            ml: 2,
                          },
                        }}
                      />
                    }
                    label="Content"
                  />
                  <TextField
                    label="Title"
                    variant="standard"
                    size="small"
                    disabled={curField !== "content" ? true : false}
                    sx={{ ml: 6, width: 400 }}
                    value={addContentTitle}
                    onChange={handleContentTitleChange}
                  />

                  <FormControlLabel
                    sx={{ mt: 3 }}
                    value="q_a"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 18,
                            ml: 2,
                          },
                        }}
                      />
                    }
                    label="Q&A"
                  />
                </RadioGroup>
                <TextField
                  label="Q&A Time"
                  variant="standard"
                  size="small"
                  value={addQATime}
                  fullWidth
                  onChange={handleQATimeChange}
                />
              </FormControl>
            </Typography>
            <Divider sx={{ marginBottom: 2, marginTop: 2 }}></Divider>
            <Button
              onClick={handleAddTopicCancel}
              variant="contained"
              color="primary"
              sx={{ mt: 2, ml: 3, mr: 5, float: "right" }}
            >
              CANCEL
            </Button>
            <Button
              onClick={handleAddTopic}
              variant="contained"
              color="primary"
              sx={{ mt: 2, float: "right" }}
            >
              ADD
            </Button>
          </Box>
        </Modal>
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteTopicClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Are you sure you want to delete this topic?"}
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleDeleteTopicClose}>Disagree</Button>
            <Button onClick={handleDeleteTopic} autoFocus>
              Agree
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openDeleteLectureDialog}
          onClose={handleDeleteLectureClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Are you sure you want to delete this lecture?"}
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleDeleteLectureClose}>Disagree</Button>
            <Button onClick={handleDeleteLecture} autoFocus>
              Agree
            </Button>
          </DialogActions>
        </Dialog>
        <Paper
          elevation={10}
          sx={{ width: 350, overflowY: "auto", height: "100%" }}
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
              <Divider textAlign="left" sx={{ marginTop: 2, marginBottom: 2 }}>
                <b>Lecture List</b>
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
                                      handleSelectTopicEvent(topicId)
                                    }
                                  />
                                  <IconButton
                                    onClick={() =>
                                      handleDeleteTopicOpen(topicId)
                                    }
                                    aria-label="deleteTopic"
                                    color="error"
                                    sx={{ mr: 3 }}
                                  >
                                    <DeleteForeverIcon />
                                  </IconButton>
                                </div>
                              );
                            })}
                          <Button
                            onClick={() => addTopic(lecture._id)}
                            size="small"
                            color="#212121"
                            startIcon={<AddBoxIcon />}
                            style={{
                              marginLeft: "25px",
                              marginTop: "1px",
                              border: "1px dashed gray",
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            <span
                              style={{
                                width: "100%",
                                marginTop: "3px",
                                fontSize: "10px",
                                margin: "3px 135px 0px 10px",
                              }}
                            >
                              Add Topic
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteLectureOpen(lecture._id)}
                            size="small"
                            color="error"
                            startIcon={<DeleteForeverIcon />}
                            style={{
                              marginLeft: "25px",
                              marginTop: "1px",
                              border: "1px dashed gray",
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            <span
                              style={{
                                width: "100%",
                                marginTop: "3px",
                                fontSize: "10px",
                                margin: "3px 100px 0px 10px",
                              }}
                            >
                              Delete Lecture
                            </span>
                          </Button>
                        </CustomTreeItem>
                      </div>
                    );
                  })}
                <Button
                  size="small"
                  color="#212121"
                  startIcon={<AddBoxIcon />}
                  onClick={setAddLecture}
                  style={{
                    marginLeft: "16px",
                    border: "1px dashed gray",
                    marginTop: "2px",
                  }}
                  sx={{ textTransform: "none" }}
                >
                  <span
                    style={{
                      width: "100%",
                      marginTop: "3px",
                      fontSize: "12px",
                      margin: "3px 142px 0px 10px",
                    }}
                  >
                    Add Lecture
                  </span>
                </Button>
                {isAddLecture && (
                  <div>
                    <TextField
                      label="Title:"
                      variant="standard"
                      size="small"
                      value={newLectureTitle}
                      sx={{ ml: 5 }}
                      onChange={addNewLectureTitle}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddLecture()
                      }
                    />
                    <h5 style={{ marginLeft: "50px", color: "gray" }}>
                      <i>Check your title and press Enter.</i>
                    </h5>
                  </div>
                )}
              </SimpleTreeView>
            </div>
            <Button
              onClick={goToLecture}
              variant="outlined"
              style={{ width: "100%" }}
              sx={{ textTransform: "none" }}
            >
              Return to Lecture
            </Button>
          </div>
        </Paper>

        <MessageArea
          style={{ margin: "5px", height: "100%" }}
          className="message-area"
        >
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
            <MessageContainer>
              {selectedTopic.content && (
                <Button
                  onClick={addContent}
                  // variant="outlined"
                  size="small"
                  // color="#212121"
                  startIcon={<AddBoxIcon />}
                  style={{
                    marginLeft: "16px",
                    float: "right",
                    // border: "1px dashed gray",
                    marginTop: "2px",
                  }}
                  sx={{ textTransform: "none" }}
                >
                  <span
                    style={{
                      width: "100%",
                      marginTop: "3px",
                      fontSize: "15px",
                      margin: "3px 50px 0px 10px",
                    }}
                  >
                    Add Content
                  </span>
                </Button>
              )}
              {selectedTopic.content &&
                selectedTopic.content.map((eachContent, index) => {
                  return (
                    <Message
                      sx={{ marginTop: "50px", border: "1px solid black" }}
                    >
                      <Grid container spacing={2}>
                        {/* Image */}
                        <Grid item xs={8}>
                          <Item>
                            <div
                              style={{ width: "100%", cursor: "pointer" }}
                              onClick={() =>
                                document
                                  .getElementById(`image-upload-${index}`)
                                  .click()
                              }
                            >
                              <img
                                src={
                                  eachContent.image
                                    ? "https://app-ragbackend-dev-wus-001.azurewebsites.net/static/image/" +
                                      eachContent.image
                                    : "https://app-ragbackend-dev-wus-001.azurewebsites.net/static/camera.png"
                                }
                                onError={(e) => {
                                  e.currentTarget.src = `https://app-ragbackend-dev-wus-001.azurewebsites.net/static/camera.png`;
                                }}
                                style={{
                                  width: "100%",
                                }}
                              />
                              <input
                                // key={index}
                                id={`image-upload-${index}`}
                                type="file"
                                onChange={(event) => (
                                  console.log("in:", index),
                                  handleImageSelect(event, index)
                                )}
                                accept="image/*"
                                style={{ display: "none" }}
                              />
                            </div>
                          </Item>
                        </Grid>
                        {/* Static */}
                        <Grid item xs={4}>
                          <Divider
                            textAlign="left"
                            sx={{ marginTop: 2, marginBottom: 2 }}
                          >
                            <b>Static Data</b>
                          </Divider>
                          <Item>
                            <Typography id="modal-description">
                              <textarea
                                style={{ width: "100%", height: "200px" }}
                                value={eachContent.text}
                                onChange={(event) =>
                                  handleDataChange(event, index, "text")
                                }
                              ></textarea>
                            </Typography>
                          </Item>
                          <hr style={{ marginBottom: 0 }} />
                          <div
                            style={{
                              display: "flex",
                              marginTop: "10px",
                            }}
                          >
                            {activeIndex === index && activeLang === "st" ? (
                              isLoading ? (
                                <CircularProgress
                                  size={20}
                                  style={{ margin: "3px 10px 0px 20px" }}
                                />
                              ) : (
                                <StopCircleIcon
                                  style={{
                                    cursor: "pointer",
                                    margin: "3px 10px 0px 20px",
                                  }}
                                  onClick={() =>
                                    handleTTSClick(
                                      eachContent.text,
                                      "st",
                                      index
                                    )
                                  }
                                />
                              )
                            ) : (
                              <PlayCircleOutlineIcon
                                style={{
                                  cursor:
                                    activeIndex === null
                                      ? "pointer"
                                      : "not-allowed",
                                  opacity: activeIndex === null ? 1 : 0.8,
                                  margin: "3px 10px 0px 20px",
                                }}
                                onClick={() =>
                                  activeIndex === null &&
                                  handleTTSClick(eachContent.text, "st", index)
                                }
                              />
                            )}
                            {/* <span>{eachContent.time}s</span> */}
                            <Button
                              sx={{
                                marginLeft: 2,
                                float: "right",
                                textTransform: "none",
                              }}
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={handleDataUpdate}
                            >
                              Save
                            </Button>
                            <Button
                              sx={{
                                marginLeft: 2,
                                float: "right",
                                textTransform: "none",
                              }}
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                generateData(eachContent.text, index)
                              }
                            >
                              Generate
                            </Button>
                          </div>
                        </Grid>
                        {/* English */}
                        <Grid item xs={4}>
                          <Divider
                            textAlign="center"
                            sx={{ marginTop: 2, marginBottom: 2 }}
                          >
                            <b>English Data</b>
                          </Divider>
                          <Item>
                            <Typography id="modal-description">
                              <textarea
                                style={{ width: "100%", height: "200px" }}
                                value={eachContent.EnglishText}
                                onChange={(event) =>
                                  handleDataChange(event, index, "EnglishText")
                                }
                              ></textarea>
                            </Typography>
                          </Item>
                          <hr style={{ marginBottom: 0 }} />
                          <div
                            style={{
                              display: "flex",
                              marginTop: "10px",
                            }}
                          >
                            {activeIndex === index && activeLang === "en" ? (
                              isLoading ? (
                                <CircularProgress
                                  size={20}
                                  style={{ margin: "3px 10px 0px 20px" }}
                                />
                              ) : (
                                <StopCircleIcon
                                  style={{
                                    cursor: "pointer",
                                    margin: "3px 10px 0px 20px",
                                  }}
                                  onClick={() =>
                                    handleTTSClick(
                                      eachContent.EnglishText,
                                      "en",
                                      index
                                    )
                                  }
                                />
                              )
                            ) : (
                              <PlayCircleOutlineIcon
                                style={{
                                  cursor:
                                    activeIndex === null
                                      ? "pointer"
                                      : "not-allowed",
                                  opacity: activeIndex === null ? 1 : 0.8,
                                  margin: "3px 10px 0px 20px",
                                }}
                                onClick={() =>
                                  activeIndex === null &&
                                  handleTTSClick(
                                    eachContent.EnglishText,
                                    "en",
                                    index
                                  )
                                }
                              />
                            )}
                            <Button
                              sx={{
                                marginLeft: 2,
                                float: "right",
                                textTransform: "none",
                              }}
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={handleDataUpdate}
                            >
                              Update
                            </Button>
                          </div>
                        </Grid>
                        {/* Hindi */}
                        <Grid item xs={4}>
                          <Divider
                            textAlign="center"
                            sx={{ marginTop: 2, marginBottom: 2 }}
                          >
                            <b>Hindi Data</b>
                          </Divider>
                          <Item>
                            <Typography id="modal-description">
                              <textarea
                                style={{ width: "100%", height: "200px" }}
                                value={eachContent.HindiText}
                                onChange={(event) =>
                                  handleDataChange(event, index, "HindiText")
                                }
                              ></textarea>
                            </Typography>
                          </Item>
                          <hr style={{ marginBottom: 0 }} />
                          <div
                            style={{
                              display: "flex",
                              marginTop: "10px",
                            }}
                          >
                            {activeIndex === index && activeLang === "hi" ? (
                              isLoading ? (
                                <CircularProgress
                                  size={20}
                                  style={{ margin: "3px 10px 0px 20px" }}
                                />
                              ) : (
                                <StopCircleIcon
                                  style={{
                                    cursor: "pointer",
                                    margin: "3px 10px 0px 20px",
                                  }}
                                  onClick={() =>
                                    handleTTSClick(
                                      eachContent.HindiText,
                                      "hi",
                                      index
                                    )
                                  }
                                />
                              )
                            ) : (
                              <PlayCircleOutlineIcon
                                style={{
                                  cursor:
                                    activeIndex === null
                                      ? "pointer"
                                      : "not-allowed",
                                  opacity: activeIndex === null ? 1 : 0.8,
                                  margin: "3px 10px 0px 20px",
                                }}
                                onClick={() =>
                                  activeIndex === null &&
                                  handleTTSClick(
                                    eachContent.HindiText,
                                    "hi",
                                    index
                                  )
                                }
                              />
                            )}
                            <Button
                              sx={{
                                marginLeft: 2,
                                float: "right",
                                textTransform: "none",
                              }}
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={handleDataUpdate}
                            >
                              Update
                            </Button>
                          </div>
                        </Grid>
                        {/* Telugu */}
                        <Grid item xs={4}>
                          <Divider
                            textAlign="center"
                            sx={{ marginTop: 2, marginBottom: 2 }}
                          >
                            <b>Telugu Data</b>
                          </Divider>
                          <Item>
                            <Typography id="modal-description">
                              <textarea
                                style={{ width: "100%", height: "200px" }}
                                value={eachContent.TeluguText}
                                onChange={(event) =>
                                  handleDataChange(event, index, "TeluguText")
                                }
                              ></textarea>
                            </Typography>
                          </Item>
                          <hr style={{ marginBottom: 0 }} />
                          <div
                            style={{
                              display: "flex",
                              marginTop: "10px",
                            }}
                          >
                            {activeIndex === index && activeLang === "te" ? (
                              isLoading ? (
                                <CircularProgress
                                  size={20}
                                  style={{ margin: "3px 10px 0px 20px" }}
                                />
                              ) : (
                                <StopCircleIcon
                                  style={{
                                    cursor: "pointer",
                                    margin: "3px 10px 0px 20px",
                                  }}
                                  onClick={() =>
                                    handleTTSClick(
                                      eachContent.TeluguText,
                                      "te",
                                      index
                                    )
                                  }
                                />
                              )
                            ) : (
                              <PlayCircleOutlineIcon
                                style={{
                                  cursor:
                                    activeIndex === null
                                      ? "pointer"
                                      : "not-allowed",
                                  opacity: activeIndex === null ? 1 : 0.8,
                                  margin: "3px 10px 0px 20px",
                                }}
                                onClick={() =>
                                  activeIndex === null &&
                                  handleTTSClick(
                                    eachContent.TeluguText,
                                    "te",
                                    index
                                  )
                                }
                              />
                            )}
                            <Button
                              sx={{
                                marginLeft: 2,
                                float: "right",
                                textTransform: "none",
                              }}
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={handleDataUpdate}
                            >
                              Update
                            </Button>
                          </div>
                        </Grid>
                      </Grid>
                    </Message>
                  );
                })}
            </MessageContainer>
          </Paper>
        </MessageArea>
      </div>
    </ChatContainer>
  );
};

export default AdminPage;
