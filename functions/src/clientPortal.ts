import { onCall, HttpsError } from 'firebase-functions/v2/https';
import jwt from 'jsonwebtoken';
import { db } from './admin';

type AuthShape = { uid?: string; token?: Record<string, unknown> } | null | undefined;

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

  const token = jwt.sign(
    { serviceOrderId, customerId, scope: 'client_portal' },
    getPortalSecret(),
    { expiresIn: '7d', issuer: 'urbly-functions' }
  );

  await db.collection('service_orders').doc(serviceOrderId).set({
    clientPortalAccess: {
      tokenIssuedAt: new Date().toISOString(),
      customerId
    }
  }, { merge: true });

  return { token };
});

export const validateClientPortalToken = onCall(async (request) => {
  const token = request.data?.token as string | undefined;
  if (!token) {
    throw new HttpsError('invalid-argument', 'Token requerido.');
  }

  try {
    const payload = jwt.verify(token, getPortalSecret()) as {
      serviceOrderId: string;
      customerId: string;
      scope: string;
    };

    if (payload.scope !== 'client_portal') {
      throw new HttpsError('permission-denied', 'Token invalido.');
    }

    const serviceOrderSnap = await db.collection('service_orders').doc(payload.serviceOrderId).get();
    if (!serviceOrderSnap.exists) {
      throw new HttpsError('not-found', 'Servicio no encontrado.');
    }

    const serviceOrder = serviceOrderSnap.data() as { customerId?: string | null; title?: string; status?: string };
    if (serviceOrder.customerId !== payload.customerId) {
      throw new HttpsError('permission-denied', 'Token no corresponde al cliente.');
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
