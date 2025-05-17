// js/apiService.js - Handles communication with external APIs (Exchange Rate, Notion)

const apiService = (() => {
    const FRANKFURTER_API_BASE = 'https://api.frankfurter.app';
    // const NOTION_API_BASE = 'https://api.notion.com/v1';

    async function fetchCurrencies() {
        try {
            const response = await fetch(`${FRANKFURTER_API_BASE}/currencies`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching currencies:", error);
            // Optionally, rethrow or return a specific error structure
            return null; // Or an empty object/array depending on expected return type
        }
    }

    async function fetchExchangeRates(baseCurrency = 'USD') {
        try {
            if (!baseCurrency) {
                console.warn('Base currency is not provided, defaulting to USD');
                baseCurrency = 'USD';
            }
            const response = await fetch(`${FRANKFURTER_API_BASE}/latest?from=${baseCurrency}`);
            if (!response.ok) {
                // Frankfurter API might return 404 if the base currency is not supported for 'latest' endpoint directly
                // or other errors.
                const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
                console.error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }
            const data = await response.json();
            return data.rates;
        } catch (error) {
            console.error(`Error fetching exchange rates for ${baseCurrency}:`, error);
            return null; // Return null or an empty object to indicate failure
        }
    }

    // async function syncToNotion(apiKey, databaseId, dataToSync) { ... }

    return {
        fetchCurrencies,
        fetchExchangeRates,
        // syncToNotion
    };
})();

// Example usage (will be called from other modules like app.js or dataManager.js)
// apiService.fetchExchangeRates('TWD').then(data => console.log(data)); 