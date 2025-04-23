import * as dgram from "dgram";
import { WLEDClient } from 'wled-client';

/**
 * Represents an RGB color value for an LED
 * [red, green, blue] where each value is 0-255
 */
export type Led = readonly [number, number, number];

/**
 * Configuration options for WLEDDdp client
 */
export interface WLEDDdpOptions {
  /** The hostname or IP address of the WLED device */
  readonly host: string;
  /** The port number for DDP communication (default is 4048) */
  readonly port: number;
  /** Whether to automatically turn on LEDs if they're off initially */
  readonly autoTurnOn?: boolean;
  /** Number of LEDs in the strip */
  readonly ledCount?: number;
}

/**
 * Client for controlling WLED devices using the DDP (Distributed Display Protocol)
 * Provides methods for sending color data and controlling LED settings
 */
export class WLEDDdp {
    private readonly _socket: dgram.Socket;
    private readonly _port: number;
    private readonly _host: string;
    private readonly _ledCount: number;
    private readonly _autoTurnOn: boolean;
    private initiallyOff = true;

    private readonly jsonClient: WLEDClient;

    // DDP Protocol constants
    private readonly VERSION = 0x01; // Version 1, PUSH flag not set, other flags are 0
    private readonly DATA_TYPE = 0x01; // Data type RGB
    private readonly OUTPUT_ID = 0x01; // Default ID for output device

    /**
     * Creates a new WLEDDdp client
     * @param options Configuration options for the client
     */
    constructor(options: WLEDDdpOptions);
    /**
     * Creates a new WLEDDdp client (legacy constructor)
     * @param host The hostname or IP address of the WLED device
     * @param port The port number for DDP communication
     * @deprecated Use the options object constructor instead
     */
    constructor(host: string, port: number);
    constructor(hostOrOptions: string | WLEDDdpOptions, port?: number) {
        if (typeof hostOrOptions === 'string') {
            this._host = hostOrOptions;
            this._port = port ?? 4048;
            this._autoTurnOn = true;
            this._ledCount = 250;
        } else {
            this._host = hostOrOptions.host;
            this._port = hostOrOptions.port;
            this._autoTurnOn = hostOrOptions.autoTurnOn ?? true;
            this._ledCount = hostOrOptions.ledCount ?? 250;
        }
        
        this._socket = dgram.createSocket('udp4');
        this.jsonClient = new WLEDClient({
            host: this._host,
            websocket: false
        });

        this.initLeds().catch((error: Error) => {
            console.error('Error initializing LEDs:', error);
        });
    }

    /**
     * Initializes the LED connection and turns on the LEDs if they're off
     * @returns Promise that resolves when initialization is complete
     */
    public async initLeds(): Promise<void> {
        await this.jsonClient.init();
        console.log('LEDs initialized', this.jsonClient.info, this.jsonClient.state);
        this.initiallyOff = !this.jsonClient.state.on;
        if (this.initiallyOff && this._autoTurnOn) {
            await this.jsonClient.turnOn();
        }
    }

    /**
     * Sends color data to the WLED device
     * @param data Array of LED color values to send
     * @returns void
     */
    public send(data: readonly Led[]): void {
        const packet = this.createPacket(data);
        this.sendPacket(packet);
    }

    /**
     * Sets the overall brightness of the WLED device
     * @param brightness Brightness value (0-255)
     * @returns Promise that resolves when brightness has been set
     */
    public async setBrightness(brightness: number): Promise<void> {
        if (brightness < 0 || brightness > 255) {
            throw new Error('Brightness must be between 0 and 255');
        }
        await this.jsonClient.setBrightness(brightness);
    }

    /**
     * Creates an array of LED color values with the specified initial fill
     * @param initialFill Optional initial color for all LEDs, defaults to [0,0,0] (off)
     * @returns Array of LED color values
     */
    public getLeds(initialFill?: Led): readonly Led[] {
        return new Array(this._ledCount).fill(initialFill ?? [0,0,0]);
    }

    /**
     * Creates a DDP packet from an array of LED color values
     * @param leds Array of LED color values
     * @returns Buffer containing the DDP packet
     * @private
     */
    private createPacket(leds: readonly Led[]): Buffer {
        const header = Buffer.alloc(10); // DDP header is 10 bytes
        header[0] = this.VERSION;
        header[1] = 0x00; // Reserved for future use, set to 0.
        header[2] = this.DATA_TYPE;
        header[3] = this.OUTPUT_ID;
        header.writeUInt32BE(0, 4); // Offset set to 0
        header.writeUInt16BE(leds.length * 3, 8); // Data length

        const data = Buffer.concat(leds.map(color => {
            return Buffer.from([color[0], color[1], color[2]]);
        }));

        return Buffer.concat([header, data]);
    }

    /**
     * Sends a DDP packet to the WLED device
     * @param packet Buffer containing the DDP packet
     * @private
     */
    private sendPacket(packet: Buffer): void {
        this._socket.send(
            packet,
            0,
            packet.length,
            this._port,
            this._host,
            (error: Error | null, bytes: number) => {
                if (error) {
                    console.error('Error sending packet:', error);
                }
            });
    }
}
