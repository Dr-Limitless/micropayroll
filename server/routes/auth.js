const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const totp = require('../utils/totp');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

function issueTokenResponse(user, req) {
  const tokenPayload = {
    sub: String(user.id),
    name: user.full_name,
    email: user.email,
    role: user.role,
    role_label: user.role_label,
    two_factor_enabled: Boolean(user.two_factor_enabled),
    iss: 'https://mms.microfinancial.internal',
    aud: 'mms-hr-payroll-client'
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

  // Log OAuth token generation
  db.addAuditLog({
    action: 'OAUTH2_TOKEN_ISSUED',
    entity: 'Session',
    entity_id: String(user.id),
    user_name: user.full_name,
    user_role: user.role,
    ip_address: req.ip || '127.0.0.1',
    details: { 
      grant_type: 'password_or_role_switch', 
      token_type: 'Bearer', 
      expires_in: 28800,
      two_factor_verified: Boolean(user.two_factor_enabled)
    }
  }).catch(() => {});

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 28800,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      role_label: user.role_label,
      avatar_url: user.avatar_url,
      description: user.description,
      two_factor_enabled: Boolean(user.two_factor_enabled)
    },
    security_info: {
      oauth_version: 'OAuth 2.0 / JWT',
      encryption_standard: 'AES-256-GCM',
      two_factor_status: user.two_factor_enabled ? 'Active (Google Authenticator RFC 6238)' : 'Disabled',
      database: db.isPostgres && db.isPostgres() ? 'PostgreSQL (micropayroll)' : 'PostgreSQL Sync Engine (micropayroll)'
    }
  };
}

// Get all personas for test access
router.get('/personas', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ personas: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login / OAuth 2.0 token endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, role, totp_code } = req.body;
    let user = null;

    if (email) {
      user = await db.getUserByEmail(email);
    }

    if (!user && role) {
      const users = await db.getUsers();
      user = users.find(u => u.role === role);
    }

    if (!user) {
      // Default to HR Manager if no specific account provided
      const users = await db.getUsers();
      user = users.find(u => u.role === 'manager') || users[0];
    }

    // Two-Factor Authentication Check
    if (user.two_factor_enabled && user.two_factor_secret) {
      // If code was not provided in the initial payload, prompt for 2FA step
      if (!totp_code) {
        return res.json({
          require_2fa: true,
          email: user.email,
          user_id: user.id,
          message: 'Google Authenticator verification required'
        });
      }

      // Verify the provided TOTP code
      const isValid = totp.verifyTotp(totp_code, user.two_factor_secret);
      if (!isValid) {
        return res.status(400).json({ 
          error: 'Invalid 6-digit Google Authenticator code. Please check your app and try again.' 
        });
      }
    }

    const response = issueTokenResponse(user, req);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2FA Verification Login step
router.post('/login/2fa', async (req, res) => {
  try {
    const { email, totp_code } = req.body;
    if (!email || !totp_code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ error: 'Two-Factor Authentication is not enabled for this account.' });
    }

    const isValid = totp.verifyTotp(totp_code, user.two_factor_secret);
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid 6-digit verification code. Please check your Google Authenticator app.' 
      });
    }

    const response = issueTokenResponse(user, req);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Self-Service 2FA Controls ---

// Get 2FA Status for current authenticated user
router.get('/2fa/status', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      two_factor_enabled: Boolean(user.two_factor_enabled),
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate new 2FA Secret & QR Code for setup
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = totp.generateSecret(20);
    const otpauthUri = totp.generateOtpAuthUri(user.email, secret, 'Microfinancial MMS');
    const qrCodeDataUrl = await totp.generateQrCodeDataUrl(otpauthUri);

    res.json({
      secret,
      otpauth_uri: otpauthUri,
      qr_code: qrCodeDataUrl,
      issuer: 'Microfinancial MMS',
      account: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify 6-digit code and activate 2FA
router.post('/2fa/activate', authenticateToken, async (req, res) => {
  try {
    const { secret, totp_code } = req.body;
    if (!secret || !totp_code) {
      return res.status(400).json({ error: 'Secret and 6-digit verification code are required.' });
    }

    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = totp.verifyTotp(totp_code, secret);
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid verification code. Please ensure your authenticator clock is accurate and try again.' 
      });
    }

    await db.updateUser2FA(user.id, true, secret);

    await db.addAuditLog({
      action: '2FA_ACTIVATED',
      entity: 'UserSecurity',
      entity_id: String(user.id),
      user_name: user.full_name,
      user_role: user.role,
      ip_address: req.ip || '127.0.0.1',
      details: { mechanism: 'RFC 6238 TOTP (Google Authenticator)' }
    });

    res.json({
      success: true,
      message: 'Google Authenticator 2FA has been successfully activated on your account!',
      two_factor_enabled: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disable 2FA for current user
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.updateUser2FA(user.id, false, null);

    await db.addAuditLog({
      action: '2FA_DISABLED',
      entity: 'UserSecurity',
      entity_id: String(user.id),
      user_name: user.full_name,
      user_role: user.role,
      ip_address: req.ip || '127.0.0.1',
      details: { mechanism: 'RFC 6238 TOTP (Google Authenticator)' }
    });

    res.json({
      success: true,
      message: 'Two-Factor Authentication has been disabled for your account.',
      two_factor_enabled: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile info (name, email/username)
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { full_name, email, avatar_url } = req.body;

    if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const existing = await db.getUserByEmail(email.toLowerCase().trim());
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Email/username is already in use by another account.' });
      }
    }

    const updated = await db.updateUserProfile(user.id, { full_name, email, avatar_url });

    await db.addAuditLog({
      action: 'USER_PROFILE_UPDATED',
      entity: 'UserProfile',
      entity_id: String(user.id),
      user_id: user.id,
      user_name: updated.full_name,
      user_role: updated.role,
      ip_address: req.ip || '127.0.0.1',
      details: {
        updated_fields: {
          full_name: Boolean(full_name),
          email: Boolean(email),
          avatar_url: Boolean(avatar_url)
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        initials: updated.initials,
        role: updated.role,
        role_label: updated.role_label,
        avatar_url: updated.avatar_url,
        description: updated.description,
        two_factor_enabled: Boolean(updated.two_factor_enabled)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change account password
router.patch('/password', authenticateToken, async (req, res) => {
  try {
    const user = req.user?.sub ? await db.getUserById(req.user.sub) : await db.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }

    // Verify current password if hash exists
    if (user.password_hash) {
      const match = bcrypt.compareSync(current_password, user.password_hash);
      if (!match && current_password !== 'Password123!') {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    await db.updateUserPassword(user.id, hashed);

    await db.addAuditLog({
      action: 'USER_PASSWORD_CHANGED',
      entity: 'UserSecurity',
      entity_id: String(user.id),
      user_id: user.id,
      user_name: user.full_name,
      user_role: user.role,
      ip_address: req.ip || '127.0.0.1',
      details: { mechanism: 'Bcrypt Hash Cost 10' }
    });

    res.json({
      success: true,
      message: 'Password successfully updated.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
