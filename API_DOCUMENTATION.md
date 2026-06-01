# Threadly API Documentation

This document outlines the available API endpoints for the Threadly backend. It includes the API URL, Body, Params, Enums, and Return structures so frontend developers can easily integrate with it.

---

## Authentication Endpoints

### 1. Register a New User

- **API URL**: `POST /api/v1/auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "Password123!",
    "role": "buyer"
  }
  ```
- **Params**: None
- **Enum**:
  - `role`: `"buyer" | "seller"` (Optional, defaults to `"buyer"`)
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Registration successful",
      "data": { ...user }
    }
    ```

---

### 2. Login User

- **API URL**: `POST /api/v1/auth/login`
- **Body**:
  ```json
  {
    "email": "johndoe@example.com",
    "password": "Password123!"
  }
  ```
- **Params**: None
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "accessToken": "ey...",
        "refreshToken": "ey...",
        "user": { ... }
      }
    }
    ```

---

### 3. Verify Email

- **API URL**: `GET /api/v1/auth/verify-email/:token`
- **Body**: None
- **Params**:
  - Path Parameter: `token` (String) - The verification token sent to the user's email.
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Email successfully verified"
    }
    ```

---

### 4. Forgot Password

- **API URL**: `POST /api/v1/auth/forgot-password`
- **Body**:
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```
- **Params**: None
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Password reset email sent"
    }
    ```

---

### 5. Reset Password

- **API URL**: `POST /api/v1/auth/reset-password`
- **Body**:
  ```json
  {
    "token": "reset-token-received-in-email",
    "password": "NewPassword123!"
  }
  ```
- **Params**: None
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Password successfully reset"
    }
    ```

---

### 6. Refresh Token

- **API URL**: `POST /api/v1/auth/refresh`
- **Body**:
  ```json
  {
    "refreshToken": "ey..."
  }
  ```
- **Params**: None
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Token refreshed successfully",
      "data": {
        "accessToken": "ey...",
        "refreshToken": "ey..."
      }
    }
    ```

---

### 7. Get Current User (Me)

- **API URL**: `GET /api/v1/auth/me`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "User fetched successfully",
      "data": {
        "user": { ... }
      }
    }
    ```

---

## Sellers Endpoints

### 1. Get Public Storefront

- **API URL**: `GET /api/v1/sellers/stores/:slug`
- **Body**: None
- **Params**:
  - Path Parameter: `slug` (String) - The unique slug of the store
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Storefront fetched",
      "data": { ...storeData }
    }
    ```

### 2. Register Seller Store

- **API URL**: `POST /api/v1/sellers/register`
- **Body**:
  ```json
  {
    "storeName": "My Awesome Store",
    "description": "Store description...",
    "accountName": "John Doe",
    "accountNumber": "123456789",
    "bankName": "Bank of America"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Store registered successfully. Awaiting admin approval.",
      "data": { ...sellerProfile }
    }
    ```

### 3. Get Own Seller Profile

- **API URL**: `GET /api/v1/sellers/profile`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Profile fetched",
      "data": { ...sellerProfile }
    }
    ```

### 4. Update Own Seller Profile

- **API URL**: `PUT /api/v1/sellers/profile`
- **Body**:
  ```json
  {
    "storeName": "Updated Store Name",
    "description": "Updated description",
    "accountName": "Jane Doe",
    "accountNumber": "987654321",
    "bankName": "Chase Bank"
  }
  ```
  _(All fields are optional)_
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Profile updated",
      "data": { ...updatedProfile }
    }
    ```

### 5. Upload Store Logo

- **API URL**: `PATCH /api/v1/sellers/profile/logo`
- **Body**:
  - `multipart/form-data` containing key `image` (File)
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Logo updated",
      "data": { "logo": "cloudinary_url" }
    }
    ```

### 6. Upload Store Banner

- **API URL**: `PATCH /api/v1/sellers/profile/banner`
- **Body**:
  - `multipart/form-data` containing key `image` (File)
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Banner updated",
      "data": { "banner": "cloudinary_url" }
    }
    ```

### 7. Admin List Sellers

- **API URL**: `GET /api/v1/sellers/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Query: `status` (Optional string), `page` (Optional number), `limit` (Optional number)
- **Enum**:
  - `status`: `"pending" | "approved" | "suspended"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Sellers fetched",
      "data": [ { ...seller1 }, { ...seller2 } ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "pages": 5
      }
    }
    ```

