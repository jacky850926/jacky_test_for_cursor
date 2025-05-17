// js/app.js - Main application logic, event binding, initialization

document.addEventListener('DOMContentLoaded', () => {
    console.log("App initialized (app.js)");

    // Initialize managers
    dataManager.init(); // Load data from localStorage
    uiManager.init();   // Cache DOM elements

    async function initializeApp() {
        try {
            // 1. Fetch available currencies from API (or use defaults)
            const officialCurrencies = await apiService.fetchExchangeRates(); // Fetches rates relative to USD by default
            let currenciesForSelect = {};
            if (officialCurrencies && officialCurrencies.rates) {
                 // Extract currency codes for dropdown
                Object.keys(officialCurrencies.rates).forEach(code => {
                    currenciesForSelect[code] = code; // Simple list for now, can add full names later
                });
                currenciesForSelect[officialCurrencies.base] = officialCurrencies.base; // Add base currency itself
            }
            // Ensure TWD is always an option
            if (!currenciesForSelect['TWD']) {
                currenciesForSelect['TWD'] = 'TWD';
            }
            
            const currencyOptions = Object.keys(currenciesForSelect).map(code => ({ value: code, text: code }));
            
            // 2. Populate currency dropdown in transaction form
            const transactionCurrencyEl = document.getElementById('transaction-currency');
            if (transactionCurrencyEl) {
                uiManager.populateDropdown(transactionCurrencyEl, currencyOptions);
                // Set default selected currency to primary currency
                const primaryCurrency = dataManager.getPrimaryCurrency();
                if (primaryCurrency && currenciesForSelect[primaryCurrency]) {
                    transactionCurrencyEl.value = primaryCurrency;
                } else if (currenciesForSelect['TWD']) {
                    transactionCurrencyEl.value = 'TWD'; // Fallback to TWD
                } else if (currencyOptions.length > 0) {
                    transactionCurrencyEl.value = currencyOptions[0].value; // Fallback to first available
                }
            }

            // TODO: Populate account dropdown
            // TODO: Populate main category dropdown
            // TODO: Set default date for transaction-date input
            const dateInput = document.getElementById('transaction-date');
            if(dateInput) dateInput.valueAsDate = new Date();

        } catch (error) {
            console.error("Error initializing app data:", error);
            // Handle initialization error (e.g., show a toast to the user)
            if (uiManager.showToast) {
                uiManager.showToast('無法初始化應用程式數據，請稍後再試。 FAILED', 'error');
            }
        }
    }

    initializeApp();

    // TODO: Bind other event listeners (transaction type change, form submission, etc.)
}); 