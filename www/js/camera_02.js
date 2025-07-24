let currentStream = null;
let currentFacingMode = 'user';
let flashSupported = false;
let flashEnabled = false;
let wifiUploadEnabled = true;
let qualitySelectorVisible = false;
let db = null;
// Network connection monitoring
let connectionInfo = {
    type: 'unknown',
    effectiveType: 'unknown',
    isWifi: false,
    isOnline: navigator.onLine
};

// Image quality settings
let imageQualitySettings = {
    quality: 'high', // 'full', 'high', 'medium', 'low'
    mimeType: 'image/jpeg',
    maxWidth: null,
    maxHeight: null,
    compressionQuality: 0.9
};

// Quality presets
const qualityPresets = {
    full: {
        maxWidth: null,
        maxHeight: null,
        compressionQuality: 1.0,
        mimeType: 'image/jpeg',
        description: 'Original size, no compression'
    },
    high: {
        maxWidth: 1920,
        maxHeight: 1080,
        compressionQuality: 0.9,
        mimeType: 'image/jpeg',
        description: 'High quality, slight compression'
    },
    medium: {
        maxWidth: 1280,
        maxHeight: 720,
        compressionQuality: 0.8,
        mimeType: 'image/jpeg',
        description: 'Medium quality, good for sharing'
    },
    low: {
        maxWidth: 640,
        maxHeight: 480,
        compressionQuality: 0.6,
        mimeType: 'image/jpeg',
        description: 'Small size, fast upload'
    }
};

// Create quality selector UI
function createQualitySelector() {
    const selector = document.createElement('div');
    selector.id = 'quality-selector';
    selector.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px;
        border-radius: 12px;
        z-index: 100;
        min-width: 200px;
        backdrop-filter: blur(10px);
    `;
    
    selector.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span>
            Image Quality
        </div>
        <div id="quality-options"></div>
        <div id="quality-info" style="font-size: 12px; color: #ccc; margin-top: 8px;"></div>
    `;
    
    document.body.appendChild(selector);
    
    // Create quality options
    const optionsContainer = document.getElementById('quality-options');
    Object.keys(qualityPresets).forEach(preset => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
            border: 1px solid transparent;
        `;
        
        const isSelected = imageQualitySettings.quality === preset;
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
        
        option.innerHTML = `
            <div style="font-weight: 500; text-transform: capitalize;">${preset}</div>
            <div style="font-size: 11px; color: #bbb;">${qualityPresets[preset].description}</div>
        `;
        
        option.addEventListener('click', () => selectQuality(preset));
        optionsContainer.appendChild(option);
    });
    
    updateQualityInfo();
}

// Select quality preset
function selectQuality(preset) {
    if (!qualityPresets[preset]) return;
    
    imageQualitySettings = {
        ...imageQualitySettings,
        quality: preset,
        ...qualityPresets[preset]
    };
    
    // Save preference
    localStorage.setItem('imageQuality', preset);
    
    // Update UI
    updateQualitySelector();
    updateQualityInfo();
}

// Update quality selector UI
function updateQualitySelector() {
    const options = document.querySelectorAll('#quality-options > div');
    options.forEach((option, index) => {
        const preset = Object.keys(qualityPresets)[index];
        const isSelected = imageQualitySettings.quality === preset;
        
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
    });
}

// Update quality info display
function updateQualityInfo() {
    const info = document.getElementById('quality-info');
    if (!info) return;
    
    const settings = imageQualitySettings;
    const sizeText = settings.maxWidth ? 
        `Max: ${settings.maxWidth}×${settings.maxHeight}` : 
        'Original size';
    const qualityText = `Quality: ${Math.round(settings.compressionQuality * 100)}%`;
    
    info.textContent = `${sizeText} • ${qualityText}`;
}

// Load quality preference
function loadQualityPreference() {
    const saved = localStorage.getItem('imageQuality');
    if (saved && qualityPresets[saved]) {
        selectQuality(saved);
    }
}

// Enhanced image compression function
async function compressImage(canvas, settings = imageQualitySettings) {
    return new Promise((resolve) => {
        // Calculate target dimensions
        let { width, height } = canvas;
        const { maxWidth, maxHeight } = settings;
        
        if (maxWidth && maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            if (ratio < 1) {
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
        }
        
        // Create target canvas if resizing is needed
        let targetCanvas = canvas;
        if (width !== canvas.width || height !== canvas.height) {
            targetCanvas = document.createElement('canvas');
            targetCanvas.width = width;
            targetCanvas.height = height;
            
            const ctx = targetCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw resized image
            ctx.drawImage(canvas, 0, 0, width, height);
        }
        
        // Convert to blob with compression
        targetCanvas.toBlob(
            (blob) => {
                const compressedFile = new File(
                    [blob],
                    `photo-${Date.now()}.jpg`,
                    {
                        type: settings.mimeType,
                        lastModified: new Date().getTime()
                    }
                );
                
                resolve({
                    file: compressedFile,
                    blob: blob,
                    originalSize: canvas.width * canvas.height,
                    compressedSize: width * height,
                    compressionRatio: (width * height) / (canvas.width * canvas.height)
                });
            },
            settings.mimeType,
            settings.compressionQuality
        );
    });
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

// Show photo review with compression details
function showPhotoReview(compressionResult) {
    const photoReview = document.getElementById('photoReview');
    photoReview.classList.add('active');
    
    // Add compression info to the review
    let infoDisplay = document.getElementById('compression-info');
    if (!infoDisplay) {
        infoDisplay = document.createElement('div');
        infoDisplay.id = 'compression-info';
        infoDisplay.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            backdrop-filter: blur(5px);
        `;
        photoReview.appendChild(infoDisplay);
    }
    
    const { file, compressionRatio } = compressionResult;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const compressionPercent = Math.round((1 - compressionRatio) * 100);
    
    infoDisplay.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">📊 Image Info</div>
        <div>Quality: ${imageQualitySettings.quality.toUpperCase()}</div>
        <div>Size: ${fileSizeMB}MB</div>
        ${compressionPercent > 0 ? `<div>Compressed: ${compressionPercent}%</div>` : ''}
    `;
}

// Show processing indicator
function showProcessingIndicator(show) {
    let indicator = document.getElementById('processing-indicator');
    
    if (show && !indicator) {
        indicator = document.createElement('div');
        indicator.id = 'processing-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            z-index: 200;
            text-align: center;
            backdrop-filter: blur(10px);
        `;
        indicator.innerHTML = `
            <div style="margin-bottom: 10px;">📸</div>
            <div>Processing image...</div>
            <div style="font-size: 12px; color: #ccc; margin-top: 8px;">
                Quality: ${imageQualitySettings.quality.toUpperCase()}
            </div>
        `;
        document.body.appendChild(indicator);
    } else if (!show && indicator) {
        indicator.remove();
    }
}



// Register photo with server to get upload details
async function registerPhotoWithServer(metadata) {
    var f = document.getElementById(glbBaseFormName);


    try {
        const response = await fetch('/api/photos/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: `photo-${Date.now()}-${metadata.quality}.jpg`,
                size: metadata.size,
                mimeType: metadata.mimeType,
                quality: metadata.quality,
                camera: metadata.camera,
                timestamp: metadata.timestamp,
                clientId: getClientId(), // Unique device/session ID
                metadata: metadata
            })
        });
        
        if (!response.ok) {
            throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
        }
        
        const serverDetails = await response.json();
        
        // Expected server response format (matching your Jade system):
        // {
        //   fileHandle: "unique-file-handle-from-jade",
        //   blockSize: 1048576, // Chunk size from server
        //   status: "Ready", // or other status
        //   error: null // Error message if any
        // }
        
        return serverDetails;
        
    } catch (error) {
        console.error('Server registration failed:', error);
        throw new Error(`Unable to register photo with server: ${error.message}`);
    }
}

