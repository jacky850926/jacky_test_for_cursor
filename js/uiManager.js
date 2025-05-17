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

    function populateDropdown(selectElementId, items, valueField, textField, defaultSelectedValue) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) {
            console.error(`Element with ID ${selectElementId} not found for populateDropdown.`);
            return;
        }
        selectElement.innerHTML = ''; // Clear existing options
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            selectElement.appendChild(option);
        });
        if (defaultSelectedValue) {
            selectElement.value = defaultSelectedValue;
        }
    }

    function populateCurrencyDropdown(selectElementId, currencies, defaultCurrency) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) {
            console.error(`Element with ID ${selectElementId} not found.`);
            return;
        }

        selectElement.innerHTML = ''; // Clear existing options

        // Ensure currencies is an object, as expected by Frankfurter API
        if (typeof currencies !== 'object' || currencies === null) {
            console.error('Currencies data is not a valid object:', currencies);
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Error loading currencies';
            selectElement.appendChild(errorOption);
            return;
        }

        for (const currencyCode in currencies) {
            const option = document.createElement('option');
            option.value = currencyCode;
            option.textContent = `${currencyCode} - ${currencies[currencyCode]}`;
            selectElement.appendChild(option);
        }

        if (defaultCurrency && currencies[defaultCurrency]) {
            selectElement.value = defaultCurrency;
        } else if (Object.keys(currencies).length > 0 && !defaultCurrency) {
             // If no default currency is specified, select the first one
            // selectElement.value = Object.keys(currencies)[0];
             // Or leave it, so the first one is naturally selected by the browser
        } else if (!currencies[defaultCurrency]) {
            console.warn(`Default currency ${defaultCurrency} not found in fetched currencies.`);
        }
    }

    function displayExchangeRates(rates, baseCurrency) {
        const listElement = document.getElementById('exchange-rates-list');
        const titleElement = document.getElementById('exchange-rates-title');

        if (!listElement || !titleElement) {
            console.error("Element with ID 'exchange-rates-list' or 'exchange-rates-title' not found.");
            return;
        }
        
        titleElement.textContent = baseCurrency ? `相對 ${baseCurrency} 的匯率` : '即時匯率';
        listElement.innerHTML = ''; // Clear previous rates

        if (!rates || Object.keys(rates).length === 0) {
            const listItem = document.createElement('li');
            listItem.className = 'p-2 text-gray-400 text-center';
            listItem.textContent = baseCurrency ? `無法獲取 ${baseCurrency} 的匯率。該貨幣可能不被API支援作為基礎貨幣，或發生了錯誤。` : '請選擇一個基礎貨幣以查看匯率。';
            listElement.appendChild(listItem);
            return;
        }

        for (const currency in rates) {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center p-3 bg-gray-700 rounded-md mb-2 shadow';
            
            const currencySpan = document.createElement('span');
            currencySpan.className = 'text-lg text-blue-300';
            currencySpan.textContent = currency;
            
            const rateSpan = document.createElement('span');
            rateSpan.className = 'text-lg text-pink-400';
            // Ensure rate is a number before calling toFixed
            const rateValue = parseFloat(rates[currency]);
            rateSpan.textContent = !isNaN(rateValue) ? rateValue.toFixed(4) : 'N/A';

            listItem.appendChild(currencySpan);
            listItem.appendChild(rateSpan);
            listElement.appendChild(listItem);
        }
    }

    function updateDashboardSummary(summary) {
        // summary: { totalIncome: 0, totalExpense: 0, balance: 0, currency: 'USD' }
        const primaryCurrency = summary.currency || 'N/A';
        document.getElementById('total-income').textContent = `${summary.totalIncome.toFixed(2)} ${primaryCurrency}`;
        document.getElementById('total-expense').textContent = `${summary.totalExpense.toFixed(2)} ${primaryCurrency}`;
        
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = `${summary.balance.toFixed(2)} ${primaryCurrency}`;
        if (summary.balance < 0) {
            balanceElement.classList.remove('text-green-400');
            balanceElement.classList.add('text-red-400');
        } else {
            balanceElement.classList.remove('text-red-400');
            balanceElement.classList.add('text-green-400');
        }
    }

    // function renderAccountList(accountsData) { ... }
    // function renderTransactionList(transactionsData) { ... }
    // function showModal(modalId, content) { ... }
    // function showToast(message, type) { ... }

    return {
        init,
        populateDropdown,
        populateCurrencyDropdown,
        displayExchangeRates,
        updateDashboardSummary,
        // renderAccountList,
        // renderTransactionList,
        // ... other UI functions
    };
})(); 

export { uiManager }; 