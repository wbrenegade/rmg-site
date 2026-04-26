const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { item, customer } = req.body;

    const name = item?.name || item?.title || "Custom Decal";
    const size = item?.size || "Custom";
    const quantity = Number(item?.quantity || 1);
    const price = Number(item?.price || 39.99);

    const unitAmount = Math.round(price * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      // customer_email: customer?.email || undefined,
      customer_creation: "if_required",
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${name} - ${size}`,
              description: "Custom vinyl decal order from RenegadeMade Graphix",
            },
            unit_amount: unitAmount,
          },
          quantity,
        },
      ],

      metadata: {
        source: item?.source || "website",
        productId: item?.productId || "custom-decal",
        size,
        placement: item?.settings?.placementPreset || "custom",
      },

      success_url: `${process.env.SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/checkout`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

module.exports = router;
