/**
 * FloatingPDFManager - Enhanced PDF Viewer with Touch Support
 * A comprehensive PDF viewer with floating modal, touch gestures, and high-quality rendering
 * 
 * Features:
 * - Floating modal PDF viewer
 * - Touch gestures (swipe navigation, pinch zoom)
 * - High-DPI rendering for crisp text
 * - Mobile and desktop optimized
 * - Drag and drop, minimize/restore
 * - Orientation change handling
 * 
 * Dependencies:
 * - PDF.js library (https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js)
 * 
 * Usage:
 * const pdfManager = new FloatingPDFManager();
 * pdfManager.openPDF(base64Data, 'filename.pdf');
 */

class FloatingPDFManager {
  constructor() {
    // Set up PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    this.currentPDF = null;
    this.currentCanvas = null;
    this.currentContext = null;
    this.currentPage = 1;
    this.floatingContainer = null;
    this.lastPDFData = null;
    this.lastFileName = null;
    
    // Drag functionality properties
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.containerStartX = 0;
    this.containerStartY = 0;
    
    // Enhanced functionality properties
    this.orientationCleanup = null;
    this.desktopZoomLevel = 1;
  }

  // Convert base64 to blob
  base64ToBlob(base64Data, contentType = 'application/pdf') {
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  // Cache PDF using OPFS
  async cachePDFFromBase64(base64Data, fileName) {
    try {
      const pdfBlob = this.base64ToBlob(base64Data);
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return fileName;
    } catch (error) {
      console.error('Error caching PDF:', error);
      return null;
    }
  }

  // Get cached PDF
  async getCachedPDF(fileName) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }

