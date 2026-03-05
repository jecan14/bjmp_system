// This script attaches a confirmation modal to any ".logout-btn" / ".logout-form" on the page.
// It is safe even if the page is restored from BFCache, and retries init if DOM wasn't ready yet.

(function () {
    if (window.__logoutModalInitialized) return;

    function tryInit() {
        if (window.__logoutModalInitialized) return true;

        const logoutModal = document.getElementById('logoutModal');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const closeIcon = document.getElementById('closeLogoutModal');

        // If the modal structure is not present yet, caller can retry later.
        if (!logoutModal || !confirmLogoutBtn || !cancelLogoutBtn) return false;

        window.__logoutModalInitialized = true;

        let pendingLogoutForm = null;

        function openLogoutModal() {
            logoutModal.classList.add('show');
        }

        function closeLogoutModal() {
            logoutModal.classList.remove('show');
            pendingLogoutForm = null;
        }

        // Intercept logout form submissions (covers button click + Enter key + other handlers).
        document.addEventListener(
            'submit',
            function (event) {
                const form = event.target;
                if (!(form instanceof HTMLFormElement)) return;
                if (!form.classList.contains('logout-form')) return;

                event.preventDefault();
                pendingLogoutForm = form;
                openLogoutModal();
            },
            true
        );

        // Also intercept direct clicks on logout buttons (in case logout is not in a form).
        document.addEventListener(
            'click',
            function (event) {
                const logoutButton = event.target.closest('.logout-btn');
                if (!logoutButton) return;

                // If this logout button is inside a logout-form, the submit handler above will handle it.
                const parentForm = logoutButton.closest('form.logout-form');
                if (parentForm) return;

                event.preventDefault();
                pendingLogoutForm = null;
                openLogoutModal();
            },
            true
        );

        // Confirm logout -> POST to logout.php
        confirmLogoutBtn.addEventListener('click', function () {
            if (pendingLogoutForm) {
                // Submit the original form (does not trigger submit event listeners).
                pendingLogoutForm.submit();
                return;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'logout.php';
            document.body.appendChild(form);
            form.submit();
        });

        // Cancel / close modal
        cancelLogoutBtn.addEventListener('click', closeLogoutModal);
        if (closeIcon) closeIcon.addEventListener('click', closeLogoutModal);

        // Close when clicking on backdrop
        logoutModal.addEventListener('click', function (event) {
            if (event.target === logoutModal) closeLogoutModal();
        });

        return true;
    }

    // Try immediately.
    if (tryInit()) return;

    // Retry when DOM is ready (covers scripts loaded in <head> or fast execution).
    document.addEventListener('DOMContentLoaded', tryInit, { once: true });

    // Retry on pageshow (covers BFCache restores).
    window.addEventListener('pageshow', tryInit);
})();
