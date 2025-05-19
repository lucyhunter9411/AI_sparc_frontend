import React, { useEffect } from "react";

const TextToSpeech = ({ text }) => {
  useEffect(() => {
    const synth = window.speechSynthesis;

    return () => {
      synth.onvoiceschanged = null; // Clean up event listener
    };
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Event listener for when speech ends
    utterance.onend = () => {
      console.log("Speech has finished being spoken.");
    };

    synth.speak(utterance);

    return () => {
      synth.cancel(); // Clean up on unmount
    };
  }, [text]);

  return null; // This component does not render anything visible
};

export default TextToSpeech;
