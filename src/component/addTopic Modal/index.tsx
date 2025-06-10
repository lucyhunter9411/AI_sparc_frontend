import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

interface AddTopicModalProps {
  isAddTopic: boolean;
  handleAddTopicCancel: () => void;
  curField: string;
  handleCurFieldChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addContentTitle: string;
  handleContentTitleChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  addQATime: string;
  handleQATimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddTopicSubmit: () => void;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isAddTopic,
  handleAddTopicCancel,
  curField,
  handleCurFieldChange,
  addContentTitle,
  handleContentTitleChange,
  addQATime,
  handleQATimeChange,
  handleAddTopicSubmit,
}) => {
  return (
    <Modal
      open={isAddTopic}
      onClose={handleAddTopicCancel}
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
          maxWidth: "95%",
        }}
      >
        <Typography id="modal-title" variant="h6" component="h2">
          Add New Topic
        </Typography>
        <Divider sx={{ marginBottom: 2, marginTop: 2 }} />
        <Typography id="modal-description" sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <RadioGroup
              aria-labelledby="topic-type-radio-group"
              name="topic-type-radio-group"
              value={curField}
              onChange={handleCurFieldChange}
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
                sx={{ mt: 1 }}
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
                disabled={curField !== "content"}
                sx={{ ml: 6, width: "90%", mt: 1 }}
                value={addContentTitle}
                onChange={handleContentTitleChange}
              />

              <FormControlLabel
                sx={{ mt: 1 }}
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
              <TextField
                label="Q&A Time"
                variant="standard"
                size="small"
                value={addQATime}
                fullWidth
                sx={{ mt: 1 }}
                onChange={handleQATimeChange}
                disabled={curField !== "q_a"}
              />
            </RadioGroup>
          </FormControl>
        </Typography>
        <Divider sx={{ marginBottom: 2, marginTop: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            onClick={handleAddTopicCancel}
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleAddTopicSubmit}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={
              (curField === "content" && !addContentTitle.trim()) ||
              (curField === "q_a" && !addQATime.trim())
            }
          >
            ADD
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddTopicModal;
