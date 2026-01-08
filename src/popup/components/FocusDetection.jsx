import React, { useState, useEffect, useRef } from 'react';

const FocusDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState('stopped');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Check status on load
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      if (response && response.isDetecting) {
        setIsDetecting(true);
        setStatus('focused');
        startLocalVideo();
      }
    });

    // Listen for detection results
    const messageListener = (request) => {
      if (request.action === 'detectionResult') {
        const count = request.predictions.length;
        setStatus('distracted');
        
        // Draw bounding boxes
        drawBoundingBoxes(request.predictions);
        
        // Reset status after delay
        setTimeout(() => {
          if (isDetecting) {
            setStatus('focused');
          }
        }, 1500);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [isDetecting]);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to actually start playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              // Small delay to ensure first frame is ready
              setTimeout(() => {
                updateCanvas();
              }, 100);
            }
          });
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const updateCanvas = () => {
    if (!isDetecting || !streamRef.current) return;
    if (videoRef.current && videoRef.current.videoWidth > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    requestAnimationFrame(updateCanvas);
  };

  const drawBoundingBoxes = (predictions) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.videoWidth === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    predictions.forEach(prediction => {
      const { x, y, width, height, confidence, class: className } = prediction;
      
      const boxX = x - width / 2;
      const boxY = y - height / 2;
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, width, height);
      
      const label = `${className} ${(confidence * 100).toFixed(1)}%`;
      ctx.font = '16px Arial';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(boxX, boxY - 25, textWidth + 10, 25);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, boxX + 5, boxY - 7);
    });
    
    // Resume normal canvas updates after 1.5 seconds
    setTimeout(() => {
      if (isDetecting) {
        updateCanvas();
      }
    }, 1500);
  };

  const handleToggle = async () => {
    console.log('Button clicked, isDetecting:', isDetecting);
    
    if (!isDetecting) {
      // Start detection
      console.log('Sending startDetection message...');
      chrome.runtime.sendMessage({ action: 'startDetection' }, async (response) => {
        console.log('Received response:', response);
        if (response && response.success) {
          setIsDetecting(true);
          setStatus('focused');
          
          await startLocalVideo();
          
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      });
    } else {
      // Stop detection
      console.log('Sending stopDetection message...');
      chrome.runtime.sendMessage({ action: 'stopDetection' }, (response) => {
        console.log('Received response:', response);
        if (response && response.success) {
          setIsDetecting(false);
          setStatus('stopped');
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      });
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'focused':
        return { text: '✓ Focused', className: 'bg-green-600' };
      case 'distracted':
        return { text: '⚠️ Distracted', className: 'bg-red-600' };
      default:
        return { text: 'Stopped', className: 'bg-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
      <div className="text-xs text-gray-400 mb-2">
        Detects mobile phone usage via webcam every 2 seconds
      </div>

      {/* Video Preview */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
        />
        {!isDetecting && (
          <div className="aspect-video flex items-center justify-center text-gray-500 text-sm">
            Camera preview will appear here
          </div>
        )}
      </div>

      {/* Status */}
      <div className={`${statusDisplay.className} text-white text-center py-2 px-3 rounded-lg text-sm font-semibold`}>
        {statusDisplay.text}
      </div>

      {/* Control Button */}
      <button
        onClick={handleToggle}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          isDetecting
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isDetecting ? 'Stop Detection' : 'Start Detection'}
      </button>

      {/* Info */}
      {isDetecting && (
        <div className="text-xs text-gray-400 text-center">
          🔍 Detection running in background. You can close this popup.
        </div>
      )}
    </div>
  );
};

export default FocusDetection;
