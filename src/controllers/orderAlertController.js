const { randomUUID } = require("crypto");
const { sendOrderAlert } = require("../services/orderAlertService");

function createSampleOrder() {
  return {
    id: `test-order-${randomUUID().slice(0, 8)}`,
    userId: "cms-test",
    customer: {
      firstName: "Test",
      lastName: "Order",
      email: "test-order@example.com",
      phone: "N/A"
    },
    items: [
      {
        name: "Alert Test Decal",
        quantity: 1,
        price: 9.99
      }
    ],
    subtotal: 9.99,
    tax: 0,
    total: 9.99,
    status: "Paid - Pending Fulfillment",
    stripeSessionId: null,
    paymentStatus: "paid",
    createdAt: new Date().toISOString()
  };
}

async function sendCmsTestOrderAlert(req, res) {
  try {
    const sampleOrder = createSampleOrder();
    const results = await sendOrderAlert(sampleOrder);
    const delivered = results.filter((result) => result.ok).map((result) => result.channel);

    res.json({
      ok: true,
      message: delivered.length
        ? `Test alert sent via ${delivered.join(", ")}.`
        : "Test alert processed, but no external channel is configured.",
      results
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || "Failed to send test order alert."
    });
  }
}

module.exports = {
  sendCmsTestOrderAlert
};
