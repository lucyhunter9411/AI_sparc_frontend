import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Divider,
  styled,
  IconButton,
  TextField,
  Button,
  Box,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/Add";
// import EditIcon from "@mui/icons-material/Edit";
import UpdateIcon from "@mui/icons-material/Update";
import ListIcon from "@mui/icons-material/List";

import { keyframes } from "@emotion/react";

// Define types for our data
type Device = {
  device_id: string;
  room_name: string;
  url?: string;
};

type DevicesData = {
  devices: Device[];
};

interface DevicesCardUIProps {
  connectrobot: string;
}

// Animation for connect button
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[8],
  },
}));

const StyledDeviceId = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  color: theme.palette.text.secondary,
  fontSize: 14,
  wordBreak: "break-all",
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

const ConnectButton = styled(Button)(({ theme }) => ({
  //   animation: `${pulse} 2s infinite`,.
  marginTop: theme.spacing(2),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: "white",
  "&:hover": {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
  },
}));

const SmallButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(0.5),
  minWidth: "unset",
  marginLeft: theme.spacing(1),
}));

const DevicesCardUI: React.FC<DevicesCardUIProps> = ({ connectrobot }) => {
  const [devicesData, setDevicesData] = useState<DevicesData>({
    devices: [
      {
        device_id: "e0645015f2d6fca5",
        room_name: "BlueStacks Sim",
        url: "",
      },
      {
        device_id: "a2a65f074d8eb936",
        room_name: "My_Test",
        url: "",
      },
    ],
  });

  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [newRobot, setNewRobot] = useState("");
  const [newTV, setNewTV] = useState("");

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = (deviceId: string, currentName: string) => {
    setEditingDevice(deviceId);
    setNewRoomName(currentName);
  };

  const handleSaveEdit = (deviceId: string) => {
    setDevicesData((prev) => ({
      devices: prev.devices.map((device) =>
        device.device_id === deviceId
          ? { ...device, room_name: newRoomName }
          : device
      ),
    }));
    setEditingDevice(null);
  };

  const handleDelete = (deviceId: string) => {
    setDevicesData((prev) => ({
      devices: prev.devices.filter((device) => device.device_id !== deviceId),
    }));
  };

  const handleUrlChange = (deviceId: string, value: string) => {
    setUrlInputs((prev) => ({ ...prev, [deviceId]: value }));
  };

  const handleSetUrl = (deviceId: string) => {
    const url = urlInputs[deviceId] || "";
    setDevicesData((prev) => ({
      devices: prev.devices.map((device) =>
        device.device_id === deviceId ? { ...device, url } : device
      ),
    }));
  };

  const handleConnect = (deviceId: string) => {
    console.log(`Connecting to device ${deviceId}`);
  };

  return (
    <StyledContainer maxWidth="lg">
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, flexGrow: 1 }}
        >
          Devices
        </Typography>
        <IconButton
          aria-label="device actions"
          aria-controls={open ? "device-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleMenuClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="device-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem
            onClick={() => {
              setShowAddForm(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            Add
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <UpdateIcon fontSize="small" />
            </ListItemIcon>
            Update
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <ListIcon fontSize="small" />
            </ListItemIcon>
            List
          </MenuItem>
        </Menu>
      </Box>
      <Divider sx={{ my: 3 }} />

      {showAddForm ? (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Add Device
          </Typography>
          <TextField
            label="Room"
            fullWidth
            margin="normal"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
          />
          <TextField
            label="Robot (selection)"
            fullWidth
            margin="normal"
            value={newRobot}
            onChange={(e) => setNewRobot(e.target.value)}
            placeholder="Enter robot ID"
          />
          <TextField
            label="TV selection"
            fullWidth
            margin="normal"
            value={newTV}
            onChange={(e) => setNewTV(e.target.value)}
            placeholder="Enter TV selection"
          />
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button onClick={() => setShowAddForm(false)} variant="outlined">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // Add your logic to save the new device here
                // Example: Add to devicesData and reset form
                setDevicesData((prev) => ({
                  devices: [
                    ...prev.devices,
                    {
                      device_id: Math.random().toString(16).slice(2, 10),
                      room_name: newRoom,
                      url: "",
                    },
                  ],
                }));
                setNewRoom("");
                setNewRobot("");
                setNewTV("");
                setShowAddForm(false);
              }}
              disabled={!newRoom}
            >
              Add
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {devicesData.devices.map((device) => (
            <Grid item key={device.device_id} xs={12} sm={6} md={4}>
              <StyledCard elevation={3}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    {editingDevice === device.device_id ? (
                      <TextField
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        size="small"
                        autoFocus
                      />
                    ) : (
                      <Typography gutterBottom variant="h5" component="h2">
                        {device.room_name}
                      </Typography>
                    )}
                    <Box>
                      {editingDevice === device.device_id ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton
                              onClick={() => handleSaveEdit(device.device_id)}
                              color="primary"
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton
                              onClick={() => setEditingDevice(null)}
                              color="error"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() =>
                                handleEditClick(
                                  device.device_id,
                                  device.room_name
                                )
                              }
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(device.device_id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  <StyledDeviceId variant="body2">
                    ID: {device.device_id}
                  </StyledDeviceId>
                  <StyledDeviceId variant="body2">
                    Robot ID: {connectrobot}
                  </StyledDeviceId>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LinkIcon color="action" sx={{ mr: 1 }} />
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter URL"
                        value={urlInputs[device.device_id] || device.url || ""}
                        onChange={(e) =>
                          handleUrlChange(device.device_id, e.target.value)
                        }
                        sx={{ flexGrow: 1 }}
                      />
                      <SmallButton
                        variant="contained"
                        color="primary"
                        onClick={() => handleSetUrl(device.device_id)}
                      >
                        Set
                      </SmallButton>
                    </Box>

                    {device.url && (
                      <Collapse in={!!device.url}>
                        <Typography variant="caption" color="text.secondary">
                          Current URL: {device.url}
                        </Typography>
                      </Collapse>
                    )}
                  </Box>

                  <ConnectButton
                    fullWidth
                    variant="contained"
                    onClick={() => handleConnect(device.device_id)}
                    startIcon={<CheckIcon />}
                  >
                    Connect
                  </ConnectButton>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}
    </StyledContainer>
  );
};

export default DevicesCardUI;
