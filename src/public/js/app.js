// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidenav for mobile
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems);
    
    // Initialize dropdowns
    var dropdowns = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdowns);
    
    // Initialize modals
    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    
    // Initialize tooltips
    var tooltips = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltips);
    
    // Initialize select elements
    var selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
    
    // Initialize datepicker
    var datepickers = document.querySelectorAll('.datepicker');
    M.Datepicker.init(datepickers);
    
    // Initialize character counter
    var textareas = document.querySelectorAll('textarea');
    M.CharacterCounter.init(textareas);
});

// Utility functions
function showToast(message, classes = '') {
    M.toast({html: message, classes: classes});
}

function showSuccessToast(message) {
    showToast(message, 'green');
}

function showErrorToast(message) {
    showToast(message, 'red');
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}