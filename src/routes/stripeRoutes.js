const express = require("express");
const createStripeClient = require("stripe");

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe is not configured yet." });
      return;
    }

    const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY);
    const { item, items, customer } = req.body;
    const checkoutItems = Array.isArray(items) && items.length ? items : [item].filter(Boolean);

    if (!checkoutItems.length) {
      res.status(400).json({ error: "No checkout items were provided." });
      return;
    }

    const lineItems = checkoutItems.map((checkoutItem) => {
      const name = checkoutItem?.name || checkoutItem?.title || "Custom Decal";
      const size = checkoutItem?.size || "Custom";
      const quantity = Math.max(1, Number(checkoutItem?.quantity || 1));
      const price = Math.max(0, Number(checkoutItem?.price || 0));

      if (!price) {
        throw new Error(`Missing price for ${name}.`);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${name} - ${size}`,
            description: "Custom vinyl decal order from RenegadeMade Graphix",
          },
          unit_amount: Math.round(price * 100),
        },
        quantity,
      };
    });

    const primaryItem = checkoutItems[0] || {};
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer?.email || undefined,
      customer_creation: "if_required",
      billing_address_collection: "auto",
      line_items: lineItems,
      metadata: {
        source: primaryItem?.source || "website",
        productId: primaryItem?.productId || primaryItem?.id || "custom-decal",
        size: primaryItem?.size || "Custom",
        placement: primaryItem?.settings?.placementPreset || "custom",
        customerName: [customer?.firstName, customer?.lastName].filter(Boolean).join(" "),
      },
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

module.exports = router;
