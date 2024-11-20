import React, { useState } from "react";
import { AudioRecorder, useAudioRecorder } from "react-audio-voice-recorder";
import axios from "axios";
import "./App.css";

const App = () => {
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTranscribed, setHasTranscribed] = useState(false);

  const recorderControls = useAudioRecorder();

  // Handle when recording is complete
  const handleRecordingComplete = (audioBlob) => {
    if (hasTranscribed) return;

    setHasTranscribed(true);
    sendAudioToAPI(audioBlob); // Directly use audioBlob in the API call
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

  const getTruncatedTranscription = (text, wordLimit) => {
    const words = text.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="app">
      <div className="header">
        <h1>Speech to Text</h1>
      </div>

      <div className="recorder-container">
        <AudioRecorder
          recorderControls={recorderControls}
          onRecordingComplete={handleRecordingComplete}
          showVisualizer={true}
          downloadOnSavePress={false}
          downloadFileExtension="mp3"
          strokeColor="#000000"
          backgroundColor="#FF5733"
          style={{ display: "none" }}
        />
      </div>

      <div className="buttons">
        <button
          className="btn start"
          onClick={() => {
            recorderControls.startRecording();
            setRecording(true);
            setHasTranscribed(false);
          }}
          disabled={recording || isProcessing}
        >
          Start Recording
        </button>
        <button
          className="btn stop"
          onClick={() => {
            recorderControls.stopRecording();
            setRecording(false);
          }}
          disabled={!recording || isProcessing}
        >
          Stop Recording
        </button>
      </div>

      <div className="transcription-container">
        <div style={{ marginTop: "20px" }}>
          {isProcessing ? (
            <p>Audio is processing...</p>
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
