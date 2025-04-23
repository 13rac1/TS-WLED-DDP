import { WLEDDdp, WLEDDdpOptions } from './wled-ddp.js';
import { ColorMath } from './color-math.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration for the LED application
 */
interface AppConfig {
  /** The hostname or IP address of the WLED device */
  readonly host: string;
  /** The port number for DDP communication */
  readonly port: number;
  /** Number of LEDs in the strip */
  readonly ledCount: number;
  /** Animation update interval in milliseconds */
  readonly updateInterval: number;
}

/**
 * Helper to parse environment variables with type safety
 * @param name - Environment variable name
 * @param defaultValue - Default value if environment variable is not set
 * @returns Parsed environment variable value
 */
function getEnvValue<T>(name: string, defaultValue: T): T {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    return Number(value) as unknown as T;
  }

  return value as unknown as T;
}

/**
 * Default configuration loaded from environment variables
 */
const config: AppConfig = {
  host: getEnvValue('WLED_HOST', 'wled.local'),
  port: getEnvValue('WLED_PORT', 4048),
  ledCount: getEnvValue('LED_COUNT', 250),
  updateInterval: getEnvValue('UPDATE_INTERVAL', 15),
};

/**
 * Main application class for controlling LED animations
 */
class LedAnimationApp {
  private readonly socket: WLEDDdp;
  private offset: number = 0;
  private intervalId?: NodeJS.Timeout;
  private readonly config: AppConfig;

  /**
   * Creates a new LED animation application
   * @param config - Application configuration
   */
  constructor(config: AppConfig) {
    this.config = config;

    // Initialize WLED connection
    const options: WLEDDdpOptions = {
      host: config.host,
      port: config.port,
      ledCount: config.ledCount,
    };

    // eslint-disable-next-line no-console
    console.log('Initializing with config:', {
      host: config.host,
      port: config.port,
      ledCount: config.ledCount,
      updateInterval: config.updateInterval,
    });

    this.socket = new WLEDDdp(options);
  }

  /**
   * Animation update function called on each interval
   */
  private update(): void {
    // Generate rainbow pattern with current offset
    const rainbowLeds = ColorMath.generateRainbow(this.config.ledCount, this.offset);

    // Send the LED data to the WLED device
    this.socket.send(rainbowLeds);

    // Update the offset for the next frame, loops at 360 for the hue
    this.offset = (this.offset + 2) % 360;
  }

  /**
   * Starts the animation loop
   */
  public start(): void {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.update(), this.config.updateInterval);
      // eslint-disable-next-line no-console
      console.log('Animation started');
    }
  }

  /**
   * Stops the animation loop
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      // eslint-disable-next-line no-console
      console.log('Animation stopped');
    }
  }
}

// Create and start the application
const app = new LedAnimationApp(config);
app.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down...');
  app.stop();
  process.exit(0);
});
