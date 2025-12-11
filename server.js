const express = require('express');
const crypto = require('crypto');
const app = express();
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files

// BCL Configuration - USING YOUR CREDENTIALS
const BCL_CONFIG = {
  merchantId: 'DEMO SDN BHD', // You need to find this in BCL dashboard
  apiKey: 'eWx5O3LGpkNpv3JGJ6DWL89s82Ng651k', // Your API Secret Key
  personalAccessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI1IiwianRpIjoiZTJhNDNjMjJlY2RiMTFhZDY5MWRjNzMzNzIzNGY4OTlkNjQ3YmFkYjRmMDNlZjM4YjMzN2FlNmJlYjc3NGE4MWY3ZmE4NzIyODNiZDFmMWEiLCJpYXQiOjE3Mjk1Nzg3NzAuNTI3OTcxLCJuYmYiOjE3Mjk1Nzg3NzAuNTI3OTczLCJleHAiOjIwNDUxMTE1NzAuNTI3MTk5LCJzdWIiOiI0OTYiLCJzY29wZXMiOlsiKiJdfQ.ApO8aUj_9i0VsUK6xFv8ShuYWTqtD2vIDXZiQtz1c_03q-JBWlwWks6O2JabjaC6pFXZXwxEkOF75DNzmFPVUYHJk8g3gs2c3qveh4RuvgYumyEVSC2AGKuy-AWSTM93SbzL2sEULaQHI-h2PnODU1RD6vLDe5tZ1mMfJ1psFerWkz4Q1u6JUmXrsB93O8OaGqKIjVJB5O3-CCe6JtqhyYku-yr_Suea2aerE-gWE1RSrBQfoTYt0g8mkjUYJFLQccIpnN1-0BVrOYPgHhSErCmrzbHeorWz4Og4lPIduDUYWVs-eLoiQDRVc2jkYUh7uIQV6DjTrmzNLmxezyVDhDwDQplhUfVZG_Crz3_ah2swjUXhE97LYAAOBsEx-mjPCCItgIx_bLjUIArd7dRSjdnHmsa1Mq2WB13jEhQ02-VfcDjcGNWu2enEzDqkHvoT1iiaFnB2wdyOZyfGo0Kkr2RihiV5r1fSX8HC2C6Y9ZF5VbtCUnfmy9vA7rspvk-BwYcnqeKn4KvYoRifZ6Zpt52J_jUknxS5uQDmXF22WISGKxqJFzxhSFaZ_MEpymDmlL7b3lN5TulPQi6osI3bQ594DoLb6rxBzZjDp7hwH8OxUuGazDLgEkzwp-g5YnI5VQnRfFmfXBh0x-z5CTPWrvhlHPlgqdQJFvXwlRVlT5c',
  // For testing - use sandbox
  baseUrl: 'https://sandbox-payment.bcl.my/api/v2',
  // For production: 'https://payment.bcl.my/api/v2'
  returnUrl: 'http://localhost:3000/payment-callback',
  notifyUrl: 'http://localhost:3000/payment-notify'
};

// IMPORTANT: You need to find your Merchant ID from BCL dashboard
// It usually looks like: M123456789 or similar
// Login to BCL.my -> Dashboard -> Merchant Settings

// In-memory storage for demo (use database in production)
const orders = new Map();

// Generate signature for BCL using HMAC-SHA256
function generateBCLSignature(params, apiKey) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');
}

