const express = require("express");
const createStripeClient = require("stripe");
const { createOrder, findOrderByStripeSessionId } = require("../models/orderModel");
const {
  savePendingCheckout,
  getPendingCheckoutBySessionId,
  deletePendingCheckout
} = require("../models/checkoutSessionModel");
const { sendOrderAlert } = require("../services/orderAlertService");

const router = express.Router();

function calculateTotals(items = []) {
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { subtotal, tax, total };
}

function buildFallbackItems(lineItems = []) {
  return lineItems.map((lineItem) => ({
    name: lineItem.description || "Custom Decal",
    title: lineItem.description || "Custom Decal",
    size: "Custom",
    quantity: Number(lineItem.quantity || 1),
    price: Number(((lineItem.price?.unit_amount || 0) / 100).toFixed(2))
  }));
}

async function handleCheckoutSessionCompleted(stripe, session) {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return;
  }

  const existingOrder = findOrderByStripeSessionId(session.id);
  if (existingOrder) {
    return;
  }

  const pendingCheckout = getPendingCheckoutBySessionId(session.id);
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  const fallbackItems = buildFallbackItems(lineItemsResponse.data);
  const items = pendingCheckout?.items?.length ? pendingCheckout.items : fallbackItems;
  const totals = pendingCheckout || {
    subtotal: Number(((session.amount_subtotal || 0) / 100).toFixed(2)),
    tax: Number((((session.total_details?.amount_tax || 0) / 100)).toFixed(2)),
    total: Number(((session.amount_total || 0) / 100).toFixed(2))
  };
  const customerDetails = session.customer_details || {};
  const customer = pendingCheckout?.customer || {
    firstName: customerDetails.name ? customerDetails.name.split(" ").slice(0, 1).join(" ") : "",
    lastName: customerDetails.name ? customerDetails.name.split(" ").slice(1).join(" ") : "",
    email: customerDetails.email || session.customer_email || "",
    phone: customerDetails.phone || "",
    address: customerDetails.address?.line1 || "",
    city: customerDetails.address?.city || "",
    state: customerDetails.address?.state || "",
    zip: customerDetails.address?.postal_code || "",
    country: customerDetails.address?.country || "",
    notes: ""
  };

  const order = createOrder({
    userId: pendingCheckout?.userId || "guest",
    customer,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    status: "Paid - Pending Fulfillment",
    stripeSessionId: session.id,
    paymentStatus: session.payment_status
  });

  deletePendingCheckout(session.id);
  await sendOrderAlert(order);
}

async function handleStripeWebhook(req, res) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      res.status(500).json({ error: "Stripe is not configured yet." });
      return;
    }

    const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers["stripe-signature"];
    const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    let event;

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(payload.toString("utf8"));
      console.warn("Stripe webhook secret is not configured. Webhook signatures are not being verified.");
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(stripe, event.data.object);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    res.status(400).json({ error: "Stripe webhook handling failed." });
  }
}

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
    const totals = calculateTotals(checkoutItems);

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

    savePendingCheckout({
      sessionId: session.id,
      userId: req.body?.userId || "guest",
      customer,
      items: checkoutItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

module.exports = {
  router,
  handleStripeWebhook
};
