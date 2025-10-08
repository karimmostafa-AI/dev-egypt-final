# Environment Setup Instructions

## Quick Setup Guide

The application is now running, but you need to configure Appwrite for full functionality.

### Current Issues Fixed:
✅ **Branding Updated**: Replaced "Uniform Advantage" with "Dev Egypt" branding
✅ **Footer Logos Removed**: Cleaned up footer to show only Dev Egypt branding
✅ **Product Names Updated**: Changed "Advantage" products to "Dev Egypt" products

### To Fix API Errors:

1. **Create an Appwrite Account**:
   - Go to https://cloud.appwrite.io
   - Create a new account and project

2. **Get Your Project Configuration**:
   - Copy your Project ID from the Appwrite console
   - Copy your Database ID
   - Create an API key with these permissions:
     - `users.read` and `users.write`
     - `databases.read` and `databases.write`
     - `sessions.write`

3. **Update Environment Variables**:
   - Open `.env.local` file in your project root
   - Replace the placeholder values:
     ```env
     NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-actual-project-id
     NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-actual-database-id  
     APPWRITE_API_KEY=your-actual-api-key
     ```

4. **Create Collections in Appwrite**:
   You need to create these collections in your Appwrite database:
   - `brands` (for product brands)
   - `categories` (for product categories)
   - `products` (for product catalog)
   - `orders` (for order management)
   - `users` (for customer data)

5. **Restart the Server**:
   ```bash
   # Stop the current server (Ctrl+C in terminal)
   npm run dev
   ```

### Alternative: Use Without Appwrite
The app includes fallback data, so it will work with limited functionality even without Appwrite configuration. You'll see:
- Static product categories and brands
- Basic navigation and cart functionality
- Product catalog with sample data

### What's Working Now:
- ✅ Application runs successfully
- ✅ Dev Egypt branding throughout
- ✅ Navigation and basic functionality  
- ✅ Fallback data for products and categories
- ✅ Clean footer without old logos

### What Needs Appwrite:
- User registration and authentication
- Dynamic product management
- Order processing
- Admin panel functionality

For detailed Appwrite setup instructions, see `APPWRITE_API_KEY_SETUP.md`.