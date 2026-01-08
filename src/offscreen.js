const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let stream = null;

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 } 
    });
    video.srcObject = stream;
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('Camera started in offscreen document');
    });
  } catch (error) {
    console.error('Camera error in offscreen:', error);
  }
}

// Capture frame
function captureFrame() {
  if (video.videoWidth === 0) return null;
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureFrame') {
    const imageData = captureFrame();
    sendResponse({ imageData });
  }
  return true;
});

// Start camera on load
startCamera();
