const crypto = require("crypto");
const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    console.log("Verify payment request received:", req.body);

    // Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }

    // Update balance
    wallet.balance += Number(amount);

    // Create transaction
    const transaction = {
      userId: mongoose.Types.ObjectId(userId),
      type: "CREDIT",
      amount: Number(amount),
      reason: "Wallet top-up via Razorpay",
      balanceAfter: Number(wallet.balance),
      status: "completed",
      metadata: { paymentMethod: "Razorpay" }
    };

    wallet.transactions.push(transaction);
    await wallet.save();

    console.log("Transaction saved:", transaction);

    res.status(200).json({
      success: true,
      message: "Payment verified and wallet updated",
      balance: wallet.balance,
      transaction
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Transaction creation error",
      error: error.message
    });
  }
};