// Store image with server details
async function storeImageLocallyWithServerDetails(imageBlob, metadata, serverDetails) {
    if (!db) await initDB();
    
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    
    const photoData = {
        id,
        imageBlob,
        metadata: {
            ...metadata,
            status: 'registered', // New status: registered but not uploaded
            registeredAt: new Date().toISOString(),
            uploadReady: true
        },
        serverDetails: {
            ...serverDetails,
            registeredAt: new Date().toISOString(),
            uploadAttempts: 0,
            lastAttemptAt: null
        }
    };
    
    await store.add(photoData);
    console.log('Photo stored with server details:', { id, uploadId: serverDetails.uploadId });
    return id;
}

// Fallback storage without server details (for retry later)
async function storeImageLocallyWithoutServer(imageBlob, metadata) {
    if (!db) await initDB();
    
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    
    const photoData = {
        id,
        imageBlob,
        metadata: {
            ...metadata,
            status: 'pending_registration', // Needs server registration
            registrationRetries: 0,
            maxRegistrationRetries: 5
        },
        serverDetails: null
    };
    
    await store.add(photoData);
    return id;
}

// Enhanced background sync to handle registration and upload
async function checkAndProcessPendingUploads() {
    if (!db) await initDB();
    
    try {
        const transaction = db.transaction(['pendingUploads'], 'readwrite');
        const store = transaction.objectStore('pendingUploads');
        const allPhotos = await store.getAll();
        
        const pendingRegistration = allPhotos.filter(photo => 
            photo.metadata?.status === 'pending_registration'
        );
        
        const registeredPhotos = allPhotos.filter(photo => 
            photo.metadata?.status === 'registered' &&
            photo.serverDetails &&
            (!photo.metadata.requiresWifi || connectionInfo.isWifi)
        );
        
        // First: Try to register photos that failed registration
        for (const photo of pendingRegistration) {
            if (photo.metadata.registrationRetries < photo.metadata.maxRegistrationRetries) {
                try {
                    console.log(`Retrying registration for photo ${photo.id}`);
                    const serverDetails = await registerPhotoWithServer(photo.metadata);
                    
                    // Update photo with server details
                    photo.metadata.status = 'registered';
                    photo.metadata.uploadReady = true;
                    photo.serverDetails = {
                        ...serverDetails,
                        registeredAt: new Date().toISOString(),
                        uploadAttempts: 0
                    };
                    
                    await store.put(photo);
                    console.log(`Photo ${photo.id} successfully registered`);
                    
                } catch (error) {
                    console.error(`Registration retry failed for photo ${photo.id}:`, error);
                    photo.metadata.registrationRetries++;
                    photo.metadata.lastRegistrationAttempt = new Date().toISOString();
                    await store.put(photo);
                }
            }
        }
        
        // Second: Upload registered photos
        if (registeredPhotos.length > 0) {
            console.log(`Found ${registeredPhotos.length} photos ready for upload`);
            await registerBackgroundSync();
            showNetworkNotification(`📤 ${registeredPhotos.length} photos ready to upload`);
        }
        
    } catch (error) {
        console.error('Error processing pending uploads:', error);
    }
}

// Enhanced upload function using your chunked upload system
async function uploadRegisteredPhoto(photoData) {
    if (!photoData.serverDetails) {
        throw new Error('No server details available for upload');
    }
    
    const { fileHandle, blockSize } = photoData.serverDetails;
    const { imageBlob, metadata } = photoData;
    
    // Convert blob to file-like object for your existing system
    const file = new File([imageBlob], `photo-${Date.now()}-${metadata.quality}.jpg`, { 
        type: metadata.mimeType,
        lastModified: Date.now()
    });
    
    try {
        const result = await uploadFileInChunks(file, fileHandle, blockSize);
        return result;
    } catch (error) {
        throw new Error(`Photo upload failed: ${error.message}`);
    }
}

// Adapted version of your chunked upload system for photos
async function uploadFileInChunks(file, fileHandle, blockSize) {
    const numberOfChunks = Math.ceil(file.size / blockSize);
    let chunkNumber = 0;
    let byteIndex = 0;
    
    for (let i = 0; i < numberOfChunks; i++) {
        chunkNumber = i + 1;
        const byteEnd = Math.min(byteIndex + blockSize, file.size);
        const chunk = file.slice(byteIndex, byteEnd);
        
        // Convert chunk to base64
        const chunkBase64 = await blobToBase64(chunk);
        
        // Send chunk
        const chunkResult = await sendPhotoChunk(fileHandle, chunkBase64, chunkNumber);
        
        // Update progress
        const percent = ((100 * chunkNumber) / numberOfChunks).toFixed();
        updateUploadProgress(file.name, percent);
        
        byteIndex = byteEnd;
        
        // Check if upload is complete
        if (chunkResult.status === "Complete" || chunkNumber >= numberOfChunks) {
            return { success: true, fileHandle: fileHandle };
        } else if (chunkResult.status === "Error") {
            throw new Error(chunkResult.error || 'Chunk upload failed');
        }
        // Continue for "Done" status
    }
    
    return { success: true, fileHandle: fileHandle };
}

// Send individual chunk using your existing system
async function sendPhotoChunk(fileHandle, chunkBase64, chunkNumber) {
    const lObj = {
        systemName: glbSystemName,
        formName: "FileChunkSave", 
        vin: Conversions.base32.encode(fileHandle),
        doc: chunkBase64,
        sid: Conversions.base32.encode(chunkNumber.toString())
    };
    
    const lJson = JSON.stringify(lObj);
    
    try {
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response; 
        }
        
        const result = JSON.parse(lResponse);
        return result;
        
    } catch (error) {
        throw new Error(`Chunk ${chunkNumber} upload failed: ${error.message}`);
    }
}

