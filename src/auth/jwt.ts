import * as jose from "jose";

export interface AppStoreConnectConfig {
  keyId: string;
  issuerId: string;
  privateKey: string;
}

export class JWTAuthenticator {
  private config: AppStoreConnectConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: AppStoreConnectConfig) {
    this.config = config;
  }

  /**
   * Get a valid JWT token, generating a new one if needed
   * Tokens are cached and reused until they expire
   */
  async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 60 second buffer)
    if (this.cachedToken && this.tokenExpiry > now + 60) {
      return this.cachedToken;
    }

    // Generate new token
    this.cachedToken = await this.generateToken();
    return this.cachedToken;
  }

  /**
   * Generate a new JWT token for App Store Connect API
   * Token is valid for 20 minutes as per Apple's requirements
   */
  private async generateToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 20 * 60; // 20 minutes from now

    // Import the private key
    const privateKey = await jose.importPKCS8(
      this.config.privateKey,
      "ES256"
    );

    // Create JWT
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({
        alg: "ES256",
        kid: this.config.keyId,
        typ: "JWT",
      })
      .setIssuer(this.config.issuerId)
      .setIssuedAt(now)
      .setExpirationTime(expiry)
      .setAudience("appstoreconnect-v1")
      .sign(privateKey);

    this.tokenExpiry = expiry;
    return jwt;
  }

  /**
   * Clear the cached token, forcing generation of a new one on next request
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }
}

/**
 * Create JWT authenticator from environment variables
 */
export function createAuthFromEnv(): JWTAuthenticator {
  const keyId = process.env.APPLE_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!keyId || !issuerId || !privateKey) {
    throw new Error(
      "Missing required environment variables: APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_PRIVATE_KEY"
    );
  }

  return new JWTAuthenticator({
    keyId,
    issuerId,
    privateKey,
  });
}