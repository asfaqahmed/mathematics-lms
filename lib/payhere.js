import crypto from 'crypto'

// PayHere configuration
export const PAYHERE_CONFIG = {
  MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID,
  MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET,
  SANDBOX_URL: 'https://sandbox.payhere.lk/pay/checkout',
  LIVE_URL: 'https://www.payhere.lk/pay/checkout',
  CURRENCY: 'LKR'
}

/**
 * Generate hash for PayHere payment
 */
export const generatePayHereHash = (orderId, amount, currency = 'LKR') => {
  const merchantSecret = PAYHERE_CONFIG.MERCHANT_SECRET
  const merchantId = PAYHERE_CONFIG.MERCHANT_ID
  
  if (!merchantSecret || !merchantId) {
    throw new Error('PayHere merchant credentials not configured')
  }

  // PayHere hash format: 
  // MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
  const innerHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
  const outerString = merchantId + orderId + parseFloat(amount).toFixed(2) + currency + innerHash
  const hash = crypto.createHash('md5').update(outerString).digest('hex').toUpperCase()
  
  return hash
}

/**
 * Create PayHere payment object
 */
export const createPayHerePayment = ({
  orderId,
  amount,
  items,
  firstName,
  lastName,
  email,
  phone,
  address,
  city,
  country = 'Sri Lanka',
  returnUrl,
  cancelUrl,
  notifyUrl,
  customFields = {}
}) => {
  const hash = generatePayHereHash(orderId, amount)
  
  return {
    sandbox: process.env.NODE_ENV !== 'production',
    merchant_id: PAYHERE_CONFIG.MERCHANT_ID,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    order_id: orderId,
    items: items,
    amount: parseFloat(amount).toFixed(2),
    currency: PAYHERE_CONFIG.CURRENCY,
    hash: hash,
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    address: address,
    city: city,
    country: country,
    delivery_address: address,
    delivery_city: city,
    delivery_country: country,
    ...customFields
  }
}

/**
 * Verify PayHere callback notification
 */
export const verifyPayHereCallback = (data) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = data

  // Generate expected hash for verification
  const merchantSecret = PAYHERE_CONFIG.MERCHANT_SECRET
  const localMd5sig = crypto
    .createHash('md5')
    .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecret)
    .digest('hex')
    .toUpperCase()

  // Verify hash matches
  const isValid = localMd5sig === md5sig
  
  return {
    isValid,
    status: getPaymentStatus(status_code),
    orderId: order_id,
    amount: payhere_amount,
    currency: payhere_currency
  }
}

/**
 * Convert PayHere status code to readable status
 */
const getPaymentStatus = (statusCode) => {
  switch (parseInt(statusCode)) {
    case 2:
      return 'paid'
    case 0:
      return 'pending'
    case -1:
      return 'cancelled'
    case -2:
      return 'failed'
    case -3:
      return 'chargedback'
    default:
      return 'unknown'
  }
}

/**
 * Load PayHere script dynamically
 */
export const loadPayHereScript = () => {
  return new Promise((resolve, reject) => {
    // Check if PayHere is already loaded
    if (typeof window.payhere !== 'undefined') {
      resolve(window.payhere)
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://www.payhere.lk/lib/payhere.js'
    script.onload = () => {
      if (typeof window.payhere !== 'undefined') {
        resolve(window.payhere)
      } else {
        reject(new Error('PayHere script loaded but payhere object not found'))
      }
    }
    script.onerror = () => {
      reject(new Error('Failed to load PayHere script'))
    }

    document.head.appendChild(script)
  })
}

/**
 * Initialize PayHere payment with callbacks
 */
export const initializePayHerePayment = async (paymentData, callbacks = {}) => {
  try {
    const payhere = await loadPayHereScript()
    
    // Set up callbacks
    payhere.onCompleted = (orderId) => {
      console.log('PayHere payment completed:', orderId)
      if (callbacks.onCompleted) callbacks.onCompleted(orderId)
    }

    payhere.onDismissed = () => {
      console.log('PayHere payment dismissed')
      if (callbacks.onDismissed) callbacks.onDismissed()
    }

    payhere.onError = (error) => {
      console.error('PayHere payment error:', error)
      if (callbacks.onError) callbacks.onError(error)
    }

    // Start payment
    payhere.startPayment(paymentData)
    
  } catch (error) {
    console.error('Failed to initialize PayHere:', error)
    if (callbacks.onError) callbacks.onError(error)
    throw error
  }
}

export default {
  PAYHERE_CONFIG,
  generatePayHereHash,
  createPayHerePayment,
  verifyPayHereCallback,
  loadPayHereScript,
  initializePayHerePayment
}