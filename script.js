document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');
    const dateInput = document.getElementById('date');

    // Set default date to today
    dateInput.valueAsDate = new Date();

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function addTransactionDOM(transaction) {
        const item = document.createElement('li');
        item.classList.add(transaction.type);

        // Determine amount class based on transaction type for specific styling
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';

        item.innerHTML = `
            <span class="description">${transaction.description}</span>
            <span class="amount ${amountClass}">NT$${transaction.type === 'income' ? '' : '-'}${Math.abs(transaction.amount).toLocaleString()}</span>
            <span class="date">${transaction.date}</span>
            <button class="delete-btn" data-id="${transaction.id}">刪除</button>
        `;
        transactionList.appendChild(item);
    }

    function updateSummary() {
        const amounts = transactions.map(transaction => transaction.amount);

        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => (acc += item), 0);

        const expense = amounts
            .filter(item => item < 0)
            .reduce((acc, item) => (acc += item), 0) * -1; // Make it positive for display

        const balance = income - expense;

        totalIncomeEl.textContent = `NT$${income.toLocaleString()}`;
        totalExpenseEl.textContent = `NT$${expense.toLocaleString()}`;
        balanceEl.textContent = `NT$${balance.toLocaleString()}`;
    }

    function addTransaction(e) {
        e.preventDefault();

        const type = document.getElementById('type').value;
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;

        if (description.trim() === '' || isNaN(amount) || date === '') {
            alert('請填寫所有欄位');
            return;
        }

        const transaction = {
            id: generateID(),
            type: type,
            description: description,
            amount: type === 'income' ? amount : -amount, // Store expense as negative
            date: date
        };

        transactions.push(transaction);
        addTransactionDOM(transaction);
        updateSummary();
        saveTransactions();

        transactionForm.reset();
        dateInput.valueAsDate = new Date(); // Reset date to today after submission
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
}); 