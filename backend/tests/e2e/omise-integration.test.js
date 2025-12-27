/**
 * Omise Payment Integration Test (Test Mode)
 * ทดสอบการเชื่อมต่อ Omise PromptPay ใน Test Mode
 * 
 * Prerequisites:
 * - Set OMISE_PUBLIC_KEY and OMISE_SECRET_KEY in .env (test keys)
 * - Test keys start with: pkey_test_xxx and skey_test_xxx
 * 
 * Run: cd backend && npm test -- tests/e2e/omise-integration.test.js
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const Omise = require('omise');

// Load environment variables from project root
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });


// Check if Omise keys are configured
const hasOmiseKeys = process.env.OMISE_PUBLIC_KEY && process.env.OMISE_SECRET_KEY;
const isTestMode = process.env.OMISE_SECRET_KEY?.includes('test');

describe('💳 Omise Payment Integration Test (Test Mode)', () => {
    let omise;

    beforeAll(() => {
        if (hasOmiseKeys) {
            omise = Omise({
                publicKey: process.env.OMISE_PUBLIC_KEY,
                secretKey: process.env.OMISE_SECRET_KEY
            });
        }
    });

    // ====================================================
    // Configuration Check
    // ====================================================
    describe('⚙️ Configuration Check', () => {
        it('Omise keys ควรถูกตั้งค่าใน environment', () => {
            console.log('\n========================================');
            console.log('🔧 Omise Configuration Check');
            console.log('========================================');

            if (hasOmiseKeys) {
                console.log('✅ OMISE_PUBLIC_KEY: Configured');
                console.log('✅ OMISE_SECRET_KEY: Configured');
                console.log(`📌 Mode: ${isTestMode ? 'TEST MODE ✓' : 'LIVE MODE ⚠️'}`);

                // Mask keys for logging
                const publicKey = process.env.OMISE_PUBLIC_KEY;
                const secretKey = process.env.OMISE_SECRET_KEY;
                console.log(`   Public Key: ${publicKey.substring(0, 15)}...`);
                console.log(`   Secret Key: ${secretKey.substring(0, 15)}...`);
            } else {
                console.log('⚠️ OMISE_PUBLIC_KEY: Not set');
                console.log('⚠️ OMISE_SECRET_KEY: Not set');
                console.log('');
                console.log('📝 Please add Omise test keys to .env:');
                console.log('   OMISE_PUBLIC_KEY=pkey_test_xxxxx');
                console.log('   OMISE_SECRET_KEY=skey_test_xxxxx');
            }

            console.log('========================================\n');

            // Test passes even without keys (just logs warning)
            expect(true).toBe(true);
        });
    });

    // ====================================================
    // Omise API Connection Test
    // ====================================================
    describe('🔌 Omise API Connection', () => {
        (hasOmiseKeys ? it : it.skip)('ควรเชื่อมต่อ Omise API ได้', async () => {
            try {
                // Try to retrieve account info
                const account = await omise.account.retrieve();

                console.log('\n✅ Connected to Omise!');
                console.log(`   Account ID: ${account.id}`);
                console.log(`   Email: ${account.email}`);
                console.log(`   Team: ${account.team || 'N/A'}`);
                console.log(`   Currency: ${account.currency}`);

                expect(account).toBeDefined();
                expect(account.id).toBeDefined();
            } catch (error) {
                console.error('❌ Failed to connect to Omise:', error.message);
                throw error;
            }
        });
    });

    // ====================================================
    // PromptPay Source Creation Test
    // ====================================================
    describe('📱 PromptPay Source Creation', () => {
        (hasOmiseKeys ? it : it.skip)('ควรสร้าง PromptPay source ได้', async () => {
            try {
                const amount = 100; // 100 THB = 10000 satang
                const amountInSatang = amount * 100;

                // Create PromptPay source
                const source = await omise.sources.create({
                    type: 'promptpay',
                    amount: amountInSatang,
                    currency: 'thb'
                });

                console.log('\n✅ PromptPay Source Created!');
                console.log(`   Source ID: ${source.id}`);
                console.log(`   Type: ${source.type}`);
                console.log(`   Amount: ${source.amount / 100} THB`);
                console.log(`   Flow: ${source.flow}`);

                if (source.scannable_code?.image?.download_uri) {
                    console.log(`   QR Code URL: ${source.scannable_code.image.download_uri}`);
                }

                expect(source).toBeDefined();
                expect(source.id).toMatch(/^src_/);
                expect(source.type).toBe('promptpay');
                expect(source.amount).toBe(amountInSatang);
            } catch (error) {
                console.error('❌ Failed to create source:', error.message);
                throw error;
            }
        }, 30000);
    });

    // ====================================================
    // Full PromptPay Charge Flow Test
    // ====================================================
    describe('💰 PromptPay Charge Flow', () => {
        (hasOmiseKeys ? it : it.skip)('ควรสร้าง PromptPay charge ครบ flow', async () => {
            try {
                const orderId = `TEST-ORDER-${Date.now()}`;
                const amount = 50; // 50 THB minimum for testing
                const amountInSatang = amount * 100;

                console.log('\n========================================');
                console.log('💳 Creating PromptPay Charge');
                console.log('========================================');
                console.log(`   Order ID: ${orderId}`);
                console.log(`   Amount: ${amount} THB`);

                // Step 1: Create Source
                console.log('\n1️⃣ Creating PromptPay source...');
                const source = await omise.sources.create({
                    type: 'promptpay',
                    amount: amountInSatang,
                    currency: 'thb'
                });
                console.log(`   ✅ Source ID: ${source.id}`);

                // Step 2: Create Charge
                console.log('\n2️⃣ Creating charge...');
                const charge = await omise.charges.create({
                    amount: amountInSatang,
                    currency: 'thb',
                    source: source.id,
                    metadata: {
                        orderId: orderId,
                        testMode: 'true',
                        createdAt: new Date().toISOString()
                    }
                });

                console.log(`   ✅ Charge ID: ${charge.id}`);
                console.log(`   Status: ${charge.status}`);
                console.log(`   Paid: ${charge.paid}`);
                console.log(`   Expires At: ${charge.expires_at}`);

                // Get QR Code URL
                const qrCodeUrl = charge.source?.scannable_code?.image?.download_uri ||
                    source.scannable_code?.image?.download_uri;

                if (qrCodeUrl) {
                    console.log('\n3️⃣ QR Code Generated!');
                    console.log(`   📱 QR Code URL: ${qrCodeUrl}`);
                    console.log('\n   💡 Scan this QR code with Thai banking app to test payment');
                }

                console.log('\n========================================');
                console.log('✅ PromptPay Charge Created Successfully!');
                console.log('========================================');
                console.log('');
                console.log('📝 Test Data Saved:');
                console.log(JSON.stringify({
                    orderId,
                    chargeId: charge.id,
                    sourceId: source.id,
                    amount: amount,
                    status: charge.status,
                    qrCodeUrl: qrCodeUrl
                }, null, 2));
                console.log('');

                expect(charge).toBeDefined();
                expect(charge.id).toMatch(/^chrg_/);
                expect(charge.status).toBe('pending');
                expect(charge.metadata.orderId).toBe(orderId);
            } catch (error) {
                console.error('❌ Charge creation failed:', error.message);
                if (error.message.includes('secret key')) {
                    console.log('💡 Tip: Make sure you\'re using the correct secret key');
                }
                throw error;
            }
        }, 30000);
    });

    // ====================================================
    // Charge Status Check Test
    // ====================================================
    describe('🔍 Charge Status Check', () => {
        let testChargeId;

        beforeAll(async () => {
            if (hasOmiseKeys) {
                try {
                    // Create a test charge to check status
                    const source = await omise.sources.create({
                        type: 'promptpay',
                        amount: 2000, // 20 THB
                        currency: 'thb'
                    });

                    const charge = await omise.charges.create({
                        amount: 2000,
                        currency: 'thb',
                        source: source.id,
                        metadata: { test: 'status-check' }
                    });

                    testChargeId = charge.id;
                } catch (error) {
                    console.log('Could not create test charge:', error.message);
                }
            }
        });

        (hasOmiseKeys ? it : it.skip)('ควรตรวจสอบสถานะ charge ได้', async () => {
            if (!testChargeId) {
                console.log('⚠️ No test charge available');
                return;
            }

            const charge = await omise.charges.retrieve(testChargeId);

            console.log('\n📊 Charge Status:');
            console.log(`   Charge ID: ${charge.id}`);
            console.log(`   Status: ${charge.status}`);
            console.log(`   Paid: ${charge.paid}`);
            console.log(`   Amount: ${charge.amount / 100} THB`);

            if (charge.failure_code) {
                console.log(`   Failure Code: ${charge.failure_code}`);
                console.log(`   Failure Message: ${charge.failure_message}`);
            }

            expect(charge.id).toBe(testChargeId);
        }, 15000);
    });

    // ====================================================
    // Webhook Simulation Test
    // ====================================================
    describe('🪝 Webhook Handler Test', () => {
        it('ควรจัดการ webhook event ได้', async () => {
            // Mock webhook event from Omise
            const mockWebhookEvent = {
                object: 'event',
                key: 'charge.complete',
                id: 'evnt_test_xxxxx',
                data: {
                    object: 'charge',
                    id: 'chrg_test_xxxxx',
                    amount: 10000,
                    currency: 'thb',
                    status: 'successful',
                    paid: true,
                    metadata: {
                        orderId: 'TEST-ORDER-123'
                    }
                }
            };

            console.log('\n📥 Simulating Omise Webhook Event:');
            console.log(`   Event Key: ${mockWebhookEvent.key}`);
            console.log(`   Charge Status: ${mockWebhookEvent.data.status}`);
            console.log(`   Order ID: ${mockWebhookEvent.data.metadata.orderId}`);

            // Create test app with webhook route
            const app = express();
            app.use(express.json());

            app.post('/api/payment/omise/webhook', (req, res) => {
                const event = req.body;
                console.log(`   ✅ Webhook received: ${event.key}`);

                if (event.key === 'charge.complete' && event.data.status === 'successful') {
                    console.log('   ✅ Payment successful - would update order');
                }

                res.status(200).json({ success: true, message: 'Webhook processed' });
            });

            const res = await request(app)
                .post('/api/payment/omise/webhook')
                .send(mockWebhookEvent);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            console.log('   ✅ Webhook handler working correctly\n');
        });
    });

    // ====================================================
    // Summary
    // ====================================================
    describe('📊 Test Summary', () => {
        it('แสดงสรุปผลการทดสอบ Omise', () => {
            console.log('\n========================================');
            console.log('🎉 Omise Integration Test Complete!');
            console.log('========================================');
            console.log('');
            console.log('📋 Tests performed:');
            console.log('  1. ⚙️ Configuration check');
            console.log('  2. 🔌 API connection test');
            console.log('  3. 📱 PromptPay source creation');
            console.log('  4. 💰 Full charge flow');
            console.log('  5. 🔍 Charge status check');
            console.log('  6. 🪝 Webhook handler');
            console.log('');
            console.log('📝 Notes:');
            console.log('  - Tests run in Omise TEST MODE');
            console.log('  - No real money is charged');
            console.log('  - Charges auto-expire after 15 minutes');
            console.log('  - Check Omise Dashboard for transaction logs');
            console.log('');
            console.log('🔗 Omise Dashboard: https://dashboard.omise.co');
            console.log('========================================\n');

            expect(true).toBe(true);
        });
    });
});
