const videoElement = document.querySelector("#webcam");
const startButton = document.querySelector("#start-record");
const startCameraBtn = document.querySelector("#start-camera");
const stopButton = document.querySelector("#stop-record");
const downloadLink = document.querySelector("#download-link");
const videoSelect = document.querySelector("#video-devices");
const audioSelect = document.querySelector("#audio-devices");
const redDot = document.querySelector(".red-dot");

let mediaRecorder;
let recordedChunks = [];
let currentStream = null;

// Get media devices and populate selects
async function populateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Clear and populate video devices
    videoSelect.innerHTML = devices
      .filter((device) => device.kind === "videoinput")
      .map(
        (device) =>
          `<option value="${device.deviceId}">${
            device.label || `Video Device ${videoSelect.options.length + 1}`
          }</option>`
      )
      .join("");

    // Clear and populate audio devices
    audioSelect.innerHTML = devices
      .filter((device) => device.kind === "audioinput")
      .map(
        (device) =>
          `<option value="${device.deviceId}">${
            device.label || `Audio Device ${audioSelect.options.length + 1}`
          }</option>`
      )
      .join("");
  } catch (error) {
    console.error("Error accessing devices:", error);
  }
}

async function getMedia(constraints) {
  try {
    if (currentStream) {
      stopTracks(currentStream);
    }
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = currentStream;
    startButton.disabled = false;
    startCameraBtn.disabled = true;
  } catch (error) {
    console.error("Error accessing media:", error);
  }
}

function stopTracks(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

// Device selection handlers
videoSelect.addEventListener("change", async () => {
  await getMedia({
    video: { deviceId: videoSelect.value },
    audio: { deviceId: audioSelect.value },
  });
});

audioSelect.addEventListener("change", async () => {
  await getMedia({
    video: { deviceId: videoSelect.value },
    audio: { deviceId: audioSelect.value },
  });
});

// Initial device setup
startCameraBtn.addEventListener("click", async () => {
  await getMedia({
    video: { deviceId: videoSelect.value },
    audio: { deviceId: audioSelect.value },
  });
  populateDevices();
});

// Recording controls
startButton.addEventListener("click", () => {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(currentStream, {
    mimeType: "video/webm; codecs=vp9",
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  mediaRecorder.start();
  redDot.classList.add("show");
  videoElement.classList.add("red-border");
  startButton.disabled = true;
  stopButton.disabled = false;
});

stopButton.addEventListener("click", () => {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    redDot.classList.remove("show");
    videoElement.classList.remove("red-border");
    stopButton.disabled = true;
    startButton.disabled = false;
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `recording-${Date.now()}.webm`;
    downloadLink.style.display = "block";

    // Cleanup
    recordedChunks = [];
  };
});

// Cleanup when window closes
window.addEventListener("beforeunload", () => {
  if (currentStream) {
    stopTracks(currentStream);
  }
});
