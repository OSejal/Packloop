// backend/routes/payment.js
const express = require ("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { verifyPayment } = require("../controllers/paymentController");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post("/orders", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    console.log("Creating Razorpay order with:", amount, currency);

    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`
    };

    const response = await razorpay.orders.create(options);
    console.log("Razorpay order response:", response);

    res.json({
      order_id: response.id,
      currency: response.currency,
      amount: response.amount
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating Razorpay order");
  }
});



router.get("/payment/:paymentId", async(req, res) => {
  const {paymentId} = req.params;

  const razorpay = new Razorpay({
    key_id: "rzp_test_R5IPYCVzJiCP0V",
    key_secret: "e5iEvFpkYs7xxWNl4zz2fuMG",
  })

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return res.status(500).json("Error at razorpay loading")
    }

    res.json({
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency
    })
  } catch(error) {
    res.status(500).json("failed to fetch");
  }
})

// Verify payment signature
router.post("/verify", verifyToken, verifyPayment);

module.exports = router;

