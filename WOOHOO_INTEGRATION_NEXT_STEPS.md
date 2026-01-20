# Woohoo API Integration - Complete Documentation

## Status: READY FOR TESTING
The Woohoo API integration has been updated to match the official OAuth2.0 REST API v3 documentation exactly.

---

## 1. OAuth2.0 Authentication Flow (Per Official Docs)

### Step 1: Get Authorization Code
- **Endpoint:** `POST /oauth2/verify`
- **Body:** `{ "clientId": "...", "username": "...", "password": "..." }`
- **Response:** `{ "authorizationCode": "..." }`

### Step 2: Get Bearer Token
- **Endpoint:** `POST /oauth2/token`
- **Body:** `{ "clientId": "...", "clientSecret": "...", "authorizationCode": "..." }`
- **Response:** `{ "token": "..." }` (valid for 7 days)

---

## 2. OAuth2.0 Signature Generation (HMAC-SHA512)

For all subsequent API requests, signature is generated as follows:

1. **A** = Request Method in uppercase (GET/POST)
2. **B** = Sort query parameters alphabetically (if any)
3. **C** = URL encode complete URL using RFC3986
4. **D** = Concatenate: `A&C`
5. **E** = Sort request body keys alphabetically (for POST, including nested objects)
6. **F** = URL encode request body string
7. **G** = Concatenate: `D&F` (for POST with body)
8. **Signature** = HMAC-SHA512 hash of base string (D or G) using Client Secret

### Required Headers for All API Calls
```
Authorization: Bearer {token}
Content-Type: application/json
dateAtClient: {ISO 8601 timestamp}  (e.g., 2026-01-20T10:30:00.000Z)
signature: {HMAC-SHA512 signature}
```

---

## 3. API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/v3/catalog/categories` | Get all product categories |
| GET | `/rest/v3/catalog/categories/{id}/products` | Get products in category |
| GET | `/rest/v3/catalog/products/{sku}` | Get product details by SKU |
| POST | `/rest/v3/orders` | Create voucher order |
| GET | `/rest/v3/order/{id}/status` | Get order status |
| GET | `/rest/v3/orders/{id}` | Get order details |
| GET | `/rest/v3/order/{id}/cards/` | Get activated card details |
| POST | `/rest/v3/orders/{id}/resend` | Resend voucher to recipient |
| GET | `/rest/v3/accounts` | Get account balance |
| GET | `/rest/v3/orders` | Get transaction history |
| POST | `/rest/v3/balance` | Check card/SVC balance |

---

## 4. Environment Variables

```env
WOOHOO_USERNAME=FINPAGESAPISANDBOX@WOOHOO.IN
WOOHOO_PASSWORD=FINPAGESAPISANDBOX@1234
WOOHOO_CLIENT_ID=8af50260ae5444bdc34665c2b6e6daa9
WOOHOO_CLIENT_SECRET=93c1d8f362749dd1fe0a819ae8b5de95
WOOHOO_SVC=1122001540000377
WOOHOO_AUTH_VERIFY_URL=https://sandbox.woohoo.in/oauth2/verify
WOOHOO_TOKEN_URL=https://sandbox.woohoo.in/oauth2/token
WOOHOO_BASE_URL=https://sandbox.woohoo.in/rest
```

---

## 5. IP Whitelisting (REQUIRED)

The Woohoo sandbox API requires IP whitelisting. **Tests must run from your whitelisted server only.**

### Submit to Woohoo Support:
- **Project Name:** Dream60
- **Client ID (UAT):** 8af50260ae5444bdc34665c2b6e6daa9
- **Environment:** UAT / Sandbox
- **Server IP Address:** [Your dev-api.dream60.com server IP]

**Note:** Testing from localhost will fail with 403 CloudFront WAF error.

---

## 6. Admin Panel Endpoints

All voucher management endpoints under `/api/admin/vouchers/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/eligible-winners` | GET | Get winners ready for voucher |
| `/send` | POST | Send voucher to winner |
| `/issued` | GET | Get all issued vouchers |
| `/woohoo-balance` | GET | Check SVC balance |
| `/woohoo-transactions` | GET | Get transaction history |
| `/woohoo-categories` | GET | Get product categories |
| `/woohoo-products/:categoryId` | GET | Get products in category |
| `/woohoo-product/:sku` | GET | Get product details |
| `/woohoo-order-status/:orderId` | GET | Get order status |
| `/woohoo-order-cards/:orderId` | GET | Get activated cards |
| `/:voucherId/resend-email` | POST | Resend voucher email |
| `/:voucherId/sync` | POST | Sync status with Woohoo |

---

## 7. Testing

### Test from Whitelisted Server
```bash
# Test categories
curl https://dev-api.dream60.com/api/admin/vouchers/woohoo-categories

# Test SVC balance
curl https://dev-api.dream60.com/api/admin/vouchers/woohoo-balance
```

### Local Test Script
Run from your whitelisted server:
```bash
node test_woohoo_auth.cjs
```

---

## 8. Troubleshooting

### Error 8308: Invalid Credentials
Contact Woohoo SPOC to verify:
1. Username/password are correct
2. Account is active
3. IP is whitelisted

### Error 403: Forbidden (CloudFront WAF)
Your IP is not whitelisted. Run from whitelisted server only.

### Error: Invalid Signature
Verify:
1. Body keys are sorted alphabetically (recursively for nested objects)
2. URL is properly RFC3986 encoded
3. Client Secret is correct
4. dateAtClient is in ISO 8601 format

---

## 9. Production Checklist

After UAT sign-off:
1. Request production credentials from Woohoo
2. Update `.env` with production values
3. Whitelist production server IP
4. Load SVC balance with funds
5. Perform sanity test transaction

---

## 10. Files Reference

| File | Description |
|------|-------------|
| `src/backend/src/utils/woohooService.js` | Main Woohoo API service |
| `src/backend/src/controllers/adminVoucherController.js` | Admin API controllers |
| `src/backend/src/routes/adminRoutes.js` | Route definitions |
| `src/backend/src/models/Voucher.js` | Voucher data model |
| `test_woohoo_auth.cjs` | Standalone test script |
