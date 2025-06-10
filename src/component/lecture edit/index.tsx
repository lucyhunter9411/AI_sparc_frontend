import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Tooltip,
  Box,
  Typography,
  Chip,
  useTheme,
  CircularProgress,
  Theme,
  styled,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import axios from "axios";

interface Lecture {
  _id: string;
  title: string;
}

interface Topic {
  _id: string;
  title: string;
  lecture_id: string;
}

interface CustomTreeItemProps {
  itemId: string;
  label: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

interface LectureEditorProps {
  lectures: Lecture[];
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  setLectures: (lectures: Lecture[]) => void;
  onStartLecture: (lectureId: string, topicId: string) => void;
  expandedItems: string[];
  onExpandedItemsChange: (
    event: React.SyntheticEvent<Element, Event>,
    items: string[]
  ) => void;
  CustomTreeItem: React.ComponentType<CustomTreeItemProps>;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  selectedTopic: any;
  setSelectedTopic(selectedTopic: any): void;
}

const TopicItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  paddingRight: theme.spacing(1),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
}));

const DeleteButtonWrapper = styled(Box)(({ theme }) => ({
  opacity: 0,
  transform: "translateX(10px)",
  transition: theme.transitions.create(["opacity", "transform"], {
    duration: theme.transitions.duration.short,
  }),
  display: "flex",
  alignItems: "center",
}));

