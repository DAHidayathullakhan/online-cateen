/**
 * Payment Abstraction Service
 * Provides mock development payment processing mode with clear transaction logging.
 */
class PaymentService {
  static async processPayment({ amount, paymentMethod, studentId, orderNumber }) {
    const isMock = true; // Development mode abstraction
    
    // Simulate payment verification delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[PaymentService DEV MODE] Processed payment of ₹${amount} for Order ${orderNumber} via ${paymentMethod || 'Campus Wallet'}. Transaction ID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      amount,
      mode: isMock ? 'DEVELOPMENT_MOCK_PAYMENT' : 'LIVE',
      status: 'PAID',
      message: 'Payment verified successfully in Development Mock Mode.'
    };
  }
}

module.exports = PaymentService;
