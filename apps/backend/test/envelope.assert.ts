export interface TestResponse {
  body: Record<string, unknown>;
  status: number;
}

/**
 * Assert that a response matches the Zonite envelope shape.
 * Throws if the envelope is malformed.
 */
export function assertEnvelope(res: TestResponse): void {
  const { body } = res;

  // Check required envelope fields
  if (typeof body.code !== 'number') {
    throw new Error(`Invalid envelope: code must be a number, got ${typeof body.code}`);
  }

  if (typeof body.success !== 'boolean') {
    throw new Error(`Invalid envelope: success must be a boolean, got ${typeof body.success}`);
  }

  if (typeof body.message !== 'string') {
    throw new Error(`Invalid envelope: message must be a string, got ${typeof body.message}`);
  }

  if (typeof body.timestamp !== 'string') {
    throw new Error(`Invalid envelope: timestamp must be a string, got ${typeof body.timestamp}`);
  }

  // Success envelope must have data
  if (body.success && !('data' in body)) {
    throw new Error('Invalid envelope: success=true must include data field');
  }

  // Error envelope must have error or data
  if (!body.success && !body.error && !body.data) {
    throw new Error('Invalid envelope: success=false must include error or data field');
  }

  // Code should match HTTP status
  if (body.code !== res.status) {
    console.warn(`Envelope code (${body.code}) does not match HTTP status (${res.status})`);
  }
}
