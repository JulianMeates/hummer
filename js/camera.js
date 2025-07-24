        let currentStream = null;
        let currentFacingMode = 'user'; // 'user' for front, 'environment' for back
        let flashSupported = false;
        let flashEnabled = false;

        // DOM elements
     

      
        async function initCamera() {
             initDB().catch(console.error);
            const video = document.getElementById('videoElement');
            const captureBtn = document.getElementById('captureBtn');
            const cameraSwitchBtn = document.getElementById('cameraSwitchBtn');
            const flashToggle = document.getElementById('flashToggle');
            const photoReview = document.getElementById('photoReview');
            const capturedPhoto = document.getElementById('capturedPhoto');
            const retakeBtn = document.getElementById('retakeBtn');
            const uploadNowBtn = document.getElementById('uploadNowBtn');
            const uploadLaterBtn = document.getElementById('uploadLaterBtn');
            const saveBtn = document.getElementById('saveBtn');
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
            video = document.getElementById('videoElement');
            
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

        // Photo upload queue system (IndexedDB)
        let db = null;

        async function initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('PhotoQueue', 1);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('pendingUploads')) {
                        const store = db.createObjectStore('pendingUploads', { keyPath: 'id' });
                        store.createIndex('status', 'status', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        }

        async function storeImageLocally(imageBlob, metadata) {
            if (!db) await initDB();
            
            const id = Date.now() + Math.random().toString(36).substr(2, 9);
            const transaction = db.transaction(['pendingUploads'], 'readwrite');
            const store = transaction.objectStore('pendingUploads');
            
            const photoData = {
                id,
                imageBlob,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    camera: currentFacingMode,
                    size: imageBlob.size
                }
            };
            
            await store.add(photoData);
            return id;
        }

        async function syncMetadata(photoId, metadata) {
            try {
                const response = await fetch('/api/photos/metadata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tempId: photoId,
                        ...metadata,
                        imageStatus: 'pending_upload'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('Failed to sync metadata:', error);
                // Store metadata locally for later sync
                if (!db) await initDB();
                const transaction = db.transaction(['pendingUploads'], 'readwrite');
                const store = transaction.objectStore('pendingUploads');
                
                const existingData = await store.get(photoId);
                if (existingData) {
                    existingData.metadata.metadataSyncPending = true;
                    await store.put(existingData);
                }
                throw error;
            }
        }

        async function uploadImageNow(imageBlob, metadata) {
            const formData = new FormData();
            formData.append('image', imageBlob, `photo-${Date.now()}.jpg`);
            formData.append('metadata', JSON.stringify(metadata));
            
            const response = await fetch('/api/photos/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            
            return await response.json();
        }

        // Service Worker registration for background sync
        async function registerBackgroundSync() {
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('photo-upload');
                    console.log('Background sync registered');
                } catch (error) {
                    console.error('Background sync registration failed:', error);
                }
            }
        }

        async function uploadNow() {
            if (!capturedPhoto.photoBlob) return;
            
            try {
                uploadNowBtn.disabled = true;
                uploadLaterBtn.disabled = true;
                uploadNowBtn.textContent = 'Uploading...';
                
                const metadata = {
                    timestamp: new Date().toISOString(),
                    camera: currentFacingMode,
                    size: capturedPhoto.photoBlob.size,
                    uploadType: 'immediate'
                };
                
                await uploadImageNow(capturedPhoto.photoBlob, metadata);
                
                showSuccessMessage('Photo uploaded successfully!');
                retakePhoto(); // Close review mode
                
            } catch (error) {
                console.error('Upload failed:', error);
                showError('Upload failed. Photo has been queued for later upload.');
                
                // Fallback to queue if immediate upload fails
                await uploadLater();
            } finally {
                uploadNowBtn.disabled = false;
                uploadLaterBtn.disabled = false;
                uploadNowBtn.textContent = 'Upload Now';
            }
        }

        async function uploadLater() {
            if (!capturedPhoto.photoBlob) return;
            
            try {
                uploadLaterBtn.disabled = true;
                uploadNowBtn.disabled = true;
                uploadLaterBtn.textContent = 'Queuing...';
                
                const metadata = {
                    timestamp: new Date().toISOString(),
                    camera: currentFacingMode,
                    size: capturedPhoto.photoBlob.size,
                    uploadType: 'queued'
                };
                
                // Store image locally
                const photoId = await storeImageLocally(capturedPhoto.photoBlob, metadata);
                
                // Try to sync metadata immediately (will queue locally if it fails)
                try {
                    await syncMetadata(photoId, metadata);
                } catch (error) {
                    console.log('Metadata will be synced later');
                }
                
                // Register for background sync
                await registerBackgroundSync();
                
                showSuccessMessage('Photo queued for upload when connection improves!');
                retakePhoto(); // Close review mode
                
            } catch (error) {
                console.error('Failed to queue photo:', error);
                showError('Failed to save photo. Please try again.');
            } finally {
                uploadLaterBtn.disabled = false;
                uploadNowBtn.disabled = false;
                uploadLaterBtn.textContent = 'Queue Upload';
            }
        }

        function showSuccessMessage(message) {
            // Create a temporary success message
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                z-index: 30;
                font-weight: 500;
            `;
            successDiv.textContent = message;
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
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
        /*
        captureBtn.addEventListener('click', capturePhoto);
        cameraSwitchBtn.addEventListener('click', switchCamera);
        flashToggle.addEventListener('click', toggleFlash);
        retakeBtn.addEventListener('click', retakePhoto);
        uploadNowBtn.addEventListener('click', uploadNow);
        uploadLaterBtn.addEventListener('click', uploadLater);
        closeBtn.addEventListener('click', closeCamera);
        */
        // Initialize database on load
       

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