/**
 * Decodes Base64 data associated with an HTML element and opens it in a new browser tab.
 * It expects the element to have `data-base64`, `data-mimetype`, and optionally `data-filename` attributes.
 * Whitespace is automatically removed from the Base64 data before processing.
 *
 * @param {HTMLElement} element The HTML element containing the data attributes.
 */
async function openBase64Attachment(element) {
    try {
        console.log(element);
        // Retrieve data from dataset attributes
        const base64DataRaw = element.dataset.base64;
        const mimeType = element.dataset.mimetype || 'application/octet-stream'; // Default MIME if not provided
        // Note: fileName is less relevant when opening in a tab, but kept for potential context
        const fileName = element.dataset.filename || 'file'; 

        if (!base64DataRaw) {
            console.error("No Base64 data found in data-base64 attribute on element:", element);
            alert("Could not retrieve attachment data.");
            return;
        }

        const base64Data = base64DataRaw.replaceAll(' ', '+');


        // Construct the full Data URI *only* to use it with fetch
        const dataURI = `data:${mimeType};base64,${base64Data}`;
        console.log("Data URI Length:", dataURI.length); // Still useful to know

        console.log("Decoding Base64 and creating Blob...");

        // Use fetch to easily convert Data URI to Blob
        const response = await fetch(dataURI);
        if (!response.ok) {
            throw new Error(`Failed to fetch data URI: ${response.statusText}`);
        }
        const blob = await response.blob(); // Get the data as a Blob

        // Create a temporary Blob URL
        const objectURL = URL.createObjectURL(blob);
        console.log("Created Object URL:", objectURL); // This URL will be short, like blob:http://...

        // --- Attempt to open the Blob URL ---
        // window.open is often more reliable for blob URLs than data URIs
        const newTab = window.open(objectURL, '_blank');

        // Optional: Slightly more robust popup check
         if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
             // Fallback maybe? Or just inform user. The anchor method could be tried here too.
            alert('Could not open the attachment in a new tab. Please check your browser\'s popup blocker settings.');
            console.warn("Popup blocker might have prevented opening the new tab with Blob URL.");
            URL.revokeObjectURL(objectURL); // Revoke if opening failed
            return; // Stop execution
         } else {
             console.log("New tab opened with Blob URL successfully (or at least not blocked immediately).");
             // --- Clean up the Object URL ---
             // Revoking immediately might close the new tab before it loads.
             // A common strategy is to revoke it when the *new* window unloads,
             // but that's harder to set up reliably. Revoking after a short delay
             // is a pragmatic compromise, though not guaranteed.
             // For simplicity here, we can initially omit revocation or use a timeout.
             setTimeout(() => {
                 URL.revokeObjectURL(objectURL);
                 console.log("Object URL revoked after delay.");
             }, 1000 * 30); // Revoke after 30 seconds - adjust as needed
             // Or, could try: newTab.addEventListener('unload', () => URL.revokeObjectURL(objectURL));
             // but cross-origin restrictions might prevent adding event listeners.
         }

    } catch (e) {
        console.error("Error opening Base64 attachment in new tab:", e);
        alert("An error occurred while trying to open the attachment.");
    }
}