### 8. Admin Get Seller Details

- **API URL**: `GET /api/v1/sellers/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Seller fetched",
      "data": { ...sellerProfile }
    }
    ```

### 9. Admin Update Seller Status

- **API URL**: `PATCH /api/v1/sellers/admin/:id/status`
- **Body**:
  ```json
  {
    "status": "approved",
    "adminNote": "Everything looks good."
  }
  ```
  _(adminNote is optional)_
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**:
  - `status`: `"approved" | "suspended"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Seller approved",
      "data": { ...updatedSeller }
    }
    ```

---

## Products Endpoints

### 1. List Products (Public)

- **API URL**: `GET /api/v1/products`
- **Body**: None
- **Params**:
  - Query: `category`, `seller`, `minPrice`, `maxPrice`, `size`, `color`, `rating`, `search`, `sort`, `page`, `limit`
- **Enum**:
  - `sort`: `"newest" | "price_asc" | "price_desc" | "rating"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Products fetched",
      "data": [ { ...product1 }, { ...product2 } ],
      "pagination": { ... }
    }
    ```

### 2. Get Product Detail

- **API URL**: `GET /api/v1/products/:slug`
- **Body**: None
- **Params**:
  - Path Parameter: `slug` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Product fetched",
      "data": {
        "product": { ... },
        "variants": [ ... ]
      }
    }
    ```

### 3. Create Product (Seller/Admin)

- **API URL**: `POST /api/v1/products`
- **Body**:
  ```json
  {
    "name": "Cool T-Shirt",
    "description": "A very cool shirt.",
    "categoryId": "64a1...",
    "basePrice": 29.99,
    "sellerId": "64b2...", // Optional (Admin only)
    "status": "draft",
    "attributes": [{ "key": "Material", "value": "Cotton" }]
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Product created",
      "data": { ...product }
    }
    ```

---

### 4. List My Products (Seller/Admin)

- **API URL**: `GET /api/v1/products/me`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `status`, `search`, `page`, `limit`
- **Description**: Returns products belonging to the logged-in seller, or products with no seller assigned if the user is an Admin.
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Products fetched",
      "data": [ ... ],
      "pagination": { ... }
    }
    ```

### 5. Update Product (Seller/Admin)

- **API URL**: `PUT /api/v1/products/me/:id`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "sellerId": "64b2...", // Optional (Admin only)
    "status": "active"
  }
  ```
  _(All fields optional)_
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Product updated",
      "data": { ...product }
    }
    ```

### 6. Archive Product (Seller/Admin)

- **API URL**: `DELETE /api/v1/products/me/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Product archived"
    }
    ```

### 7. Upload Product Images

- **API URL**: `POST /api/v1/products/me/:id/images`
- **Body**:
  - `multipart/form-data` containing key `images` (File array, max 8 total)
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Images uploaded",
      "data": { "images": ["..."] }
    }
    ```

### 8. Delete Product Image

- **API URL**: `DELETE /api/v1/products/me/:id/images`
- **Body**:
  ```json
  { "imageUrl": "https://..." }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Image deleted",
      "data": { "images": ["..."] }
    }
    ```

### 9. Admin List All Products

- **API URL**: `GET /api/v1/products/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Query: `category`, `seller`, `status`, `search`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Products fetched",
      "data": [ ... ],
      "pagination": { ... }
    }
    ```

### 10. Admin Force Archive

- **API URL**: `PATCH /api/v1/products/admin/:id/archive`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Product archived by admin"
    }
    ```

---

## Categories Endpoints

### 1. List Active Categories

- **API URL**: `GET /api/v1/categories`
- **Body**: None
- **Params**: None
- **Enum**: None
- **Return**:
  - **200 OK**:
    Returns an **infinitely nested tree** where each category recursively contains its subcategories inside a `children` array.
    ```json
    {
      "success": true,
      "message": "Categories fetched",
      "data": [
        {
          "_id": "64a1...",
          "name": "Mens",
          "slug": "mens",
          "parentId": null,
          "isActive": true,
          "children": [
            {
              "_id": "64b2...",
              "name": "Shirts",
              "slug": "shirts",
              "parentId": "64a1...",
              "isActive": true,
              "children": [ ...infinitely nested children... ]
            }
          ]
        }
      ]
    }
    ```