// Helper function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Update progress display for photo uploads
function updateUploadProgress(fileName, percent) {
    // Create or update progress indicator
    let progressDiv = document.getElementById('upload-progress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 100;
            backdrop-filter: blur(10px);
        `;
        document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
        <div style="margin-bottom: 8px; font-size: 14px;">Uploading ${fileName}</div>
        <div style="background: #333; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percent}%; background: #04AA6D; height: 6px; transition: width 0.3s ease;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; margin-top: 4px;">${percent}% Complete</div>
    `;
    
    // Remove progress indicator when complete
    if (percent >= 100) {
        setTimeout(() => {
            if (progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 2000);
    }
}

// Get file destination handle (Step 1)
async function getFileDestinationHandle(imageBlob, metadata) {
    const filename = `photo-${Date.now()}-${metadata.quality}.jpg`;
    
    const lObj = {
        systemName: glbSystemName,
        formName: "FileDestinationHandle",
        fileName: Conversions.base32.encode(filename),
        vin: Conversions.base32.encode(imageBlob.size.toString())
    };
    
    const lJson = JSON.stringify(lObj);
    
    try {
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response; 
        }
        
        const serverDetails = JSON.parse(lResponse);
        
        if (!serverDetails.fileHandle || !serverDetails.blockSize) {
            throw new Error('Invalid server response - missing fileHandle or blockSize');
        }
        
        return {
            fileHandle: serverDetails.fileHandle,
            blockSize: serverDetails.blockSize,
            filename: filename
        };
        
    } catch (error) {
        throw new Error(`Failed to get upload destination: ${error.message}`);
    }
}

// Upload photo directly in chunks (Step 2)
async function uploadPhotoDirectly(imageBlob, serverDetails, metadata) {
    const { fileHandle, blockSize, filename } = serverDetails;
    const numberOfChunks = Math.ceil(imageBlob.size / blockSize);
    let byteIndex = 0;
    
    // Create file object for chunk processing
    const file = new File([imageBlob], filename, { 
        type: metadata.mimeType,
        lastModified: Date.now()
    });
    
    for (let chunkNumber = 1; chunkNumber <= numberOfChunks; chunkNumber++) {
        const byteEnd = Math.min(byteIndex + blockSize, imageBlob.size);
        const chunk = file.slice(byteIndex, byteEnd);
        
        // Convert chunk to base64
        const chunkBase64 = await blobToBase64(chunk);
        
        // Update progress
        const percent = ((100 * chunkNumber) / numberOfChunks).toFixed();
        uploadNowBtn.textContent = `Uploading... ${percent}%`;
        updateUploadProgress(filename, percent);
        
        // Send chunk
        const chunkResult = await sendPhotoChunkDirect(fileHandle, chunkBase64, chunkNumber);
        
        byteIndex = byteEnd;
        
        // Check chunk result
        if (chunkResult.status === "Complete" || chunkNumber >= numberOfChunks) {
            // Upload complete
            return { fileHandle: fileHandle, filename: filename };
        } else if (chunkResult.status === "Error") {
            throw new Error(chunkResult.error || `Chunk ${chunkNumber} upload failed`);
        }
        // Continue for "Done" status
    }
    
    return { fileHandle: fileHandle, filename: filename };
}

// Send individual chunk for direct upload
async function sendPhotoChunkDirect(fileHandle, chunkBase64, chunkNumber) {
    const lObj = {
        systemName: glbSystemName,
        formName: "FileChunkSave",
        vin: Conversions.base32.encode(fileHandle),
        doc: chunkBase64,
        sid: Conversions.base32.encode(chunkNumber.toString())
    };
    
    const lJson = JSON.stringify(lObj);
    
    try {
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response; 
        }
        
        const result = JSON.parse(lResponse);
        return result;
        
    } catch (error) {
        throw new Error(`Chunk ${chunkNumber} upload failed: ${error.message}`);
    }
}

// Submit form to complete the photo upload (Step 3)
async function submitPhotoForm(fileHandle, metadata) {
    // This replaces your original submitForm(f) call
    // You may need to adapt this based on your form structure
    
    const formData = {
        systemName: glbSystemName,
        formName: "PhotoSubmit", // Or whatever your final form name is
        doc: fileHandle, // The file handle from the upload
        timestamp: metadata.timestamp,
        camera: metadata.camera,
        quality: metadata.quality,
        fileSize: metadata.fileSize,
        // Add any other form fields your system expects
    };
    
    const lJson = JSON.stringify(formData);
    
    try {
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response; 
        }
        
        const result = JSON.parse(lResponse);
        
        if (result.status === "Error") {
            throw new Error(result.error || 'Form submission failed');
        }
        
        return result;
        
    } catch (error) {
        throw new Error(`Form submission failed: ${error.message}`);
    }
}

// Helper function to hide photo review
function hidePhotoReview() {
    const photoReview = document.getElementById('photoReview');
    if (photoReview) {
        photoReview.style.display = 'none';
    }
    
    // Clear the captured photo data
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (capturedPhoto) {
        capturedPhoto.photoBlob = null;
        capturedPhoto.photoFile = null;
        capturedPhoto.compressionInfo = null;
    }
}

// Enhanced progress update for direct uploads
function updateUploadProgress(fileName, percent) {
    let progressDiv = document.getElementById('upload-progress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px;
            border-radius: 12px;
            z-index: 150;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px;">📤</span>
            <span style="font-size: 14px; font-weight: 500;">Uploading ${fileName}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
            <div style="width: ${percent}%; background: linear-gradient(90deg, #04AA6D, #00ff88); height: 8px; transition: width 0.3s ease;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #ccc;">${percent}% Complete</div>
    `;
    
    // Remove progress indicator when complete
    if (parseInt(percent) >= 100) {
        setTimeout(() => {
            if (progressDiv && progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 2000);
    }
}

// Load quality preference from storage
function loadQualityPreference() {
    const saved = localStorage.getItem('imageQuality');
    if (saved && qualityPresets[saved]) {
        selectQuality(saved);
    }
}

// Load WiFi preference from storage
function loadWifiPreference() {
    const saved = localStorage.getItem('wifiUploadEnabled');
    if (saved !== null) {
        wifiUploadEnabled = saved === 'true';
    }
}

// Get unique client ID for device/session identification
function getClientId() {
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
        clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('clientId', clientId);
    }
    return clientId;
}


function showSuccessMessage(message) {
    // Remove any existing success message
    const existingSuccess = document.getElementById('success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.id = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(52, 199, 89, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">✅</span>
            ${message}
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Animate in
    requestAnimationFrame(() => {
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 300);
    }, 4000);
}

// Enhanced background sync to handle registration and upload
async function checkAndProcessPendingUploads() {
    if (!db) await initDB();
    
    try {
        const transaction = db.transaction(['pendingUploads'], 'readwrite');
        const store = transaction.objectStore('pendingUploads');
        
        // Wrap getAll in a Promise
        const allPhotos = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        const pendingRegistration = allPhotos.filter(photo => 
            photo.metadata && photo.metadata.status === 'pending_registration'
        );
        
        const registeredPhotos = allPhotos.filter(photo => 
            photo.metadata && 
            photo.metadata.status === 'registered' &&
            photo.serverDetails &&
            (!photo.metadata.requiresWifi || connectionInfo.isWifi)
        );
        
        // First: Try to register photos that failed registration
        for (const photo of pendingRegistration) {
            if (photo.metadata.registrationRetries < photo.metadata.maxRegistrationRetries) {
                try {
                    console.log(`Retrying registration for photo ${photo.id}`);
                    const serverDetails = await registerPhotoWithServer(photo.metadata);
                    
                    // Update photo with server details
                    photo.metadata.status = 'registered';
                    photo.metadata.uploadReady = true;
                    photo.serverDetails = {
                        ...serverDetails,
                        registeredAt: new Date().toISOString(),
                        uploadAttempts: 0
                    };
                    
                    await new Promise((resolve, reject) => {
                        const putRequest = store.put(photo);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    });
                    
                    console.log(`Photo ${photo.id} successfully registered`);
                    
                } catch (error) {
                    console.error(`Registration retry failed for photo ${photo.id}:`, error);
                    photo.metadata.registrationRetries++;
                    photo.metadata.lastRegistrationAttempt = new Date().toISOString();
                    
                    await new Promise((resolve, reject) => {
                        const putRequest = store.put(photo);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    });
                }
            }
        }
        
        // Second: Upload registered photos
        if (registeredPhotos.length > 0) {
            console.log(`Found ${registeredPhotos.length} photos ready for upload`);
            await registerBackgroundSync();
            showNetworkNotification(`📤 ${registeredPhotos.length} photos ready to upload`);
        }
        
    } catch (error) {
        console.error('Error processing pending uploads:', error);
    }
}


// Get unique client ID for device/session identification
function getClientId() {
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
        clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('clientId', clientId);
    }
    return clientId;
}


// Enhanced initialization
async function initCamera() {
    // Load preferences
    loadWifiPreference();
    loadQualityPreference();
    
    // Initialize UI components
    initNetworkMonitoring();
    createWifiToggle();
    initQualityUI();
    
    // Initialize database
    initDB().catch(console.error);
    
    // **ADD THIS CAMERA INITIALIZATION CODE:**
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    const cameraSwitchBtn = document.getElementById('cameraSwitchBtn');
    const flashToggle = document.getElementById('flashToggle');
    const photoReview = document.getElementById('photoReview');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const retakeBtn = document.getElementById('retakeBtn');
    const uploadNowBtn = document.getElementById('uploadNowBtn');
    const uploadLaterBtn = document.getElementById('uploadLaterBtn');
    const loadingState = document.getElementById('loadingState');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const closeBtn = document.getElementById('closeBtn');

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
    
    // Check for pending uploads after camera is ready
    setTimeout(checkAndProcessPendingUploads, 1000);
}

// Clean up photo review
function retakePhoto() {
    const photoReview = document.getElementById('photoReview');
    photoReview.classList.remove('active');
    
    // Clean up compression info display
    const infoDisplay = document.getElementById('compression-info');
    if (infoDisplay) {
        infoDisplay.remove();
    }
    
    // Clean up the blob URL
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (capturedPhoto.src.startsWith('blob:')) {
        URL.revokeObjectURL(capturedPhoto.src);
    }
    
    // Clear stored data
    delete capturedPhoto.photoBlob;
    delete capturedPhoto.photoFile;
    delete capturedPhoto.compressionInfo;

     glbSubmitted = false;
    var f = document.getElementById(glbBaseFormName);
  //  f.doc.value = lFileHandle;
    submitForm(f);
}

// WiFi preference toggle
function createWifiToggle() {
    const toggle = document.createElement('div');
    toggle.id = 'wifi-toggle';
    toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        z-index: 100;
        user-select: none;
        transition: all 0.3s ease;
    `;
    
    function updateToggleText() {
        toggle.textContent = `📶 WiFi Only: ${wifiUploadEnabled ? 'ON' : 'OFF'}`;
        toggle.style.background = wifiUploadEnabled ? 'rgba(52, 199, 89, 0.9)' : 'rgba(142, 142, 147, 0.9)';
    }
    
    toggle.addEventListener('click', () => {
        wifiUploadEnabled = !wifiUploadEnabled;
        updateToggleText();
        
        // Save preference
        localStorage.setItem('wifiUploadEnabled', wifiUploadEnabled.toString());
        
        // Check if this change enables any pending uploads
        if (!wifiUploadEnabled && connectionInfo.isOnline) {
            checkAndProcessPendingUploads();
        }
    });
    
    updateToggleText();
    document.body.appendChild(toggle);
}

// Load WiFi preference from storage
function loadWifiPreference() {
    const saved = localStorage.getItem('wifiUploadEnabled');
    if (saved !== null) {
        wifiUploadEnabled = saved === 'true';
    }
}

// Show network-related notifications
function showNetworkNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 122, 255, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 20px;
        z-index: 110;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}
