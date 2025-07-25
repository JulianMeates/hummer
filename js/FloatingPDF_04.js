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

    this.currentRenderTask = null;
    this.isRendering = false;
    this.pendingPageNumber = null;
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
    
    // Skip if file is too large (>25MB)
    if (pdfBlob.size > 25 * 1024 * 1024) {
      console.log('PDF too large for caching');
      return null;
    }
    
    // Check available storage
    const estimate = await navigator.storage.estimate();
    const availableMB = (estimate.quota - estimate.usage) / (1024 * 1024);
    
    if (availableMB < 50) { // Need at least 50MB free
      console.log('Insufficient storage space');
      return null;
    }
    
    const opfsRoot = await navigator.storage.getDirectory();
    const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(pdfBlob);
    await writable.close();
    return fileName;
    
  } catch (error) {
    console.log('PDF caching failed (non-critical):', error.message);
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
    cursor: default;
  `;

  // Create content area
  const contentArea = document.createElement('div');
  contentArea.id = 'pdf-content-area';
  contentArea.style.cssText = `
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: relative;
  `;

  // CONDITIONAL DRAGGING: Only enable for desktop
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSmallViewport = window.innerWidth < 768;
  
  if (!isMobile && !isSmallViewport) {
    // Desktop: Enable dragging
    this.setupDragFunctionality(container, container);
    console.log('Desktop: Dragging enabled');
  } else {
    // Mobile: No dragging, always centered
    console.log('Mobile: Dragging disabled - PDF stays centered');
  }

 // contentArea.appendChild(buttonContainer);
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

  setupDragFunctionality(dragElement, container) {
  dragElement.addEventListener('mousedown', (e) => {
    // Get the click position relative to container
    const containerRect = container.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    
    // ENHANCED: Don't drag if clicking on specific elements or areas
    const preventDragElements = [
      'BUTTON',
      'CANVAS', 
      'IFRAME',
      'INPUT',
      'SELECT',
      'TEXTAREA'
    ];
    
    const preventDragSelectors = [
      '#pdf-content-area',
      '#pdf-canvas-container',
      '#pdf-scroll-wrapper',
      'iframe',
      '.file-input-label',
      '.upload-container',
      '[style*="background: rgba(0, 123, 255"]', // PDF controls with blue background
      '[style*="padding: 8px 12px"]' // Header controls
    ];
    
    // Check if clicking on prevented elements
    if (preventDragElements.includes(e.target.tagName)) {
      console.log('Drag prevented: clicked on', e.target.tagName);
      return;
    }
    
    // Check if clicking on prevented selectors
    for (const selector of preventDragSelectors) {
      if (e.target.closest(selector)) {
        console.log('Drag prevented: clicked in', selector);
        return;
      }
    }
    
    const clickedElement = e.target;
    const isHeaderElement = (
      clickedElement.closest('[style*="background: rgba(0, 123, 255"]') ||
      clickedElement.closest('[style*="padding: 8px 12px"]') ||
      clickedElement.closest('button') ||
      clickY < 80 // Increased from 60px to be more conservative
    );
    
    if (isHeaderElement) {
      console.log('Drag prevented: clicked on header or controls');
      return;
    }
    
    // SPECIFIC: Don't drag from the main content area (where PDF/iframe is)
    const contentArea = container.querySelector('#pdf-content-area');
    if (contentArea) {
      const contentRect = contentArea.getBoundingClientRect();
      const isInContentArea = (
        e.clientX >= contentRect.left &&
        e.clientX <= contentRect.right &&
        e.clientY >= contentRect.top &&
        e.clientY <= contentRect.bottom
      );
      
      if (isInContentArea) {
        console.log('Drag prevented: clicked in content area');
        return;
      }
    }
    
    const isInDragZone = (
      (clickX < 15 && clickY > 100) ||  // Left edge, below header
      (clickX > containerRect.width - 15 && clickY > 100) || // Right edge, below header
      (clickY > containerRect.height - 15) // Bottom edge only
    );
    
    if (!isInDragZone) {
      console.log('Drag prevented: not in drag zone');
      return;
    }
    
    console.log('Drag started from valid zone');
    
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    const rect = container.getBoundingClientRect();
    this.containerStartX = rect.left + rect.width / 2;
    this.containerStartY = rect.top + rect.height / 2;
    
    document.body.style.cursor = 'grabbing';
    dragElement.style.cursor = 'grabbing';
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
      dragElement.style.cursor = '';
      console.log('Drag ended');
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

  closeFloatingPDF() {
  // Cancel any ongoing render operation
  if (this.currentRenderTask) {
    this.currentRenderTask.cancel();
    this.currentRenderTask = null;
  }
  
  this.isRendering = false;
  this.pendingPageNumber = null;
  
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

  const isMobile = this.isMobileEnvironment();
  const isPDFJSAvailable = typeof pdfjsLib !== 'undefined';

  if (isMobile && isPDFJSAvailable) {
    console.log('Mobile: Using PDF.js with touch controls (no dragging)');
    await this.displayWithPDFJS(blobUrl, container);
  } else if (isMobile) {
    console.log('Mobile: Using fallback display (no dragging)');
    this.displayMobileFallback(blobUrl, container);
  } else {
    console.log('Desktop: Using iframe with drag capability');
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
    
    // Simplified canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'pdf-canvas-container';
    canvasContainer.style.cssText = `
      flex: 1;
      overflow: hidden;
      background: white;
      position: relative;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    `;
    
    // Simple scrollable wrapper (mainly for centering)
    const scrollWrapper = document.createElement('div');
    scrollWrapper.id = 'pdf-scroll-wrapper';
    scrollWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;
      overflow: hidden;
    `;
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      display: block;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: none;
      touch-action: none;
      transform-origin: center center;
    `;
    
    this.currentCanvas = canvas;
    this.currentContext = canvas.getContext('2d');
    
    scrollWrapper.appendChild(canvas);
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

createMobileControls(totalPages) {
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 123, 255, 0.95);
    color: white;
    flex-shrink: 0;
    min-height: 36px;
    box-sizing: border-box;
    backdrop-filter: blur(4px);
    position: relative;
    z-index: 10;
  `;
  
  // Create left button group with conditional fast navigation
  const leftButtonGroup = document.createElement('div');
  leftButtonGroup.style.cssText = `
    display: flex;
    gap: 6px;
    align-items: center;
  `;
  
  // Base button styling
  const buttonStyle = `
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    min-width: 36px;
    min-height: 36px;
    touch-action: manipulation;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Fast prev button (only if more than 10 pages)
  if (totalPages > 10) {
    const fastPrevBtn = document.createElement('button');
    fastPrevBtn.innerHTML = '⏪';
    fastPrevBtn.title = 'Jump back 10 pages';
    fastPrevBtn.style.cssText = buttonStyle;
    fastPrevBtn.onclick = () => {
      const newPage = Math.max(1, this.currentPage - 10);
      this.goToMobilePage(newPage);
    };
    leftButtonGroup.appendChild(fastPrevBtn);
  }
  
  // Regular prev button
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '‹';
  prevBtn.title = 'Previous page';
  prevBtn.style.cssText = buttonStyle;
  prevBtn.onclick = () => this.goToMobilePage(this.currentPage - 1);
  leftButtonGroup.appendChild(prevBtn);
  
  // Regular next button
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '›';
  nextBtn.title = 'Next page';
  nextBtn.style.cssText = buttonStyle;
  nextBtn.onclick = () => this.goToMobilePage(this.currentPage + 1);
  leftButtonGroup.appendChild(nextBtn);
  
  // Fast next button (only if more than 10 pages)
  if (totalPages > 10) {
    const fastNextBtn = document.createElement('button');
    fastNextBtn.innerHTML = '⏩';
    fastNextBtn.title = 'Jump forward 10 pages';
    fastNextBtn.style.cssText = buttonStyle;
    fastNextBtn.onclick = () => {
      const newPage = Math.min(totalPages, this.currentPage + 10);
      this.goToMobilePage(newPage);
    };
    leftButtonGroup.appendChild(fastNextBtn);
  }
  
  // Page info in the center
  const pageInfo = document.createElement('div');
  pageInfo.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    margin: 0 12px;
  `;
  
  const pageDisplay = document.createElement('span');
  pageDisplay.id = 'mobile-page-info';
  pageDisplay.textContent = `${this.currentPage} / ${totalPages}`;
  pageDisplay.style.cssText = `
    font-weight: bold;
    font-size: 14px;
    line-height: 1.2;
  `;
  
  // Update hint text based on whether fast nav is available
  const hintText = totalPages > 10 
    ? 'Drag • Fast swipe • Pinch • ⏪⏩=10pg'
    : 'Drag • Fast swipe • Pinch • Double-tap';
    
  const swipeHint = document.createElement('span');
  swipeHint.textContent = hintText;
  swipeHint.style.cssText = `
    font-size: 10px;
    opacity: 0.8;
    margin-top: 1px;
    line-height: 1;
  `;
  
  pageInfo.appendChild(pageDisplay);
  pageInfo.appendChild(swipeHint);
  
  // Close button on the right
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.title = 'Close PDF';
  closeButton.style.cssText = `
    background: rgba(220, 53, 69, 0.9);
    color: white;
    border: none;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    min-width: 36px;
    min-height: 36px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
  `;
  
  closeButton.onclick = (e) => {
    e.stopPropagation();
    this.closeFloatingPDF();
  };
  
  closeButton.onmouseover = () => {
    closeButton.style.background = 'rgba(220, 53, 69, 1)';
  };
  closeButton.onmouseout = () => {
    closeButton.style.background = 'rgba(220, 53, 69, 0.9)';
  };
  
  // Assemble the controls
  controlsDiv.appendChild(leftButtonGroup);
  controlsDiv.appendChild(pageInfo);
  controlsDiv.appendChild(closeButton);
  
  return controlsDiv;
}
 