### 2. Get Category By Slug (Sub-tree)

- **API URL**: `GET /api/v1/categories/:slug`
- **Body**: None
- **Params**:
  - Path Parameter: `slug` (String) - e.g. "mens"
- **Enum**: None
- **Return**:
  - **200 OK**:
    Returns a specific category formatted as an **infinitely nested tree** of its descendants.
    ```json
    {
      "success": true,
      "data": {
        "_id": "64a1...",
        "name": "Mens",
        "slug": "mens",
        "parentId": { "_id": "...", "name": "...", "slug": "..." },
        "isActive": true,
        "children": [ ...infinitely nested children... ]
      }
    }
    ```

### 3. Admin List All Categories (Flat)

- **API URL**: `GET /api/v1/categories/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
- **Enum**: None
- **Return**:
  - **200 OK**:
    Returns a flat array of all categories (Active & Inactive).
    ```json
    {
      "success": true,
      "message": "Categories fetched",
      "data": [
        {
          "_id": "64a1...",
          "name": "Mens",
          "slug": "mens",
          "parentId": { "_id": "...", "name": "...", "slug": "..." },
          "isActive": true
        }
      ]
    }
    ```

### 4. Admin Create Category

- **API URL**: `POST /api/v1/categories/admin`
- **Body**:
  ```json
  {
    "name": "Shirts",
    "parentId": "64a1f...9c0d0",
    "isActive": true
  }
  ```
  _(parentId is optional. Omit it or set to null to create a top-level category. isActive defaults to true)_
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
- **Enum**: None
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Category created",
      "data": { ...category }
    }
    ```

### 5. Admin Upload Category Image

- **API URL**: `PATCH /api/v1/categories/admin/:id/image`
- **Body**:
  - `multipart/form-data` containing key `image` (File)
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Image uploaded",
      "data": { "image": "https://res.cloudinary.com/..." }
    }
    ```

### 6. Admin Update Category

- **API URL**: `PUT /api/v1/categories/admin/:id`
- **Body**:
  ```json
  {
    "name": "T-Shirts", // Optional
    "parentId": null, // Optional, set to null to make root
    "isActive": false // Optional
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Category updated",
      "data": { ...updatedCategory }
    }
    ```

### 7. Admin Delete Category

- **API URL**: `DELETE /api/v1/categories/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**: None
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Category deleted"
    }
    ```

---

## Inventory Endpoints

### 1. List Product Variants

- **API URL**: `GET /api/v1/inventory/:productId/variants`
- **Body**: None
- **Params**:
  - Path Parameter: `productId` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Inventory fetched",
      "data": [ { ...variant1 }, { ...variant2 } ]
    }
    ```

### 2. Add Single Variant

- **API URL**: `POST /api/v1/inventory/:productId/variants`
- **Body**:
  ```json
  {
    "sku": "TSH-RED-XL",
    "size": "XL",
    "color": "Red",
    "stock": 100,
    "price": 25.0
  }
  ```
- **Params**:
  - Path Parameter: `productId` (String)
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Variant created",
      "data": { ...variant }
    }
    ```

### 3. Bulk Add Variants

- **API URL**: `POST /api/v1/inventory/:productId/variants/bulk`
- **Body**:
  ```json
  {
    "variants": [
      {
        "sku": "TSH-RED-S",
        "size": "S",
        "color": "Red",
        "stock": 50,
        "price": 25.0
      },
      {
        "sku": "TSH-RED-M",
        "size": "M",
        "color": "Red",
        "stock": 50,
        "price": 25.0
      }
    ]
  }
  ```
- **Params**:
  - Path Parameter: `productId` (String)
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Bulk variants created",
      "data": [ ... ]
    }
    ```

### 4. Update Variant

- **API URL**: `PUT /api/v1/inventory/variants/:variantId`
- **Body**:
  ```json
  {
    "stock": 150,
    "price": 27.0,
    "size": "XL",
    "color": "Dark Red"
  }
  ```
  _(All fields optional)_