const TopicContent = styled(Box)({
  flexGrow: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const LectureEditor: React.FC<LectureEditorProps> = ({
  lectures = [],
  topics = [],
  setTopics,
  setLectures,

  onStartLecture,
  expandedItems = [],
  onExpandedItemsChange = () => {},
  CustomTreeItem,
  editMode,
  setEditMode,
  selectedTopic,
  setSelectedTopic,
}) => {
  const theme = useTheme();
  const [deleteTopicId, setDeleteTopicId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [newLectureTitle, setNewLectureTitle] = useState<string>("");
  // const [newTopicTitle, setNewTopicTitle] = useState<string>("");
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(
    null
  );
  const [addingTopicLoading, setAddingTopicLoading] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    type: "lecture" | "topic" | null;
    id: string | null;
    title: string;
  }>({
    open: false,
    type: null,
    id: null,
    title: "",
  });

  const [openTopicDialog, setOpenTopicDialog] = useState(false);

  const [isAddTopic, setAddTopic] = useState(false);

  const safeExpandedItems = Array.isArray(expandedItems) ? expandedItems : [];

  const handleSelectTopicEvent = (id: any) => {
    setSelectedTopic(topics.filter((u) => u._id === id)[0]);
  };

  const [addingLecture, setAddingLecture] = useState<boolean>(false);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    const send_data = new URLSearchParams();

    const endpoint =
      deleteConfirmation.type === "topic" ? "deleteTopic/" : "deleteLecture/";
    const paramName =
      deleteConfirmation.type === "topic" ? "topicID" : "lectureID";

    if (!deleteConfirmation.id) return;

    send_data.append(paramName, deleteConfirmation.id);

    try {
      const response = await axios.post(
        `http://localhost:8000/${endpoint}`,
        send_data,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (deleteConfirmation.type === "topic") {
        setTopics(response.data.topic);
      } else {
        setLectures(response.data.lecture);
      }
    } catch (error) {
    } finally {
      handleCloseDeleteConfirmation();
    }
  };

  const handleDeleteConfirmation = (
    type: "lecture" | "topic",
    id: string,
    title: string
  ) => {
    setDeleteTopicId(id);
    setDeleteConfirmation({
      open: true,
      type,
      id,
      title,
    });
  };

  const handleCloseDeleteConfirmation = () => {
    setLoading(false);
    setDeleteConfirmation({
      open: false,
      type: null,
      id: null,
      title: "",
    });
  };

  const handleAddLecture = async () => {
    if (!newLectureTitle.trim()) return;

    try {
      setLoading(true);
      const send_data = new URLSearchParams();
      send_data.append("title", newLectureTitle.trim());

      const response = await axios.post(
        "http://localhost:8000/addLecture/",
        send_data,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      setLectures(response.data.lecture);
      setNewLectureTitle("");
      setAddingLecture(false);
    } catch (error) {
      console.error("Error adding lecture:", error);
    } finally {
      setLoading(false);
    }
  };

  const [curField, setCurField] = useState("content");
  const handleCurFieldlChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setCurField(event.target.value);
  };

  const [addContentTitle, setAddContentTitle] = useState("");
  const handleContentTitleChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setAddContentTitle(event.target.value);
  };
  const [addQATime, setAddQATime] = useState("");
  const handleQATimeChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setAddQATime(event.target.value);
  };

  const handleAddTopic = async () => {
    let send_data = new URLSearchParams();

    if (!selectedLectureId) {
      return;
    }

    send_data.append("lecture_id", selectedLectureId);
    send_data.append(
      "title",
      curField === "intro"
        ? "Introduction"
        : curField === "q_a"
        ? "Q&A Time"
        : addContentTitle
    );
    send_data.append("qna_time", String(parseInt(addQATime) || 0));

    try {
      setAddingTopicLoading(true);
      const response = await axios.post(
        "http://localhost:8000/addTopic/",
        send_data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      setTopics(response.data.topic);
      setAddContentTitle("");
      setAddQATime("");
      setCurField("content");
      setOpenTopicDialog(false);
    } catch (error) {
      console.error("Error adding topic:", error);
    } finally {
      setAddingTopicLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SimpleTreeView
        expandedItems={safeExpandedItems}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        {editMode && addingLecture && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pl: 2,
              mb: 1,
            }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="New lecture title"
              value={newLectureTitle}
              onChange={(e) => setNewLectureTitle(e.target.value)}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Tooltip title="Add lecture">
              <IconButton
                onClick={handleAddLecture}
                color="primary"
                disabled={!newLectureTitle.trim()}
                size="small"
              >
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton
                onClick={() => {
                  setAddingLecture(false);
                  setNewLectureTitle("");
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {lectures.map((lecture) => (
          <CustomTreeItem
            key={`lecture-${lecture._id}`}
            itemId={lecture._id}
            label={lecture.title}
          >
            {topics
              .filter((topic) => topic.lecture_id === lecture._id)
              .map((topic) => (
                <TopicItem
                  key={`topic-${topic._id}`}
                  onMouseEnter={() => setHoveredTopicId(topic._id)}
                  onMouseLeave={() => setHoveredTopicId(null)}
                >
                  <TopicContent>
                    <CustomTreeItem
                      itemId={topic._id}
                      label={topic.title}
                      onClick={() => handleSelectTopicEvent(topic._id)}
                    />
                  </TopicContent>
                  {editMode && (
                    <DeleteButtonWrapper
                      sx={{
                        opacity: hoveredTopicId === topic._id ? 1 : 0,
                        transform:
                          hoveredTopicId === topic._id
                            ? "translateX(0)"
                            : "translateX(10px)",
                      }}
                    >
                      <Tooltip title="Delete topic">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirmation(
                              "topic",
                              topic._id,
                              topic.title
                            );
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </DeleteButtonWrapper>
                  )}
                </TopicItem>
              ))}

            {editMode && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pl: 3,
                  pr: 1,
                  gap: 1,
                  mt: 1,
                  mb: 1,
                }}
              >
                <Chip
                  icon={<AddIcon fontSize="small" />}
                  label="Add Topic"
                  onClick={() => {
                    setSelectedLectureId(lecture._id);
                    setOpenTopicDialog(true);
                  }}
                  size="small"
                  variant="outlined"
                  sx={{ cursor: "pointer" }}
                />

                <Chip
                  icon={<DeleteIcon fontSize="small" />}
                  label="Delete Lesson"
                  onClick={() =>
                    handleDeleteConfirmation(
                      "lecture",
                      lecture._id,
                      lecture.title
                    )
                  }
                  color="error"
                  size="small"
                  variant="outlined"
                  sx={{ cursor: "pointer" }}
                />
              </Box>
            )}
          </CustomTreeItem>
        ))}

        {editMode && (
          <>
            {addingLecture ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pl: 2,
                  pr: 2,
                  mb: 1,
                }}
              >
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="New lecture title"
                  value={newLectureTitle}
                  onChange={(e) => setNewLectureTitle(e.target.value)}
                  sx={{ flexGrow: 1, mr: 1 }}
                  autoFocus
                />
                <Tooltip title="Add lecture">
                  <IconButton
                    onClick={handleAddLecture}
                    color="primary"
                    disabled={!newLectureTitle.trim() || loading}
                    size="small"
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CheckIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton
                    onClick={() => {
                      setAddingLecture(false);
                      setNewLectureTitle("");
                    }}
                    size="small"
                    disabled={loading}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box
                sx={{
                  position: "sticky",
                  backgroundColor: "background.paper",
                  py: 1,
                  px: 1,
                  display: "flex",
                  justifyContent: "center",
                  zIndex: 1,
                  mt: "auto",
                  gap: 1,
                  overflowX: "hidden",
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    minWidth: 250,
                    textTransform: "none",
                    fontWeight: "bold",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                  onClick={() => setAddingLecture(true)}
                >
                  Add Lecture
                </Button>
              </Box>
            )}
          </>
        )}
      </SimpleTreeView>

      <Dialog
        open={deleteConfirmation.open}
        onClose={handleCloseDeleteConfirmation}
      >
        <DialogTitle>
          Delete {deleteConfirmation.type === "lecture" ? "Lecture" : "Topic"}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteConfirmation.title}"?
            {deleteConfirmation.type === "lecture" &&
              " This will also delete all associated topics."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirmation} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Topic Dialog */}
      <Dialog
        open={openTopicDialog}
        onClose={() => {
          setOpenTopicDialog(false);
          setAddContentTitle("");
          setAddQATime("");
          setCurField("content");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            {/* Section Selection */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Section Type
              </Typography>
              <RadioGroup value={curField} onChange={handleCurFieldlChange} row>
                <FormControlLabel
                  value="intro"
                  control={<Radio />}
                  label="Introduction"
                />
                <FormControlLabel
                  value="content"
                  control={<Radio />}
                  label="Content"
                />
                <FormControlLabel value="q_a" control={<Radio />} label="Q&A" />
              </RadioGroup>
            </Box>

            {curField === "content" && (
              <TextField
                label="Topic Title"
                value={addContentTitle}
                onChange={handleContentTitleChange}
                fullWidth
                variant="outlined"
                required
              />
            )}

            {curField === "q_a" && (
              <TextField
                label="Q&A Time (minutes)"
                type="number"
                value={addQATime}
                onChange={handleQATimeChange}
                fullWidth
                variant="outlined"
                inputProps={{ min: 1, max: 60 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={addingTopicLoading}
            onClick={() => setOpenTopicDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleAddTopic();
              setOpenTopicDialog(false);
            }}
            variant="contained"
            disabled={
              curField === "content"
                ? !addContentTitle
                : curField === "q_a"
                ? !addQATime
                : false
            }
          >
            {addingTopicLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Topic"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LectureEditor;
