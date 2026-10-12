// Browser (Web Bluetooth) client for ORPHE INSOLE 1.5.
// Bundled to ../insole-1.5.web.js (global `Insole15`).
//
// The transport + protocol client are vendored from the bleRPC `central_web`
// central; only InsoleClient and the insole proto are device-specific.

import * as protobuf from 'protobufjs/minimal';

// Represent proto 64-bit fields (epoch-ms clocks: epoch_ms/start_ms/oldest_ms/
// newest_ms) as plain JS numbers rather than Long objects. Every 64-bit value
// this device produces is a millisecond timestamp, well within 2^53, so the
// window-time arithmetic in InsoleClient stays simple.
(protobuf.util as unknown as { Long: unknown }).Long = null;
protobuf.configure();

export { InsoleClient, WINDOW_MS, SAMPLE_PERIOD_MS } from './client/InsoleClient';
export type {
  InsoleFrame,
  InsoleConfig,
  InsoleClientOptions,
} from './client/InsoleClient';
export {
  BlerpcClient,
  PayloadTooLargeError,
  ResponseTooLargeError,
  PeripheralErrorException,
  ProtocolException,
} from './client/BlerpcClient';
export { WebBluetoothTransport, SERVICE_UUID, CHAR_UUID } from './ble/WebBluetoothTransport';
export type { ScannedDevice } from './ble/WebBluetoothTransport';
export { LocalStorageKnownKeyStore } from './client/knownKeys';
export { insole } from './proto/insole';
