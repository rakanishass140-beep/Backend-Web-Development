'use strict';

const crypto = require('crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  const signatureHeader = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Verify the provider signature against the exact raw request bytes.
  if (
    typeof signatureHeader !== 'string' ||
    !signatureHeader.startsWith('sha256=') ||
    !secret ||
    !Buffer.isBuffer(req.body)
  ) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const receivedHex = signatureHeader.slice('sha256='.length);
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest();

  const received = Buffer.from(receivedHex, 'hex');
  if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  // Record the id before dispatching so retries cannot enqueue duplicate work.
  _processedIds.add(event.id);

  res.status(200).json({ status: 'received' });

  setImmediate(() => {
    try {
      const result = handleEvent(event);
      if (result && typeof result.catch === 'function') {
        result.catch(err => console.error('[webhook] event processing failed:', err));
      }
    } catch (err) {
      console.error('[webhook] event processing failed:', err);
    }
  });
}

module.exports = { handleWebhook, _processedIds };
