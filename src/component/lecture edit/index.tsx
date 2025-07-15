import React, { useState } from "react";
import * as yup from "yup";
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
  label: React.ReactNode;
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
  snackbar: {
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  };
  setSnackbar: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      severity: "success" | "error" | "warning" | "info";
    }>
  >;
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
  snackbar,
  setSnackbar,
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

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [openTopicDialog, setOpenTopicDialog] = useState(false);

  const [isAddTopic, setAddTopic] = useState(false);

  const safeExpandedItems = Array.isArray(expandedItems) ? expandedItems : [];

  const handleSelectTopicEvent = (id: any) => {
    setSelectedTopic(topics.filter((u) => u._id === id)[0]);
  };

  const [addingLecture, setAddingLecture] = useState<boolean>(false);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileSchema = yup
    .mixed()
    .test(
      "fileType",
      "Not a valid format. Please upload PDF file only.",
      (value) => {
        if (!value) return true;
        if (value instanceof File) {
          return value.type === "application/pdf";
        }
        return false;
      }
    );

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
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/${endpoint}`,
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
      setSnackbar({
        open: true,
        message:
          deleteConfirmation.type === "topic"
            ? "Topic deleted successfully"
            : "Lesson deleted successfully",
        severity: "success",
      });
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
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/addLecture/`,
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
      setSnackbar({
        open: true,
        message: "Lesson added successfully!",
        severity: "success",
      });
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
        `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/addTopic/`,
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
      setSnackbar({
        open: true,
        message: "Topic added successfully!",
        severity: "success",
      });
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
      {editMode && (
        <Box
          sx={{
            top: 0,
            backgroundColor: "background.paper",
            py: 1,
            px: 1,
            display: "flex",
            justifyContent: "center",
            zIndex: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            mb: 1,
            gap: 1,
          }}
        >
          <Chip
            label="Add New Lesson"
            onClick={() => setAddingLecture(true)}
            disabled={addingLecture}
            clickable
            color="primary"
            sx={{
              borderTopLeftRadius: 24,
              borderBottomLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,

              "&:hover": {
                boxShadow: theme.shadows[2],
              },
            }}
          />
          <Chip
            label="Upload File"
            onClick={() => {
              setOpenUploadDialog(true);
            }}
            clickable
            color="secondary"
            sx={{
              borderTopLeftRadius: 24,
              borderBottomLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
              "&:hover": {
                boxShadow: theme.shadows[2],
              },
            }}
          />
        </Box>
      )}

      {editMode && addingLecture && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            pl: 2,
            pr: 2,
            mb: 2,
            gap: 1,
          }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder="Enter lecture title"
            value={newLectureTitle}
            onChange={(e) => setNewLectureTitle(e.target.value)}
            sx={{ flexGrow: 1 }}
            autoFocus
            fullWidth
          />
          <Tooltip title="Add lecture">
            <IconButton
              onClick={handleAddLecture}
              color="primary"
              disabled={!newLectureTitle.trim() || loading}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckIcon fontSize="small" />
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
              sx={{
                backgroundColor: theme.palette.error.light,
                color: theme.palette.error.contrastText,
                "&:hover": {
                  backgroundColor: theme.palette.error.main,
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <SimpleTreeView
        expandedItems={safeExpandedItems}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        {lectures.map((lecture) => {
          const lectureTopics = topics.filter(
            (topic) => topic.lecture_id === lecture._id
          );
          const isHovered = hoveredTopicId === `lecture-${lecture._id}`;
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
                  onMouseEnter={() =>
                    setHoveredTopicId(`lecture-${lecture._id}`)
                  }
                  onMouseLeave={() => setHoveredTopicId(null)}
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
                  {editMode && (
                    <DeleteButtonWrapper
                      className="delete-lesson-btn"
                      sx={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered
                          ? "translateX(0)"
                          : "translateX(-10px)",
                        mr: 1,
                      }}
                    >
                      <Tooltip title="Delete lesson">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirmation(
                              "lecture",
                              lecture._id,
                              lecture.title
                            );
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </DeleteButtonWrapper>
                  )}
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
                </Box>
              )}
            </CustomTreeItem>
          );
        })}
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
            sx={{
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              minWidth: 100,
              textTransform: "capitalize",
            }}
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
            sx={{
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              minWidth: 100,
              textTransform: "capitalize",
            }}
          >
            {addingTopicLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Topic"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openUploadDialog}
        onClose={() => {
          setOpenUploadDialog(false);
          setUploadFile(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Upload PDF</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              pt: 1,
              minHeight: 180,
            }}
          >
            <Box
              sx={{
                width: "100%",
                border: "2px dashed",
                borderColor: theme.palette.divider,
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: theme.palette.action.hover,
                cursor: "pointer",
                transition: "border-color 0.2s",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                },
              }}
              component="label"
            >
              <input
                type="file"
                disabled={uploading}
                accept="image/*,application/pdf"
                hidden
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    try {
                      await fileSchema.validate(file);
                      setUploadFile(file);
                      setUploadError(null);
                    } catch (err: any) {
                      setUploadFile(null);
                      setUploadError(err.message);
                    }
                  }
                }}
              />
              {!uploadFile ? (
                <>
                  <UploadFileIcon
                    sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Drag & drop or click to select an image or PDF
                  </Typography>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {uploadFile.type.startsWith("image/") ? (
                    <Box
                      component="img"
                      src={URL.createObjectURL(uploadFile)}
                      alt={uploadFile.name}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 1,
                        mb: 1,
                        boxShadow: 1,
                      }}
                    />
                  ) : (
                    <UploadFileIcon
                      sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                    />
                  )}
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {uploadFile.name}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    disabled={uploading}
                    onClick={() => setUploadFile(null)}
                    sx={{
                      borderTopRightRadius: 20,
                      borderBottomRightRadius: 20,
                      borderTopLeftRadius: 20,
                      borderBottomLeftRadius: 20,
                      minWidth: 100,
                      textTransform: "capitalize",
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
              {uploadError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Button
            onClick={() => {
              setOpenUploadDialog(false);
              setUploadFile(null);
              setUploadError(null);
            }}
            sx={{
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              minWidth: 100,
              textTransform: "capitalize",
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              minWidth: 100,
              textTransform: "capitalize",
            }}
            disabled={!uploadFile || uploading}
            onClick={async () => {
              if (!uploadFile) return;
              setUploading(true);
              try {
                const formData = new FormData();
                formData.append("file", uploadFile);

                const uploadRes = await axios.post(
                  `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/upload/file/`,
                  formData,
                  { headers: { "Content-Type": "multipart/form-data" } }
                );

                const fileName = uploadRes?.data?.file_name;
                if (fileName) {
                  const vectorFormData = new FormData();
                  vectorFormData.append("file_name", fileName);

                  await axios.post(
                    `${process.env.NEXT_PUBLIC_V2_SERVER_URL}/create-vector-db/v1/`,
                    vectorFormData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                  );
                }

                setOpenUploadDialog(false);
                setUploadFile(null);

                setSnackbar({
                  open: true,
                  message: "File uploaded successfully!",
                  severity: "success",
                });
              } catch (err) {
                setSnackbar({
                  open: true,
                  message: "Upload failed!",
                  severity: "error",
                });
              } finally {
                setUploading(false);
              }
            }}
          >
            {uploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Upload"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LectureEditor;
