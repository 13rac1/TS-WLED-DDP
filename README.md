# WLED DDP TypeScript Client

A simple test project that demonstrates controlling WLED LED strips using the Distributed Display Protocol (DDP) with TypeScript.

## What is this?

This project is a TypeScript implementation of the DDP protocol for controlling WLED-powered LED strips based on [piretek's Gist](https://gist.github.com/piretek/16b2c729135a4a64d60d48a15fb36996). It includes:

- A DDP client for sending color data to WLED devices
- Utility functions for color manipulation and LED pattern generation
- A simple rainbow animation demo, like the FastLED demos.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure your environment:
   - Copy `.env.example` to `.env`
   - Edit the values in `.env` to match your setup

3. Run the project:
```
npm start
```

## Project Structure

```
.
├── src/                  # Source code
│   ├── index.ts          # Main application entry point
│   ├── wled-ddp.ts       # WLED DDP client implementation
│   ├── color-math.ts     # Color utility functions
│   └── types/            # Type definitions
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Example environment configuration
├── .env                  # Your environment configuration (not in git)
├── eslint.config.js      # ESLint configuration (flat config format)
├── .prettierrc           # Prettier configuration
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Development

- Build the project: `npm run build`
- Clean the build directory: `npm run clean`
- Run in development mode: `npm run dev`
- Start the application: `npm start`
- Lint code: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Format code: `npm run format`
- Check formatting: `npm run format:check`

## Technical Details

This project uses:

- **ES Modules**: Both TypeScript and JavaScript use ES module syntax with `.js` file extensions in imports
- **TypeScript**: Configured with strict type checking using `NodeNext` module resolution
- **ESLint 9**: Using the modern flat config format with strict TypeScript rules
- **Prettier**: Ensures consistent code formatting
- **Environment Variables**: Configurable via `.env` file

## Configuration

The application can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| WLED_HOST | Hostname or IP of your WLED device | wled.local |
| WLED_PORT | DDP port number | 4048 |
| LED_COUNT | Number of LEDs in your strip | 250 |
| UPDATE_INTERVAL | Animation update interval (ms) | 15 |

## Usage

The main application creates a rainbow animation on your WLED device. You can customize:

- LED count
- Update interval
- WLED host address and port

Press Ctrl+C to stop the application.

## How it works

The application uses UDP sockets to send DDP packets to WLED devices, which control the RGB values of individual LEDs in the strip. It also uses the WLED JSON API for initial setup and brightness control.

## References
* [WLED DDP Interface Docs](https://kno.wled.ge/interfaces/ddp/)
* [3 Way Labs DDP Spec](http://www.3waylabs.com/ddp/)
* [ShiftLimits' JavaScript WLED Client](https://github.com/ShiftLimits/wled-client)
