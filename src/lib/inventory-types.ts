// Types for inventory management - Client-safe exports

export interface StockMovement {
  product_id: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_id?: string;
  reference_type?: 'order' | 'purchase' | 'manual' | 'return';
  reason?: string;
  notes?: string;
  user_id?: string;
  admin_id?: string;
  cost_impact?: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
}

export interface InventoryAlert {
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiry_warning';
  alert_level: 'warning' | 'critical' | 'info';
  current_stock: number;
  threshold_value: number;
  message: string;
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_notes?: string;
  auto_resolve: boolean;
  notification_sent: boolean;
  notification_channels?: string[];
  created_at: string;
}

export interface CartReservation {
  cart_id: string;
  session_id: string;
  user_id?: string;
  product_id: string;
  quantity_reserved: number;
  reservation_expires_at: string;
  product_price: number;
  variation_data?: any;
  is_active: boolean;
  converted_to_order: boolean;
  order_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface InventoryAdjustment {
  product_id: string;
  new_quantity: number;
  reason: string;
  notes?: string;
  admin_id: string;
  automatic?: boolean;
}

export interface StockUpdate {
  productId: string;
  previousStock: number;
  newStock: number;
  change: number;
  movementType: string;
  timestamp: string;
  alerts?: InventoryAlert[];
  notifications?: any[];
}

// Simple mock service functions for client-side usage
export const mockInventoryService = {
  getProductStock: async (productId: string): Promise<number> => {
    // Mock implementation - in real app this would call the actual service
    return Math.floor(Math.random() * 100) + 1;
  },
  
  getLowStockProducts: async (threshold?: number): Promise<any[]> => {
    const stockThreshold = threshold || 5;
    return [
      { id: 'product1', name: 'Sample Product 1', available_units: 3 },
      { id: 'product2', name: 'Sample Product 2', available_units: 1 },
      { id: 'product3', name: 'Sample Product 3', available_units: 0 }
    ].filter(p => p.available_units < stockThreshold);
  }
};