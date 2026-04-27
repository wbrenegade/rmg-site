RenegadeMade Graphix Website Starter (Node.js App)

What is included:
- Multi-page HTML storefront
- Shared CSS styling
- JavaScript product catalog, cart, login, signup, account dashboard, contact form, and demo checkout
- Privacy policy, terms, FAQ, order success page
- Node.js + Express server for page routing and APIs
- JSON-backed data storage in data/db.json
- MVC backend architecture (models, controllers, routes, middleware)

Important:
This package now runs as a Node.js app with API-backed data storage.
That means:
- products are served by the backend API
- accounts are saved via backend API (with local fallback)
- orders are saved via backend API (with local fallback)
- contact form submissions are saved via backend API (with local fallback)
- cart remains browser localStorage for quick storefront UX
- Stripe checkout is wired in, and paid orders can now trigger server-side alerts when Stripe webhooks are configured

Pages included:
- views/index.html
- views/shop.html
- views/product.html
- views/cart.html
- views/checkout.html
- views/login.html
- views/signup.html
- views/account.html
- views/contact.html
- views/privacy.html
- views/terms.html
- views/faq.html
- views/order-success.html

How to use with Node.js:
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run: npm install
4. Run: npm start
5. Open: http://localhost:3000
	- If port 3000 is already in use, the app automatically tries the next available port (3001, 3002, etc.).

Optional development mode:
- Run: npm run dev
- Uses nodemon.json to watch server.js and src/**/*.js and auto-restart the server

CMS admin panel:
- Open: http://localhost:3000/admin
- Default CMS password: changeme123
- For production, set environment variable CMS_PASSWORD to a strong value.
- You can manage:
	- Products (create, edit, delete)
	- Homepage hero text content
	- Recent orders and contact messages

API endpoints:
- GET /api/health
- GET /api/products
- GET /api/settings/public
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/orders?userId=<id>
- POST /api/orders
- POST /api/messages
- POST /api/cms/login
- GET /api/cms/products
- POST /api/cms/products
- PUT /api/cms/products/:id
- DELETE /api/cms/products/:id
- GET /api/cms/orders
- GET /api/cms/messages
- GET /api/cms/settings
- PUT /api/cms/settings
- POST /api/stripe/create-checkout-session
- POST /api/stripe/webhook

Stripe paid-order alerts:
- Set `STRIPE_SECRET_KEY` to your Stripe secret key.
- Set `SITE_URL` to your public site URL so Stripe redirects correctly.
- Set `STRIPE_WEBHOOK_SECRET` to the signing secret from your Stripe webhook endpoint.
- In Stripe, point a webhook endpoint at `/api/stripe/webhook` and subscribe to `checkout.session.completed`.
- To receive text alerts, also set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE`, and `ORDER_ALERT_TO_PHONE`.
- To receive a webhook alert in Slack, Discord, Zapier, or another service, set `ORDER_ALERT_WEBHOOK_URL`.
- If SMS/webhook credentials are missing, the server still logs each paid order alert to stdout.

MVC backend structure:
- src/models: data and persistence logic
- src/controllers: request/response handlers
- src/routes: API and page route declarations
- src/middleware: shared middleware (error handling)
- src/app.js: Express app composition
- server.js: startup entrypoint

MVC web structure:
- views/: page templates served by page controller routes
- public/assets/: static CSS, JS, images, and video served by Express static middleware
- Edit HTML in views/ and static files in public/assets/

Note:
- Root-level legacy HTML and assets folders were removed to avoid duplicate sources.
- Run the app through Node.js (npm start or npm run dev).

Best next upgrades:
- connect real checkout with Stripe or PayPal
- connect real user accounts with Supabase, Firebase, or your own backend
- replace placeholder product preview boxes with real product images
- add your logo and branding assets
- connect the contact form to email or Formspree / Netlify Forms / backend mailer
