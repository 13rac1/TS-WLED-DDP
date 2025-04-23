import { WLEDDdp, WLEDDdpOptions } from "./wled-ddp";
import { ColorMath } from "./color-math";

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
 * Default configuration for the application
 */
const config: AppConfig = {
  host: 'wled.local',
  port: 4048,
  ledCount: 250,
  updateInterval: 15
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
      ledCount: config.ledCount
    };
    
    this.socket = new WLEDDdp(options);
  }
  
  /**
   * Animation update function called on each interval
   */
  private update(): void {
    // Generate rainbow pattern with current offset
    const rainbowLeds = ColorMath.generateRainbow(
      this.config.ledCount, 
      this.offset
    );
    
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
      this.intervalId = setInterval(
        () => this.update(), 
        this.config.updateInterval
      );
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
      console.log('Animation stopped');
    }
  }
}

// Create and start the application
const app = new LedAnimationApp(config);
app.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  app.stop();
  process.exit(0);
});
