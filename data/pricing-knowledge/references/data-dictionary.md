# Data Dictionary: Master Pricing Model

The Master Pricing Model (Pricing Structure Template) is organized by SKU (one sheet per SKU). Each sheet follows a vertical structure for cost and margin calculations.

## Core Structure (Vertical)

| Row Label | Description | Example Value (Blanco) |
|-----------|-------------|------------------------|
| **SIZE** | Bottle size in ml | 750.00 |
| **PROOF** | Alcohol proof | 80.00 |
| **CASE PACK** | Bottles per case | 6.00 |
| **F O B** | Free On Board price (per case) | 125.00 |
| **INLAND FREIGHT** | Shipping cost to distributor | 3.00 |
| **STATE TAX** | Applicable state excise tax | 4.81 |
| **SALES COST** | Total cost to Siempre (FOB + Taxes + Freight) | 132.81 |
| **NET SALES COST** | Final cost after adjustments | 132.81 |
| **LIST PRICE** | Distributor list price to retail | 198.00 |
| **NET CASE COST** | Final cost to retailer after discounts | 198.00 |
| **PROFIT** | Siempre profit per case | 65.19 |
| **PROFIT %** | Siempre margin percentage | 32.92% |
| **NET BOTTLE COST** | Cost per bottle to retailer | 33.00 |

## Retail Pricing Targets (Calculated)

The model calculates suggested retail prices (SRP) based on various margin targets:

- **RETAIL PRICE @ 25 mg**: SRP at 25% retail margin
- **RETAIL PRICE @ 28 mg**: SRP at 28% retail margin
- **RETAIL PRICE @ 30 mg**: SRP at 30% retail margin
- **RETAIL PRICE @ 35 mg**: SRP at 35% retail margin
- **RETAIL PRICE @ 37 mg**: SRP at 37% retail margin

## Market-Specific Columns (Horizontal)

While the core structure is vertical, the model uses columns (Unnamed: 2 to Unnamed: 15) to represent different deal levels or market scenarios (e.g., "OP 2 btl", "OP 1cs").

- **Unnamed: 16**: Usually contains "Average" or "Total" calculations.
- **Percent of Business**: Weighted volume for each deal level.
- **Volume per Discount**: Expected case volume at that price point.
