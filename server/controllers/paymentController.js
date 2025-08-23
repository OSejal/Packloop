const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Wallet = require("../models/Wallet"); // adjust path
const Transaction = require("../models/Transaction");

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const creditAmount = amount / 100;

    //  Update wallet 
    const wallet = await Wallet.findOneAndUpdate(
       { userId: req.user.id },
      { $inc: { balance: creditAmount } },
      { new: true, upsert: true }
    );

    await Transaction.create({
      userId: req.user.id,
      amount: creditAmount,
      type: "CREDIT",
      status: "SUCCESS",
      referenceId: razorpay_payment_id
    });

    return res.json({
      success: true,
      message: "Payment verified, wallet updated",
      balance: wallet.balance
    });

  } catch (error) {
    console.error("Payment verify error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