// WiFi preference toggle
function createWifiToggle() {
    const toggle = document.createElement('div');
    toggle.id = 'wifi-toggle';
    toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        z-index: 100;
        user-select: none;
        transition: all 0.3s ease;
    `;
    
    function updateToggleText() {
        toggle.textContent = `📶 WiFi Only: ${wifiUploadEnabled ? 'ON' : 'OFF'}`;
        toggle.style.background = wifiUploadEnabled ? 'rgba(52, 199, 89, 0.9)' : 'rgba(142, 142, 147, 0.9)';
    }
    
    toggle.addEventListener('click', () => {
        wifiUploadEnabled = !wifiUploadEnabled;
        updateToggleText();
        
        // Save preference
        localStorage.setItem('wifiUploadEnabled', wifiUploadEnabled.toString());
        
        // Check if this change enables any pending uploads
        if (!wifiUploadEnabled && connectionInfo.isOnline) {
            checkAndProcessPendingUploads();
        }
    });
    
    updateToggleText();
    document.body.appendChild(toggle);
}

// Load WiFi preference from storage
function loadWifiPreference() {
    const saved = localStorage.getItem('wifiUploadEnabled');
    if (saved !== null) {
        wifiUploadEnabled = saved === 'true';
    }
}

function loadQualityPreference() {
   const saved = localStorage.getItem('imageQuality');
   if (saved && qualityPresets[saved]) {
       selectQuality(saved);
   }
}

function updateConnectionInfo(connection) {
    if (!connection) return;
    
    connectionInfo.type = connection.type || 'unknown';
    connectionInfo.effectiveType = connection.effectiveType || 'unknown';
    
    // Determine if likely on WiFi
    connectionInfo.isWifi = connection.type === 'wifi' || 
                           connection.type === 'ethernet' ||
                           (connection.effectiveType === '4g' && connection.type === 'unknown');
    
    console.log('Connection updated:', connectionInfo);
}

function initNetworkMonitoring() {
    // Check connection type if available
    if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        updateConnectionInfo(connection);
        
        // Listen for connection changes
        connection.addEventListener('change', () => updateConnectionInfo(connection));
    }
    
    // Listen for online/offline events
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    // Initial check
    handleConnectionChange();
}

function handleConnectionChange() {
    connectionInfo.isOnline = navigator.onLine;
    
    console.log('Network status changed:', {
        online: connectionInfo.isOnline,
        wifi: connectionInfo.isWifi,
        type: connectionInfo.type
    });
    
    // Update UI indicators
    updateNetworkStatusUI();
    
    // Check if we should process pending uploads
    if (connectionInfo.isOnline && (connectionInfo.isWifi || !wifiUploadEnabled)) {
        checkAndProcessPendingUploads();
    }
}

function updateNetworkStatusUI() {
    // Create or update network status indicator
    let statusIndicator = document.getElementById('network-status');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'network-status';
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 100;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusIndicator);
    }
    
    if (!connectionInfo.isOnline) {
        statusIndicator.textContent = '📵 Offline';
        statusIndicator.style.background = 'rgba(255, 59, 48, 0.9)';
        statusIndicator.style.color = 'white';
    } else if (connectionInfo.isWifi) {
        statusIndicator.textContent = '📶 WiFi';
        statusIndicator.style.background = 'rgba(52, 199, 89, 0.9)';
        statusIndicator.style.color = 'white';
    } else {
        statusIndicator.textContent = '📱 Mobile Data';
        statusIndicator.style.background = 'rgba(255, 149, 0, 0.9)';
        statusIndicator.style.color = 'white';
    }
}

// WiFi preference toggle
function createWifiToggle() {
    const toggle = document.createElement('div');
    toggle.id = 'wifi-toggle';
    toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        z-index: 100;
        user-select: none;
        transition: all 0.3s ease;
    `;
    
    function updateToggleText() {
        toggle.textContent = `📶 WiFi Only: ${wifiUploadEnabled ? 'ON' : 'OFF'}`;
        toggle.style.background = wifiUploadEnabled ? 'rgba(52, 199, 89, 0.9)' : 'rgba(142, 142, 147, 0.9)';
    }
    
    toggle.addEventListener('click', () => {
        wifiUploadEnabled = !wifiUploadEnabled;
        updateToggleText();
        
        // Save preference
        localStorage.setItem('wifiUploadEnabled', wifiUploadEnabled.toString());
        
        // Check if this change enables any pending uploads
        if (!wifiUploadEnabled && connectionInfo.isOnline) {
            checkAndProcessPendingUploads();
        }
    });
    
    updateToggleText();
    document.body.appendChild(toggle);
}

