/**
 * Tranzila Webhook Handler — Supabase Edge Function
 *
 * Deploy with:
 *   supabase functions deploy tranzila-webhook --no-verify-jwt
 *
 * In Tranzila back-office → הגדרות → URL נוטיפיקציה:
 *   https://<your-supabase-project>.supabase.co/functions/v1/tranzila-webhook
 *
 * Tranzila sends a POST (form-encoded) with:
 *   TranzilaTK, sum, currency, supplier, myid (= order_number), Response, ConfirmationCode, etc.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

Deno.serve(async (req: Request) => {
  // Tranzila sends POST with form-encoded body
  const body = await req.text()
  const params = new URLSearchParams(body)

  const txid         = params.get('TranzilaTK')
  const response     = params.get('Response')        // '000' = success
  const sum          = params.get('sum')
  const orderNumber  = params.get('myid')            // we pass order_number as myid
  const supplier     = params.get('supplier')

  console.log('Tranzila webhook:', { txid, response, sum, orderNumber })

  // Only process successful transactions
  if (response !== '000') {
    console.log('Non-success response:', response)
    return new Response('OK', { status: 200 })
  }

  if (!orderNumber || !txid) {
    console.error('Missing orderNumber or txid')
    return new Response('Bad Request', { status: 400 })
  }

  // Find the order by order_number and update it
  const { data: order, error: findError } = await supabase
    .schema('buffalo')
    .from('orders')
    .select('id, payment_token, status')
    .eq('order_number', orderNumber)
    .single()

  if (findError || !order) {
    console.error('Order not found:', orderNumber, findError)
    return new Response('Order not found', { status: 404 })
  }

  // Mark as paid using the RPC
  const { data, error } = await supabase.rpc('mark_order_paid', {
    p_token:            order.payment_token,
    p_txid:             txid,
    p_amount:           sum ? parseFloat(sum) : null,
    p_method:           'tranzila',
    p_tranzila_status:  response,
  })

  if (error) {
    console.error('mark_order_paid error:', error)
    return new Response('DB Error', { status: 500 })
  }

  console.log('Order marked as paid:', data)
  return new Response('OK', { status: 200 })
})
