document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');
    const dateInput = document.getElementById('date');
    const transactionCurrencySelect = document.getElementById('transaction-currency');

    // New elements for exchange rates
    const baseCurrencySelector = document.getElementById('base-currency-selector');
    const exchangeRateListEl = document.getElementById('exchange-rate-list');
    const displayBaseCurrencyEl = document.getElementById('display-base-currency');
    const ratesDateEl = document.getElementById('rates-date');
    const FRANKFURTER_API_BASE = 'https://api.frankfurter.app';

    // Overall Summary Elements (Primary Currency)
    const overallTotalIncomeEl = document.getElementById('overall-total-income');
    const overallTotalExpenseEl = document.getElementById('overall-total-expense');
    const overallBalanceEl = document.getElementById('overall-balance');
    const primaryCurrencyDisplaySpans = document.querySelectorAll('.primary-currency-display');
    const primaryCurrencySelector = document.getElementById('primary-currency-selector');

    // Per-Currency Summary Container
    const perCurrencySummaryContainer = document.getElementById('per-currency-summary-container');

    const newCategoryInput = document.getElementById('new-category-input');
    const addNewCategoryBtn = document.getElementById('add-new-category-btn');

    const transactionAccountSelect = document.getElementById('transaction-account');
    const newAccountInput = document.getElementById('new-account-input');
    const addNewAccountBtn = document.getElementById('add-new-account-btn');

    // Set default date to today
    dateInput.valueAsDate = new Date();

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let primaryCurrency = localStorage.getItem('primaryCurrency') || 'TWD'; // Load primary currency, default TWD
    let latestRates = {}; // To cache fetched rates for conversions
    let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function savePrimaryCurrency() {
        localStorage.setItem('primaryCurrency', primaryCurrency);
    }

    function saveCustomCategories() {
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
    }

    function saveAccounts() {
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    function populateAccountSelector() {
        if (!transactionAccountSelect) return;
        transactionAccountSelect.innerHTML = ''; // Clear existing
        accounts.forEach(accountName => {
            const option = document.createElement('option');
            option.value = accountName;
            option.textContent = accountName;
            transactionAccountSelect.appendChild(option);
        });
        // Set a default if no account is selected or if the list is empty
        if (transactionAccountSelect.options.length > 0) {
            if (!transactionAccountSelect.value) {
                 transactionAccountSelect.value = transactionAccountSelect.options[0].value;
            }
        } else {
            // Optionally add a placeholder or a default like "Default Account"
            // For now, it will be empty if no accounts are added.
        }
    }

    function addTransactionDOM(transaction) {
        const item = document.createElement('li');
        item.classList.add(transaction.type);

        // Determine amount class based on transaction type for specific styling
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';

        item.innerHTML = `
            <span class="account-display">[${transaction.account}]</span>
            <span class="description">${transaction.description}</span>
            <span class="amount ${amountClass}">${transaction.currency} ${transaction.type === 'income' ? '' : '-'}${Math.abs(transaction.amount).toLocaleString()}</span>
            <span class="date">${transaction.date}</span>
            <button class="delete-btn" data-id="${transaction.id}">刪除</button>
        `;
        transactionList.appendChild(item);
    }

    function updateSummary() {
        // Clear previous per-currency summaries
        if(perCurrencySummaryContainer) perCurrencySummaryContainer.innerHTML = '';

        const amountsByCurrency = {};

        transactions.forEach(transaction => {
            if (!amountsByCurrency[transaction.currency]) {
                amountsByCurrency[transaction.currency] = { income: 0, expense: 0, transactions: [] };
            }
            if (transaction.amount > 0) {
                amountsByCurrency[transaction.currency].income += transaction.amount;
            } else {
                amountsByCurrency[transaction.currency].expense += Math.abs(transaction.amount);
            }
            amountsByCurrency[transaction.currency].transactions.push(transaction);
        });

        // Display per-currency summaries
        for (const currency in amountsByCurrency) {
            const summary = amountsByCurrency[currency];
            const balance = summary.income - summary.expense;
            
            const currencyCard = document.createElement('div');
            currencyCard.classList.add('card', 'per-currency-card');
            currencyCard.innerHTML = `
                <h4>${currency} 明細</h4>
                <p>收入: ${summary.income.toLocaleString()}</p>
                <p>支出: ${summary.expense.toLocaleString()}</p>
                <p>餘額: ${balance.toLocaleString()}</p>
            `;
            if(perCurrencySummaryContainer) perCurrencySummaryContainer.appendChild(currencyCard);
        }
        
        // Update overall summary in primary currency
        updateOverallSummary(); 
    }

    async function updateOverallSummary() {
        if (!overallTotalIncomeEl || !overallTotalExpenseEl || !overallBalanceEl) return;

        let overallIncome = 0;
        let overallExpense = 0;

        // Update display for primary currency in titles
        primaryCurrencyDisplaySpans.forEach(span => span.textContent = primaryCurrency);

        // Fetch rates for conversion if transactions exist
        if (transactions.length > 0) {
            try {
                // We need rates from each transaction.currency TO primaryCurrency
                // For simplicity, fetch all rates relative to USD (or any major currency) first as an intermediate step if direct rate is not simple.
                // Or, better, fetch for each transaction_currency against the primary_currency.
                // Frankfurter allows `latest?from=SOURCE&to=TARGET1,TARGET2` but only if SOURCE is EUR or USD for free tier for `to` param.
                // So, we will fetch `latest?from=transaction_currency` and look for `primaryCurrency` rate.
                // If `transaction_currency` is `primaryCurrency`, rate is 1.

                // Collect all unique transaction currencies that are not the primary currency
                const currenciesToFetchRatesFor = [...new Set(transactions.map(t => t.currency))]
                                                .filter(c => c !== primaryCurrency);
                
                // Fetch rates for these currencies against the primary currency if not already cached or if primary currency itself
                // This logic needs to be robust. For now, let's assume we fetch `latest?from=[PrimaryCurrency]`
                // And then convert. This is simpler for now.

                const ratesResponse = await fetch(`${FRANKFURTER_API_BASE}/latest?from=${primaryCurrency}`);
                if (!ratesResponse.ok) throw new Error('Could not fetch rates for overall summary');
                const fetchedRates = await ratesResponse.json();
                latestRates = fetchedRates.rates; // Cache these rates
                latestRates[primaryCurrency] = 1; // Rate of primary to itself is 1

                for (const transaction of transactions) {
                    let amountInPrimaryCurrency = transaction.amount;
                    if (transaction.currency !== primaryCurrency) {
                        const rate = latestRates[transaction.currency];
                        if (rate) {
                            // This conversion is: transaction.amount (in transaction.currency) / rate (rate is primaryCurrency per transaction.currency)
                            // Example: primary=TWD. transaction=10 USD. rate[USD] = 30 (TWD per USD)
                            // amountInPrimaryCurrency = 10 USD * 30 TWD/USD = 300 TWD.
                            // The API `latest?from=TWD` gives { "USD": 0.033 } (USD per TWD).
                            // So if primary is TWD, and transaction is USD, transaction.amount / rate[USD] is correct.
                            // transaction.amount (USD) / (USD per TWD) = TWD. This is what we need for the API structure `latest?from=PRIMARY`
                            amountInPrimaryCurrency = transaction.amount / latestRates[transaction.currency];
                        } else if (customCategories.includes(transaction.currency)){
                            // This is a custom category and not the primary currency, and no rate was found (as expected).
                            // We cannot convert this to the primary currency if the primary is an official one.
                            console.warn(`自訂類別 ${transaction.currency} 無法轉換至主要貨幣 ${primaryCurrency}。該筆交易將不計入總覽。`);
                            amountInPrimaryCurrency = null; // Indicate it shouldn't be summed for overall if conversion failed.
                        } else {
                             console.warn(`找不到從 ${transaction.currency} 到 ${primaryCurrency} 的匯率。該筆交易將不計入總覽。`);
                             amountInPrimaryCurrency = null;
                        }
                    }

                    if (amountInPrimaryCurrency !== null && typeof amountInPrimaryCurrency === 'number') {
                        if (amountInPrimaryCurrency > 0) {
                            overallIncome += amountInPrimaryCurrency;
                        } else {
                            overallExpense += Math.abs(amountInPrimaryCurrency);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching rates for overall summary:", error);
                // Display a message or use unconverted sums as a fallback?
                overallTotalIncomeEl.textContent = 'Error';
                overallTotalExpenseEl.textContent = 'Error';
                overallBalanceEl.textContent = 'Error';
                return;
            }
        }

        overallTotalIncomeEl.textContent = `${primaryCurrency} ${overallIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        overallTotalExpenseEl.textContent = `${primaryCurrency} ${overallExpense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        const overallBal = overallIncome - overallExpense;
        overallBalanceEl.textContent = `${primaryCurrency} ${overallBal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    function addTransaction(e) {
        e.preventDefault();

        const type = document.getElementById('type').value;
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const currency = transactionCurrencySelect.value;
        const account = transactionAccountSelect.value;

        if (description.trim() === '' || isNaN(amount) || date === '' || currency === '' || account === '') {
            alert('請填寫所有欄位，包括帳戶和幣種');
            return;
        }

        const transaction = {
            id: generateID(),
            type: type,
            description: description,
            amount: type === 'income' ? amount : -amount, 
            currency: currency, 
            account: account,
            date: date
        };

        transactions.push(transaction);
        addTransactionDOM(transaction);
        updateSummary();
        saveTransactions();

        transactionForm.reset();
        dateInput.valueAsDate = new Date(); // Reset date to today after submission
        
        // Ensure transaction currency defaults back to primary currency after form reset
        if (transactionCurrencySelect) { 
            const options = Array.from(transactionCurrencySelect.options).map(opt => opt.value);
            if (primaryCurrency && options.includes(primaryCurrency)) {
                transactionCurrencySelect.value = primaryCurrency;
            } else if (options.includes('TWD')) { // Fallback to TWD if primary not found or not set
                transactionCurrencySelect.value = 'TWD'; 
            } else if (options.length > 0) {
                 transactionCurrencySelect.value = options[0]; // Fallback to first if TWD not found
            }
        }

        // Populate accounts selector
        populateAccountSelector();
    }

    function generateID() {
        return Math.floor(Math.random() * 1000000000);
    }

    function removeTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        init();
    }

    function init() {
        transactionList.innerHTML = '';
        transactions.forEach(addTransactionDOM);
        updateSummary();
    }

    transactionForm.addEventListener('submit', addTransaction);

    transactionList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            removeTransaction(id);
        }
    });

    init();

    // --- Exchange Rate Functionality ---

    async function fetchCurrenciesAndPopulateSelector() {
        try {
            const response = await fetch(`${FRANKFURTER_API_BASE}/currencies`);
            if (!response.ok) {
                console.warn("無法從 API 獲取貨幣列表，將僅使用自訂類別和預設 TWD。");
                // Even if API fails, proceed with custom categories and default TWD
            }
            const currenciesFromAPI = response.ok ? await response.json() : {};

            const allCurrencyOptions = {};

            // 1. Add custom categories first
            customCategories.forEach(customCat => {
                allCurrencyOptions[customCat] = `${customCat} (自訂)`;
            });

            // 2. Then overlay/add API currencies. API names take precedence if code is same.
            for (const currencyCode in currenciesFromAPI) {
                allCurrencyOptions[currencyCode] = `${currencyCode} - ${currenciesFromAPI[currencyCode]}`;
            }
            
            // 3. Ensure TWD is present.
            if (!allCurrencyOptions['TWD']) {
                allCurrencyOptions['TWD'] = 'TWD - 新台幣 (預設)'; 
            }
            
            // Clear existing options before populating
            baseCurrencySelector.innerHTML = '';
            transactionCurrencySelect.innerHTML = '';
            primaryCurrencySelector.innerHTML = '';

            for (const code in allCurrencyOptions) {
                const optionText = allCurrencyOptions[code];
                const option = document.createElement('option');
                option.value = code;
                option.textContent = optionText;

                baseCurrencySelector.appendChild(option.cloneNode(true));
                transactionCurrencySelect.appendChild(option.cloneNode(true));
                primaryCurrencySelector.appendChild(option.cloneNode(true));
            }

            // Set default selected values
            if (allCurrencyOptions['TWD']) {
                baseCurrencySelector.value = 'TWD';
                transactionCurrencySelect.value = 'TWD';
            } else if (Object.keys(allCurrencyOptions).length > 0) {
                const firstKey = Object.keys(allCurrencyOptions)[0];
                baseCurrencySelector.value = firstKey;
                transactionCurrencySelect.value = firstKey;
            }

            // Set primary currency, ensuring it exists in the populated list
            if (allCurrencyOptions[primaryCurrency]) {
                primaryCurrencySelector.value = primaryCurrency;
            } else if (Object.keys(allCurrencyOptions).length > 0) {
                primaryCurrency = Object.keys(allCurrencyOptions)[0];
                primaryCurrencySelector.value = primaryCurrency;
                savePrimaryCurrency();
            } else {
                // No currencies at all, handle gracefully (e.g. disable selector or show message)
                // This case should be rare if API call succeeds or custom categories exist.
            }

            // populateAccountSelector(); // This was correctly called once during overall initialization (e.g. in init() or DOMContentLoaded)

        } catch (error) {
            console.error("獲取貨幣時發生錯誤:", error);
            exchangeRateListEl.innerHTML = '<li>無法載入貨幣數據。</li>';
        }
    }

    async function fetchAndDisplayRates(baseCurrency) {
        if (!baseCurrency) {
            exchangeRateListEl.innerHTML = '<li>請選擇基準貨幣。</li>';
            displayBaseCurrencyEl.textContent = '---';
            ratesDateEl.textContent = '---';
            return;
        }
        // Check if the baseCurrency is a custom category without official rates
        if (customCategories.includes(baseCurrency) && !(await isOfficialCurrency(baseCurrency))) {
            exchangeRateListEl.innerHTML = `<li>${baseCurrency} 是自訂類別，無可用匯率數據。</li>`;
            displayBaseCurrencyEl.textContent = baseCurrency;
            ratesDateEl.textContent = 'N/A';
            return;
        }
        exchangeRateListEl.innerHTML = '<li>載入中...</li>'; // Loading indicator
        try {
            const response = await fetch(`${FRANKFURTER_API_BASE}/latest?from=${baseCurrency}`);
            if (!response.ok) {
                throw new Error(`無法獲取匯率： ${response.statusText}`);
            }
            const data = await response.json();
            
            displayBaseCurrencyEl.textContent = data.base;
            ratesDateEl.textContent = data.date;
            
            displayRates(data.rates, data.base);

        } catch (error) {
            console.error(`獲取 ${baseCurrency} 匯率時發生錯誤:`, error);
            exchangeRateListEl.innerHTML = `<li>無法載入 ${baseCurrency} 的匯率數據。</li>`;
            displayBaseCurrencyEl.textContent = baseCurrency;
            ratesDateEl.textContent = '錯誤';
        }
    }

    function displayRates(rates, base) {
        exchangeRateListEl.innerHTML = ''; // Clear previous rates or loading message
        if (Object.keys(rates).length === 0) {
            exchangeRateListEl.innerHTML = `<li>沒有可用的 ${base} 匯率數據。</li>`;
            return;
        }
        for (const currency in rates) {
            const rate = rates[currency];
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="currency-code">${currency}</span>
                <span class="currency-rate">${rate.toFixed(4)}</span>
                <span class="base-comparison">(1 ${base} = ${rate.toFixed(4)} ${currency})</span>
            `;
            exchangeRateListEl.appendChild(listItem);
        }
    }

    // Event listener for currency selector
    if (baseCurrencySelector) {
        baseCurrencySelector.addEventListener('change', (e) => {
            fetchAndDisplayRates(e.target.value);
        });
    }
    // Event listener for primary currency selector
    if (primaryCurrencySelector) {
        primaryCurrencySelector.addEventListener('change', (e) => {
            primaryCurrency = e.target.value;
            savePrimaryCurrency();
            updateSummary(); // Re-calculate and display all summaries
        });
    }
    
    // Initialize exchange rate functionality
    if (baseCurrencySelector && exchangeRateListEl && displayBaseCurrencyEl && ratesDateEl) {
        fetchCurrenciesAndPopulateSelector();
    }

    // Event listener for adding a new custom category
    if (addNewCategoryBtn && newCategoryInput) {
        addNewCategoryBtn.addEventListener('click', () => {
            const newCategoryName = newCategoryInput.value.trim().toUpperCase();
            if (newCategoryName === '') {
                alert('類別名稱不可為空。');
                return;
            }

            // Check if category already exists (either as official or custom)
            let exists = false;
            for (let i = 0; i < transactionCurrencySelect.options.length; i++) {
                if (transactionCurrencySelect.options[i].value === newCategoryName) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                alert(`類別 '${newCategoryName}' 已存在。`);
                return;
            }

            customCategories.push(newCategoryName);
            saveCustomCategories();

            // Add to all relevant select elements
            const optionText = `${newCategoryName} (自訂)`;
            const newOption = document.createElement('option');
            newOption.value = newCategoryName;
            newOption.textContent = optionText;

            transactionCurrencySelect.appendChild(newOption.cloneNode(true));
            primaryCurrencySelector.appendChild(newOption.cloneNode(true));
            baseCurrencySelector.appendChild(newOption.cloneNode(true));
            
            // Optionally, select the newly added category in the transaction form
            transactionCurrencySelect.value = newCategoryName;
            newCategoryInput.value = ''; // Clear input
            alert(`自訂類別 '${newCategoryName}' 已新增。`);
        });
    }

    if (addNewAccountBtn && newAccountInput) {
        addNewAccountBtn.addEventListener('click', () => {
            const newAccountName = newAccountInput.value.trim();
            if (newAccountName === '') {
                alert('帳戶名稱不可為空。');
                return;
            }
            if (accounts.includes(newAccountName)) {
                alert(`帳戶 '${newAccountName}' 已存在。`);
                return;
            }
            accounts.push(newAccountName);
            saveAccounts();
            populateAccountSelector(); // Refresh the dropdown
            transactionAccountSelect.value = newAccountName; // Select the new account
            newAccountInput.value = ''; // Clear input
            alert(`帳戶 '${newAccountName}' 已新增。`);
        });
    }

    // Helper function to check if a currency code is official (part of API response)
    async function isOfficialCurrency(currencyCode) {
        try {
            const response = await fetch(`${FRANKFURTER_API_BASE}/currencies`);
            const officialCurrencies = await response.json();
            return officialCurrencies.hasOwnProperty(currencyCode);
        } catch (error) {
            console.error("Error checking official currencies:", error);
            return false; // Assume not official on error
        }
    }
}); 