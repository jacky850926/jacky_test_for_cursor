// js/dataManager.js - Manages application data (accounts, transactions, categories) and LocalStorage operations

const dataManager = (() => {
    const STATE_VERSION = '1.0'; // For potential future migrations
    const DEFAULT_STATE = {
        transactions: [],
        accounts: [
            { id: 'cash-twd', name: 'Default Cash (TWD)', currency: 'TWD', balance: 0, type: 'cash' },
            { id: 'bank-usd', name: 'Default Bank (USD)', currency: 'USD', balance: 0, type: 'bank' }
        ],
        categories: [
            { id: 'income-salary', name: 'Salary', type: 'income', subcategories: [] },
            { id: 'expense-food', name: 'Food', type: 'expense', subcategories: [
                {id: 'food-groceries', name: 'Groceries'},
                {id: 'food-restaurants', name: 'Restaurants'}
            ] },
            { id: 'expense-transport', name: 'Transportation', type: 'expense', subcategories: [] }
        ],
        userPreferences: {
            primaryCurrency: 'TWD',
            // other preferences can go here
        },
        exchangeRates: { // To store fetched rates, base currency as key
            // Example: USD: { EUR: 0.9, TWD: 30.5, ... }
        },
        appVersion: STATE_VERSION
    };

    let state = {};

    function loadData() {
        const storedState = localStorage.getItem('accountingAppState');
        if (storedState) {
            try {
                state = JSON.parse(storedState);
                // Basic migration check if needed in future
                if (!state.appVersion || state.appVersion !== STATE_VERSION) {
                    console.warn('State version mismatch or missing, potentially re-initializing parts or migrating.');
                    // For now, let's merge carefully or reset if too different
                    // This example will just overwrite with default if version is old/missing
                    // A more robust migration would be needed for production.
                    // state = { ...DEFAULT_STATE, ...state, appVersion: STATE_VERSION }; //簡易合併
                }
                 // Ensure all top-level keys from DEFAULT_STATE exist
                for (const key in DEFAULT_STATE) {
                    if (!(key in state)) {
                        state[key] = DEFAULT_STATE[key];
                    }
                }
                // Ensure nested userPreferences exists
                if (!state.userPreferences) {
                    state.userPreferences = { ...DEFAULT_STATE.userPreferences };
                } else {
                    // Ensure primaryCurrency exists within userPreferences
                    if (!state.userPreferences.primaryCurrency) {
                        state.userPreferences.primaryCurrency = DEFAULT_STATE.userPreferences.primaryCurrency;
                    }
                }
                 if (!state.exchangeRates) {
                    state.exchangeRates = { ...DEFAULT_STATE.exchangeRates };
                }


            } catch (error) {
                console.error("Error parsing stored state, re-initializing with defaults:", error);
                state = JSON.parse(JSON.stringify(DEFAULT_STATE)); // Deep copy default state
            }
        } else {
            state = JSON.parse(JSON.stringify(DEFAULT_STATE)); // Deep copy default state
        }
        console.log("Data manager initialized, state:", state);
    }

    function saveData() {
        try {
            localStorage.setItem('accountingAppState', JSON.stringify(state));
            console.log("State saved to localStorage.");
        } catch (error) {
            console.error("Error saving state to localStorage:", error);
        }
    }

    function init() {
        loadData();
        // No separate saveData call here, it's done by mutator functions
    }

    // Placeholder for account management functions
    function addAccount(name, currency, initialBalance) { console.log('addAccount called'); /* ... */ saveData(); }
    
    // Placeholder for transaction management functions
    function addTransaction(transactionData) { console.log('addTransaction called'); /* ... */ saveData(); }

    // Placeholder for category management functions
    function addMainCategory(name) { console.log('addMainCategory called'); /* ... */ saveData(); }

    // Getter for the current state (or specific parts)
    function getState() {
        return state;
    }
    
    function getPrimaryCurrency(){
        return state.userPreferences.primaryCurrency;
    }

    function setPrimaryCurrency(currencyCode){
        state.userPreferences.primaryCurrency = currencyCode;
        saveData();
    }

    function updateExchangeRates(rates){
        state.exchangeRates = rates;
        // Optionally save to localStorage if you want to cache for offline, but usually fetched fresh.
        console.log("Exchange rates updated in dataManager", state.exchangeRates);
        saveData();
    }

    // --- Primary Display Currency ---    
    function getPrimaryDisplayCurrency() {
        return state.userPreferences.primaryCurrency;
    }

    function setPrimaryDisplayCurrency(currencyCode) {
        if (state.userPreferences) {
            state.userPreferences.primaryCurrency = currencyCode;
            saveData();
            console.log(`Primary display currency set to: ${currencyCode}`);
        } else {
            console.error('userPreferences not initialized in state');
        }
    }

    // --- Exchange Rates --- (as stored in dataManager)
    function getStoredExchangeRates(baseCurrency) {
        return state.exchangeRates ? state.exchangeRates[baseCurrency] : null;
    }

    function updateStoredExchangeRates(baseCurrency, rates) {
        if (!state.exchangeRates) {
            state.exchangeRates = {};
        }
        state.exchangeRates[baseCurrency] = rates;
        saveData();
        console.log(`Exchange rates for ${baseCurrency} updated in dataManager.`);
    }

    // --- Transactions --- (basic placeholders)
    function getTransactions() {
        return [...state.transactions];
    }
    
    // --- Dashboard Calculations (Placeholders/Basic Implementation) ---
    // These would need to be more sophisticated in a real app, handling multi-currency if necessary
    // For now, they assume all transactions are in the primary display currency or need conversion (not implemented)
    function getTotalIncome(currency) {
        // Placeholder: assumes all income transactions are in the target currency
        // In a real app, this would require currency conversion if transactions are in different currencies
        return state.transactions
            .filter(t => t.type === 'income' && t.currency === currency) // Simplistic filter
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    }

    function getTotalExpense(currency) {
        // Placeholder: assumes all expense transactions are in the target currency
        return state.transactions
            .filter(t => t.type === 'expense' && t.currency === currency)
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    }

    function getBalance(currency) {
        // Placeholder: simple balance based on filtered income and expense
        const income = getTotalIncome(currency);
        const expense = getTotalExpense(currency);
        return income - expense;
    }

    // --- Accounts --- (basic placeholders)
    function getAccounts() {
        return [...state.accounts];
    }

    function addAccount(account) {
        state.accounts.push(account);
        saveData();
    }

    // --- Categories --- (basic placeholders)
    function getCategories(type = null) { // type can be 'income' or 'expense' or null for all
        let filteredCategories = state.categories;
        if (type) {
            filteredCategories = state.categories.filter(c => c.type === type);
        }
        return [...filteredCategories];
    }

    function addCategory(category) {
        state.categories.push(category);
        saveData();
    }

    function getSubCategories(mainCategoryId) {
        const mainCategory = state.categories.find(c => c.id === mainCategoryId);
        return mainCategory && mainCategory.subcategories ? [...mainCategory.subcategories] : [];
    }

    function addSubCategory(mainCategoryId, subCategory) {
        const mainCategory = state.categories.find(c => c.id === mainCategoryId);
        if (mainCategory) {
            if (!mainCategory.subcategories) {
                mainCategory.subcategories = [];
            }
            mainCategory.subcategories.push(subCategory);
            saveData();
            return true;
        }
        return false;
    }

    return {
        init,
        addAccount,
        addTransaction,
        addMainCategory,
        getState,
        getPrimaryCurrency,
        setPrimaryCurrency,
        updateExchangeRates,
        getPrimaryDisplayCurrency,
        setPrimaryDisplayCurrency,
        getTransactions,
        getTotalIncome,
        getTotalExpense,
        getBalance,
        getAccounts,
        addAccount,
        getCategories,
        addCategory,
        getSubCategories,
        addSubCategory
    };
})(); 