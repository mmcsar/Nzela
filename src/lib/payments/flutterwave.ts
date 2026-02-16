/**
 * Flutterwave Integration for Mobile Money Payments
 * Supports: M-Pesa, Airtel Money, Orange Money for RDC
 * 
 * Docs: https://developer.flutterwave.com/docs/collecting-payments/mobile-money/
 */

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ── Types ──────────────────────────

export interface FlutterwaveChargeRequest {
  amount: number;
  currency: 'CDF' | 'USD';
  phone_number: string;
  email: string;
  tx_ref: string;              // Our unique transaction reference
  network?: 'MPESA' | 'AIRTEL' | 'ORANGE';
  fullname?: string;
  redirect_url?: string;
  meta?: Record<string, any>;
}

export interface FlutterwaveChargeResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    redirect_url?: string;
    status: string;
    charge_type: string;
    created_at: string;
    meta?: {
      authorization?: {
        redirect?: string;
        mode?: string;
      };
    };
  };
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: 'successful' | 'failed' | 'pending';
    payment_type: string;
    created_at: string;
    customer: {
      email: string;
      phone_number: string;
      name: string;
    };
  };
}

// ── Helper: detect mobile money network from phone number ──
export function detectNetwork(phone: string): 'MPESA' | 'AIRTEL' | 'ORANGE' | null {
  // Clean phone number
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // RDC phone patterns
  // Vodacom (M-Pesa): 081, 082, 083 ou +243 81/82/83
  if (/^(\+?243)?0?8[123]/.test(clean)) return 'MPESA';
  
  // Airtel: 097, 099 ou +243 97/99
  if (/^(\+?243)?0?9[79]/.test(clean)) return 'AIRTEL';
  
  // Orange: 084, 085, 089 ou +243 84/85/89
  if (/^(\+?243)?0?8[459]/.test(clean)) return 'ORANGE';
  
  return null;
}

// ── Format phone number for Flutterwave ──
export function formatPhoneForFlw(phone: string): string {
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // Remove leading 0 and add country code if needed
  if (clean.startsWith('0')) {
    clean = '243' + clean.substring(1);
  }
  if (!clean.startsWith('+') && !clean.startsWith('243')) {
    clean = '243' + clean;
  }
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  
  return clean;
}

// ── Initiate Mobile Money Charge ──
export async function initiateMobileMoneyCharge(
  params: FlutterwaveChargeRequest
): Promise<FlutterwaveChargeResponse> {
  const network = params.network || detectNetwork(params.phone_number);
  
  if (!network) {
    return {
      status: 'error',
      message: 'Impossible de detecter le reseau. Verifiez le numero de telephone.',
    };
  }

  const formattedPhone = formatPhoneForFlw(params.phone_number);

  // Choose endpoint based on network
  const endpoint = `${FLW_BASE_URL}/charges?type=mobile_money_franco`;

  const payload = {
    phone_number: formattedPhone,
    amount: params.amount,
    currency: params.currency,
    email: params.email,
    tx_ref: params.tx_ref,
    fullname: params.fullname || '',
    redirect_url: params.redirect_url || `${APP_URL}/fr/dashboard/payments/callback`,
    network: network,
    is_mobile_money_franco: 1,
    meta: params.meta || {},
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data as FlutterwaveChargeResponse;
  } catch (error: any) {
    console.error('[Flutterwave] Charge error:', error);
    return {
      status: 'error',
      message: error.message || 'Erreur de connexion au service de paiement',
    };
  }
}

// ── Verify Transaction ──
export async function verifyTransaction(
  transactionId: string | number
): Promise<FlutterwaveVerifyResponse> {
  try {
    const response = await fetch(
      `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();
    return data as FlutterwaveVerifyResponse;
  } catch (error: any) {
    console.error('[Flutterwave] Verify error:', error);
    return {
      status: 'error',
      message: error.message || 'Erreur de verification',
    };
  }
}

// ── Verify Webhook Signature ──
export function verifyWebhookSignature(
  signature: string | null,
  secretHash: string
): boolean {
  if (!signature) return false;
  return signature === secretHash;
}

// ── Get public key for client-side ──
export function getFlutterwavePublicKey(): string {
  return FLW_PUBLIC_KEY;
}

// ── Generate unique transaction reference ──
export function generateTxRef(prefix = 'NZL'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ── Mobile Money providers info for UI ──
export const MOBILE_MONEY_PROVIDERS = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    network: 'MPESA' as const,
    operator: 'Vodacom',
    color: '#e60000',
    prefixes: ['081', '082', '083'],
    logo: '/icons/mpesa.svg',
    instructions: 'Vous recevrez une notification USSD sur votre telephone. Entrez votre code PIN M-Pesa pour confirmer.',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    network: 'AIRTEL' as const,
    operator: 'Airtel',
    color: '#ff0000',
    prefixes: ['097', '099'],
    logo: '/icons/airtel.svg',
    instructions: 'Vous recevrez un message USSD. Entrez votre code PIN Airtel Money pour confirmer le paiement.',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    network: 'ORANGE' as const,
    operator: 'Orange',
    color: '#ff7900',
    prefixes: ['084', '085', '089'],
    logo: '/icons/orange.svg',
    instructions: 'Composez *144# pour confirmer le paiement, ou validez via la notification Orange Money.',
  },
] as const;
