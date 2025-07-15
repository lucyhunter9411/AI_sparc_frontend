import WbSunnyIcon from "@mui/icons-material/WbSunny";
import Brightness5Icon from "@mui/icons-material/Brightness5";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import BedtimeIcon from "@mui/icons-material/Bedtime";

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good morning",
      message: "Good morning! How can I help you today?",
      icon: <WbSunnyIcon sx={{ color: "#FFD600", ml: 1, fontSize: 32 }} />,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon",
      message: "Good afternoon! What can I do for you?",
      icon: <Brightness7Icon sx={{ color: "#FFA726", ml: 1, fontSize: 32 }} />,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good evening",
      message: "Good evening! How’s it going?",
      icon: <NightsStayIcon sx={{ color: "#5C6BC0", ml: 1, fontSize: 32 }} />,
    };
  }
  return {
    greeting: "Hello",
    message: "Hello! Burning the midnight oil?",
    icon: <BedtimeIcon sx={{ color: "#283593", ml: 1, fontSize: 32 }} />,
  };
};
