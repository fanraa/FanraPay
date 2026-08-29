export const isBiometricSupported = () => {
  return window.PublicKeyCredential !== undefined;
};

export const registerBiometric = async (): Promise<string | null> => {
  if (!isBiometricSupported()) return null;
  
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "FanraPay", id: window.location.hostname },
        user: {
          id: userId,
          name: "owner@fanrapay",
          displayName: "FanraPay Owner"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        authenticatorSelection: { 
          authenticatorAttachment: "platform", 
          userVerification: "required" 
        },
        timeout: 60000,
      }
    });

    if (cred) {
      return btoa(String.fromCharCode(...new Uint8Array((cred as PublicKeyCredential).rawId)));
    }
    return null;
  } catch(e: any) {
    if (e.message && e.message.includes('publickey-credentials-create')) {
      console.warn("Biometric registration requires a top-level context. Please open in a new tab.");
    } else {
      console.error("Biometric registration failed:", e);
    }
    throw e;
  }
};

export const verifyBiometric = async (credentialIdBase64: string): Promise<boolean> => {
  if (!isBiometricSupported()) return false;

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const rawId = Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0));

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ type: "public-key", id: rawId }],
        userVerification: "required",
        timeout: 60000
      }
    });
    return !!assertion;
  } catch (e: any) {
    if (e.message && e.message.includes('publickey-credentials-get')) {
      console.warn("Biometric verification requires a top-level context. Please open in a new tab.");
    } else {
      console.error("Biometric verification failed:", e);
    }
    return false;
  }
};
