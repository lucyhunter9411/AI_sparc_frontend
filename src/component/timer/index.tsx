import React, { useEffect, useRef } from "react";
import { Box, keyframes } from "@mui/material";
import { orange } from "@mui/material/colors";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
`;

const blink = keyframes`
  0% { opacity: 1; text-shadow: 0 0 8px ${orange[500]}; }
  50% { opacity: 0.7; text-shadow: 0 0 4px ${orange[500]}; }
  100% { opacity: 1; text-shadow: 0 0 8px ${orange[500]}; }
`;

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isStart?: boolean;
}

const TimerDisplay = React.memo(
  ({ minutes, seconds, isStart }: TimerDisplayProps) => {
    const formatTime = (min: number, sec: number): string => {
      const formattedMinutes = min < 10 ? `0${min}` : min.toString();
      const formattedSeconds = sec < 10 ? `0${sec}` : sec.toString();
      return `${formattedMinutes}:${formattedSeconds}`;
    };

    const [minutesPart, secondsPart] = formatTime(minutes, seconds).split(":");

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          fontFamily: "'Roboto Mono', monospace",
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: orange[800],
          textAlign: "center",
          animation: `${pulse} 2s infinite ease-in-out`,
        }}
      >
        <Box
          component="span"
          sx={{
            animation: `${blink} 1s infinite`,
            px: 0.5,
          }}
        >
          :
        </Box>
        <Box
          component="span"
          sx={{
            display: "inline-block",
            minWidth: "1.2em",
            textAlign: "center",
          }}
        >
          {secondsPart}
        </Box>
      </Box>
    );
  }
);

export default TimerDisplay;
