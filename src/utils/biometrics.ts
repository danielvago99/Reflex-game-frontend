const encoder = new TextEncoder();

const toBuffer = (value: string) => encoder.encode(value);

const toBase64Url = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  return new Uint8Array(atob(padded).split('').map((char) => char.charCodeAt(0)));
};

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof PublicKeyCredential === 'undefined') {
    return false;
  }

  if (!window.isSecureContext) {
    return false;
  }

  if (!navigator.credentials) {
    return false;
  }

  if (!('isUserVerifyingPlatformAuthenticatorAvailable' in PublicKeyCredential)) {
    return true;
  }

  try {
    return await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Biometric availability check failed', error);
    return false;
  }
}

export async function registerBiometricCredential(walletId: string): Promise<string> {
  if (!(await isBiometricAvailable())) {
    throw new Error('Biometric authentication is not available on this device');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Reflex Wallet',
      id: window.location.hostname
    },
    user: {
      id: toBuffer(walletId.slice(0, 64)),
      name: walletId,
      displayName: walletId
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred'
    },
    timeout: 60_000,
    attestation: 'none'
  };

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) {
    throw new Error('Biometric registration was cancelled');
  }

  return toBase64Url(credential.rawId);
}

export async function verifyBiometricCredential(walletId: string, credentialId: string): Promise<boolean> {
  if (!(await isBiometricAvailable())) {
    return false;
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60_000,
    userVerification: 'required',
    allowCredentials: [
      {
        id: fromBase64Url(credentialId),
        type: 'public-key',
        transports: ['internal']
      }
    ]
  };

  const assertion = (await navigator.credentials.get({ publicKey: requestOptions })) as PublicKeyCredential | null;
  if (!assertion) {
    return false;
  }

  // Basic local verification to ensure the assertion is tied to the expected wallet
  const response = assertion.response as AuthenticatorAssertionResponse;
  const clientDataJson = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
  const expectedChallenge = toBase64Url(challenge);
  if (clientDataJson.challenge !== expectedChallenge) {
    return false;
  }

  if (assertion.id !== credentialId && assertion.rawId) {
    const encoded = toBase64Url(assertion.rawId);
    if (encoded !== credentialId) {
      return false;
    }
  }

  if (response.userHandle) {
    const userHandle = new TextDecoder().decode(response.userHandle);
    if (!walletId.startsWith(userHandle)) {
      return false;
    }
  }

  return true;
}

export const biometricsUtils = {
  isBiometricAvailable,
  registerBiometricCredential,
  verifyBiometricCredential
};

export type BiometricHelpers = typeof biometricsUtils;