// Create quality selector UI
function createQualitySelector() {
    const selector = document.createElement('div');
    selector.id = 'quality-selector';
    selector.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px;
        border-radius: 12px;
        z-index: 100;
        min-width: 200px;
        backdrop-filter: blur(10px);
    `;
    
    selector.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span>
            Image Quality
        </div>
        <div id="quality-options"></div>
        <div id="quality-info" style="font-size: 12px; color: #ccc; margin-top: 8px;"></div>
    `;
    
    document.body.appendChild(selector);
    
    // Create quality options
    const optionsContainer = document.getElementById('quality-options');
    Object.keys(qualityPresets).forEach(preset => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
            border: 1px solid transparent;
        `;
        
        const isSelected = imageQualitySettings.quality === preset;
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
        
        option.innerHTML = `
            <div style="font-weight: 500; text-transform: capitalize;">${preset}</div>
            <div style="font-size: 11px; color: #bbb;">${qualityPresets[preset].description}</div>
        `;
        
        option.addEventListener('click', () => selectQuality(preset));
        optionsContainer.appendChild(option);
    });
    
    updateQualityInfo();
}

// Show network-related notifications
function showNetworkNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 122, 255, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 20px;
        z-index: 110;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

 async function loadPhotos() {
            try {
                showLoading(true);
                clearError();
                
                if (!db) await initDB();
                
                const transaction = db.transaction(['pendingUploads'], 'readonly');
                const store = transaction.objectStore('pendingUploads');
                const request = store.getAll();
                
                request.onsuccess = () => {
                    photos = request.result;
                    displayPhotos();
                    updateStats();
                    showLoading(false);
                };
                
                request.onerror = () => {
                    showError('Failed to load photos from database');
                    showLoading(false);
                };
                
            } catch (error) {
                console.error('Error loading photos:', error);
                showError('Database connection failed: ' + error.message);
                showLoading(false);
            }
        }

        // Display photos in the grid
        function displayPhotos() {
            const container = document.getElementById('Footer'); // 'photos-container');
            
            if (photos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
                        </svg>
                        <h3>No photos in queue</h3>
                        <p>Photos will appear here when they're waiting to be uploaded</p>
                    </div>
                `;
                return;
            }

            const photosHtml = photos.map(photo => {
                const metadata = photo.metadata || {};
                const status = metadata.status || 'unknown';
                const timestamp = new Date(metadata.timestamp || photo.id).toLocaleString();
                const size = formatFileSize(metadata.size || 0);
                
                return `
                    <div class="photo-card ${status}">
                        <div class="photo-header">
                            <span class="status-badge status-${status}">${status}</span>
                            <small>${timestamp}</small>
                        </div>
                        <div class="photo-details">
                            <strong>ID:</strong> ${photo.id}<br>
                            <strong>Size:</strong> ${size}<br>
                            <strong>Camera:</strong> ${metadata.camera || 'unknown'}<br>
                            <strong>Upload Type:</strong> ${metadata.uploadType || 'unknown'}
                            ${metadata.metadataSyncPending ? '<br><strong>⚠️ Metadata sync pending</strong>' : ''}
                        </div>
                        <div class="photo-actions">
                            <button class="btn-small" onclick="deletePhoto('${photo.id}')">Delete</button>
                            ${status === 'pending' ? `<button class="btn-small" onclick="retryUpload('${photo.id}')">Retry</button>` : ''}
                            <button class="btn-small" onclick="viewPhotoDetails('${photo.id}')">Details</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `<div class="photos-grid">${photosHtml}</div>`;
        }

        // Update statistics
        function updateStats() {
            const pending = photos.filter(p => (p.metadata?.status || 'pending') === 'pending').length;
            const uploaded = photos.filter(p => (p.metadata?.status || 'pending') === 'uploaded').length;
            const failed = photos.filter(p => (p.metadata?.status || 'pending') === 'failed').length;
            const totalSize = photos.reduce((sum, p) => sum + (p.metadata?.size || 0), 0);
            //'stats'
            document.getElementById('Footer').innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${uploaded}</div>
                    <div class="stat-label">Uploaded</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${failed}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatFileSize(totalSize)}</div>
                    <div class="stat-label">Total Size</div>
                </div>
            `;
        }

        // Clean up uploaded photos
        async function cleanupUploaded() {
            if (!confirm('Delete all successfully uploaded photos?')) return;
            
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(['pendingUploads'], 'readwrite');
                const store = transaction.objectStore('pendingUploads');
                const index = store.index('status');
                const request = index.openCursor('uploaded');
                
                let deletedCount = 0;
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deletedCount++;
                        cursor.continue();
                    } else {
                        alert(`Deleted ${deletedCount} uploaded photos`);
                        loadPhotos();
                    }
                };
                
            } catch (error) {
                console.error('Error cleaning up:', error);
                showError('Failed to cleanup uploaded photos');
            }
        }

        // Delete specific photo
        async function deletePhoto(photoId) {
            if (!confirm('Delete this photo?')) return;
            
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(['pendingUploads'], 'readwrite');
                const store = transaction.objectStore('pendingUploads');
                await store.delete(photoId);
                
                loadPhotos();
            } catch (error) {
                console.error('Error deleting photo:', error);
                showError('Failed to delete photo');
            }
        }

        // Clear all photos
        async function clearAll() {
            if (!confirm('Delete ALL photos? This cannot be undone!')) return;
            
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(['pendingUploads'], 'readwrite');
                const store = transaction.objectStore('pendingUploads');
                await store.clear();
                
                loadPhotos();
            } catch (error) {
                console.error('Error clearing all:', error);
                showError('Failed to clear all photos');
            }
        }

        // View photo details
        function viewPhotoDetails(photoId) {
            const photo = photos.find(p => p.id === photoId);
            if (!photo) return;
            
            const details = JSON.stringify(photo, null, 2);
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <html>
                    <head><title>Photo Details - ${photoId}</title></head>
                    <body style="font-family: monospace; padding: 20px;">
                        <h2>Photo Details</h2>
                        <pre>${details}</pre>
                        <br>
                        <button onclick="window.close()">Close</button>
                    </body>
                </html>
            `);
        }

        // Export data as JSON
        function exportData() {
            const dataStr = JSON.stringify(photos, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-queue-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }

        // Retry failed uploads (placeholder - would need actual upload logic)
        function retryFailed() {
            alert('Retry functionality would trigger your background sync or upload process');
        }

        // Retry specific upload
        function retryUpload(photoId) {
            alert(`Would retry upload for photo ${photoId}`);
        }

        // Utility functions
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function showLoading(show) {
            const container = document.getElementById('Footer');
            container.innerHTML = show ? '<div class="loading">Loading photos...</div>' : '';
        }
         

        function showError(message) {
            const container = document.getElementById('Footer');
            container.innerHTML = `<div class="error">❌ ${message}</div>`;
        }

        function clearError() {
            document.getElementById('Footer').innerHTML = '';
        }

        // Initialize on page load
        window.addEventListener('load', () => {
            loadPhotos();
        });



        function createQualityToggleButton() {
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'quality-toggle-btn';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 12px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 101;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
    `;
    
    toggleBtn.innerHTML = '📷';
    toggleBtn.title = `Image Quality: ${imageQualitySettings.quality.toUpperCase()}`;
    
    toggleBtn.addEventListener('click', toggleQualitySelector);
    document.body.appendChild(toggleBtn);
    
    return toggleBtn;
}

// Toggle quality selector visibility
function toggleQualitySelector() {
    qualitySelectorVisible = !qualitySelectorVisible;
    
    const selector = document.getElementById('quality-selector');
    const toggleBtn = document.getElementById('quality-toggle-btn');
    
    if (qualitySelectorVisible) {
        selector.style.display = 'block';
        selector.style.opacity = '0';
        selector.style.transform = 'translateY(20px)';
        
        // Animate in
        requestAnimationFrame(() => {
            selector.style.opacity = '1';
            selector.style.transform = 'translateY(0)';
        });
        
        // Change button style to indicate it's active
        toggleBtn.style.background = 'rgba(0, 122, 255, 0.8)';
        toggleBtn.innerHTML = '✕';
        toggleBtn.title = 'Close quality selector';
        
    } else {
        // Animate out
        selector.style.opacity = '0';
        selector.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            selector.style.display = 'none';
        }, 300);
        
        // Reset button style
        toggleBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        toggleBtn.innerHTML = '📷';
        toggleBtn.title = `Image Quality: ${imageQualitySettings.quality.toUpperCase()}`;
    }
}

