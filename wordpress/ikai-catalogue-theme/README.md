# Ikai.One Catalogue WordPress Theme

A lightweight custom WordPress theme for a product catalogue with single-product WhatsApp ordering.

## Install
1. Zip the `ikai-catalogue-theme` directory.
2. In WordPress Admin, open Appearance → Themes → Add New → Upload Theme.
3. Upload the ZIP and activate **Ikai.One Catalogue**.
4. Open Settings → Permalinks and click **Save Changes** once to refresh product URLs.

## Add products
1. Open Products → Add New Product.
2. Add a product title and description.
3. Set a Featured Image.
4. In Product Details, enter the price in PKR, optional SKU, and availability.
5. Assign a Product Category and Publish.

## WhatsApp
The order destination is configured in `functions.php` as the confirmed business number. The message contains product name, displayed price, quantity and product URL. Customers confirm stock, final price and delivery with the business in WhatsApp.

## Notes
- This theme does not collect payment or customer data.
- It does not include cart, checkout, shipping calculation or order storage.
- Do not store credentials or hosting secrets in this repository.
