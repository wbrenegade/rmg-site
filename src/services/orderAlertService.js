function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function buildOrderAlertMessage(order = {}) {
  const customerName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "Unknown customer";
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((count, item) => count + Number(item.quantity || 1), 0)
    : 0;
  const firstItem = Array.isArray(order.items) && order.items.length
    ? order.items[0].name || order.items[0].title || "Custom Decal"
    : "Custom Decal";

  return [
    `New paid order ${order.id}`,
    `${customerName} placed ${itemCount} item${itemCount === 1 ? "" : "s"}`,
    `Lead item: ${firstItem}`,
    `Total: ${formatMoney(order.total)}`,
    `Email: ${order.customer?.email || "N/A"}`,
    `Phone: ${order.customer?.phone || "N/A"}`
  ].join(" | ");
}

async function sendTwilioSms(message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;
  const toPhone = process.env.ORDER_ALERT_TO_PHONE || process.env.ALERT_TO_PHONE;

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    return { skipped: true, channel: "sms" };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: toPhone,
      From: fromPhone,
      Body: message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${errorText}`);
  }

  return { skipped: false, channel: "sms" };
}

async function sendWebhookAlert(order, message) {
  const webhookUrl = process.env.ORDER_ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    return { skipped: true, channel: "webhook" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: message,
      order
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook alert failed: ${response.status} ${errorText}`);
  }

  return { skipped: false, channel: "webhook" };
}

async function sendOrderAlert(order) {
  const message = buildOrderAlertMessage(order);
  console.info(`[order-alert] ${message}`);

  const results = await Promise.allSettled([
    sendTwilioSms(message),
    sendWebhookAlert(order, message)
  ]);

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Order alert delivery failed:", result.reason);
    }
  });

  return results;
}

module.exports = {
  sendOrderAlert,
  buildOrderAlertMessage
};
