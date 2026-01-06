# Woohoo Integration: Next Steps & IP Whitelisting

This document outlines the essential steps to finalize your Woohoo voucher integration and move from UAT (Sandbox) to Production.

## 1. IP Whitelisting (Action Required Now)

Woohoo requires all source IP addresses to be whitelisted before you can make API calls. You must provide your server's static IP address to the Woohoo team.

### Data to Submit to Woohoo Support
Copy and send the following details to your Woohoo Program Manager (Sreehari kb) or their support team:

- **Project Name:** Dream60
- **Client ID (UAT):** 8af50260ae5444bdc34665c2b6e6daa9
- **Environment:** UAT / Sandbox
- **UAT IP Address:** [INSERT YOUR SERVER IP HERE]
- **Production IP Address:** [INSERT YOUR PRODUCTION SERVER IP HERE]

*Note: If you are testing from a local environment with a dynamic IP, whitelisting may not be feasible. It is recommended to use a staging server with a static IP.*

---

## 2. Next Integration Steps

### Step A: Verify Product SKUs
The current implementation uses a placeholder SKU (`AMAZON_GC`). 
1. Call the **Categories API** to see available categories.
2. Call the **Products API** for a specific category to get the exact `sku` for the gift cards you want to distribute (e.g., Amazon, Flipkart).
3. Update the `sku` in the Admin Panel's "Send Voucher" call or make it selectable in the UI.

### Step B: Execute UAT Test Cases
Woohoo provided a 'Test cases' sheet. You should perform these actions in the Admin Panel:
1. **Successful Distribution:** Send a voucher to an eligible winner and verify the status becomes `COMPLETE`.
2. **Handle Failure:** Test what happens if the Woohoo API returns an error (e.g., insufficient balance in SVC).
3. **Token Refresh:** Ensure the system correctly handles token expiration (implemented in `woohooService.js`).

### Step C: UAT Sign-off
Once you have successfully issued a few test vouchers:
1. Fill in the 'Test Kit' and 'Test cases' results in the provided Excel files.
2. Share the filled sheets with the Woohoo QA team for sign-off.

---

## 3. Moving to Production

After UAT sign-off, follow these steps to go live:
1. **Request Production Credentials:** Woohoo will provide a new Client ID, Client Secret, SVC, and URLs.
2. **Update Environment Variables:** Replace the `WOOHOO_*` variables in your `.env` file with production values.
3. **Load SVC Balance:** Coordinate with Woohoo to load your Virtual Account (SVC) with funds.
4. **Sanity Test:** Perform one small live transaction to confirm everything is working on the production environment.

---

## 4. Key Implementation Details
- **Token Caching:** Access tokens are stored in the database to prevent redundant "Bearer token" requests.
- **Admin Manual Control:** Vouchers are **not** sent automatically. The Admin must manually click "Send Voucher" in the "Voucher Management" section of the admin panel (`/d60-ctrl-x9k7`).
- **Payment Verification:** Only winners who have completed their claim and paid the final bid amount appear in the eligible list.