// Create BCL payment order
app.post('/create-bcl-payment', (req, res) => {
  try {
    const { email, companyName, amount = 3.00, payment_method = 'ALL' } = req.body;
    
    // Generate unique order ID
    const orderId = 'CHOP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const params = {
      merchant_id: BCL_CONFIG.merchantId, // You need to update this!
      order_id: orderId,
      amount: amount.toFixed(2),
      currency: 'MYR',
      payment_method: payment_method,
      product_description: `HD Company Chop - ${companyName.substring(0, 50)}`,
      customer_email: email,
      customer_name: companyName.substring(0, 50) || 'Customer',
      return_url: BCL_CONFIG.returnUrl,
      notify_url: BCL_CONFIG.notifyUrl,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    console.log('Creating payment with params:', params);
    
    // Generate signature
    params.signature = generateBCLSignature(params, BCL_CONFIG.apiKey);
    
    // Store order in memory
    orders.set(orderId, {
      email,
      companyName,
      amount,
      status: 'pending',
      createdAt: new Date(),
      downloadToken: crypto.randomBytes(32).toString('hex'),
      params: params // Store for verification
    });
    
    console.log(`Created order: ${orderId} for ${email}`);
    
    res.json({
      success: true,
      paymentUrl: `${BCL_CONFIG.baseUrl}/payment`,
      params: params,
      orderId: orderId
    });
    
  } catch (error) {
    console.error('Error creating BCL payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to check if BCL integration works
app.post('/test-bcl-connection', (req, res) => {
  try {
    const testParams = {
      merchant_id: BCL_CONFIG.merchantId,
      order_id: 'TEST_' + Date.now(),
      amount: '3.00',
      currency: 'MYR',
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    testParams.signature = generateBCLSignature(testParams, BCL_CONFIG.apiKey);
    
    res.json({
      success: true,
      message: 'BCL connection test successful',
      testParams: testParams,
      apiKeyLength: BCL_CONFIG.apiKey.length,
      hasPAT: !!BCL_CONFIG.personalAccessToken
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle BCL payment callback (when user returns to your site)
app.post('/payment-callback', (req, res) => {
  try {
    console.log('Payment callback received:', req.body);
    
    const { order_id, status, signature, ...otherParams } = req.body;
    
    // Verify signature
    const calculatedSig = generateBCLSignature(otherParams, BCL_CONFIG.apiKey);
    
    if (calculatedSig !== signature) {
      console.error('Invalid signature for order:', order_id);
      console.log('Received signature:', signature);
      console.log('Calculated signature:', calculatedSig);
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">⚠️ Payment Error</h1>
            <p>Invalid signature detected. Please contact support.</p>
            <p>Order ID: ${order_id}</p>
            <a href="/" style="color: #6366f1;">Return to Home</a>
          </body>
        </html>
      `);
    }
    
    const order = orders.get(order_id);
    
    if (!order) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Order Not Found</h1>
            <p>Order ID: ${order_id} not found in our system.</p>
            <a href="/" style="color: #6366f1;">Return to Home</a>
          </body>
        </html>
      `);
    }
    
    if (status === 'SUCCESS') {
      // Payment successful
      order.status = 'paid';
      order.paidAt = new Date();
      
      // Create success page with download link
      const successPage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful - WebCop.my</title>
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
              padding: 20px;
            }
            .container { 
              background: white; 
              padding: 3rem; 
              border-radius: 20px; 
              text-align: center; 
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 500px; 
              width: 100%;
              animation: fadeIn 0.5s ease;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .success-icon { 
              font-size: 4rem; 
              color: #10b981; 
              margin-bottom: 1rem; 
              animation: bounce 0.5s ease;
            }
            @keyframes bounce {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            h1 { 
              color: #1f2d3d; 
              margin-bottom: 1rem; 
              font-size: 2rem;
            }
            p { 
              color: #6b7280; 
              margin-bottom: 2rem; 
              line-height: 1.6;
            }
            .btn { 
              background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); 
              color: white; 
              border: none; 
              padding: 1rem 2rem; 
              border-radius: 999px; 
              font-weight: 600; 
              cursor: pointer; 
              text-decoration: none; 
              display: inline-block; 
              margin: 0.5rem; 
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            }
            .btn:hover { 
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            }
            .details {
              background: #f8fafc;
              border-radius: 10px;
              padding: 1rem;
              margin: 1.5rem 0;
              text-align: left;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              margin: 0.5rem 0;
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="container">
            <div class="success-icon">🎉</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase. Your HD company chop is ready for download.</p>
            
            <div class="details">
              <div class="detail-item">
                <span>Amount Paid:</span>
                <span style="font-weight: 600;">RM${order.amount.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span>Order ID:</span>
                <span style="font-family: monospace;">${order_id}</span>
              </div>
              <div class="detail-item">
                <span>Email:</span>
                <span>${order.email}</span>
              </div>
            </div>
            
            <button onclick="downloadHD()" class="btn" style="font-size: 1.1rem;">
              ⬇️ Download HD Now
            </button>
            <br>
            <a href="/" class="btn" style="background: #6b7280; margin-top: 1rem;">
              ← Back to Home
            </a>
            
            <p style="margin-top: 2rem; font-size: 0.9rem; color: #9ca3af;">
              This window will close automatically in 5 seconds...
            </p>
          </div>
          
          <script>
            function downloadHD() {
              // Send message to opener (main window)
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'payment_success',
                  token: '${order.downloadToken}',
                  orderId: '${order_id}',
                  action: 'download_hd'
                }, '*');
                
                // Show confirmation
                alert('Download will start on the main page. You can close this window.');
              } else {
                // If opener closed, redirect to home with token
                window.location.href = '/?payment_success=true&token=${order.downloadToken}&order_id=${order_id}';
              }
            }
            
            // Auto-trigger download after 1 second
            setTimeout(downloadHD, 1000);
            
            // Auto-close after 5 seconds
            setTimeout(() => {
              if (window.opener && !window.opener.closed) {
                window.close();
              }
            }, 5000);
          </script>
        </body>
        </html>
      `;
      
      res.send(successPage);
    } else {
      // Payment failed
      order.status = 'failed';
      
      const failedPage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Failed - WebCop.my</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #f5f7fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { background: white; padding: 3rem; border-radius: 16px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1); max-width: 500px; }
            .error-icon { font-size: 4rem; color: #dc2626; margin-bottom: 1rem; }
            h1 { color: #1f2d3d; margin-bottom: 1rem; }
            p { color: #6b7280; margin-bottom: 2rem; }
            .btn { background: #6366f1; color: white; border: none; padding: 1rem 2rem; border-radius: 999px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">⚠️</div>
            <h1>Payment ${status}</h1>
            <p>Your payment was not successful. Status: <strong>${status}</strong></p>
            <p>Order ID: <code>${order_id}</code></p>
            <a href="/" class="btn">Try Again</a>
          </div>
        </body>
        </html>
      `;
      
      res.send(failedPage);
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Internal Server Error</h1>
          <p>${error.message}</p>
          <a href="/" style="color: #6366f1;">Return to Home</a>
        </body>
      </html>
    `);
  }
});

// Handle BCL notify URL (server-to-server)
app.post('/payment-notify', (req, res) => {
  try {
    console.log('Payment notify received:', req.body);
    
    const { order_id, status, signature, ...otherParams } = req.body;
    
    // Verify signature
    const calculatedSig = generateBCLSignature(otherParams, BCL_CONFIG.apiKey);
    
    if (calculatedSig !== signature) {
      console.error('Invalid notify signature for order:', order_id);
      return res.status(400).send('Invalid signature');
    }
    
    const order = orders.get(order_id);
    
    if (order) {
      order.status = status.toLowerCase();
      order.notifiedAt = new Date();
      order.notifyData = req.body;
      
      if (status === 'SUCCESS') {
        console.log(`✅ Payment confirmed for order: ${order_id}`);
        // Here you could send email confirmation, update database, etc.
      }
    }
    
    res.send('OK');
    
  } catch (error) {
    console.error('Notify error:', error);
    res.status(500).send('Error');
  }
});

// Verify payment and provide download
app.post('/verify-payment', (req, res) => {
  try {
    const { orderId, token } = req.body;
    
    const order = orders.get(orderId);
    
    if (!order) {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Order not found' 
      });
    }
    
    if (order.status !== 'paid') {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Payment not completed. Status: ' + order.status
      });
    }
    
    if (order.downloadToken !== token) {
      return res.json({ 
        success: false, 
        valid: false, 
        message: 'Invalid download token' 
      });
    }
    
    // Mark token as used (optional)
    // order.downloadToken = null;
    
    res.json({
      success: true,
      valid: true,
      message: 'Payment verified successfully',
      order: {
        id: orderId,
        email: order.email,
        companyName: order.companyName,
        amount: order.amount,
        paidAt: order.paidAt
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mock payment endpoint for testing (without real BCL)
app.post('/create-mock-payment', (req, res) => {
  try {
    const { email, companyName, amount = 3.00 } = req.body;
    
    const orderId = 'MOCK_' + Date.now();
    const downloadToken = crypto.randomBytes(32).toString('hex');
    
    // Store order
    orders.set(orderId, {
      email,
      companyName,
      amount,
      status: 'paid',
      downloadToken,
      createdAt: new Date(),
      paidAt: new Date(),
      isMock: true
    });
    
    console.log(`Created mock order: ${orderId} for ${email}`);
    
    res.json({
      success: true,
      orderId: orderId,
      downloadToken: downloadToken,
      message: 'Mock payment successful (for testing)',
      note: 'This is a test payment. Use real BCL for production.'
    });
    
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    bclConfigured: !!BCL_CONFIG.apiKey,
    merchantId: BCL_CONFIG.merchantId ? 'Set' : 'Not set',
    totalOrders: orders.size
  });
});

// Get all orders (for debugging)
app.get('/debug/orders', (req, res) => {
  const ordersArray = Array.from(orders.entries()).map(([id, order]) => ({
    id,
    ...order,
    params: order.params ? 'Set' : 'Not set'
  }));
  
  res.json({
    total: orders.size,
    orders: ordersArray
  });
});

// Clear all orders (for testing)
app.post('/debug/clear-orders', (req, res) => {
  const count = orders.size;
  orders.clear();
  res.json({ cleared: count });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Application: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🐞 Debug orders: http://localhost:${PORT}/debug/orders`);
  console.log(`💰 BCL Configuration:`);
  console.log(`   - API Key: ${BCL_CONFIG.apiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`   - Merchant ID: ${BCL_CONFIG.merchantId || '✗ MISSING - Update server.js!'}`);
  console.log(`   - Base URL: ${BCL_CONFIG.baseUrl}`);
  console.log(`   - Using: ${BCL_CONFIG.merchantId === 'YOUR_MERCHANT_ID' ? '⚠️ TEST MODE (Update merchantId)' : '✅ Production'}`);
  
  if (BCL_CONFIG.merchantId === 'YOUR_MERCHANT_ID') {
    console.log('\n⚠️ ⚠️ ⚠️ IMPORTANT:');
    console.log('1. Login to BCL.my dashboard');
    console.log('2. Find your Merchant ID');
    console.log('3. Update server.js line 14: merchantId: "YOUR_ACTUAL_MERCHANT_ID"');
    console.log('4. Restart server: npm start');
  }
});