// Modified quality selector (initially hidden)
function createQualitySelector() {
    const selector = document.createElement('div');
    selector.id = 'quality-selector';
    selector.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 16px;
        border-radius: 12px;
        z-index: 100;
        min-width: 200px;
        backdrop-filter: blur(10px);
        display: none;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    selector.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">📷</span>
                Image Quality
            </div>
            <div id="close-quality-btn" style="cursor: pointer; padding: 4px; font-size: 16px; opacity: 0.7;" title="Close">✕</div>
        </div>
        <div id="quality-options"></div>
        <div id="quality-info" style="font-size: 12px; color: #ccc; margin-top: 8px;"></div>
    `;
    
    document.body.appendChild(selector);
    
    // Add close button functionality
    document.getElementById('close-quality-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQualitySelector();
    });
    
    // Create quality options
    const optionsContainer = document.getElementById('quality-options');
    Object.keys(qualityPresets).forEach(preset => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        `;
        
        const isSelected = imageQualitySettings.quality === preset;
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
        
        option.innerHTML = `
            <div style="font-weight: 500; text-transform: capitalize;">${preset}</div>
            <div style="font-size: 11px; color: #bbb;">${qualityPresets[preset].description}</div>
        `;
        
        option.addEventListener('click', () => {
            selectQuality(preset);
            // Auto-close after selection
            setTimeout(() => {
                if (qualitySelectorVisible) {
                    toggleQualitySelector();
                }
            }, 500);
        });
        
        optionsContainer.appendChild(option);
    });
    
    updateQualityInfo();
}

// Enhanced selectQuality function to update button
function selectQuality(preset) {
    if (!qualityPresets[preset]) return;
    
    imageQualitySettings = {
        ...imageQualitySettings,
        quality: preset,
        ...qualityPresets[preset]
    };
    
    // Save preference
    localStorage.setItem('imageQuality', preset);
    
    // Update UI
    updateQualitySelector();
    updateQualityInfo();
    updateQualityToggleButton();
}

// Update quality selector UI
function updateQualitySelector() {
    const options = document.querySelectorAll('#quality-options > div');
    options.forEach((option, index) => {
        const preset = Object.keys(qualityPresets)[index];
        const isSelected = imageQualitySettings.quality === preset;
        
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
    });
}

// Update the toggle button with current quality
function updateQualityToggleButton() {
    const toggleBtn = document.getElementById('quality-toggle-btn');
    if (toggleBtn && !qualitySelectorVisible) {
        toggleBtn.title = `Image Quality: ${imageQualitySettings.quality.toUpperCase()}`;
    }
}

// Close selector when clicking outside
function handleOutsideClick(event) {
    const selector = document.getElementById('quality-selector');
    const toggleBtn = document.getElementById('quality-toggle-btn');
    
    if (qualitySelectorVisible && 
        !selector.contains(event.target) && 
        !toggleBtn.contains(event.target)) {
        toggleQualitySelector();
    }
}

// Enhanced initialization to create both button and hidden selector
function initQualityUI() {
    createQualityToggleButton();
    createQualitySelector();
    
    // Add outside click handler
    document.addEventListener('click', handleOutsideClick);
    
    // Add escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && qualitySelectorVisible) {
            toggleQualitySelector();
        }
    });
}


function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorText = document.getElementById('Footer');
    const errorMessage = document.getElementById('Footer');
    if (errorText) errorText.textContent = message;
    if (errorMessage) errorMessage.classList.add('show');
}

function hideError() {
    const errorMessage = document.getElementById('Footer');
    if (errorMessage) errorMessage.classList.remove('show');
}


// 29 JUL 2025
// Generate unique phone image ID with device fingerprint
function generatePhoneImageId() {
    const deviceId = getOrCreateDeviceId();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    // Format: deviceId_timestamp_random
    return `${deviceId}_${timestamp}_${random}`;
}

// Get or create a unique device identifier
function getOrCreateDeviceId() {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('deviceUniqueId');
    
    if (!deviceId) {
        // Generate a new device ID using multiple factors
        const deviceFingerprint = generateDeviceFingerprint();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 12);
        
        // Create device ID: fingerprint_timestamp_random
        deviceId = `dev_${deviceFingerprint}_${timestamp}_${random}`;
        
        // Store it persistently
        localStorage.setItem('deviceUniqueId', deviceId);
        
        // Also try to store in IndexedDB as backup
        storeDeviceIdInDB(deviceId);
        
        console.log('Generated new device ID:', deviceId);
    }
    
    return deviceId;
}

// Generate device fingerprint based on available browser/device info
function generateDeviceFingerprint() {
    const factors = [];
    
    // Screen resolution
    factors.push(`${screen.width}x${screen.height}`);
    
    // Timezone
    factors.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // User agent hash (shortened)
    const uaHash = hashString(navigator.userAgent).toString(36).substr(0, 8);
    factors.push(uaHash);
    
    // Language
    factors.push(navigator.language || 'unknown');
    
    // Platform
    factors.push(navigator.platform || 'unknown');
    
    // Hardware concurrency (CPU cores)
    factors.push(navigator.hardwareConcurrency || 'unknown');
    
    // Memory (if available)
    if ('deviceMemory' in navigator) {
        factors.push(navigator.deviceMemory);
    }
    
    // Combine all factors and hash
    const combined = factors.join('|');
    const fingerprint = hashString(combined).toString(36).substr(0, 12);
    
    return fingerprint;
}

// Simple hash function for strings
function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
}

// Store device ID in IndexedDB as backup
async function storeDeviceIdInDB(deviceId) {
    try {
        // Use a separate database for device info
        const dbRequest = indexedDB.open('DeviceInfo', 1);
        
        dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('device')) {
                db.createObjectStore('device', { keyPath: 'key' });
            }
        };
        
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['device'], 'readwrite');
            const store = transaction.objectStore('device');
            
            store.put({
                key: 'deviceId',
                value: deviceId,
                created: new Date().toISOString()
            });
        };
    } catch (error) {
        console.warn('Could not store device ID in IndexedDB:', error);
    }
}

// Enhanced device ID recovery
async function recoverDeviceIdIfNeeded() {
    let deviceId = localStorage.getItem('deviceUniqueId');
    
    if (!deviceId) {
        // Try to recover from IndexedDB
        try {
            deviceId = await getDeviceIdFromDB();
            if (deviceId) {
                localStorage.setItem('deviceUniqueId', deviceId);
                console.log('Recovered device ID from IndexedDB:', deviceId);
            }
        } catch (error) {
            console.warn('Could not recover device ID from IndexedDB:', error);
        }
    }
    
    return deviceId;
}

// Get device ID from IndexedDB
function getDeviceIdFromDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('DeviceInfo', 1);
        
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['device'], 'readonly');
            const store = transaction.objectStore('device');
            const request = store.get('deviceId');
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
    });
}

// Modified capture photo function - save locally first
async function capturePhoto() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = document.getElementById('videoElement');
    
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
    
    // Show processing indicator
    showProcessingIndicator(true);
    
    try {
        // Compress image based on quality settings
        const result = await compressImage(canvas, imageQualitySettings);
        
        // Generate unique phone image ID
        const phoneImageId = generatePhoneImageId();
        
        // Create metadata
        const metadata = {
            phoneImageId: phoneImageId,
            timestamp: new Date().toISOString(),
            camera: currentFacingMode,
            size: result.blob.size,
            quality: imageQualitySettings.quality,
            mimeType: imageQualitySettings.mimeType,
            requiresWifi: wifiUploadEnabled,
            status: 'captured', // New status: captured but not registered
            serverUniqueId: null, // Will be filled when server responds
            compressionInfo: {
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
                fileSize: result.blob.size
            }
        };
        
        // Save locally immediately with phone ID
        const localId = await storeImageLocally(result.blob, metadata);
        
        // Create preview URL
        const url = URL.createObjectURL(result.blob);
        const capturedPhoto = document.getElementById('capturedPhoto');
        capturedPhoto.src = url;
        
        // Store reference to local storage ID and phone image ID
        capturedPhoto.photoBlob = result.blob;
        capturedPhoto.photoFile = result.file;
        capturedPhoto.phoneImageId = phoneImageId;
        capturedPhoto.localStorageId = localId;
        capturedPhoto.compressionInfo = metadata.compressionInfo;
        
        // Show photo review
        showPhotoReview(result, phoneImageId);
        
    } catch (error) {
        console.error('Error processing image:', error);
        showError('Failed to process image. Please try again.');
    } finally {
        showProcessingIndicator(false);
    }
}

