import * as dgram from "dgram";
import { WLEDClient } from 'wled-client';

export type Led = [ number, number, number ];

export class WLEDDdp {
    private _socket: dgram.Socket;
    private readonly _port: number;
    private readonly _host: string;
    private initiallyOff = true;

    private jsonClient: WLEDClient;

    private readonly VERSION = 0x01; // Version 1, PUSH flag not set, other flags are 0
    private readonly DATA_TYPE = 0x01; // Data type RGB
    private readonly OUTPUT_ID = 0x01; // Default ID for output device

    constructor(host: string, port: number) {
        this._port = port;
        this._host = host;
        this._socket = dgram.createSocket('udp4');
        this.jsonClient = new WLEDClient({
            host,
            websocket: false
        });

        this.initLeds().catch((error) => {
            console.error('Error initializing LEDs:', error);
        });
    }

    public async initLeds(): Promise<void> {
        await this.jsonClient.init();
        console.log('LEDs initialized', this.jsonClient.info, this.jsonClient.state);
        this.initiallyOff = !this.jsonClient.state.on;
        if (this.initiallyOff) {
            await this.jsonClient.turnOn();
        }
    }

    public send(data: Led[]) {
        const packet = this.createPacket(data);
        this.sendPacket(packet);
    }

    public async setBrightness(brightness: number) {
        await this.jsonClient.setBrightness(brightness);
    }

    public getLeds(initialFill?: Led): Led[] {
        return new Array(250).fill(initialFill ?? [0,0,0]);
    }

    private createPacket(leds: Led[]): Buffer {
        const header = Buffer.alloc(10); // DDP header is 10 bytes
        header[0] = this.VERSION;
        header[1] = 0x00; // Reserved for future use, set to 0.
        header[2] = this.DATA_TYPE;
        header[3] = this.OUTPUT_ID;
        header.writeUInt32BE(0, 4); // Offset set to 0
        header.writeUInt16BE(leds.length * 3, 8); // Data length

        const data = Buffer.concat(leds.map(color => {
            return Buffer.from([ color[0], color[1], color[2] ]);
        }));

        return Buffer.concat([ header, data ]);
    }

    private sendPacket(packet: Buffer) {
        this._socket.send(
            packet,
            this._port,
            this._host,
            (error) => {
                if (error) {
                    console.error('Error sending packet:', error);
                }
            });
    }
}
