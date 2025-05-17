// js/uiManager.js - Manages UI updates, DOM operations, modals, toasts, etc.

const uiManager = (() => {

    // Store references to frequently accessed DOM elements
    const DOM = {}; // Will be populated in init

    function init() {
        // Example: Cache DOM elements
        // DOM.accountList = document.getElementById('account-list');
        // DOM.transactionForm = document.getElementById('transaction-form');
        console.log("UI Manager initialized");
    }

    function populateDropdown(selectElement, optionsArray, valueField = 'value', textField = 'text') {
        if (!selectElement) return;
        selectElement.innerHTML = ''; // Clear existing options
        optionsArray.forEach(item => {
            const option = document.createElement('option');
            option.value = typeof item === 'object' ? item[valueField] : item;
            option.textContent = typeof item === 'object' ? item[textField] : item;
            selectElement.appendChild(option);
        });
    }

    // function renderAccountList(accountsData) { ... }
    // function renderTransactionList(transactionsData) { ... }
    // function showModal(modalId, content) { ... }
    // function showToast(message, type) { ... }

    return {
        init,
        populateDropdown,
        // renderAccountList,
        // renderTransactionList,
        // ... other UI functions
    };
})(); 