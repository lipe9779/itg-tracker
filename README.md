# Maritime Shipment Tracker

A production-ready web application for tracking maritime shipments by container number or Bill of Lading.

## Features

- **Auto-detection** of container numbers (ISO 6346) and Bill of Lading numbers
- **Carrier identification** from 15+ major ocean carriers via prefix matching
- **Background job processing** with real-time status polling
- **Confidence scoring** for carrier identification and tracking data
- **Mock mode** for UI testing without live carrier connections
- **Admin dashboard** with request history, raw responses, and retry functionality
- **Provider abstraction** for easy extension to new carriers and third-party APIs
- **Rate limiting** and input sanitization

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npx prisma migrate dev

# 3. Seed carriers (optional)
npm run db:seed

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `MOCK_MODE` | Use mock data instead of real APIs | `true` |
| `MAERSK_API_KEY` | Maersk public API key (optional) | — |
| `SHIPSGO_API_KEY` | ShipsGo third-party API key (optional) | — |
| `VIZION_API_KEY` | Vizion API key (optional) | — |
| `PROJECT44_API_KEY` | project44 API key (optional) | — |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Supported Carriers

| Carrier | Prefixes | Tracking Provider |
|---|---|---|
| Maersk | MSKU, MRKU, MRSU, MAEU | API stub (needs API key) |
| MSC | MSCU, MEDU, MSDU | Stub (CAPTCHA blocked) |
| CMA CGM | CMAU, CMCU, CGMU | Stub (JS rendering) |
| Hapag-Lloyd | HLCU, HLXU | Base stub |
| ONE | ONEU, KKFU, NYKU, MOFU | Base stub |
| Evergreen | EISU, EGHU, EGSU, EMCU | Base stub |
| COSCO | CCLU, COSU, CBHU | Base stub |
| OOCL | OOLU, OOCU | Base stub |
| Yang Ming | YMLU, YMMU | Base stub |
| ZIM | ZIMU, ZCSU | Base stub |
| HMM | HDMU, HMMU | Base stub |
| PIL | PCIU, PILU | Base stub |
| Wan Hai | WHLU, WHSU | Base stub |
| Matson | MATU | Base stub |
| Seaboard Marine | SMLU, SMCU | Base stub |

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── track/route.ts          # POST - submit tracking
│   │   ├── track/[id]/route.ts     # GET - poll status
│   │   └── admin/requests/route.ts # GET - admin list
│   ├── track/[id]/page.tsx         # Tracking result UI
│   ├── admin/page.tsx              # Admin dashboard
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Design system
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   └── services/
│       ├── inputDetector.ts        # ISO 6346 validation
│       ├── carrierDetector.ts      # Prefix matching
│       ├── carrierRegistry.ts      # 15 carrier definitions
│       ├── trackingProviders.ts    # Provider abstraction
│       └── jobQueue.ts             # Background processing
prisma/
├── schema.prisma                   # Database schema
├── seed.ts                         # Carrier seed script
└── migrations/                     # SQLite migrations
```

## Technical Notes

### What is fully working
- Input detection with ISO 6346 check digit validation
- Carrier identification from container/BL prefixes with confidence scoring
- Background job queue with status lifecycle (queued → processing → completed/failed)
- Full UI with polling, error handling, and result display
- Admin dashboard with raw response viewer
- Mock mode for complete UI testing
- Rate limiting and input sanitization

### What is mocked
- All tracking results when `MOCK_MODE=true`
- Mock provider returns realistic Maersk shipment data for any input

### What requires real API credentials
- **Maersk**: Set `MAERSK_API_KEY` for live API tracking
- Third-party APIs (ShipsGo, Vizion, project44): Set respective API keys

### What cannot be reliably automated
- **MSC**: Uses CAPTCHA on tracking page
- **CMA CGM**: Heavy JavaScript rendering
- **Most carriers**: Tracking pages use anti-bot measures, rate limiting, or login walls
- The app clearly communicates these limitations and provides direct links to official tracking pages