createDesktopControls(totalPages) {
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    background: rgba(0, 123, 255, 0.95);
    color: white;
    gap: 15px;
    flex-shrink: 0;
    backdrop-filter: blur(4px);
  `;
  
  // Navigation buttons group
  const navGroup = document.createElement('div');
  navGroup.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
  `;
  
  const baseButtonStyle = `
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    min-height: 32px;
  `;
  
  // Fast prev for desktop (if needed)
  if (totalPages > 10) {
    const fastPrevBtn = document.createElement('button');
    fastPrevBtn.textContent = '⏪ -10';
    fastPrevBtn.title = 'Jump back 10 pages';
    fastPrevBtn.style.cssText = baseButtonStyle;
    fastPrevBtn.onclick = () => {
      const newPage = Math.max(1, this.currentPage - 10);
      this.goToDesktopPage(newPage);
    };
    navGroup.appendChild(fastPrevBtn);
  }
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Prev';
  prevBtn.style.cssText = baseButtonStyle;
  prevBtn.onclick = () => this.goToDesktopPage(this.currentPage - 1);
  navGroup.appendChild(prevBtn);
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.style.cssText = baseButtonStyle;
  nextBtn.onclick = () => this.goToDesktopPage(this.currentPage + 1);
  navGroup.appendChild(nextBtn);
  
  // Fast next for desktop (if needed)
  if (totalPages > 10) {
    const fastNextBtn = document.createElement('button');
    fastNextBtn.textContent = '+10 ⏩';
    fastNextBtn.title = 'Jump forward 10 pages';
    fastNextBtn.style.cssText = baseButtonStyle;
    fastNextBtn.onclick = () => {
      const newPage = Math.min(totalPages, this.currentPage + 10);
      this.goToDesktopPage(newPage);
    };
    navGroup.appendChild(fastNextBtn);
  }
  
  // Rest of desktop controls (zoom, page info, close)...
  // [Previous desktop control code continues here]
  
  controlsDiv.appendChild(navGroup);
  // ... add other desktop elements
  
  return controlsDiv;
}


