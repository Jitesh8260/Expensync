const Transaction = require("../models/Transaction");

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { title, amount, category, note, tags, date } = req.body;
        const userId = req.user;

        if (!title || amount === undefined) {
            return res.status(400).json({ message: "Title and amount are required" });
        }

        const newTransaction = new Transaction({
            title: title.trim(),
            amount: Number(amount),
            category: category?.trim() || "Others",
            note: note?.trim() || '',
            tags: tags?.map(t => t.trim()) || [],
            date: date ? new Date(date) : Date.now(),
            userId,
        });

        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// GET /transactions?page=1&limit=10 (PAGINATION)
// GET /transactions?page=1&limit=10&search=food&filter=Food
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", filter = "" } = req.query;
    const skip = (page - 1) * limit;

    // 🔎 Base query: only user's transactions
    const query = { userId: req.user };

    // ✅ Search (case-insensitive on title, note, tags)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Filter by category
    if (filter) {
      query.category = filter;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 }) // latest first
      .skip(skip)
      .limit(Number(limit))
      .lean(); // ⚡ light payload

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Failed to fetch transactions" });
  }
};


// Transaction summary
exports.getTransactionSummary = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user });

        let income = 0, expense = 0;
        transactions.forEach(txn => {
            if (txn.amount >= 0) income += txn.amount;
            else expense += Math.abs(txn.amount);
        });

        res.status(200).json({
            totalTransactions: transactions.length,
            income,
            expense,
            net: income - expense,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching summary", error: error.message });
    }
};

// Delete transaction with authorization
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user;

        const deletedTransaction = await Transaction.findOneAndDelete({ _id: id, userId });
        if (!deletedTransaction) {
            return res.status(404).json({ message: "Transaction not found or unauthorized" });
        }

        const transactions = await Transaction.find({ userId }).sort({ date: -1 });
        res.status(200).json({
            message: "Transaction deleted successfully",
            transactions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting transaction", error: error.message });
    }
};