// Store image locally with phone-generated ID
async function storeImageLocally(imageBlob, metadata) {
    if (!db) await initDB();
    
    const localId = Date.now() + Math.random().toString(36).substr(2, 9);
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    
    const photoData = {
        id: localId, // IndexedDB key
        phoneImageId: metadata.phoneImageId, // Our unique identifier
        imageBlob,
        metadata: {
            ...metadata,
            savedAt: new Date().toISOString(),
            uploadReady: false // Not ready until we have server ID
        },
        serverDetails: null // Will be populated when server responds
    };
    
    await new Promise((resolve, reject) => {
        const request = store.add(photoData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
    
    console.log('Photo stored locally:', { localId, phoneImageId: metadata.phoneImageId });
    return localId;
}

// Modified upload later - register with server and update local record
async function uploadLater() {
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (!capturedPhoto.phoneImageId) return;
    
    try {
        uploadLaterBtn.disabled = true;
        uploadNowBtn.disabled = true;
        uploadLaterBtn.textContent = 'Registering...';
        
        // Photo is already saved locally, now register with server
        const registrationResult = await registerPhotoWithServer(capturedPhoto.phoneImageId);
        
        // Update local record with server details
        await updateLocalPhotoWithServerDetails(
            capturedPhoto.phoneImageId, 
            registrationResult.serverUniqueId,
            registrationResult
        );
        
        // Register for background sync if conditions are met
        if (connectionInfo.isOnline && (connectionInfo.isWifi || !wifiUploadEnabled)) {
            await registerBackgroundSync();
            showSuccessMessage(`Photo registered and queued for upload! (${(capturedPhoto.compressionInfo.fileSize / (1024 * 1024)).toFixed(2)}MB)`);
        } else {
            showSuccessMessage(`Photo registered and will upload when ${wifiUploadEnabled ? 'WiFi' : 'connection'} is available!`);
        }
        
        retakePhoto();
        
    } catch (error) {
        console.error('Failed to register photo:', error);
        showSuccessMessage('Photo saved locally. Will register with server when connection is available.');
        retakePhoto();
        
    } finally {
        uploadLaterBtn.disabled = false;
        uploadNowBtn.disabled = false;
        uploadLaterBtn.textContent = 'Queue Upload';
    }
}

// Register photo with server using phone image ID
async function registerPhotoWithServer(phoneImageId) {
    try {
        // Get photo metadata from local storage
        const photoData = await getPhotoByPhoneId(phoneImageId);
        if (!photoData) {
            throw new Error('Photo not found in local storage');
        }
        
        const response = await fetch('/api/photos/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneImageId: phoneImageId,
                filename: `photo-${phoneImageId}.jpg`,
                size: photoData.metadata.size,
                mimeType: photoData.metadata.mimeType,
                quality: photoData.metadata.quality,
                camera: photoData.metadata.camera,
                timestamp: photoData.metadata.timestamp,
                clientId: getClientId(),
                metadata: photoData.metadata
            })
        });
        
        if (!response.ok) {
            throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
        }
        
        const serverResponse = await response.json();
        
        // Expected server response:
        // {
        //   serverUniqueId: "server_generated_unique_id",
        //   fileHandle: "unique-file-handle-from-jade",
        //   blockSize: 1048576,
        //   status: "Ready",
        //   error: null
        // }
        
        return serverResponse;
        
    } catch (error) {
        console.error('Server registration failed:', error);
        throw new Error(`Unable to register photo with server: ${error.message}`);
    }
}

