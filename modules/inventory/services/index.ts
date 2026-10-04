import "server-only";

import { getInventoryRepository } from "@/modules/inventory/repositories";
import { FefoAllocationService } from "@/modules/inventory/services/fefo-allocation.service";
import { InventoryService } from "@/modules/inventory/services/inventory.service";
import { StockInService } from "@/modules/inventory/services/stock-in.service";
import { StockOutService } from "@/modules/inventory/services/stock-out.service";

let inventoryService: InventoryService | undefined;
let stockInService: StockInService | undefined;
let stockOutService: StockOutService | undefined;
let fefoAllocationService: FefoAllocationService | undefined;

export function getInventoryService(): InventoryService {
  inventoryService ??= new InventoryService(getInventoryRepository());
  return inventoryService;
}

export function getStockInService(): StockInService {
  stockInService ??= new StockInService(getInventoryRepository());
  return stockInService;
}

export function getStockOutService(): StockOutService {
  stockOutService ??= new StockOutService(getInventoryRepository());
  return stockOutService;
}

export function getFefoAllocationService(): FefoAllocationService {
  fefoAllocationService ??= new FefoAllocationService();
  return fefoAllocationService;
}
