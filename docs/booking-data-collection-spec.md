# Booking Data Collection — Spec
> Extract sales visit bookings from Google Calendar → structured visit-schedule.json → feed to Hunt Window Agents.
> Version: 1.0 | Status: SPEC | Author: Claude (Solace) | Date: 2026-04-12

---

## Purpose

The Hunting Layer's Hunt Window Agents require a `visit_window: { start, end }` input to scope their work to actual planned market visits. Without this, hunt cycles are arbitrary date windows disconnected from when reps are actually in market.

This spec defines how we extract that visit data from Google Calendar — the source of truth for where Nick, Rick, and Alex are physically going.

---

## Data Source

**Google Calendar via Maton AI Gateway.**

```
GET https://gateway.maton.ai/google-calendar/calendar/v3/calendars/{calendarId}/events
Headers: Authorization: Bearer {MATON_API_KEY}
Params:
  timeMin: {ISO datetime}
  timeMax: {ISO datetime}
  q: "market visit" OR "sales trip" OR etc.
  singleEvents: true
  orderBy: startTime
```

Calendar IDs to scan:
- `alex@siempretequila.com` — Alex's primary calendar
- `rick@siempretequila.com` — Rick's calendar (Maton key: `RICK_MATON_KEY`)
- `nick@siempretequila.com` — Nick's calendar (if Maton key exists — check Job 8 status)

**Note:** Nick currently has no Maton key. Until Job 8 is resolved (Nick grants access), Nick's calendar is not accessible via Maton. The booking collector should handle missing keys gracefully — skip calendar, log `"calendar unavailable: no Maton key"`, continue.

---

## Event Classification Rules

Not every calendar event is a market visit. The collector must classify events:

### Include — Market Visit Events

An event qualifies as a market visit booking if it matches ANY of these:
- Title contains: `market visit`, `sales trip`, `trade show`, `account day`, `rep ride`, `on-premise tour`, `portfolio day`, `tasting`, `sales call`, `distributor meeting`
- Location field contains a US state name, US city, or Canadian province name
- Description contains keywords: `distributor`, `accounts`, `on-premise`, `portfolio`, `tasting`
- Event is all-day (multi-day trips are typically all-day events)

### Exclude — Non-Visit Events

- Internal meetings (all attendees are @siempretequila.com)
- Events with no location
- Recurring events without a location (weekly syncs, standups)
- Events titled: `personal`, `travel`, `flight`, `hotel`, `out of office`, `OOO` (unless they contain market-visit keywords in description)

### Ambiguous — Flag for Human Review

If an event has a location but no visit-type keywords, emit it as `status: "needs_review"` in the output. Alex can confirm or dismiss on next check.

---

## Market Code Extraction

From a classified event, extract `market_code` (2-letter US state or Canadian province abbreviation):

**Priority order:**
1. Parse event `location` field for state/province name or abbreviation
2. Parse event `title` for state/city hints (e.g. "TX Trade Show", "Edmonton Visit")
3. Parse event `description` for distributor names → map to market via distributor coverage map
4. If no extraction succeeds → `market_code: "UNKNOWN"`, flag for review