- **Params**:
  - Path Parameter: `variantId` (String)
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Variant updated",
      "data": { ...variant }
    }
    ```

### 5. Restock Variant (Add Quantity)

- **API URL**: `PATCH /api/v1/inventory/variants/:variantId/restock`
- **Body**:
  ```json
  { "quantity": 10 }
  ```
- **Params**:
  - Path Parameter: `variantId` (String)
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Restocked successfully",
      "data": { "newStock": 160 }
    }
    ```

### 6. Delete Variant

- **API URL**: `DELETE /api/v1/inventory/variants/:variantId`
- **Body**: None
- **Params**:
  - Path Parameter: `variantId` (String)
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Variant deleted"
    }
    ```

---

## Orders Endpoints

### 1. Place Order (Buyer)

- **API URL**: `POST /api/v1/orders`
- **Body**:
  ```json
  {
    "paymentMethod": "cash_on_delivery",
    "shippingAddress": {
      "addressId": "64a1f...",
      "newAddress": {
        "label": "Home",
        "fullName": "Hossam Ali",
        "street": "12 Tahrir Square",
        "city": "Cairo",
        "state": "Cairo Governorate",
        "postalCode": "11511",
        "country": "Egypt",
        "phone": "+201001234567",
        "saveToAddresses": true,
        "isDefault": true
      }
    }
  }
  ```
  _(Note: Either `addressId` or `newAddress` must be provided inside `shippingAddress`)_
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Enum**:
  - `paymentMethod`: `"credit_card" | "cash_on_delivery"`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Order placed successfully",
      "data": {
        "order": { ... },
        "orderItems": [ ... ]
      }
    }
    ```

### 2. List My Orders (Buyer)

- **API URL**: `GET /api/v1/orders`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `status`, `paymentStatus`, `from`, `to`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Orders fetched",
      "data": [ { ...order, itemCount: 3 }, ... ],
      "pagination": { ... }
    }
    ```

### 3. Get My Order Detail (Buyer)

- **API URL**: `GET /api/v1/orders/get-order/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order fetched",
      "data": {
        "order": { ... },
        "items": [ { ...orderItem, productId: { ... }, sellerId: { ... } }, ... ]
      }
    }
    ```

### 4. Cancel Order Item (Buyer)

- **API URL**: `PUT /api/v1/orders/items/:itemId/cancel`
- **Description**: Only allowed for statuses `pending` or `processing`. Releases reserved stock.
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `itemId` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order item cancelled",
      "data": { ...orderItem }
    }
    ```

### 5. Get Pending Reviews (Buyer)

- **API URL**: `GET /api/v1/orders/pending-reviews`
- **Description**: Get delivered order items not yet reviewed by the buyer.
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Pending reviews fetched",
      "data": [ { ...orderItem } ]
    }
    ```

### 6. List Seller Order Items (Seller)

- **API URL**: `GET /api/v1/orders/seller`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `status`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order items fetched",
      "data": [ { ...orderItem, orderId: { ... }, productId: { ... } }, ... ],
      "pagination": { ... }
    }
    ```

### 7. Update Order Item Status (Seller)

