// Load and display visitor details
function loadVisitorDetails() {
    const visitorId = parseInt(localStorage.getItem('viewVisitorId'));
    if (!visitorId) {
        window.location.href = 'visitor-list.html';
        return;
    }
    
    loadVisitors();
    const visitor = visitors.find(v => v.id === visitorId);
    
    if (!visitor) {
        alert('Visitor not found!');
        window.location.href = 'visitor-list.html';
        return;
    }
    
    const detailsDiv = document.getElementById('visitorDetails');
    detailsDiv.innerHTML = `
        <div class="detail-item">
            <label>Visitor Name</label>
            <p><strong>${visitor.visitorName}</strong></p>
        </div>

        <div class="detail-item">
            <label>ID Number</label>
            <p>${visitor.visitorId || 'N/A'}</p>
        </div>

        <div class="detail-item">
            <label>Contact Number</label>
            <p>${visitor.visitorContact}</p>
        </div>

        <div class="detail-item">
            <label>Relationship</label>
            <p>${visitor.relationship}</p>
        </div>

        <div class="detail-item">
            <label>Visiting Prisoner</label>
            <p><strong>${visitor.prisonerName}</strong><br>
            <small>Prisoner #${visitor.prisonerNumber}</small></p>
        </div>

        <div class="detail-item">
            <label>Visit Date</label>
            <p>${formatDate(visitor.visitDate)}</p>
        </div>

        <div class="detail-item">
            <label>Check-in Time</label>
            <p>${formatTime(visitor.visitTime)}</p>
        </div>

        <div class="detail-item">
            <label>Check-out Time</label>
            <p>
                ${visitor.checkoutTime 
                    ? formatTime(visitor.checkoutTime) + ' <span class="badge badge-success">Checked Out</span>' 
                    : '<span class="badge badge-warning">Still Inside</span>'}
            </p>
        </div>

        <div class="detail-item full-width">
            <label>Logged By</label>
            <p>${visitor.loggedBy}</p>
        </div>

        ${visitor.notes ? `
        <div class="detail-item full-width">
            <label>Notes / Remarks</label>
            <p>${visitor.notes}</p>
        </div>
        ` : ''}
    `;
    
    // Show checkout button if not checked out
    if (!visitor.checkoutTime) {
        const checkoutSection = document.getElementById('checkoutSection');
        checkoutSection.innerHTML = `
            <button class="btn btn-success" onclick="checkoutCurrentVisitor()">🚪 Check Out Visitor</button>
        `;
    }
}

// Format date nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Edit current visitor
function editCurrentVisitor() {
    const visitorId = localStorage.getItem('viewVisitorId');
    localStorage.setItem('editVisitorId', visitorId);
    window.location.href = 'edit-visitor.html';
}

// Checkout current visitor
function checkoutCurrentVisitor() {
    if (confirm('Check out this visitor?')) {
        const visitorId = parseInt(localStorage.getItem('viewVisitorId'));
        loadVisitors();
        
        const visitor = visitors.find(v => v.id === visitorId);
        if (visitor) {
            const now = new Date();
            visitor.checkoutTime = now.toTimeString().slice(0, 5);
            saveVisitors();
            
            alert('Visitor checked out successfully!');
            loadVisitorDetails(); // Reload to show updated status
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadVisitorDetails();
});
