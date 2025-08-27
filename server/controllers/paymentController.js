const crypto = require("crypto");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    console.log("=== Incoming Verify Request ===");
    console.log("Request Body:", req.body);
    console.log("req.user:", req.user);

    // Check Razorpay secret
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ RAZORPAY_KEY_SECRET is not set!");
      return res.status(500).json({ success: false, message: "Server config error" });
    }

    // Convert amount to number
    const creditAmount = Number(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    console.log("Generated Signature:", generatedSignature);
    console.log("Received Signature:", razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch!");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Determine userId to update
    const userIdToUpdate = req.user?.id || userId;
    if (!userIdToUpdate) {
      console.error("❌ No userId found to credit wallet!");
      return res.status(400).json({ success: false, message: "User ID missing" });
    }

    console.log(`Crediting wallet of User: ${userIdToUpdate}, Amount: ${creditAmount}`);

    // Update wallet
    let wallet;
    try {
      wallet = await Wallet.findOneAndUpdate(
        { userId: userIdToUpdate },
        { $inc: { balance: creditAmount } },
        { new: true, upsert: true }
      );
      console.log("Wallet Updated:", wallet);
    } catch (err) {
      console.error("❌ Wallet update failed:", err);
      return res.status(500).json({ success: false, message: "Wallet update error" });
    }

    // Create transaction
    let transaction;
    try {
      transaction = await Transaction.create({
        userId: userIdToUpdate,
        amount: creditAmount,
        type: "CREDIT",
        status: "SUCCESS",
        referenceId: razorpay_payment_id,
      });
      console.log("Transaction Saved:", transaction);
    } catch (err) {
      console.error("❌ Transaction creation failed:", err);
      return res.status(500).json({ success: false, message: "Transaction creation error" });
    }

    // Success response
    res.json({
      success: true,
      message: "Payment verified, wallet updated",
      balance: wallet.balance,
    });

  } catch (error) {
    console.error("❌ Payment verify unexpected error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
