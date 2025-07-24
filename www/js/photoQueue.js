          
        // Get all stored photos
        async function getAllStoredPhotos() {
            if (!db) await initDB();
            
            const transaction = db.transaction(['pendingUploads'], 'readonly');
            const store = transaction.objectStore('pendingUploads');
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        // Format file size
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Format timestamp
        function formatTimestamp(timestamp) {
            if (!timestamp) return 'Unknown';
            const date = new Date(timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        
        // Load and display stored images
        async function loadStoredImages() {
            const imagesList = document.getElementById('imagesList');
            const imageStats = document.getElementById('imageStats');
            const messages = document.getElementById('messages');
            
            imagesList.innerHTML = '<div class="loading">Loading stored images...</div>';
            messages.innerHTML = '';
            
            try {
                const photos = await getAllStoredPhotos();
                
                // Update statistics
                const totalSize = photos.reduce((sum, photo) => {
                    const size = (photo.metadata && photo.metadata.size) || photo.size || 0;
                    return sum + size;
                }, 0);
                
                imageStats.innerHTML = `
                    <strong>${photos.length}</strong> images stored | 
                    <strong>${formatFileSize(totalSize)}</strong> total size
                `;
                
                if (photos.length === 0) {
                    imagesList.innerHTML = '<div class="no-images">No images found in storage</div>';
                    return;
                }
                
                // Generate HTML for each photo
                const photosHtml = photos.map(photo => {
                    const metadata = photo.metadata || {};
                    const size = metadata.size || photo.size || 0;
                    const mimeType = metadata.mimeType || photo.mimeType || 'image/jpeg';
                    const timestamp = metadata.timestamp || photo.timestamp;
                    const phoneImageId = photo.phoneImageId || photo.id || 'unknown';
                    
                    return `
                        <div class="image-item">
                            <div class="image-info">
                                <div class="image-name">${phoneImageId}</div>
                                <div class="image-details">
                                    ${formatFileSize(size)} • ${mimeType} • ${formatTimestamp(timestamp)}
                                </div>
                            </div>
                            <div class="image-actions">
                                <button class="btn btn-view" onclick="viewImage('${phoneImageId}')">👁️ View</button>
                                <button class="btn btn-upload" onclick="completePhotoUpload('${phoneImageId}')">⬆️ Upload</button>
                                <button class="btn btn-delete" onclick="deleteImage('${phoneImageId}')">🗑️ Delete</button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                imagesList.innerHTML = photosHtml;
                
            } catch (error) {
                console.error('Error loading images:', error);
                imagesList.innerHTML = '<div class="no-images">Error loading images: ' + error.message + '</div>';
                showMessage('Error loading images: ' + error.message, 'error');
            }
        }
        
        // Show message to user
        function showMessage(message, type = 'success') {
            const messages = document.getElementById('messages');
            messages.innerHTML = `<div class="${type}">${message}</div>`;
            setTimeout(() => {
                messages.innerHTML = '';
            }, 5000);
        }
        
       async function viewImage(phoneImageId) {
            try {
                console.log('Attempting to view image:', phoneImageId);
                
                const photoData = await getPhotoByPhoneId(phoneImageId);
                console.log('Retrieved photoData:', photoData);
                
                if (!photoData) {
                    showMessage('Image not found in database', 'error');
                    return;
                }
                
                // Debug: Show what properties the photoData has
                console.log('PhotoData keys:', Object.keys(photoData));
                
                // Try multiple possible locations for image data
                let imageData = null;
                let imageSource = '';
                
                // Check various possible data locations
                if (photoData.data) {
                    imageData = photoData.data;
                    imageSource = 'photoData.data';
                } else if (photoData.blob) {
                    // Convert blob to data URL
                    imageData = await blobToDataURL(photoData.blob);
                    imageSource = 'photoData.blob (converted)';
                 } else if (photoData.imageBlob) {
                    // Convert blob to data URL
                    imageData = await blobToDataURL(photoData.imageBlob);
                    imageSource = 'photoData.blob (converted)';
                } else if (photoData.file) {
                    // Convert file to data URL
                    imageData = await fileToDataURL(photoData.file);
                    imageSource = 'photoData.file (converted)';
                } else if (photoData.base64) {
                    imageData = photoData.base64.startsWith('data:') ? photoData.base64 : `data:image/jpeg;base64,${photoData.base64}`;
                    imageSource = 'photoData.base64';
                } else if (photoData.url) {
                    imageData = photoData.url;
                    imageSource = 'photoData.url';
                }
                
                console.log('Image data source:', imageSource);
                console.log('Image data preview:', imageData ? imageData.substring(0, 100) + '...' : 'null');
                
                if (imageData) {
                    // Validate that it's a proper data URL
                    if (!imageData.startsWith('data:image/') && !imageData.startsWith('blob:') && !imageData.startsWith('http')) {
                        // Try to create a proper data URL
                        imageData = `data:image/jpeg;base64,${imageData}`;
                    }
                    
                    // Open image in new window
                    const newWindow = window.open();
                    newWindow.document.write(`
                        <html>
                            <head><title>Image: ${phoneImageId}</title></head>
                            <body style="margin:0;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;font-family:Arial,sans-serif;">
                                <div style="margin-bottom:10px;padding:10px;background:white;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                                    <strong>Image ID:</strong> ${phoneImageId}<br>
                                    <strong>Source:</strong> ${imageSource}
                                </div>
                                <img src="${imageData}" 
                                     style="max-width:90%;max-height:80%;object-fit:contain;border:1px solid #ddd;border-radius:5px;" 
                                     alt="${phoneImageId}"
                                     onerror="this.parentElement.innerHTML='<div style=\\'color:red;padding:20px;\\'>Failed to load image data</div>'">
                            </body>
                        </html>
                    `);
                } else {
                    console.error('No image data found in any expected location');
                    showMessage(`Image data not found. Available properties: ${Object.keys(photoData).join(', ')}`, 'error');
                }
            } catch (error) {
                console.error('Error viewing image:', error);
                showMessage('Error viewing image: ' + error.message, 'error');
            }
        }
        
        // Upload image function
        async function uploadImage(phoneImageId) {
            try {
                showMessage('Starting upload for ' + phoneImageId, 'success');
                
                // Call your existing upload function
                if (typeof registerPhotoWithServer === 'function') {
                    await registerPhotoWithServer(phoneImageId);
                    showMessage('Upload initiated successfully!', 'success');
                } else {
                    showMessage('Upload function not available', 'error');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                showMessage('Error uploading image: ' + error.message, 'error');
            }
        }
        
        // Delete image function
        async function deleteImage(phoneImageId) {
            if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                return;
            }
            
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(['pendingUploads'], 'readwrite');
                const store = transaction.objectStore('pendingUploads');
                const index = store.index('phoneImageId');
                
                // Find and delete the image
                const getRequest = index.get(phoneImageId);
                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        const deleteRequest = store.delete(getRequest.result.id || phoneImageId);
                        deleteRequest.onsuccess = () => {
                            showMessage('Image deleted successfully', 'success');
                            loadStoredImages(); // Refresh the list
                        };
                        deleteRequest.onerror = () => {
                            showMessage('Error deleting image', 'error');
                        };
                    } else {
                        showMessage('Image not found', 'error');
                    }
                };
                
            } catch (error) {
                console.error('Error deleting image:', error);
                showMessage('Error deleting image: ' + error.message, 'error');
            }
        }
        
    // Helper function to convert blob to data URL
        function blobToDataURL(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        
        // Helper function to convert file to data URL
        function fileToDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        // Load images when page loads
        window.addEventListener('load', () => {
            loadStoredImages();
        });