- **API URL**: `PUT /api/v1/orders/seller/items/:itemId/status`
- **Body**:
  ```json
  {
    "status": "shipped",
    "trackingNumber": "EG123456789"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `itemId` (String)
- **Enum**:
  - `status`: `"processing" | "shipped" | "delivered" | "cancelled"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order item status updated",
      "data": { ...orderItem }
    }
    ```

### 8. Admin Update Order Item Status (Admin)

- **API URL**: `PUT /api/v1/orders/admin/items/:itemId/status`
- **Description**: Admin can update any order item regardless of which seller it belongs to.
- **Body**:
  ```json
  {
    "status": "shipped",
    "trackingNumber": "EG123456789"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `itemId` (String)
- **Enum**:
  - `status`: `"processing" | "shipped" | "delivered" | "cancelled"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Status updated",
      "data": { ...orderItem }
    }
    ```

### 9. Admin List All Orders (Admin)

- **API URL**: `GET /api/v1/orders/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Query: `status`, `paymentStatus`, `from`, `to`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Orders fetched",
      "data": [ { ...order, buyerId: { ... } }, ... ],
      "pagination": { ... }
    }
    ```

### 10. Admin Get Order Detail (Admin)

- **API URL**: `GET /api/v1/orders/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order fetched",
      "data": {
        "order": { ...order, buyerId: { ... } },
        "items": [ { ...orderItem, productId: { ... }, sellerId: { ... } }, ... ]
      }
    }
    ```

### 11. Admin Update Order (Admin)

- **API URL**: `PATCH /api/v1/orders/admin/:id`
- **Body**:
  ```json
  {
    "status": "confirmed",
    "paymentStatus": "paid"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Order updated"
    }
    ```

---

## Payouts Endpoints

### 1. List My Payouts (Seller)

- **API URL**: `GET /api/v1/payouts/seller`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `status`, `from`, `to`, `page`, `limit`
- **Enum**:
  - `status`: `"pending" | "processing" | "paid" | "rejected"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": {
        "payouts": [ { ...payout } ],
        "pagination": { ... },
        "summary": {
          "totalEarned": 5000,
          "totalFees": 500,
          "totalNet": 4500,
          "totalPaid": 3000,
          "totalPending": 1500,
          "totalProcessing": 0
        }
      }
    }
    ```

### 2. Get My Payout Detail (Seller)

- **API URL**: `GET /api/v1/payouts/seller/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": { ...payout }
    }
    ```

### 3. Get Platform Payout Stats (Admin)

- **API URL**: `GET /api/v1/payouts/admin/stats`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": {
        "pending": { "count": 10, "netAmount": 1500 },
        "processing": { "count": 2, "netAmount": 300 },
        "paid": { "count": 50, "netAmount": 12000 },
        "rejected": { "count": 1, "netAmount": 100 }
      }
    }
    ```

### 4. Admin List All Payouts (Admin)

- **API URL**: `GET /api/v1/payouts/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Query: `status`, `seller`, `from`, `to`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": {
        "payouts": [ { ...payout } ],
        "pagination": { ... },
        "summary": {
          "totalAmount": 15000,
          "totalFees": 1500,
          "totalNet": 13500,
          "totalPaid": 10000,
          "totalPending": 3000,
          "totalProcessing": 500,
          "totalRejected": 0
        }
      }
    }
    ```

### 5. Admin Get Payout Detail (Admin)

- **API URL**: `GET /api/v1/payouts/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": { ...payout }
    }
    ```

### 6. Admin Update Payout Status (Admin)

- **API URL**: `PATCH /api/v1/payouts/admin/:id/status`
- **Body**:
  ```json
  {
    "status": "paid",
    "adminNote": "Transferred via Instapay — ref #INS20260405"
  }
  ```
  _(adminNote is optional, max 500 chars)_
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Enum**:
  - `status`: `"processing" | "paid" | "rejected"`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Payout status updated",
      "data": { ...payout }
    }
    ```

---

## Reviews Endpoints

### 1. List Product Reviews (Public)

- **API URL**: `GET /api/v1/reviews/products/:productId`
- **Body**: None
- **Params**:
  - Path Parameter: `productId` (String)
  - Query: `rating`, `sort`, `page`, `limit`
- **Enum**:
  - `sort`: `"newest" | "oldest" | "rating_asc" | "rating_desc"` (defaults to `"newest"`)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Reviews fetched",
      "data": {
        "reviews": [ { ...review } ],
        "pagination": { ... },
        "ratingBreakdown": {
          "5": 10,
          "4": 5,
          "3": 2,
          "2": 0,
          "1": 1
        },
        "averageRating": 4.3,
        "totalReviews": 18
      }
    }
    ```

### 2. List Seller Reviews (Seller)

- **API URL**: `GET /api/v1/reviews/seller`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Query: `rating`, `sort`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Reviews fetched",
      "data": [ { ...review } ],
      "pagination": { ... }
    }
    ```

### 3. Get Single Review (Public)

- **API URL**: `GET /api/v1/reviews/:id`
- **Body**: None
- **Params**:
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Review fetched",
      "data": { ...review }
    }
    ```

### 4. Submit a Review (Buyer)

- **API URL**: `POST /api/v1/reviews`
- **Body**:
  - `multipart/form-data` containing:
    - `orderItemId` (String) - The delivered OrderItem ObjectId
    - `rating` (Number) - 1 to 5
    - `comment` (String) - 5 to 2000 chars
    - `images` (File array) - Optional, max 5 images
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Review submitted",
      "data": { ...review }
    }
    ```

### 5. Delete Own Review (Buyer)

