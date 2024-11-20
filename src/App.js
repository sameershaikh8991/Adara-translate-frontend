import React, { useState } from "react";
import { AudioRecorder, useAudioRecorder } from "react-audio-voice-recorder"; // Import AudioRecorder
import axios from "axios";
import "./App.css";

const App = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTranscribed, setHasTranscribed] = useState(false); // Flag to track if transcription is done

  const recorderControls = useAudioRecorder();

  // Handle when recording is complete
  const handleRecordingComplete = (audioBlob) => {
    // Check if transcription has already been completed to avoid duplicate calls
    if (hasTranscribed) return;

    setAudioBlob(audioBlob);
    setHasTranscribed(true); // Set the flag to avoid further transcription requests
    sendAudioToAPI(audioBlob);
  };

  // Send audio to backend for transcription
  const sendAudioToAPI = (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    setIsProcessing(true);

    axios
      .post("http://127.0.0.1:8000/api/v1/speech/process/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setIsProcessing(false);
        setTranscription(response.data.transcription);
      })
      .catch((error) => {
        console.error("Error uploading audio:", error);
        setIsProcessing(false);
      });
  };

  // Get truncated version of transcription
  const getTruncatedTranscription = (text, wordLimit) => {
    const words = text.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;
  };

  // Open/close modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="app">
      <div className="header">
        <h1>Speech to Text</h1>
      </div>

      {/* Audio Recorder UI */}
      <div className="recorder-container">
        <AudioRecorder
          recorderControls={recorderControls}
          onRecordingComplete={handleRecordingComplete}
          showVisualizer={true}
          downloadOnSavePress={false}
          downloadFileExtension="mp3"
          strokeColor="#000000"
          backgroundColor="#FF5733"
          style={{ display: "none" }} // Hide the default UI
        />
      </div>

      {/* Recording Control Buttons */}
      <div className="buttons">
        <button
          className="btn start"
          onClick={() => {
            recorderControls.startRecording();
            setRecording(true);
            setHasTranscribed(false); // Reset transcription flag when starting new recording
          }}
          disabled={recording || isProcessing} // Disable if recording or processing
        >
          Start Recording
        </button>
        <button
          className="btn stop"
          onClick={() => {
            recorderControls.stopRecording();
            setRecording(false);
          }}
          disabled={!recording || isProcessing} // Disable if not recording or processing
        >
          Stop Recording
        </button>
      </div>

      {/* Transcription Display */}
      <div className="transcription-container">
        <div style={{ marginTop: "20px" }}>
          {isProcessing ? (
            <p>Audio is processing...</p> // Display when audio is being processed
          ) : (
            <>
              <p className="transcription">
                {getTruncatedTranscription(transcription, 100)}
              </p>
              {transcription.split(" ").length > 100 && (
                <button className="btn toggle" onClick={openModal}>
                  Show More
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal for Full Transcription */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-button" onClick={closeModal}>
              ✖
            </button>
            <h2>Full Transcription</h2>
            <p>{transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
