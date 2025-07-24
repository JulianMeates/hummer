    let currentStream = null;
    let currentFacingMode = 'user'; // 'user' for front, 'environment' for back
    let flashSupported = false;
    let flashEnabled = false;

    // DOM elements
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    const cameraSwitchBtn = document.getElementById('cameraSwitchBtn');
    const flashToggle = document.getElementById('flashToggle');
    const photoReview = document.getElementById('photoReview');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const retakeBtn = document.getElementById('retakeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadingState = document.getElementById('loadingState');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const closeBtn = document.getElementById('closeBtn');

    // Initialize camera when page loads
    document.addEventListener('DOMContentLoaded', initCamera);

    async function initCamera() {
        try {
            showLoading(true);
            hideError();
            
            // Stop any existing stream
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = currentStream;
            
            // Update video mirroring based on camera
            video.className = currentFacingMode === 'user' ? '' : 'back-camera';
            
            // Check for flash support
            const track = currentStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            flashSupported = 'torch' in capabilities;
            flashToggle.style.display = flashSupported ? 'flex' : 'none';
            
            showLoading(false);
        } catch (error) {
            console.error('Error accessing camera:', error);
            showError('Unable to access camera. Please check permissions and try again.');
            showLoading(false);
        }
    }

    async function switchCamera() {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        await initCamera();
    }

    async function toggleFlash() {
        if (!flashSupported || !currentStream) return;
        
        try {
            const track = currentStream.getVideoTracks()[0];
            await track.applyConstraints({
                advanced: [{ torch: !flashEnabled }]
            });
            flashEnabled = !flashEnabled;
            flashToggle.classList.toggle('active', flashEnabled);
        } catch (error) {
            console.error('Error toggling flash:', error);
        }
    }

    function capturePhoto() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Handle mirroring for front camera
        if (currentFacingMode === 'user') {
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
        }
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and show preview
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            capturedPhoto.src = url;
            photoReview.classList.add('active');
            
            // Store the blob for saving
            capturedPhoto.photoBlob = blob;
        }, 'image/jpeg', 0.9);
    }

    function retakePhoto() {
        photoReview.classList.remove('active');
        // Clean up the blob URL
        if (capturedPhoto.src.startsWith('blob:')) {
            URL.revokeObjectURL(capturedPhoto.src);
        }
    }

    async function savePhoto() {
        if (!capturedPhoto.photoBlob) return;
        
        try {
            // Here you would implement your photo storage logic
            // For demo purposes, we'll just create a download
            const url = URL.createObjectURL(capturedPhoto.photoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo-${Date.now()}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            
            // In your actual app, you'd call something like:
            // await storePhotoForUpload(capturedPhoto.photoBlob);
            
            retakePhoto(); // Close review mode
            
            console.log('Photo saved! In your app, this would trigger the upload queue.');
        } catch (error) {
            console.error('Error saving photo:', error);
            showError('Failed to save photo. Please try again.');
        }
    }

    function showLoading(show) {
        loadingState.style.display = show ? 'block' : 'none';
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
    }

    function hideError() {
        errorMessage.classList.remove('show');
    }

    function closeCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        // In a real app, this would navigate back or close the camera view
        console.log('Camera closed');
    }

    // Event listeners
    captureBtn.addEventListener('click', capturePhoto);
    cameraSwitchBtn.addEventListener('click', switchCamera);
    flashToggle.addEventListener('click', toggleFlash);
    retakeBtn.addEventListener('click', retakePhoto);
    saveBtn.addEventListener('click', savePhoto);
    closeBtn.addEventListener('click', closeCamera);

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(initCamera, 500);
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
    });