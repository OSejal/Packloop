// backend/routes/payment.js
const express = require("express");
const Razorpay = require("razorpay");
const paymentController = require("../controllers/paymentController");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const finalAmount = Math.round(Number(amount) * 100); // convert to paise

    console.log("Creating Razorpay order with amount:", finalAmount, "currency:", currency || "INR");

    const options = {
      amount: finalAmount,
      currency: currency || "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order);
    res.json(order);

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message || "Error creating Razorpay order" });
  }
});

// Fetch payment details
router.get("/:paymentId", async(req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return res.status(500).json({ error: "Failed to fetch payment details" });
    }

    res.json({
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency
    });
  } catch(error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// Verify payment signature
router.post("/verify", verifyToken, paymentController.verifyPayment);

module.exports = router;
