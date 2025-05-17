// js/apiService.js - Handles communication with external APIs (Exchange Rate, Notion)

const apiService = (() => {
    const FRANKFURTER_API_BASE = 'https://api.frankfurter.app';
    // const NOTION_API_BASE = 'https://api.notion.com/v1';

    async function fetchExchangeRates(baseCurrency = 'USD') {
        try {
            const response = await fetch(`${FRANKFURTER_API_BASE}/latest?from=${baseCurrency}`);
            if (!response.ok) {
                const errorData = await response.text();
                console.error(`Error fetching exchange rates: ${response.status} ${response.statusText}`, errorData);
                throw new Error(`Failed to fetch exchange rates for ${baseCurrency}`);
            }
            return await response.json();
        } catch (error) {
            console.error("fetchExchangeRates error:", error);
            throw error;
        }
    }

    // async function syncToNotion(apiKey, databaseId, dataToSync) { ... }

    return {
        fetchExchangeRates,
        // syncToNotion
    };
})();

// Example usage (will be called from other modules like app.js or dataManager.js)
// apiService.fetchExchangeRates('TWD').then(data => console.log(data)); 