**Distributor → market mapping:**
Use `~/siempre-reports/distributor_coverage.json` (or equivalent) as lookup. If RNDC is mentioned → map to known RNDC markets. If "Beechwood" → WI. If "PBG" → US importer (multi-market, don't infer single market).

---

## Output Schema — visit-schedule.json

```json
{
  "generated_at": "2026-04-12T00:00:00Z",
  "collection_window": {
    "start": "2026-04-12T00:00:00Z",
    "end": "2026-05-12T00:00:00Z"
  },
  "visits": [
    {
      "visit_id": "alex-2026-04-14-tx",
      "calendar_event_id": "abc123xyz",
      "calendar_owner": "alex@siempretequila.com",
      "title": "TX Trade Show — Houston",
      "market_code": "TX",
      "start": "2026-04-14T00:00:00",
      "end": "2026-04-16T00:00:00",
      "location": "Houston, TX",
      "classification": "market_visit",
      "status": "confirmed",
      "hunt_window_start": "2026-04-14",
      "hunt_window_end": "2026-04-16",
      "notes": ""
    },
    {
      "visit_id": "rick-2026-04-13-wi-review",
      "calendar_event_id": "def456",
      "calendar_owner": "rick@siempretequila.com",
      "title": "Dennis Sherlock — Beechwood",
      "market_code": "WI",
      "start": "2026-04-13T09:00:00",
      "end": "2026-04-13T11:00:00",
      "location": "Milwaukee, WI",
      "classification": "market_visit",
      "status": "confirmed",
      "hunt_window_start": "2026-04-13",
      "hunt_window_end": "2026-04-13",
      "notes": ""
    },
    {
      "visit_id": "alex-2026-04-20-unknown-review",
      "calendar_event_id": "ghi789",
      "calendar_owner": "alex@siempretequila.com",
      "title": "Distributor check-in",
      "market_code": "UNKNOWN",
      "start": "2026-04-20T10:00:00",
      "end": "2026-04-20T11:00:00",
      "location": "",
      "classification": "needs_review",
      "status": "pending",
      "hunt_window_start": null,
      "hunt_window_end": null,
      "notes": "No location in event — market could not be inferred"
    }
  ],
  "summary": {
    "total_visits": 3,
    "confirmed": 2,
    "needs_review": 1,
    "markets_covered": ["TX", "WI"],
    "calendars_scanned": ["alex@siempretequila.com", "rick@siempretequila.com"],
    "calendars_skipped": ["nick@siempretequila.com — no Maton key"]
  }
}
```

---

## Implementation — booking_collector.py

Script location: `~/siempre-reports/booking_collector.py` (Optimus)

```python
# Outline — implementation details follow spec above
def collect_bookings(days_ahead: int = 30) -> dict:
    """
    Fetch calendar events from all accessible accounts via Maton.
    Classify events. Extract market codes. Output visit-schedule.json.
    """
    window_start = datetime.utcnow()
    window_end = window_start + timedelta(days=days_ahead)
    
    visits = []
    skipped_calendars = []
    
    for account_email, maton_key_name in CALENDARS:
        key = get_cred(maton_key_name, "")
        if not key:
            skipped_calendars.append(f"{account_email} — no Maton key")
            continue
        
        events = fetch_calendar_events(account_email, key, window_start, window_end)
        for event in events:
            classification = classify_event(event)
            if classification == "exclude":
                continue
            market_code = extract_market_code(event)
            visit = build_visit_record(event, account_email, classification, market_code)
            visits.append(visit)
    
    output = {
        "generated_at": window_start.isoformat(),
        "collection_window": {"start": window_start.isoformat(), "end": window_end.isoformat()},
        "visits": visits,
        "summary": build_summary(visits, skipped_calendars)
    }
    
    write_json("~/siempre-reports/data/visit-schedule.json", output)
    return output

CALENDARS = [
    ("alex@siempretequila.com",  "MATON_API_KEY"),
    ("rick@siempretequila.com",  "RICK_MATON_KEY"),
    ("nick@siempretequila.com",  "NICK_MATON_KEY"),   # will skip if key absent
]
```

**Run schedule:** Daily at 07:30 on Optimus (after daily_run.sh completes). Add to launchd as `com.siempre.booking-collector`.

**Output path:** `~/siempre-reports/data/visit-schedule.json` — overwritten on each run. Hunting Coordinator reads this file before spawning Hunt Window Agents.

---

## Integration Points

### Hunting Layer (Primary Consumer)
- Hunting Coordinator reads `visit-schedule.json` before the weekly hunt cycle
- `hunt_window_start` + `hunt_window_end` fields map directly to the Hunt Window Agent's `visit_window` input
- Coordinator should filter to `status: "confirmed"` visits only — skip `needs_review`
- One Hunt Window Agent is spawned per `market_code × hunt_window` where `market_code != "UNKNOWN"`

### CIO Agent
- After each booking collection run, log a summary event to CIO:
  `{ type: "booking_collection", visits_found: n, markets: [...], needs_review: n }`
- CIO uses this for the Morning Brief's Calendar section

### Morning Brief
- The Calendar section of the Morning Brief should include upcoming market visits from `visit-schedule.json`
- "Alex in TX Apr 14–16. Rick in WI Apr 13. 2 events need location review."

### Geo-Intelligence Engine (Job 27)
- Job 27 will consume `visit-schedule.json` as the seed for route optimization
- For each confirmed visit, Job 27 will: pull all qualified hunting targets in the market → run Google Maps Distance Matrix → optimize visit order
- `visit_id` in booking schema is the key used for Job 27 route lookup

---

## Error Handling

| Error | Handling |
|---|---|
| Maton key missing for a calendar | Skip calendar, log to `skipped_calendars[]`. Do NOT fail the whole run. |
| Calendar API timeout | Retry once with 10s backoff. If second failure, log `"calendar_fetch_failed"` and continue. |
| Event with no attendees and no location | Classify as `"exclude"` — likely a personal reminder |
| All-day multi-day event spanning >14 days | Classify as `"needs_review"` — likely a vacation/travel block, not a market visit |
| Duplicate events (same market, overlapping dates, different calendar) | Deduplicate by market_code + date range overlap. Keep the one with richer metadata. |

---

## Open Questions

1. **Nick calendar access** — gates WI trade show (Apr 13 already in Rick's calendar) and all Nick's US market visits. Unblock when Job 8 resolves and Nick grants Maton key.
2. **Distributor meetings vs. in-market visits** — some distributor check-ins are phone calls or Zoom, not physical visits. Should we exclude events without a physical address in the location field, even if they match visit keywords?
3. **Historical window** — should the collector also backfill past 30 days? Useful for Farming Coordinator to understand which accounts were actually visited recently (reconcile with `last_contact_log`).
