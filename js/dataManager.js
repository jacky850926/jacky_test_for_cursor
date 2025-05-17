// js/dataManager.js - Manages application data (accounts, transactions, categories) and LocalStorage operations

const dataManager = (() => {
    let state = {
        accounts: [], // {id, name, currency, balance}
        transactions: [], // {id, type, date, description, amount, currency, accountId, categoryId, subCategoryId, ...}
        categories: [], // {id, name, subcategories: [{id, name}]}
        currentExchangeRates: {},
        notionSettings: {
            apiKey: '',
            databaseId: ''
        },
        userPreferences: {
            primaryCurrency: 'TWD' // Default primary currency
        }
    };

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving to localStorage", e);
        }
    }

    function loadData(key, defaultValue = null) {
        try {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : defaultValue;
        } catch (e) {
            console.error("Error loading from localStorage", e);
            return defaultValue;
        }
    }

    function init() {
        state.accounts = loadData('accounts', []);
        state.transactions = loadData('transactions', []);
        state.categories = loadData('categories', []);
        state.notionSettings = loadData('notionSettings', { apiKey: '', databaseId: '' });
        state.userPreferences = loadData('userPreferences', { primaryCurrency: 'TWD' });
        console.log("Data manager initialized with state:", state);
    }

    // Placeholder for account management functions
    function addAccount(name, currency, initialBalance) { console.log('addAccount called'); /* ... */ saveData('accounts', state.accounts); }
    
    // Placeholder for transaction management functions
    function addTransaction(transactionData) { console.log('addTransaction called'); /* ... */ saveData('transactions', state.transactions); }

    // Placeholder for category management functions
    function addMainCategory(name) { console.log('addMainCategory called'); /* ... */ saveData('categories', state.categories); }

    // Getter for the current state (or specific parts)
    function getState() {
        return state;
    }
    
    function getPrimaryCurrency(){
        return state.userPreferences.primaryCurrency;
    }

    function setPrimaryCurrency(currencyCode){
        state.userPreferences.primaryCurrency = currencyCode;
        saveData('userPreferences', state.userPreferences);
    }

    function updateExchangeRates(rates){
        state.currentExchangeRates = rates;
        // Optionally save to localStorage if you want to cache for offline, but usually fetched fresh.
        console.log("Exchange rates updated in dataManager", rates);
    }

    return {
        init,
        addAccount,
        addTransaction,
        addMainCategory,
        getState,
        getPrimaryCurrency,
        setPrimaryCurrency,
        updateExchangeRates
        // ... other data management functions
    };
})(); 