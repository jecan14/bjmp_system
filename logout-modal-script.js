// This script is designed to be robust and avoid conflicts.
// It is loaded at the end of the body, so DOMContentLoaded is not strictly necessary.

console.log("Logout script initializing...");

const logoutModal = document.getElementById('logoutModal');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

// Check if all required modal elements are on the page.
if (!logoutModal || !confirmLogoutBtn || !cancelLogoutBtn) {
    console.error("Logout modal components not found. Logout functionality will be disabled.");
} else {
    console.log("Logout modal components found. Attaching event listeners.");

    // Listen for clicks on the entire document body.
    document.body.addEventListener('click', function(event) {
        // Check if the clicked element (or its parent) is a logout button.
        if (event.target.closest('.logout-btn')) {
            console.log("Logout button clicked. Showing modal.");
            // Use stopPropagation to prevent other click listeners from interfering.
            event.stopPropagation();
            logoutModal.classList.add('show');
        }
    }, true); // Use capture phase to catch the event early.

    // Add listener for the "Yes, Logout" button.
    confirmLogoutBtn.addEventListener('click', function() {
        console.log("Logout confirmed. Submitting logout request.");
        // Create a hidden form and submit it to perform the logout.
        // This is the most reliable way to trigger a POST request for logout.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'logout.php';
        document.body.appendChild(form);
        form.submit();
    });

    // Add listener for the "Cancel" button.
    cancelLogoutBtn.addEventListener('click', function() {
        console.log("Logout cancelled.");
        logoutModal.classList.remove('show');
    });

    // Add listener to close the modal if the user clicks on the background overlay.
    logoutModal.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            console.log("Clicked outside modal content, closing modal.");
            logoutModal.classList.remove('show');
        }
    });
}
    }

    // "Cancel" button / Back button
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.classList.remove('show');
        });
    }

    // Also close modal if clicking outside of it
    logoutModal.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            logoutModal.classList.remove('show');
        }
    });
});