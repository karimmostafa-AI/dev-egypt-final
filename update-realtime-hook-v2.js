const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useAdminRealTimeData.ts');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('📝 Updating setupRealTimeSubscriptions and cleanup...');

// Update setupRealTimeSubscriptions function - match the exact pattern
const setupPattern = /const setupRealTimeSubscriptions = useCallback\(\(\) => \{\s*\/\/ Subscribe to product updates\s*realtimeManager\.subscribe\('products', 'update', \(event\) => \{\s*handleProductUpdate\(event\.document\);\s*\}\);\s*realtimeManager\.subscribe\('products', 'create', \(event\) => \{\s*handleProductCreate\(event\.document\);\s*\}\);\s*\/\/ Subscribe to order updates\s*realtimeManager\.subscribe\('orders', 'create', \(event\) => \{\s*handleOrderCreate\(event\.document\);\s*\}\);\s*realtimeManager\.subscribe\('orders', 'update', \(event\) => \{\s*handleOrderUpdate\(event\.document\);\s*\}\);\s*\/\/ Subscribe to stock movements for real-time updates\s*realtimeManager\.subscribe\('stock_movements', 'create', \(event\) => \{\s*handleStockMovement\(event\.document\);\s*\}\);\s*\/\/ Subscribe to inventory alerts\s*realtimeManager\.subscribe\('inventory_alerts', 'create', \(event\) => \{\s*handleInventoryAlert\(event\.document\);\s*\}\);\s*\}, \[\]\);/;

const newSetupFunction = `const setupRealTimeSubscriptions = useCallback(() => {
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

if (setupPattern.test(content)) {
  content = content.replace(setupPattern, newSetupFunction);
  console.log('✅ Updated setupRealTimeSubscriptions');
} else {
  console.log('⚠️  setupRealTimeSubscriptions pattern not found, will try alternative approach');
  
  // Alternative: Find the section and replace line by line
  const lines = content.split('\n');
  let inSetupFunc = false;
  let setupStartIdx = -1;
  let setupEndIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const setupRealTimeSubscriptions = useCallback')) {
      inSetupFunc = true;
      setupStartIdx = i;
    }
    if (inSetupFunc && lines[i].includes('}, []);') && i > setupStartIdx + 5) {
      setupEndIdx = i;
      break;
    }
  }
  
  if (setupStartIdx !== -1 && setupEndIdx !== -1) {
    const before = lines.slice(0, setupStartIdx);
    const after = lines.slice(setupEndIdx + 1);
    const setupLines = newSetupFunction.split('\n');
    lines.splice(setupStartIdx, setupEndIdx - setupStartIdx + 1, ...setupLines);
    content = lines.join('\n');
    console.log('✅ Updated setupRealTimeSubscriptions (alternative method)');
  }
}

// Update cleanup function
const cleanupPattern = /const cleanup = useCallback\(\(\) => \{\s*\/\/ Clean up real-time subscriptions\s*console\.log\('🧹 Cleaning up admin real-time subscriptions'\);\s*\}, \[\]\);/;

const newCleanupFunction = `const cleanup = useCallback(() => {
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

if (cleanupPattern.test(content)) {
  content = content.replace(cleanupPattern, newCleanupFunction);
  console.log('✅ Updated cleanup function');
} else {
  console.log('⚠️  cleanup pattern not found, will try alternative approach');
  
  // Alternative: find and replace
  const lines = content.split('\n');
  let cleanupIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const cleanup = useCallback')) {
      cleanupIdx = i;
      break;
    }
  }
  
  if (cleanupIdx !== -1) {
    // Find the end of this function
    let funcEndIdx = -1;
    for (let i = cleanupIdx + 1; i < lines.length; i++) {
      if (lines[i].includes('}, []);')) {
        funcEndIdx = i;
        break;
      }
    }
    
    if (funcEndIdx !== -1) {
      const before = lines.slice(0, cleanupIdx);
      const after = lines.slice(funcEndIdx + 1);
      const cleanupLines = newCleanupFunction.split('\n');
      lines.splice(cleanupIdx, funcEndIdx - cleanupIdx + 1, ...cleanupLines);
      content = lines.join('\n');
      console.log('✅ Updated cleanup function (alternative method)');
    }
  }
}

fs.writeFileSync(filePath, content);
console.log('\n✨ File updated successfully!');
