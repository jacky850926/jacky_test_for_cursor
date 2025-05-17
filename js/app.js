// js/app.js - Main application logic, event binding, initialization

import { apiService } from './apiService.js';
import { dataManager } from './dataManager.js';
import { uiManager } from './uiManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App initialized (app.js)");

    // Cache DOM elements for sections that need dynamic content or event listeners frequently
    const DOM = {
        transactionCurrencyEl: document.getElementById('transaction-currency'),
        transactionDateInput: document.getElementById('transaction-date'),
        // For Exchange Rates Section
        baseCurrencyForRatesSelector: document.getElementById('base-currency-for-rates'), // As per blueprint
        rateDisplayList: document.getElementById('rate-display-list'), // As per blueprint
        refreshRatesBtn: document.getElementById('refresh-rates-btn'), // As per blueprint
        ratesLastUpdatedEl: document.querySelector('#exchange-rates-section .last-updated'), // Assuming a .last-updated span
        // For Dashboard Section (Primary Currency)
        primaryCurrencySelectorDashboard: document.getElementById('primary-currency-selector-dashboard'), // Assuming an ID for this selector
        overallTotalIncomeEl: document.getElementById('dashboard-total-income'), // Assuming new IDs
        overallTotalExpenseEl: document.getElementById('dashboard-total-expense'),
        overallBalanceEl: document.getElementById('dashboard-balance'),
        primaryCurrencyDisplaySpans: document.querySelectorAll('#dashboard-section .primary-currency-display')
    };

    dataManager.init(); 
    uiManager.init(DOM); // Pass cached DOM elements to uiManager if it needs them

    const exchangeRateBaseCurrencySelect = document.getElementById('exchange-rate-base-currency-select');
    const primaryCurrencySelect = document.getElementById('primary-currency-select');
    const transactionFormCurrencySelect = document.getElementById('transaction-currency');

    let fetchedCurrencies = {}; // Store fetched currencies to avoid multiple API calls

    async function loadAndPopulateCurrencies() {
        try {
            const currencies = await apiService.fetchCurrencies();
            if (currencies) {
                fetchedCurrencies = currencies; 
                // Ensure TWD is available, if not, add it manually for display purposes
                if (!fetchedCurrencies.TWD) {
                    fetchedCurrencies.TWD = "New Taiwan Dollar";
                }

                // Populate exchange rate base currency dropdown
                if (exchangeRateBaseCurrencySelect) {
                    uiManager.populateCurrencyDropdown('exchange-rate-base-currency-select', fetchedCurrencies, dataManager.getPrimaryDisplayCurrency() || 'USD');
                    await updateExchangeRates(); // Fetch and display initial rates
                }

                // Populate dashboard primary currency select
                if (primaryCurrencySelect) {
                    uiManager.populateCurrencyDropdown('primary-currency-select', fetchedCurrencies, dataManager.getPrimaryDisplayCurrency() || 'TWD');
                }

                // Populate transaction form currency select
                if (transactionFormCurrencySelect) {
                    uiManager.populateCurrencyDropdown('transaction-currency', fetchedCurrencies, dataManager.getPrimaryDisplayCurrency() || 'TWD');
                }

            } else {
                console.error("Failed to load currencies for dropdowns.");
                // Potentially display an error message to the user in the UI
                if(exchangeRateBaseCurrencySelect) exchangeRateBaseCurrencySelect.innerHTML = '<option>Error loading currencies</option>';
                if(primaryCurrencySelect) primaryCurrencySelect.innerHTML = '<option>Error loading currencies</option>';
                if(transactionFormCurrencySelect) transactionFormCurrencySelect.innerHTML = '<option>Error loading currencies</option>';
            }
        } catch (error) {
            console.error("Error in loadAndPopulateCurrencies:", error);
        }
    }

    async function updateExchangeRates() {
        if (!exchangeRateBaseCurrencySelect) return;
        const selectedBaseCurrency = exchangeRateBaseCurrencySelect.value;
        if (!selectedBaseCurrency) {
            uiManager.displayExchangeRates(null, null); // Clear or show placeholder
            return;
        }
        try {
            // console.log(`Fetching rates for: ${selectedBaseCurrency}`);
            const rates = await apiService.fetchExchangeRates(selectedBaseCurrency);
            // console.log("Rates fetched: ", rates);
            uiManager.displayExchangeRates(rates, selectedBaseCurrency);
        } catch (error) {
            console.error(`Error updating exchange rates for ${selectedBaseCurrency}:`, error);
            uiManager.displayExchangeRates(null, selectedBaseCurrency); // Display error in UI
        }
    }
    
    function updateDashboard() {
        const primaryCurrency = dataManager.getPrimaryDisplayCurrency();
        // This is a placeholder. In a real app, you would calculate these values.
        // For now, let's use some dummy data or assume it comes from dataManager
        // which would need to be developed further.
        const summary = {
            totalIncome: dataManager.getTotalIncome(primaryCurrency), // Assume these methods exist
            totalExpense: dataManager.getTotalExpense(primaryCurrency),
            balance: dataManager.getBalance(primaryCurrency),
            currency: primaryCurrency
        };
        uiManager.updateDashboardSummary(summary);
        
        // Update other dashboard elements if needed
        if (primaryCurrencySelect && primaryCurrencySelect.value !== primaryCurrency) {
            primaryCurrencySelect.value = primaryCurrency;
        }
    }

    async function initializeApp() {
        try {
            const initialBaseCurrency = 'USD'; // Default for fetching all currencies initially
            const officialCurrenciesData = await apiService.fetchExchangeRates(initialBaseCurrency);
            let currencyOptionsForSelect = [];

            if (officialCurrenciesData && officialCurrenciesData.rates) {
                currencyOptionsForSelect = Object.keys(officialCurrenciesData.rates)
                    .map(code => ({ value: code, text: `${code} - ${code}` })); // Placeholder for full name
                // Add the base currency itself to the list if not present
                if (!Object.keys(officialCurrenciesData.rates).includes(officialCurrenciesData.base)) {
                    currencyOptionsForSelect.unshift({ value: officialCurrenciesData.base, text: `${officialCurrenciesData.base} - ${officialCurrenciesData.base}` });
                }
            }
            // Ensure TWD is always an option
            if (!currencyOptionsForSelect.find(opt => opt.value === 'TWD')) {
                currencyOptionsForSelect.push({ value: 'TWD', text: 'TWD - 新台幣 (預設)' });
            }
            currencyOptionsForSelect.sort((a,b) => a.text.localeCompare(b.text)); // Sort alphabetically
            
            // Populate currency dropdown in transaction form
            if (DOM.transactionCurrencyEl) {
                uiManager.populateDropdown(DOM.transactionCurrencyEl, currencyOptionsForSelect);
                const primaryTransactionCurrency = dataManager.getPrimaryCurrency();
                 if (currencyOptionsForSelect.find(opt => opt.value === primaryTransactionCurrency)) {
                    DOM.transactionCurrencyEl.value = primaryTransactionCurrency;
                } else if (currencyOptionsForSelect.find(opt => opt.value === 'TWD')) {
                    DOM.transactionCurrencyEl.value = 'TWD';
                } else if (currencyOptionsForSelect.length > 0) {
                    DOM.transactionCurrencyEl.value = currencyOptionsForSelect[0].value;
                }
            }

            // Populate base currency selector for exchange rates section
            if (DOM.baseCurrencyForRatesSelector) {
                uiManager.populateDropdown(DOM.baseCurrencyForRatesSelector, currencyOptionsForSelect);
                // Set default for exchange rate base (e.g., TWD or primary currency)
                const defaultExchangeBase = dataManager.getPrimaryCurrency() || 'TWD';
                if (currencyOptionsForSelect.find(opt => opt.value === defaultExchangeBase)){
                    DOM.baseCurrencyForRatesSelector.value = defaultExchangeBase;
                } else if (currencyOptionsForSelect.length > 0) {
                    DOM.baseCurrencyForRatesSelector.value = currencyOptionsForSelect[0].value;
                }
                await uiManager.updateExchangeRateDisplay(DOM.baseCurrencyForRatesSelector.value); // Fetch and display initial rates
            }
            
            // TODO: Populate primary currency selector for dashboard

            if(DOM.transactionDateInput) DOM.transactionDateInput.valueAsDate = new Date();

        } catch (error) {
            console.error("Error initializing app data:", error);
            if (uiManager.showToast) {
                uiManager.showToast('無法初始化應用程式數據，請稍後再試。 ERROR', 'error');
            }
        }
    }

    // Event Listeners
    if (DOM.baseCurrencyForRatesSelector) {
        DOM.baseCurrencyForRatesSelector.addEventListener('change', (e) => {
            uiManager.updateExchangeRateDisplay(e.target.value);
        });
    }
    if (DOM.refreshRatesBtn) { // From blueprint, not yet in HTML template for this section
        DOM.refreshRatesBtn.addEventListener('click', () => {
            if(DOM.baseCurrencyForRatesSelector.value) {
                uiManager.updateExchangeRateDisplay(DOM.baseCurrencyForRatesSelector.value, true); // true to force refresh
            }
        });
    }

    if (exchangeRateBaseCurrencySelect) {
        exchangeRateBaseCurrencySelect.addEventListener('change', updateExchangeRates);
    }

    if (primaryCurrencySelect) {
        primaryCurrencySelect.addEventListener('change', (event) => {
            const newPrimaryCurrency = event.target.value;
            dataManager.setPrimaryDisplayCurrency(newPrimaryCurrency);
            updateDashboard(); // Update dashboard with new currency
            // Potentially update other parts of the UI that depend on primary currency
            // For example, if transaction amounts need to be displayed in this currency or converted
            if (transactionFormCurrencySelect && fetchedCurrencies[newPrimaryCurrency]) {
                // Optionally, update the transaction form's default currency
                // transactionFormCurrencySelect.value = newPrimaryCurrency;
            }
             // Refresh exchange rates if the dashboard currency is also used as a default base for rates
            if (exchangeRateBaseCurrencySelect && fetchedCurrencies[newPrimaryCurrency]) {
                // exchangeRateBaseCurrencySelect.value = newPrimaryCurrency;
                // updateExchangeRates(); 
                // Decided against auto-changing exchange rate base to avoid user surprise.
                // User can change it manually.
            }
        });
    }

    // Initial data load and UI setup
    await loadAndPopulateCurrencies();
    updateDashboard(); // Initial dashboard display

    // TODO: Bind other event listeners (transaction type change, form submission, dashboard primary currency change, etc.)
}); 