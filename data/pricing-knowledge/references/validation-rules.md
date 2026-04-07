# Validation Rules: Pricing Operations

## Core Margin Rules

- **Margin Floor (30%)**: HARD STOP. Any margin_actual < 30% must be flagged immediately.
- **90-Day Payback**: No desperation discounting. All pricing adjustments must show a clear path to payback within 90 days.
- **Floor Pricing**: Establish and defend price floors in every market.

## FOB and Posting Rules

- **FOB Lead Time**: 60-day lead time for any FOB changes.
- **FOB Change Process**: Must be team-approved and submitted to pricing@prestigebevgroup.com.
- **FOB Drift**: Flag any fob_actual < fob_target (from NWOW if available).

## Market-Specific Validation

- **WA Review**: Review current_posted vs target. Flag any variance > 5%.
- **Data Gaps**: Flag any blank current_posted for active markets.
- **New State Setup**: Default posting_status to "pending" for new markets (WI, KY).

## SRP Targets

- **Plata**: 5-50
- **Repo**: 5
- **Añejo**: 0-95
- **Supremo**: 9-80
- **Chismé**: ~7 USD / ~0 CAD