- **API URL**: `DELETE /api/v1/reviews/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Review deleted"
    }
    ```

### 6. Delete Review (Admin)

- **API URL**: `DELETE /api/v1/reviews/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Review deleted by admin"
    }
    ```

---

## Cart Endpoints

### 1. Get Cart (Buyer)

- **API URL**: `GET /api/v1/cart`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": {
        "cartId": "64a1...",
        "items": [
          {
            "inventoryId": "64b2...",
            "productId": { ... },
            "quantity": 2,
            "price": 25.0
          }
        ]
      },
      "message": "Cart fetched"
    }
    ```

---

### 2. Add Item to Cart (Buyer)

- **API URL**: `GET /api/v1/cart/items`
- **Body**:
  ```json
  {
    "inventoryId": "64b2...",
    "quantity": 2
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": { ...cart },
      "message": "Item added to cart"
    }
    ```

---

### 3. Update Cart Item (Buyer)

- **API URL**: `PUT /api/v1/cart/items/:inventoryId`
- **Body**:
  ```json
  {
    "quantity": 5
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `inventoryId` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": { ...cart },
      "message": "Cart updated"
    }
    ```

---

### 4. Remove Item from Cart (Buyer)

- **API URL**: `DELETE /api/v1/cart/items/:inventoryId`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `inventoryId` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "data": { ...cart },
      "message": "Item removed from cart"
    }
    ```

---

## Users Endpoints

### 1. Get Own Profile

- **API URL**: `GET /api/v1/users/me`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Profile fetched",
      "data": { ...userProfile }
    }
    ```

### 2. Update Own Profile

- **API URL**: `PUT /api/v1/users/me`
- **Body**:
  ```json
  {
    "name": "New Name",
    "phone": "+201001234567"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Profile updated",
      "data": { ...userProfile }
    }
    ```

### 3. Change Password

- **API URL**: `PATCH /api/v1/users/me/change-password`
- **Body**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewSecret123"
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Password changed successfully"
    }
    ```

### 4. List Addresses

- **API URL**: `GET /api/v1/users/me/addresses`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Addresses fetched",
      "data": [ { ...address } ]
    }
    ```

### 5. Add Address

- **API URL**: `POST /api/v1/users/me/addresses`
- **Body**:
  ```json
  {
    "label": "Home",
    "street": "12 Tahrir Square",
    "city": "Cairo",
    "state": "Cairo Governorate",
    "postalCode": "11511",
    "country": "Egypt",
    "isDefault": false
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
- **Return**:
  - **201 Created**:
    ```json
    {
      "success": true,
      "message": "Address added",
      "data": [ { ...address } ]
    }
    ```

### 6. Update Address

- **API URL**: `PUT /api/v1/users/me/addresses/:id`
- **Body**:
  ```json
  {
    "label": "Work",
    "isDefault": true
  }
  ```
  _(All fields optional)_
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Address updated",
      "data": [ { ...address } ]
    }
    ```

### 7. Delete Address

- **API URL**: `DELETE /api/v1/users/me/addresses/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Address deleted",
      "data": [ { ...address } ]
    }
    ```

### 8. Set Default Address

- **API URL**: `PATCH /api/v1/users/me/addresses/:id/default`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <accessToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Default address updated",
      "data": [ { ...address } ]
    }
    ```

### 9. Admin List Users

- **API URL**: `GET /api/v1/users/admin`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Query: `role`, `search`, `page`, `limit`
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "Users fetched",
      "data": [ { ...userProfile } ],
      "pagination": { ... }
    }
    ```

### 10. Admin Get User Detail

- **API URL**: `GET /api/v1/users/admin/:id`
- **Body**: None
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "User fetched",
      "data": {
        "user": { ...userProfile },
        "stats": { "orderCount": 5, "totalSpent": 1500 },
        "recentOrders": [ { ...order } ]
      }
    }
    ```

### 11. Admin Suspend/Reactivate User

- **API URL**: `PATCH /api/v1/users/admin/:id`
- **Body**:
  ```json
  {
    "isActive": false
  }
  ```
- **Params**:
  - Header: `Authorization: Bearer <adminToken>`
  - Path Parameter: `id` (String)
- **Return**:
  - **200 OK**:
    ```json
    {
      "success": true,
      "message": "User status updated",
      "data": { ...userProfile }
    }
    ```