  // Create floating container
  createFloatingContainer() {
    if (this.floatingContainer) {
      this.floatingContainer.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'pdf-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const container = document.createElement('div');
    container.className = 'pdf-floating-container';
    container.style.cssText = `
      width: 90%;
      height: 90%;
      max-width: 1200px;
      max-height: 900px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      overflow: hidden;
      min-width: 300px;
      min-height: 200px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      cursor: move;
      user-select: none;
    `;

    this.setupDragFunctionality(header, container);

    const title = document.createElement('h3');
    title.textContent = 'PDF Viewer';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      margin-left: 10px;
    `;

    closeButton.onmouseover = () => closeButton.style.backgroundColor = '#f0f0f0';
    closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
    closeButton.onclick = () => this.closeFloatingPDF();

    const minimizeButton = document.createElement('button');
    minimizeButton.innerHTML = '−';
    minimizeButton.style.cssText = closeButton.style.cssText;
    minimizeButton.onmouseover = () => minimizeButton.style.backgroundColor = '#f0f0f0';
    minimizeButton.onmouseout = () => minimizeButton.style.backgroundColor = 'transparent';
    minimizeButton.onclick = () => this.minimizeFloatingPDF();

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `display: flex; align-items: center;`;
    buttonContainer.appendChild(minimizeButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    const contentArea = document.createElement('div');
    contentArea.id = 'pdf-content-area';
    contentArea.style.cssText = `
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    container.appendChild(header);
    container.appendChild(contentArea);
    overlay.appendChild(container);

    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeFloatingPDF();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.floatingContainer) {
        this.closeFloatingPDF();
      }
    });

    document.body.appendChild(overlay);
    this.floatingContainer = overlay;

    setTimeout(() => {
      overlay.style.opacity = '1';
      container.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    return contentArea;
  }

  // Setup drag functionality
  setupDragFunctionality(header, container) {
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      
      const rect = container.getBoundingClientRect();
      this.containerStartX = rect.left + rect.width / 2;
      this.containerStartY = rect.top + rect.height / 2;
      
      document.body.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;
      
      const newX = this.containerStartX + deltaX;
      const newY = this.containerStartY + deltaY;
      
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
      container.style.transform = 'translate(-50%, -50%) scale(1)';
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.cursor = '';
        header.style.cursor = 'move';
      }
    });

    window.addEventListener('resize', () => {
      if (container) this.keepContainerInBounds(container);
    });
  }

  // Keep container within viewport bounds
  keepContainerInBounds(container) {
    const rect = container.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let newX = parseFloat(container.style.left) || windowWidth / 2;
    let newY = parseFloat(container.style.top) || windowHeight / 2;
    
    const minX = rect.width / 2;
    const maxX = windowWidth - rect.width / 2;
    const minY = rect.height / 2;
    const maxY = windowHeight - rect.height / 2;
    
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    container.style.left = `${newX}px`;
    container.style.top = `${newY}px`;
  }

  // Enhanced close with cleanup
  closeFloatingPDF() {
    if (this.orientationCleanup) {
      this.orientationCleanup();
      this.orientationCleanup = null;
    }
    
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      overlay.style.opacity = '0';
      container.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        overlay.remove();
        this.floatingContainer = null;
      }, 300);
    }
  }

  // Minimize PDF viewer
  minimizeFloatingPDF() {
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      overlay.style.opacity = '0';
      container.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        overlay.style.display = 'none';
        this.createMinimizedIcon();
      }, 300);
    }
  }

  // Create minimized icon
  createMinimizedIcon() {
    const existingIcon = document.getElementById('pdf-minimized-icon');
    if (existingIcon) existingIcon.remove();

    const minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'pdf-minimized-icon';
    minimizedIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #007AFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
    `;
    
    minimizedIcon.innerHTML = '📄';
    minimizedIcon.title = 'Restore PDF Viewer';
    
    minimizedIcon.onmouseover = () => {
      minimizedIcon.style.transform = 'scale(1.1)';
      minimizedIcon.style.boxShadow = '0 6px 25px rgba(0, 123, 255, 0.4)';
    };
    
    minimizedIcon.onmouseout = () => {
      minimizedIcon.style.transform = 'scale(1)';
      minimizedIcon.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.3)';
    };
    
    minimizedIcon.onclick = () => this.restoreFloatingPDF();
    document.body.appendChild(minimizedIcon);
  }

  // Restore from minimized state
  restoreFloatingPDF() {
    const minimizedIcon = document.getElementById('pdf-minimized-icon');
    if (minimizedIcon) minimizedIcon.remove();
    
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      overlay.style.display = 'flex';
      
      setTimeout(() => {
        overlay.style.opacity = '1';
        container.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 10);
    }
  }

  // Main function to open PDF
  async openPDF(base64Data, fileName) {
    this.lastPDFData = base64Data;
    this.lastFileName = fileName;
    
    let pdfUrl = null;

    if (!pdfUrl) {
      console.log('Creating PDF from base64 data...');
      const pdfBlob = this.base64ToBlob(base64Data);
      pdfUrl = URL.createObjectURL(pdfBlob);

      if (fileName) {
        this.cachePDFFromBase64(base64Data, fileName).then(() => {
          console.log('PDF cached successfully');
        });
      }
    }

    const contentArea = this.createFloatingContainer();
    await this.displayPDF(pdfUrl, contentArea);
  }

  // Reopen last PDF
  async reopenLastPDF() {
    if (this.lastPDFData) {
      await this.openPDF(this.lastPDFData, this.lastFileName);
    } else {
      console.log('No PDF to reopen');
    }
  }

  // Smart PDF display
  async displayPDF(blobUrl, container) {
    container.innerHTML = '';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPDFJSAvailable = typeof pdfjsLib !== 'undefined';

    if (isMobile && isPDFJSAvailable) {
      await this.displayWithPDFJS(blobUrl, container);
    } else if (isMobile) {
      this.displayMobileFallback(blobUrl, container);
    } else {
      this.displayIframe(blobUrl, container);
    }
  }

  // Check if should use PDF.js for quality
  shouldUsePDFJSForQuality() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSmallViewport = window.innerWidth < 768;
    
    return devicePixelRatio > 1 || isMobile || isSmallViewport;
  }

  // Enhanced desktop iframe display
  displayIframe(blobUrl, container) {
    const shouldUsePDFJS = this.shouldUsePDFJSForQuality();
    
    if (shouldUsePDFJS && typeof pdfjsLib !== 'undefined') {
      this.displayDesktopPDFJS(blobUrl, container);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = blobUrl;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 0 0 8px 8px;
      `;
      container.appendChild(iframe);
    }
  }

  // Enhanced PDF.js for mobile
  async displayWithPDFJS(blobUrl, container) {
  try {
    const pdf = await pdfjsLib.getDocument(blobUrl).promise;
    
    this.currentPDF = pdf;
    this.currentPage = 1;
    
    const viewerDiv = document.createElement('div');
    viewerDiv.style.cssText = `
      width: 100%;
      height: 100%;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    `;
    
    const controls = this.createMobileControls(pdf.numPages);
    viewerDiv.appendChild(controls);
    
    // Improved canvas container with better touch handling
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'pdf-canvas-container';
    canvasContainer.style.cssText = `
      flex: 1;
      overflow: hidden;
      background: white;
      position: relative;
      touch-action: pinch-zoom;
      user-select: none;
      -webkit-user-select: none;
    `;
    
    // Improved scrollable wrapper
    const scrollWrapper = document.createElement('div');
    scrollWrapper.id = 'pdf-scroll-wrapper';
    scrollWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;
      position: relative;
    `;
    
    // Canvas wrapper for better zoom control
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = `
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 100%;
      min-height: 100%;
    `;
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      display: block;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
      touch-action: none;
      transform-origin: center center;
      max-width: none;
      max-height: none;
    `;
    
    this.currentCanvas = canvas;
    this.currentContext = canvas.getContext('2d');
    
    canvasWrapper.appendChild(canvas);
    scrollWrapper.appendChild(canvasWrapper);
    canvasContainer.appendChild(scrollWrapper);
    viewerDiv.appendChild(canvasContainer);
    container.appendChild(viewerDiv);
    
    this.setupTouchInteractions(canvasContainer, canvas, scrollWrapper);
    this.setupOrientationHandling(container);
    
    await this.renderMobilePage(1);
    
  } catch (error) {
    console.error('Error loading PDF with PDF.js:', error);
    this.displayMobileFallback(blobUrl, container);
  }
}
  // Desktop PDF.js implementation
  async displayDesktopPDFJS(blobUrl, container) {
    try {
      const pdf = await pdfjsLib.getDocument(blobUrl).promise;
      
      this.currentPDF = pdf;
      this.currentPage = 1;
      
      const viewerDiv = document.createElement('div');
      viewerDiv.style.cssText = `
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;
      
      const controls = this.createDesktopControls(pdf.numPages);
      viewerDiv.appendChild(controls);
      
      const canvasContainer = document.createElement('div');
      canvasContainer.id = 'pdf-canvas-container';
      canvasContainer.style.cssText = `
        flex: 1;
        overflow: auto;
        background: white;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
      `;
      
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        max-width: 100%;
        height: auto;
      `;
      
      this.currentCanvas = canvas;
      this.currentContext = canvas.getContext('2d');
      
      canvasContainer.appendChild(canvas);
      viewerDiv.appendChild(canvasContainer);
      container.appendChild(viewerDiv);
      
      await this.renderDesktopPage(1);
      
    } catch (error) {
      console.error('Error with desktop PDF.js:', error);
      const iframe = document.createElement('iframe');
      iframe.src = blobUrl;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 0 0 8px 8px;
      `;
      container.appendChild(iframe);
    }
  }

  // Enhanced mobile controls
  createMobileControls(totalPages) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: #007AFF;
      color: white;
      flex-shrink: 0;
      min-height: 44px;
      box-sizing: border-box;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹';
    prevBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      min-width: 44px;
      min-height: 44px;
      touch-action: manipulation;
    `;
    prevBtn.onclick = () => this.goToMobilePage(this.currentPage - 1);
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '›';
    nextBtn.style.cssText = prevBtn.style.cssText;
    nextBtn.onclick = () => this.goToMobilePage(this.currentPage + 1);
    
    const pageInfo = document.createElement('div');
    pageInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      margin: 0 15px;
    `;
    
    const pageDisplay = document.createElement('span');
    pageDisplay.id = 'mobile-page-info';
    pageDisplay.textContent = `${this.currentPage} / ${totalPages}`;
    pageDisplay.style.cssText = `
      font-weight: bold;
      font-size: 16px;
    `;
    
    const swipeHint = document.createElement('span');
    swipeHint.textContent = 'Swipe to navigate • Pinch to zoom';
    swipeHint.style.cssText = `
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
    `;
    
    pageInfo.appendChild(pageDisplay);
    pageInfo.appendChild(swipeHint);
    
    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(pageInfo);
    controlsDiv.appendChild(nextBtn);
    
    return controlsDiv;
  }

  // Desktop controls
  createDesktopControls(totalPages) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
      background: #007AFF;
      color: white;
      gap: 20px;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;
    prevBtn.onclick = () => this.goToDesktopPage(this.currentPage - 1);
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.style.cssText = prevBtn.style.cssText;
    nextBtn.onclick = () => this.goToDesktopPage(this.currentPage + 1);
    
    const pageInfo = document.createElement('span');
    pageInfo.id = 'desktop-page-info';
    pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    pageInfo.style.cssText = `
      font-weight: bold;
      font-size: 16px;
      min-width: 120px;
      text-align: center;
    `;
    
    const zoomOut = document.createElement('button');
    zoomOut.textContent = '−';
    zoomOut.style.cssText = prevBtn.style.cssText;
    zoomOut.onclick = () => this.adjustDesktopZoom(0.8);
    
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.style.cssText = prevBtn.style.cssText;
    zoomIn.onclick = () => this.adjustDesktopZoom(1.25);
    
    const zoomReset = document.createElement('button');
    zoomReset.textContent = '100%';
    zoomReset.style.cssText = prevBtn.style.cssText;
    zoomReset.onclick = () => this.resetDesktopZoom();
    
    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(zoomOut);
    controlsDiv.appendChild(zoomReset);
    controlsDiv.appendChild(zoomIn);
    controlsDiv.appendChild(pageInfo);
    controlsDiv.appendChild(nextBtn);
    
    return controlsDiv;
  }

  setupTouchInteractions(container, canvas, scrollWrapper) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwipeGesture = false;
  let initialPinchDistance = 0;
  let currentScale = 1;
  let lastTap = 0;
  let isPinching = false;
  let isScrolling = false;
  
  // Touch start
  container.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    isPinching = false;
    isScrolling = false;
    
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwipeGesture = true;
      
      // Allow scrolling when zoomed in
      if (currentScale > 1) {
        isScrolling = true;
        isSwipeGesture = false;
      }
    } else if (e.touches.length === 2) {
      // Pinch start
      isSwipeGesture = false;
      isPinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Store the current scale when pinch starts
      const currentTransform = canvas.style.transform;
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      if (scaleMatch) {
        currentScale = parseFloat(scaleMatch[1]);
      }
    }
  }, { passive: true });
  
  // Touch move
  container.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2 && initialPinchDistance > 0) {
      // Handle pinch zoom
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / initialPinchDistance;
      
      const newScale = Math.max(0.5, Math.min(4, currentScale * scale));
      canvas.style.transform = `scale(${newScale})`;
      
      // Update current scale for next pinch
      currentScale = newScale;
      
      // Enable/disable scrolling based on zoom level
      if (newScale > 1) {
        scrollWrapper.style.overflow = 'auto';
        container.style.touchAction = 'pan-x pan-y';
      } else {
        scrollWrapper.style.overflow = 'hidden';
        container.style.touchAction = 'pan-x pan-y pinch-zoom';
      }
      
      initialPinchDistance = distance;
    } else if (isScrolling && e.touches.length === 1) {
      // Allow native scrolling when zoomed in
      // Don't prevent default - let browser handle scrolling
    } else if (isSwipeGesture && e.touches.length === 1) {
      // Only check for swipe if we're not zoomed in
      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = Math.abs(touchCurrentX - touchStartX);
      const deltaY = Math.abs(touchCurrentY - touchStartY);
      
      // If significant vertical movement, it's probably scrolling, not swiping
      if (deltaY > deltaX && deltaY > 20) {
        isSwipeGesture = false;
      }
    }
  }, { passive: false });
  
  // Touch end
  container.addEventListener('touchend', (e) => {
    if (isSwipeGesture && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Check for horizontal swipe (only when not zoomed in)
      if (absDeltaX > 50 && absDeltaX > absDeltaY && touchDuration < 500 && currentScale <= 1.1) {
        if (deltaX > 0) {
          // Swipe right - previous page
          this.goToMobilePage(this.currentPage - 1);
        } else {
          // Swipe left - next page
          this.goToMobilePage(this.currentPage + 1);
        }
      }
      
      // Double tap to reset zoom
      const currentTime = Date.now();
      if (currentTime - lastTap < 300) {
        currentScale = 1;
        canvas.style.transform = 'scale(1)';
        scrollWrapper.scrollTop = 0;
        scrollWrapper.scrollLeft = 0;
        scrollWrapper.style.overflow = 'hidden';
        container.style.touchAction = 'pan-x pan-y pinch-zoom';
      }
      lastTap = currentTime;
    }
    
    // Reset states
    isSwipeGesture = false;
    isPinching = false;
    isScrolling = false;
    initialPinchDistance = 0;
  }, { passive: true });
  
  // Handle wheel events for desktop mouse wheel zoom
  container.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const currentTransform = canvas.style.transform;
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      let scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      scale = Math.max(0.5, Math.min(4, scale * delta));
      canvas.style.transform = `scale(${scale})`;
      
      // Update scrolling behavior
      if (scale > 1) {
        scrollWrapper.style.overflow = 'auto';
      } else {
        scrollWrapper.style.overflow = 'hidden';
        scrollWrapper.scrollTop = 0;
        scrollWrapper.scrollLeft = 0;
      }
      
      currentScale = scale;
    }
  }, { passive: false });
}

  // Setup orientation handling
  setupOrientationHandling(container) {
    const handleOrientationChange = () => {
      setTimeout(async () => {
        const canvas = this.currentCanvas;
        const scrollWrapper = document.getElementById('pdf-scroll-wrapper');
        
        if (canvas && scrollWrapper) {
          scrollWrapper.scrollTop = 0;
          scrollWrapper.scrollLeft = 0;
          await this.renderMobilePage(this.currentPage);
          this.repositionAfterOrientation(container);
        }
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    this.orientationCleanup = () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }

  // Reposition container after orientation change
  repositionAfterOrientation(container) {
    const overlay = this.floatingContainer;
    const floatingContainer = overlay.querySelector('.pdf-floating-container');
    
    if (floatingContainer) {
      floatingContainer.style.left = '50%';
      floatingContainer.style.top = '50%';
      floatingContainer.style.transform = 'translate(-50%, -50%) scale(1)';
      this.keepContainerInBounds(floatingContainer);
    }
  }

  // Enhanced mobile page rendering with high-quality
  async renderMobilePage(pageNum) {
    if (!this.currentPDF || !this.currentCanvas) return;
    
    try {
      const page = await this.currentPDF.getPage(pageNum);
      
      const container = document.getElementById('pdf-canvas-container');
      if (!container) return;
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const backingStoreRatio = this.currentContext.webkitBackingStorePixelRatio ||
                               this.currentContext.mozBackingStorePixelRatio ||
                               this.currentContext.msBackingStorePixelRatio ||
                               this.currentContext.oBackingStorePixelRatio ||
                               this.currentContext.backingStorePixelRatio || 1;
      
      const pixelRatio = devicePixelRatio / backingStoreRatio;
      
      const containerWidth = container.clientWidth - 20;
      const containerHeight = container.clientHeight - 20;
      const viewport = page.getViewport({ scale: 1 });
      
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      let baseScale = Math.min(scaleX, scaleY);
      
      const qualityMultiplier = Math.min(2.5, Math.max(1.5, pixelRatio));
      const finalScale = baseScale * qualityMultiplier;
      
      const scaledViewport = page.getViewport({ scale: finalScale });
      
      this.currentCanvas.width = scaledViewport.width * pixelRatio;
      this.currentCanvas.height = scaledViewport.height * pixelRatio;
      
      this.currentCanvas.style.width = scaledViewport.width + 'px';
      this.currentCanvas.style.height = scaledViewport.height + 'px';
      
      this.currentContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      this.currentCanvas.style.transform = 'scale(1)';
      
      this.currentContext.imageSmoothingEnabled = true;
      this.currentContext.imageSmoothingQuality = 'high';
      
      const renderContext = {
        canvasContext: this.currentContext,
        viewport: scaledViewport,
        intent: 'display',
        renderInteractiveForms: false,
        optionalContentConfigPromise: null
      };
      
      await page.render(renderContext).promise;
      
      const pageInfoElement = document.getElementById('mobile-page-info');
      if (pageInfoElement) {
        pageInfoElement.textContent = `${pageNum} / ${this.currentPDF.numPages}`;
      }
      
      const scrollWrapper = document.getElementById('pdf-scroll-wrapper');
      if (scrollWrapper) {
        scrollWrapper.scrollTop = 0;
        scrollWrapper.scrollLeft = 0;
      }
      
      console.log(`Rendered page ${pageNum} with scale: ${finalScale.toFixed(2)}, pixel ratio: ${pixelRatio}`);
      
    } catch (error) {
      console.error('Error rendering mobile page:', error);
    }
  }

  // Desktop page rendering with quality optimization
  async renderDesktopPage(pageNum) {
    if (!this.currentPDF || !this.currentCanvas) return;
    
    try {
      const page = await this.currentPDF.getPage(pageNum);
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const container = document.getElementById('pdf-canvas-container');
      const containerWidth = container.clientWidth - 40;
      
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min((containerWidth / viewport.width), 2) * (this.desktopZoomLevel || 1);
      const qualityScale = scale * Math.min(devicePixelRatio, 2);
      
      const scaledViewport = page.getViewport({ scale: qualityScale });
      
      this.currentCanvas.width = scaledViewport.width;
      this.currentCanvas.height = scaledViewport.height;
      this.currentCanvas.style.width = (scaledViewport.width / devicePixelRatio) + 'px';
      this.currentCanvas.style.height = (scaledViewport.height / devicePixelRatio) + 'px';
      
      this.currentContext.imageSmoothingEnabled = true;
      this.currentContext.imageSmoothingQuality = 'high';
      
      await page.render({
        canvasContext: this.currentContext,
        viewport: scaledViewport,
        intent: 'display'
      }).promise;
      
      const pageInfoElement = document.getElementById('desktop-page-info');
      if (pageInfoElement) {
        pageInfoElement.textContent = `Page ${pageNum} of ${this.currentPDF.numPages}`;
      }
      
    } catch (error) {
      console.error('Error rendering desktop page:', error);
    }
  }

  // Navigate to specific page (mobile)
  async goToMobilePage(pageNum) {
    if (!this.currentPDF || pageNum < 1 || pageNum > this.currentPDF.numPages) {
      return;
    }
    
    this.currentPage = pageNum;
    await this.renderMobilePage(pageNum);
  }

  // Navigate to specific page (desktop)
  async goToDesktopPage(pageNum) {
    if (!this.currentPDF || pageNum < 1 || pageNum > this.currentPDF.numPages) {
      return;
    }
    
    this.currentPage = pageNum;
    await this.renderDesktopPage(pageNum);
  }

  // Desktop zoom functionality
  adjustDesktopZoom(factor) {
    this.desktopZoomLevel = (this.desktopZoomLevel || 1) * factor;
    this.desktopZoomLevel = Math.max(0.5, Math.min(3, this.desktopZoomLevel));
    this.renderDesktopPage(this.currentPage);
  }

  resetDesktopZoom() {
    this.desktopZoomLevel = 1;
    this.renderDesktopPage(this.currentPage);
  }

  // Mobile fallback without PDF.js
  displayMobileFallback(blobUrl, container) {
    container.innerHTML = `
      <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; max-width: 400px;">
          <div style="margin-bottom: 15px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#007AFF">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 style="margin: 0 0 10px 0; color: #333;">PDF Document</h3>
          <p style="margin: 0 0 20px 0; color: #666;">Tap below to open the PDF in your device's PDF viewer</p>
          <a href="${blobUrl}" target="_blank" download="document.pdf" 
             style="display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Open PDF
          </a>
        </div>
      </div>
    `;
  }

  // List cached PDFs
  async listCachedPDFs() {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const files = [];
      for await (const [name, handle] of opfsRoot.entries()) {
        if (name.endsWith('.pdf')) {
          files.push(name);
        }
      }
      return files;
    } catch (error) {
      console.error('Error listing cached PDFs:', error);
      return [];
    }
  }

  // Clear PDF cache
  async clearCache() {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      for await (const [name, handle] of opfsRoot.entries()) {
        if (name.endsWith('.pdf')) {
          await opfsRoot.removeEntry(name);
        }
      }
      console.log('PDF cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloatingPDFManager;
}

// Make available globally (for direct script inclusion)
if (typeof window !== 'undefined') {
  window.FloatingPDFManager = FloatingPDFManager;
}

// Auto-initialize global instance for convenience
if (typeof window !== 'undefined') {
  window.pdfManager = new FloatingPDFManager();
}