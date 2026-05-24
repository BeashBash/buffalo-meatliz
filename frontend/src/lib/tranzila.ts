/**
 * Tranzila Payment Gateway — integration layer
 *
 * HOW TO ACTIVATE:
 * 1. Set VITE_TRANZILA_TERMINAL in .env  (your terminal name from Tranzila)
 * 2. Set VITE_APP_URL in .env            (your production domain, e.g. https://baffalo.co.il)
 * 3. The webhook Edge Function at /functions/v1/tranzila-webhook must be deployed
 *
 * Tranzila docs: https://tranzila.com/developer/
 */

const TERMINAL   = import.meta.env.VITE_TRANZILA_TERMINAL as string | undefined
const APP_URL    = import.meta.env.VITE_APP_URL as string | undefined ?? 'http://localhost:3000'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function hdrs() {
  return { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' }
}
async function rpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: hdrs(), body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface PaymentLinkResult {
  success: boolean
  token?: string
  amount?: number
  order_number?: string
  tranzila_url?: string   // the URL to send to the customer
  internal_url?: string   // our own payment page URL
  error?: string
}

/**
 * Generate a payment link for an order.
 * Returns both the Tranzila hosted-page URL and our internal /pay/:token page.
 */
export async function createPaymentLink(orderId: string): Promise<PaymentLinkResult> {
  if (!TERMINAL) {
    // No terminal configured yet — return internal link only (demo mode)
    const data = await rpc<{ success: boolean; token: string; amount: number; order_number: string }>(
      'admin_create_payment_link',
      { p_order_id: orderId, p_terminal: 'DEMO' }
    )
    if (!data.success) return { success: false, error: 'Failed to create token' }
    return {
      success: true,
      token: data.token,
      amount: data.amount,
      order_number: data.order_number,
      internal_url: `${APP_URL}/pay/${data.token}`,
    }
  }

  const data = await rpc<{ success: boolean; token: string; amount: number; order_number: string; terminal: string }>(
    'admin_create_payment_link',
    { p_order_id: orderId, p_terminal: TERMINAL }
  )
  if (!data.success) return { success: false, error: 'Failed to create token' }

  const successUrl = encodeURIComponent(`${APP_URL}/pay/${data.token}?status=success`)
  const failUrl    = encodeURIComponent(`${APP_URL}/pay/${data.token}?status=fail`)

  // Tranzila hosted payment page (iFrame or redirect)
  // Docs: https://tranzila.com/developer/api-reference/
  const params = new URLSearchParams({
    supplier:    TERMINAL,
    sum:         data.amount.toFixed(2),
    currency:    '1',          // 1 = ILS
    tranmode:    'A',          // A = regular charge
    cred_type:   '1',          // 1 = regular credit
    myid:        data.order_number,
    contact:     data.order_number,
    success_url: successUrl,
    fail_url:    failUrl,
    nologo:      '1',
    lang:        'heb',
  })

  const tranzila_url = `https://direct.tranzila.com/${TERMINAL}/iframenew.php?${params.toString()}`

  return {
    success: true,
    token: data.token,
    amount: data.amount,
    order_number: data.order_number,
    tranzila_url,
    internal_url: `${APP_URL}/pay/${data.token}`,
  }
}

/**
 * Build a WhatsApp message with the payment link to send to the customer
 */
export function buildPaymentWhatsApp(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  amount: number,
  paymentUrl: string
): string {
  const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '972')
  const msg = `שלום ${customerName} 👋\n\nהזמנה מספר #${orderNumber} שקולה ומוכנה!\nסכום לתשלום: ₪${amount.toFixed(2)}\n\nלתשלום מאובטח לחץ כאן:\n${paymentUrl}\n\n*באפלו מיטליז*`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

/**
 * Get order details by payment token (for /pay/:token page)
 */
export async function getOrderByToken(token: string) {
  return rpc<{
    id: string
    order_number: string
    status: string
    amount_due: number
    final_total: number | null
    payment_token: string
    payment_method: string | null
    tranzila_txid: string | null
    customer_name: string
    customer_phone: string
  } | null>('get_order_by_token', { p_token: token })
}

/**
 * Mark order as paid manually (admin override / cash payment)
 */
export async function markOrderPaidManually(token: string, method: 'cash' | 'transfer') {
  return rpc<{ success: boolean; order_number?: string; error?: string }>(
    'mark_order_paid',
    { p_token: token, p_method: method }
  )
}

export const TRANZILA_CONFIGURED = !!TERMINAL
