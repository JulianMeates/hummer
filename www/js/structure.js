function toggleSAMenu() {
    const menuOverlay = document.getElementById('SAMenuOverlay');
    const menuButton = document.querySelector('.sa-menu-button');
    menuOverlay.classList.toggle('open');
    menuButton.classList.toggle('active');
}

function toggleDetailsMenu() {
    const detailsMenuOverlay = document.getElementById('DetailsMenuOverlay');
    const detailsMenuButton = document.querySelector('.details-menu-button');
    detailsMenuOverlay.classList.toggle('open');
    detailsMenuButton.classList.toggle('active');
}

document.querySelectorAll('.sa-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSAMenu();
        console.log('Navigate to:', this.textContent);
    });
});

document.querySelectorAll('.details-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        toggleDetailsMenu();
        console.log('Open tool:', this.textContent);
    });
});

let isResizing = false;
let currentResizer = null;
let startX = 0;
let startY = 0;
let startLeftWidth = 0;
let startTopHeight = 0;

document.querySelectorAll('.vertical-resizer, .horizontal-resizer').forEach(resizer => {
    resizer.addEventListener('mousedown', initResize);
    resizer.addEventListener('touchstart', initResize);
});

function initResize(e) {
    isResizing = true;
    currentResizer = e.target;
    
    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        startX = e.clientX;
        startY = e.clientY;
    }
    
    const leftPanel = document.querySelector('.gdActions');
    const topRightPanel = document.querySelector('.sa-panel');
    
    startLeftWidth = leftPanel.offsetWidth;
    startTopHeight = topRightPanel.offsetHeight;
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', doResize);
    document.addEventListener('touchend', stopResize);
    
    e.preventDefault();
}

function doResize(e) {
    if (!isResizing) return;
    
    let clientX, clientY;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const container = document.querySelector('.container');
    const leftPanel = document.querySelector('.gdActions');
    const rightContainer = document.querySelector('.display-container');
    const topRightPanel = document.querySelector('.sa-panel');
    const bottomRightPanel = document.querySelector('.details-panel');
    
    if (currentResizer.classList.contains('vertical-resizer')) {
        const deltaX = clientX - startX;
        const containerWidth = container.offsetWidth;
        const newLeftWidth = startLeftWidth + deltaX;
        const leftPercentage = Math.max(20, Math.min(80, (newLeftWidth / containerWidth) * 100));
        const rightPercentage = 100 - leftPercentage;
        
        leftPanel.style.width = leftPercentage + '%';
        rightContainer.style.width = rightPercentage + '%';
        
    } else if (currentResizer.classList.contains('horizontal-resizer')) {
        const deltaY = clientY - startY;
        const containerHeight = rightContainer.offsetHeight;
        const newTopHeight = startTopHeight + deltaY;
        const topPercentage = Math.max(20, Math.min(80, (newTopHeight / containerHeight) * 100));
        const bottomPercentage = 100 - topPercentage;
        
        topRightPanel.style.height = `calc(${topPercentage}% - 4px)`;
        bottomRightPanel.style.height = `calc(${bottomPercentage}% - 4px)`;
    }
}

function stopResize() {
    isResizing = false;
    currentResizer = null;
    
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
}