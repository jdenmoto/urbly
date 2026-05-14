import { randomUUID } from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import jwt from 'jsonwebtoken';
import { db } from './admin';

type AuthShape = { uid?: string; token?: Record<string, unknown> } | null | undefined;

type ClientPortalAccess = {
  active?: boolean;
  activeTokenJti?: string | null;
  customerId?: string | null;
  revoked?: boolean;
  revokedAt?: string | null;
  revokedTokenIds?: string[];
  tokenVersion?: number;
};

type ClientPortalTokenPayload = {
  serviceOrderId: string;
  customerId: string;
  scope: string;
  tokenVersion: number;
  version: number;
  jti?: string;
};

function requirePermission(auth: AuthShape, permission: string) {
  if (!auth) throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  const permissions = Array.isArray(auth.token?.permissions) ? (auth.token?.permissions as string[]) : [];
  if (auth.token?.role !== 'admin' && !permissions.includes(permission)) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }
}

function getPortalSecret() {
  const secret = process.env.CLIENT_PORTAL_JWT_SECRET;
  if (!secret) {
    throw new HttpsError('failed-precondition', 'Falta configurar CLIENT_PORTAL_JWT_SECRET.');
  }
  return secret;
}

export const generateClientPortalToken = onCall(async (request) => {
  requirePermission(request.auth, 'regenerate_secure_tokens');
  const serviceOrderId = request.data?.serviceOrderId as string | undefined;
  const customerId = request.data?.customerId as string | undefined;
  if (!serviceOrderId || !customerId) {
    throw new HttpsError('invalid-argument', 'serviceOrderId y customerId son requeridos.');
  }

  const serviceOrderRef = db.collection('service_orders').doc(serviceOrderId);
  const jti = randomUUID();
  const now = new Date().toISOString();
  const tokenVersion = await db.runTransaction(async (transaction) => {
    const serviceOrderSnap = await transaction.get(serviceOrderRef);
    const serviceOrder = serviceOrderSnap.data() as { clientPortalAccess?: ClientPortalAccess } | undefined;
    const storedVersion = Number(serviceOrder?.clientPortalAccess?.tokenVersion ?? 0);
    const currentVersion = Number.isFinite(storedVersion) ? storedVersion : 0;
    const nextVersion = currentVersion + 1;

    transaction.set(serviceOrderRef, {
      clientPortalAccess: {
        active: true,
        activeTokenJti: jti,
        customerId,
        revoked: false,
        revokedAt: null,
        tokenIssuedAt: now,
        tokenVersion: nextVersion
      }
    }, { merge: true });

    return nextVersion;
  });

  const token = jwt.sign(
    { serviceOrderId, customerId, scope: 'client_portal', tokenVersion, version: tokenVersion },
    getPortalSecret(),
    { expiresIn: '7d', issuer: 'urbly-functions', jwtid: jti }
  );

  return { token };
});

export const validateClientPortalToken = onCall(async (request) => {
  const token = request.data?.token as string | undefined;
  if (!token) {
    throw new HttpsError('invalid-argument', 'Token requerido.');
  }

  try {
    const payload = jwt.verify(token, getPortalSecret(), { issuer: 'urbly-functions' }) as ClientPortalTokenPayload;

    if (
      payload.scope !== 'client_portal' ||
      !payload.jti ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.version !== payload.tokenVersion
    ) {
      throw new HttpsError('permission-denied', 'Token invalido.');
    }

    const serviceOrderSnap = await db.collection('service_orders').doc(payload.serviceOrderId).get();
    if (!serviceOrderSnap.exists) {
      throw new HttpsError('not-found', 'Servicio no encontrado.');
    }

    const serviceOrder = serviceOrderSnap.data() as {
      clientPortalAccess?: ClientPortalAccess;
      customerId?: string | null;
      title?: string;
      status?: string;
    };
    if (serviceOrder.customerId !== payload.customerId) {
      throw new HttpsError('permission-denied', 'Token no corresponde al cliente.');
    }

    const portalAccess = serviceOrder.clientPortalAccess;
    const tokenRevoked = portalAccess?.revokedTokenIds?.includes(payload.jti) ?? false;
    if (
      !portalAccess ||
      portalAccess.active === false ||
      portalAccess.revoked === true ||
      Boolean(portalAccess.revokedAt) ||
      tokenRevoked ||
      portalAccess.activeTokenJti !== payload.jti ||
      portalAccess.tokenVersion !== payload.tokenVersion ||
      portalAccess.customerId !== payload.customerId
    ) {
      throw new HttpsError('permission-denied', 'Token revocado o desactualizado.');
    }

    return {
      valid: true,
      serviceOrderId: payload.serviceOrderId,
      customerId: payload.customerId,
      serviceOrder: {
        title: serviceOrder.title ?? '',
        status: serviceOrder.status ?? 'draft'
      }
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('permission-denied', 'Token invalido o expirado.');
  }
});
