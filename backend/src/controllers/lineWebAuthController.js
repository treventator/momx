const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { info, error } = require('../utils/logger');

/**
 * Generate JWT token for authentication
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Initiate LINE Login for Web
 * @route   GET /api/line/web-login
 * @access  Public
 */
exports.webLogin = async (req, res) => {
    try {
        const channelId = process.env.LINE_CHANNEL_ID;
        const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL ||
            `${req.protocol}://${req.get('host')}/api/line/callback`;

        const redirectAfterLogin = req.query.redirect || '/';
        const stateData = Buffer.from(JSON.stringify({ redirect: redirectAfterLogin })).toString('base64');

        const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
        lineAuthUrl.searchParams.set('response_type', 'code');
        lineAuthUrl.searchParams.set('client_id', channelId);
        lineAuthUrl.searchParams.set('redirect_uri', callbackUrl);
        lineAuthUrl.searchParams.set('state', stateData);
        lineAuthUrl.searchParams.set('scope', 'profile openid');

        info('LINE Web Login initiated', { callbackUrl });
        res.redirect(lineAuthUrl.toString());
    } catch (err) {
        error('LINE Web Login error', { error: err.message });
        res.redirect('/login.html?error=login_failed');
    }
};

/**
 * @desc    Handle LINE Login callback
 * @route   GET /api/line/callback
 * @access  Public
 */
exports.webCallback = async (req, res) => {
    try {
        const { code, state, error: lineError } = req.query;

        if (lineError || !code) {
            return res.redirect('/login.html?error=access_denied');
        }

        let redirectUrl = '/';
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            redirectUrl = stateData.redirect || '/';
        } catch (e) { }

        const channelId = process.env.LINE_CHANNEL_ID;
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL ||
            `${req.protocol}://${req.get('host')}/api/line/callback`;

        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://api.line.me/oauth2/v2.1/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: callbackUrl,
                client_id: channelId,
                client_secret: channelSecret
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token } = tokenResponse.data;

        // Get user profile
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { userId, displayName, pictureUrl, statusMessage } = profileResponse.data;

        // Find or create user
        let user = await User.findOne({ 'lineProfile.lineUserId': userId });

        if (!user) {
            user = await User.create({
                lineProfile: { lineUserId: userId, displayName, pictureUrl, statusMessage },
                authProvider: 'line',
                firstName: displayName,
                isActive: true
            });
            info(`New LINE user via web: ${userId}`, { displayName });
        } else {
            user.lineProfile.displayName = displayName;
            user.lineProfile.pictureUrl = pictureUrl;
            user.lineProfile.statusMessage = statusMessage;
            await user.save();
            info(`LINE user logged in via web: ${userId}`, { displayName });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Prepare user data for frontend
        const userData = {
            _id: user._id,
            lineUserId: user.lineProfile.lineUserId,
            displayName: user.lineProfile.displayName,
            pictureUrl: user.lineProfile.pictureUrl,
            firstName: user.firstName,
            role: user.role,
            token
        };

        // Redirect to frontend auth callback page
        const frontendCallback = `/auth-callback.html#token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}&redirect=${encodeURIComponent(redirectUrl)}`;

        res.redirect(frontendCallback);
    } catch (err) {
        error('LINE Web Callback error', { error: err.message });
        res.redirect('/login.html?error=callback_failed');
    }
};
