const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useAdminRealTimeData.ts');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('📝 Updating useAdminRealTimeData hook...');

// Step 1: Add useRef to import
content = content.replace(
  "import { useEffect, useState, useCallback } from 'react';",
  "import { useEffect, useState, useCallback, useRef } from 'react';"
);
console.log('✅ Added useRef to imports');

// Step 2: Add subscriptionIdsRef after state declarations
content = content.replace(
  "  const [error, setError] = useState<string | null>(null);",
  "  const [error, setError] = useState<string | null>(null);\n\n  // Store subscription IDs for cleanup\n  const subscriptionIdsRef = useRef<string[]>([]);"
);
console.log('✅ Added subscriptionIdsRef');

// Step 3: Update setupRealTimeSubscriptions to capture subscription IDs
const oldSetupRealTime = `  const setupRealTimeSubscriptions = useCallback(() => {
    // Subscribe to product updates
    realtimeManager.subscribe('products', 'update', (event) => {
      handleProductUpdate(event.document);
    });

    realtimeManager.subscribe('products', 'create', (event) => {
      handleProductCreate(event.document);
    });

    // Subscribe to order updates
    realtimeManager.subscribe('orders', 'create', (event) => {
      handleOrderCreate(event.document);
    });

    realtimeManager.subscribe('orders', 'update', (event) => {
      handleOrderUpdate(event.document);
    });

    // Subscribe to stock movements for real-time updates
    realtimeManager.subscribe('stock_movements', 'create', (event) => {
      handleStockMovement(event.document);
    });

    // Subscribe to inventory alerts
    realtimeManager.subscribe('inventory_alerts', 'create', (event) => {
      handleInventoryAlert(event.document);
    });

  }, []);`;

const newSetupRealTime = `  const setupRealTimeSubscriptions = useCallback(() => {
    // Subscribe to product updates
    const productUpdateSubId = realtimeManager.subscribe('products', 'update', (event) => {
      handleProductUpdate(event.document);
    });
    subscriptionIdsRef.current.push(productUpdateSubId);

    const productCreateSubId = realtimeManager.subscribe('products', 'create', (event) => {
      handleProductCreate(event.document);
    });
    subscriptionIdsRef.current.push(productCreateSubId);

    // Subscribe to order updates
    const orderCreateSubId = realtimeManager.subscribe('orders', 'create', (event) => {
      handleOrderCreate(event.document);
    });
    subscriptionIdsRef.current.push(orderCreateSubId);

    const orderUpdateSubId = realtimeManager.subscribe('orders', 'update', (event) => {
      handleOrderUpdate(event.document);
    });
    subscriptionIdsRef.current.push(orderUpdateSubId);

    // Subscribe to stock movements for real-time updates
    const stockMovementSubId = realtimeManager.subscribe('stock_movements', 'create', (event) => {
      handleStockMovement(event.document);
    });
    subscriptionIdsRef.current.push(stockMovementSubId);

    // Subscribe to inventory alerts
    const inventoryAlertSubId = realtimeManager.subscribe('inventory_alerts', 'create', (event) => {
      handleInventoryAlert(event.document);
    });
    subscriptionIdsRef.current.push(inventoryAlertSubId);

  }, []);`;

content = content.replace(oldSetupRealTime, newSetupRealTime);
console.log('✅ Updated setupRealTimeSubscriptions to capture subscription IDs');

// Step 4: Update cleanup function
const oldCleanup = `  const cleanup = useCallback(() => {
    // Clean up real-time subscriptions
    console.log('🧹 Cleaning up admin real-time subscriptions');
  }, []);`;

const newCleanup = `  const cleanup = useCallback(() => {
    // Unsubscribe from all real-time subscriptions
    subscriptionIdsRef.current.forEach(subscriptionId => {
      try {
        realtimeManager.unsubscribe(subscriptionId);
      } catch (error) {
        console.error('Error unsubscribing from subscription:', error);
      }
    });
    // Clear the subscription IDs array
    subscriptionIdsRef.current = [];
    console.log('🧹 Cleaned up all admin real-time subscriptions');
  }, []);`;

content = content.replace(oldCleanup, newCleanup);
console.log('✅ Updated cleanup function to unsubscribe from all subscriptions');

fs.writeFileSync(filePath, content);
console.log('\n✨ File updated successfully!');