// Update local photo record with server details
async function updateLocalPhotoWithServerDetails(phoneImageId, serverUniqueId, serverResponse) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    const index = store.index('phoneImageId');
    
    return new Promise((resolve, reject) => {
        const request = index.get(phoneImageId);
        
        request.onsuccess = () => {
            const photoData = request.result;
            if (!photoData) {
                reject(new Error('Photo not found for update'));
                return;
            }
            
            // Update with server details
            photoData.metadata.serverUniqueId = serverUniqueId;
            photoData.metadata.status = 'registered';
            photoData.metadata.uploadReady = true;
            photoData.metadata.registeredAt = new Date().toISOString();
            
            photoData.serverDetails = {
                serverUniqueId: serverUniqueId,
                fileHandle: serverResponse.fileHandle,
                blockSize: serverResponse.blockSize,
                registeredAt: new Date().toISOString(),
                uploadAttempts: 0,
                lastAttemptAt: null
            };
            
            const updateRequest = store.put(photoData);
            updateRequest.onsuccess = () => {
                console.log(`Updated photo ${phoneImageId} with server ID ${serverUniqueId}`);
                resolve(photoData);
            };
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Get photo by phone image ID
async function getPhotoByPhoneId(phoneImageId) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['pendingUploads'], 'readonly');
    const store = transaction.objectStore('pendingUploads');
    const index = store.index('phoneImageId');
    
    return new Promise((resolve, reject) => {
        const request = index.get(phoneImageId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Modified upload now function that uses your existing submitFile_DestinationHandle
async function uploadNow() {
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (!capturedPhoto.phoneImageId) return;
    
    // Check WiFi requirement
    if (wifiUploadEnabled && !connectionInfo.isWifi && connectionInfo.isOnline) {
        showError('Upload requires WiFi connection. Please connect to WiFi or disable WiFi-only mode.');
        return;
    }
    
    if (!connectionInfo.isOnline) {
        showError('No internet connection. Photo will be queued for upload when connection is restored.');
        await uploadLater();
        return;
    }
    
    try {
        uploadNowBtn.disabled = true;
        uploadLaterBtn.disabled = true;
        uploadNowBtn.textContent = 'Preparing...';
        
        // Get photo data from local storage
        const photoData = await getPhotoByPhoneId(capturedPhoto.phoneImageId);
        if (!photoData) {
            throw new Error('Photo not found in local storage');
        }
        
        // Create File object and set global fileToUpload variable for your existing system
        window.fileToUpload = new File([photoData.imageBlob], `photo-${photoData.phoneImageId}.jpg`, {
            type: photoData.metadata.mimeType,
            lastModified: Date.now()
        });
        
        // Store phone image ID globally so your existing system can access it
        window.currentPhoneImageId = photoData.phoneImageId;
        
        uploadNowBtn.textContent = 'Uploading...';
        
        // Set up success/error callbacks for your existing upload system
        const originalOnSuccess = window.uploadOnSuccess;
        const originalOnError = window.uploadOnError;
        
        window.uploadOnSuccess = async function(serverResponse) {
            try {
                // Your existing system completed successfully
                // Update photo status to uploaded
                await updatePhotoStatus(photoData.phoneImageId, 'uploaded');
                
                showSuccessMessage('📸 Photo uploaded successfully!');
                hidePhotoReview();
                
                // Restore original callbacks
                window.uploadOnSuccess = originalOnSuccess;
                window.uploadOnError = originalOnError;
                
            } catch (error) {
                console.error('Error updating photo status:', error);
                showSuccessMessage('📸 Photo uploaded (status update failed)');
                hidePhotoReview();
            } finally {
                uploadNowBtn.disabled = false;
                uploadLaterBtn.disabled = false;
                uploadNowBtn.textContent = 'Upload Now';
            }
        };
        
        window.uploadOnError = function(error) {
            console.error('Upload failed:', error);
            showError(`Upload failed: ${error}`);
            
            // Restore original callbacks
            window.uploadOnSuccess = originalOnSuccess;
            window.uploadOnError = originalOnError;
            
            uploadNowBtn.disabled = false;
            uploadLaterBtn.disabled = false;
            uploadNowBtn.textContent = 'Upload Now';
        };
        
        // Call your existing upload method
        window.submitFile_DestinationHandle();
        
    } catch (error) {
        console.error('Upload preparation failed:', error);
        
        if (!connectionInfo.isOnline || error.message.includes('network') || error.message.includes('fetch')) {
            showError('Upload failed due to connection issues. Photo saved for later upload...');
            await uploadLater();
        } else {
            showError(`Upload failed: ${error.message}`);
        }
        
        uploadNowBtn.disabled = false;
        uploadLaterBtn.disabled = false;
        uploadNowBtn.textContent = 'Upload Now';
    }
}

// Modified upload function using server unique ID
async function uploadRegisteredPhotoWithServerID(photoData) {
    if (!photoData.serverDetails || !photoData.metadata.serverUniqueId) {
        throw new Error('No server details or server unique ID available for upload');
    }
    
    const { fileHandle, blockSize } = photoData.serverDetails;
    const { imageBlob, metadata } = photoData;
    
    // Convert blob to file-like object
    const file = new File([imageBlob], `photo-${metadata.phoneImageId}.jpg`, { 
        type: metadata.mimeType,
        lastModified: Date.now()
    });
    
    try {
        // Pass server unique ID in the upload
        const result = await uploadFileInChunksWithServerID(
            file, 
            fileHandle, 
            blockSize, 
            metadata.serverUniqueId,
            metadata.phoneImageId
        );
        return result;
    } catch (error) {
        throw new Error(`Photo upload failed: ${error.message}`);
    }
}

// Modified chunk upload to include server unique ID
async function uploadFileInChunksWithServerID(file, fileHandle, blockSize, serverUniqueId, phoneImageId) {
    const numberOfChunks = Math.ceil(file.size / blockSize);
    let chunkNumber = 0;
    let byteIndex = 0;
    
    for (let i = 0; i < numberOfChunks; i++) {
        chunkNumber = i + 1;
        const byteEnd = Math.min(byteIndex + blockSize, file.size);
        const chunk = file.slice(byteIndex, byteEnd);
        
        // Convert chunk to base64
        const chunkBase64 = await blobToBase64(chunk);
        
        // Send chunk with server unique ID
        const chunkResult = await sendPhotoChunkWithServerID(
            fileHandle, 
            chunkBase64, 
            chunkNumber, 
            serverUniqueId,
            phoneImageId
        );
        
        // Update progress
        const percent = ((100 * chunkNumber) / numberOfChunks).toFixed();
        updateUploadProgress(file.name, percent);
        
        byteIndex = byteEnd;
        
        // Check if upload is complete
        if (chunkResult.status === "Complete" || chunkNumber >= numberOfChunks) {
            return { success: true, fileHandle: fileHandle, serverUniqueId: serverUniqueId };
        } else if (chunkResult.status === "Error") {
            throw new Error(chunkResult.error || 'Chunk upload failed');
        }
    }
    
    return { success: true, fileHandle: fileHandle, serverUniqueId: serverUniqueId };
}

// Send chunk with server unique ID
async function sendPhotoChunkWithServerID(fileHandle, chunkBase64, chunkNumber, serverUniqueId, phoneImageId) {
    const lObj = {
        systemName: glbSystemName,
        formName: "FileChunkSave", 
        vin: Conversions.base32.encode(fileHandle),
        doc: chunkBase64,
        sid: Conversions.base32.encode(chunkNumber.toString()),
        serverUniqueId: serverUniqueId, // Include server unique ID
        phoneImageId: phoneImageId // Include phone image ID for reference
    };
    
    const lJson = JSON.stringify(lObj);
    
    try {
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response; 
        }
        
        const result = JSON.parse(lResponse);
        return result;
        
    } catch (error) {
        throw new Error(`Chunk ${chunkNumber} upload failed: ${error.message}`);
    }
}

// Update photo status
async function updatePhotoStatus(phoneImageId, status) {
    if (!db) await initDB();
    
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    const index = store.index('phoneImageId');
    
    return new Promise((resolve, reject) => {
        const request = index.get(phoneImageId);
        
        request.onsuccess = () => {
            const photoData = request.result;
            if (!photoData) {
                reject(new Error('Photo not found for status update'));
                return;
            }
            
            photoData.metadata.status = status;
            photoData.metadata.lastUpdated = new Date().toISOString();
            
            const updateRequest = store.put(photoData);
            updateRequest.onsuccess = () => resolve(photoData);
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Enhanced database schema with phone image ID index
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PhotoQueue', 3); // Increment version for new index
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.target.transaction;
            
            if (!db.objectStoreNames.contains('pendingUploads')) {
                const store = db.createObjectStore('pendingUploads', { keyPath: 'id' });
                store.createIndex('status', 'metadata.status', { unique: false });
                store.createIndex('timestamp', 'metadata.timestamp', { unique: false });
                store.createIndex('phoneImageId', 'phoneImageId', { unique: true }); // New index
                store.createIndex('serverUniqueId', 'metadata.serverUniqueId', { unique: false });
            } else {
                const store = transaction.objectStore('pendingUploads');
                
                // Add new indexes if upgrading
                if (!store.indexNames.contains('phoneImageId')) {
                    store.createIndex('phoneImageId', 'phoneImageId', { unique: true });
                }
                if (!store.indexNames.contains('serverUniqueId')) {
                    store.createIndex('serverUniqueId', 'metadata.serverUniqueId', { unique: false });
                }
            }
        };
    });
}

// Enhanced background processing to handle unregistered photos
async function checkAndProcessPendingUploads() {
    if (!db) await initDB();
    
    try {
        const transaction = db.transaction(['pendingUploads'], 'readwrite');
        const store = transaction.objectStore('pendingUploads');
        
        const allPhotos = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        // Photos that need server registration
        const needsRegistration = allPhotos.filter(photo => 
            photo.metadata && 
            photo.metadata.status === 'captured' && 
            !photo.metadata.serverUniqueId
        );
        
        // Photos ready for upload
        const readyForUpload = allPhotos.filter(photo => 
            photo.metadata && 
            photo.metadata.status === 'registered' &&
            photo.metadata.serverUniqueId &&
            photo.serverDetails &&
            (!photo.metadata.requiresWifi || connectionInfo.isWifi)
        );
        
        // First: Register unregistered photos
        for (const photo of needsRegistration) {
            try {
                console.log(`Registering photo ${photo.phoneImageId} with server`);
                const registrationResult = await registerPhotoWithServer(photo.phoneImageId);
                
                await updateLocalPhotoWithServerDetails(
                    photo.phoneImageId,
                    registrationResult.serverUniqueId,
                    registrationResult
                );
                
                console.log(`Photo ${photo.phoneImageId} registered with server ID ${registrationResult.serverUniqueId}`);
                
            } catch (error) {
                console.error(`Registration failed for photo ${photo.phoneImageId}:`, error);
                // Photo remains in 'captured' status for retry later
            }
        }
        
        // Second: Upload registered photos
        if (readyForUpload.length > 0) {
            console.log(`Found ${readyForUpload.length} photos ready for upload`);
            await registerBackgroundSync();
            showNetworkNotification(`📤 ${readyForUpload.length} photos ready to upload`);
        }
        
    } catch (error) {
        console.error('Error processing pending uploads:', error);
    }
}