import { PaymeState } from '../../../common/enums/payme.enum';

/**
 * Raw JSON-RPC request shape sent by Payme to the Merchant API endpoint.
 * Typed as an interface (not a class) so the global ValidationPipe leaves the
 * nested `params` untouched.
 */
export interface PaymeRpcRequest {
  jsonrpc?: string;
  id: number | string;
  method: string;
  params: PaymeParams;
}

export interface PaymeParams {
  id?: string; // Payme transaction id
  time?: number;
  amount?: number; // tiyin
  account?: Record<string, string>;
  reason?: number;
  from?: number;
  to?: number;
}

export interface PaymeAccount {
  state: PaymeState;
  create_time: number;
  perform_time: number;
  cancel_time: number;
  transaction: string; // our internal transaction id
  reason: number | null;
}