setupTouchInteractions(container, canvas, scrollWrapper) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let initialPinchDistance = 0;
  let currentScale = 1;
  let lastTap = 0;
  let isPinching = false;
  let isPanning = false;
  let hasMovedSignificantly = false;
  
  // Pan state
  let panX = 0;
  let panY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let lastPanX = 0;
  let lastPanY = 0;
  
  // Update canvas transform with both scale and pan
  const updateTransform = () => {
    canvas.style.transform = `scale(${currentScale}) translate(${panX}px, ${panY}px)`;
  };
  
  // Touch start
  container.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    isPinching = false;
    isPanning = false;
    hasMovedSignificantly = false;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      panStartX = touch.clientX;
      panStartY = touch.clientY;
      lastPanX = panX;
      lastPanY = panY;
      
      // Always enable panning for single finger
      isPanning = true;
      e.preventDefault();
      
    } else if (e.touches.length === 2) {
      // Pinch start
      isPinching = true;
      isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Store current scale
      currentScale = getCurrentScale();
    }
  }, { passive: false });
  
  // Get current scale from transform
  const getCurrentScale = () => {
    const transform = canvas.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  };
  
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
      
      // When scaling down to near 1x, reset pan if not significantly moved
      if (newScale <= 1.1 && !hasMovedSignificantly) {
        panX = 0;
        panY = 0;
      }
      
      currentScale = newScale;
      updateTransform();
      initialPinchDistance = distance;
      
    } else if (isPanning && e.touches.length === 1) {
      // Handle panning for any zoom level
      e.preventDefault();
      const touch = e.touches[0];
      
      // Calculate movement from start
      const totalDeltaX = touch.clientX - touchStartX;
      const totalDeltaY = touch.clientY - touchStartY;
      const totalMovement = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
      
      // Mark as significant movement if moved more than 10px
      if (totalMovement > 10) {
        hasMovedSignificantly = true;
      }
      
      // Calculate pan delta (invert for natural movement)
      const deltaX = (touch.clientX - panStartX) / currentScale;
      const deltaY = (touch.clientY - panStartY) / currentScale;
      
      panX = lastPanX + deltaX;
      panY = lastPanY + deltaY;
      
      // Apply bounds to prevent panning too far (more generous bounds for 1x scale)
      const bounds = getPanBounds();
      panX = Math.max(bounds.minX, Math.min(bounds.maxX, panX));
      panY = Math.max(bounds.minY, Math.min(bounds.maxY, panY));
      
      updateTransform();
    }
  }, { passive: false });
  
  // Calculate pan boundaries (more generous for 1x scale)
  const getPanBounds = () => {
    const containerRect = scrollWrapper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // For 1x scale, allow some panning for repositioning
    if (currentScale <= 1.1) {
      const maxPan = Math.min(100, containerRect.width * 0.3); // Allow 30% of container width or 100px max
      return {
        minX: -maxPan / currentScale,
        maxX: maxPan / currentScale,
        minY: -maxPan / currentScale,
        maxY: maxPan / currentScale
      };
    }
    
    // For zoomed scale, calculate based on actual content overflow
    const scaledWidth = canvasRect.width / currentScale * currentScale;
    const scaledHeight = canvasRect.height / currentScale * currentScale;
    
    const excessWidth = Math.max(0, (scaledWidth - containerRect.width) / 2 / currentScale);
    const excessHeight = Math.max(0, (scaledHeight - containerRect.height) / 2 / currentScale);
    
    return {
      minX: -excessWidth,
      maxX: excessWidth,
      minY: -excessHeight,
      maxY: excessHeight
    };
  };
  
  // Touch end
  container.addEventListener('touchend', (e) => {
    if (isPanning && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Only treat as swipe if:
      // 1. Not zoomed in significantly (< 1.3x)
      // 2. Horizontal movement dominates
      // 3. Quick gesture (< 500ms)
      // 4. Significant horizontal distance (> 80px)
      // 5. Not much vertical movement
      // 6. Haven't moved significantly overall (not a pan)
      if (currentScale < 1.5 && 
        absDeltaX > 50 && 
        absDeltaX > absDeltaY * 1.2 && 
        touchDuration < 700 &&
        absDeltaY < 80) {
        
        if (deltaX > 0) {
          // Swipe right - previous page
          this.goToMobilePage(this.currentPage - 1);
        } else {
          // Swipe left - next page
          this.goToMobilePage(this.currentPage + 1);
        }
      }
      
      // Double tap detection
      const currentTime = Date.now();
      if (currentTime - lastTap < 300 && !hasMovedSignificantly) {
        // Reset zoom and pan
        currentScale = 1;
        panX = 0;
        panY = 0;
        updateTransform();
      }
      lastTap = currentTime;
    }
    
    // Reset states
    isPanning = false;
    isPinching = false;
    initialPinchDistance = 0;
    hasMovedSignificantly = false;
  }, { passive: true });
  
  // Mouse wheel support for desktop
  container.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(4, currentScale * delta));
      
      // Reset pan when zooming out to normal
      if (newScale <= 1.1) {
        panX = 0;
        panY = 0;
      }
      
      currentScale = newScale;
      updateTransform();
    }
  }, { passive: false });
  
  // Store reference for other methods to reset transforms
  this.resetTransform = () => {
    currentScale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
  };
  
  // Store reference to get current transform state
  this.getTransformState = () => ({
    scale: currentScale,
    panX: panX,
    panY: panY
  });
  
  // Method to set transform state (useful for restoring state)
  this.setTransformState = (state) => {
    currentScale = state.scale || 1;
    panX = state.panX || 0;
    panY = state.panY || 0;
    updateTransform();
  };
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

 async renderMobilePage(pageNum) {
  if (!this.currentPDF || !this.currentCanvas) return;
  
  // Cancel any ongoing render operation
  if (this.currentRenderTask) {
    this.currentRenderTask.cancel();
    this.currentRenderTask = null;
  }
  
  if (this.isRendering) {
    this.pendingPageNumber = pageNum;
    return;
  }
  
  this.isRendering = true;
  
  try {
    const page = await this.currentPDF.getPage(pageNum);
    
    const container = document.getElementById('pdf-canvas-container');
    if (!container) {
      this.isRendering = false;
      return;
    }
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = this.currentContext.webkitBackingStorePixelRatio ||
                             this.currentContext.mozBackingStorePixelRatio ||
                             this.currentContext.msBackingStorePixelRatio ||
                             this.currentContext.oBackingStorePixelRatio ||
                             this.currentContext.backingStorePixelRatio || 1;
    
    const pixelRatio = devicePixelRatio / backingStoreRatio;
    
    // FIXED: Better container size calculation with more padding
    const containerWidth = container.clientWidth - 40; // Increased padding
    const containerHeight = container.clientHeight - 40; // Increased padding
    const viewport = page.getViewport({ scale: 1 });
    
    // FIXED: More conservative scaling to ensure it fits
    const scaleX = containerWidth / viewport.width;
    const scaleY = containerHeight / viewport.height;
    let baseScale = Math.min(scaleX, scaleY) * 0.9; // Add 10% margin
    
    // FIXED: Reduce quality multiplier to prevent over-zooming
    const qualityMultiplier = Math.min(1.8, Math.max(1.2, pixelRatio)); // Reduced from 2.5/1.5
    const finalScale = baseScale * qualityMultiplier;
    
    const scaledViewport = page.getViewport({ scale: finalScale });
    
    this.currentCanvas.width = scaledViewport.width * pixelRatio;
    this.currentCanvas.height = scaledViewport.height * pixelRatio;
    
    // FIXED: Set display size to fit container better
    const displayWidth = Math.min(scaledViewport.width, containerWidth);
    const displayHeight = Math.min(scaledViewport.height, containerHeight);
    
    this.currentCanvas.style.width = displayWidth + 'px';
    this.currentCanvas.style.height = displayHeight + 'px';
    
    this.currentContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    
    // Reset any zoom/pan transforms when changing pages
    if (this.resetTransform) {
      this.resetTransform();
    } else {
      this.currentCanvas.style.transform = 'scale(1) translate(0px, 0px)';
    }
    
    this.currentContext.imageSmoothingEnabled = true;
    this.currentContext.imageSmoothingQuality = 'high';
    
    const renderContext = {
      canvasContext: this.currentContext,
      viewport: scaledViewport,
      intent: 'display',
      renderInteractiveForms: false,
      optionalContentConfigPromise: null
    };
    
    this.currentRenderTask = page.render(renderContext);
    await this.currentRenderTask.promise;
    this.currentRenderTask = null;
    
    const pageInfoElement = document.getElementById('mobile-page-info');
    if (pageInfoElement) {
      pageInfoElement.textContent = `${pageNum} / ${this.currentPDF.numPages}`;
    }
    
    console.log(`Rendered page ${pageNum} - Base scale: ${baseScale.toFixed(2)}, Final scale: ${finalScale.toFixed(2)}, Display: ${displayWidth}x${displayHeight}`);
    
  } catch (error) {
    if (error.name !== 'RenderingCancelledException') {
      console.error('Error rendering mobile page:', error);
    }
  } finally {
    this.isRendering = false;
    this.currentRenderTask = null;
    
    if (this.pendingPageNumber !== null && this.pendingPageNumber !== pageNum) {
      const nextPage = this.pendingPageNumber;
      this.pendingPageNumber = null;
      setTimeout(() => this.renderMobilePage(nextPage), 50);
    }
  }
}

 async renderDesktopPage(pageNum) {
  if (!this.currentPDF || !this.currentCanvas) return;
  
  // Cancel any ongoing render operation
  if (this.currentRenderTask) {
    this.currentRenderTask.cancel();
    this.currentRenderTask = null;
  }
  
  // If already rendering, queue this page number
  if (this.isRendering) {
    this.pendingPageNumber = pageNum;
    return;
  }
  
  this.isRendering = true;
  
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
    
    const renderContext = {
      canvasContext: this.currentContext,
      viewport: scaledViewport,
      intent: 'display'
    };
    
    // Store the render task so we can cancel it if needed
    this.currentRenderTask = page.render(renderContext);
    await this.currentRenderTask.promise;
    this.currentRenderTask = null;
    
    const pageInfoElement = document.getElementById('desktop-page-info');
    if (pageInfoElement) {
      pageInfoElement.textContent = `Page ${pageNum} of ${this.currentPDF.numPages}`;
    }
    
  } catch (error) {
    if (error.name !== 'RenderingCancelledException') {
      console.error('Error rendering desktop page:', error);
    }
  } finally {
    this.isRendering = false;
    this.currentRenderTask = null;
    
    // If there's a pending page request, process it
    if (this.pendingPageNumber !== null && this.pendingPageNumber !== pageNum) {
      const nextPage = this.pendingPageNumber;
      this.pendingPageNumber = null;
      setTimeout(() => this.renderDesktopPage(nextPage), 50);
    }
  }
}

 async goToMobilePage(pageNum) {
  if (!this.currentPDF || pageNum < 1 || pageNum > this.currentPDF.numPages) {
    return;
  }
  
  // Don't change page if we're already on it
  if (pageNum === this.currentPage) {
    return;
  }
  
  this.currentPage = pageNum;
  await this.renderMobilePage(pageNum);
}

// UPDATE your goToDesktopPage method similarly:
async goToDesktopPage(pageNum) {
  if (!this.currentPDF || pageNum < 1 || pageNum > this.currentPDF.numPages) {
    return;
  }
  
  // Don't change page if we're already on it
  if (pageNum === this.currentPage) {
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



  isMobileDevice() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  isSmallScreen() {
    return window.innerWidth < 768;
  }

  isMobileEnvironment() {
    return this.isMobileDevice() || this.isSmallScreen();
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

