import { randomUUID } from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import jwt from 'jsonwebtoken';
import { db } from './admin';

type AuthShape = { uid?: string; token?: Record<string, unknown> } | null | undefined;

type ClientPortalAccess = {
  active?: boolean;
  activeTokenJti?: string | null;
  accountId?: string | null;
  buildingId?: string | null;
  customerId?: string | null;
  managementCompanyId?: string | null;
  revoked?: boolean;
  revokedAt?: string | null;
  revokedTokenIds?: string[];
  tokenVersion?: number;
};

type ClientPortalTokenPayload = {
  serviceOrderId: string;
  accountId: string;
  buildingId: string;
  customerId: string;
  managementCompanyId?: string;
  scope: string;
  tokenVersion: number;
  version: number;
  jti?: string;
};

type RelatedPortalRecord = Record<string, unknown> | null;

type PortalScope = {
  accountId: string;
  buildingId: string;
  customerId: string;
  managementCompanyId?: string;
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

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function assertSameString(label: string, left: unknown, right: unknown) {
  const leftValue = getString(left);
  const rightValue = getString(right);
  if (leftValue && rightValue && leftValue !== rightValue) {
    throw new HttpsError('permission-denied', `${label} no corresponde al alcance del token.`);
  }
}

function requireMatchingAccount(recordName: string, record: RelatedPortalRecord, accountId: string) {
  if (!record) return;
  const recordAccountId = getString(record.accountId);
  if (recordAccountId && recordAccountId !== accountId) {
    throw new HttpsError('permission-denied', `${recordName} pertenece a otra cuenta.`);
  }
}

export function resolveClientPortalScope(args: {
  requestedCustomerId: string;
  serviceOrder: RelatedPortalRecord;
  building: RelatedPortalRecord;
  customer: RelatedPortalRecord;
  managementCompany: RelatedPortalRecord;
}): PortalScope {
  const { requestedCustomerId, serviceOrder, building, customer, managementCompany } = args;
  const accountId = getString(serviceOrder?.accountId);
  const serviceCustomerId = getString(serviceOrder?.customerId);
  const buildingId = getString(serviceOrder?.buildingId);
  const buildingManagementCompanyId = getString(building?.managementCompanyId);
  const serviceManagementCompanyId = getString(serviceOrder?.managementCompanyId) ?? getString(serviceOrder?.administrationId);
  const managementCompanyId = serviceManagementCompanyId ?? buildingManagementCompanyId ?? undefined;

  if (!accountId || !serviceCustomerId || !buildingId) {
    throw new HttpsError('permission-denied', 'Servicio sin alcance cliente/cuenta completo.');
  }

  if (serviceCustomerId !== requestedCustomerId) {
    throw new HttpsError('permission-denied', 'Token no corresponde al cliente.');
  }

  if (!building) {
    throw new HttpsError('permission-denied', 'Edificio no corresponde al servicio.');
  }

  requireMatchingAccount('Servicio', serviceOrder, accountId);
  requireMatchingAccount('Edificio', building, accountId);
  requireMatchingAccount('Cliente', customer, accountId);
  requireMatchingAccount('Administración', managementCompany, accountId);

  assertSameString('Edificio', building?.id, buildingId);
  assertSameString('Administración del edificio', buildingManagementCompanyId, managementCompanyId);
  assertSameString('Administración del cliente', customer?.managementCompanyId ?? customer?.administrationId, managementCompanyId);
  assertSameString('Cliente de la administración', managementCompany?.customerId, serviceCustomerId);

  if (managementCompanyId && serviceCustomerId !== managementCompanyId) {
    const customerManagementId = getString(customer?.managementCompanyId) ?? getString(customer?.administrationId);
    const managementCustomerId = getString(managementCompany?.customerId);
    const isCustomerLinkedToManagement = customerManagementId === managementCompanyId || managementCustomerId === serviceCustomerId;
    if (!isCustomerLinkedToManagement && customer) {
      throw new HttpsError('permission-denied', 'Cliente no corresponde a la administración del servicio.');
    }
  }

  return { accountId, buildingId, customerId: serviceCustomerId, managementCompanyId };
}

function assertAuthActiveAccount(auth: AuthShape, accountId: string) {
  const activeAccountId = getString(auth?.token?.activeAccountId);
  if (activeAccountId && activeAccountId !== accountId) {
    throw new HttpsError('permission-denied', 'No autorizado para generar tokens de otra cuenta.');
  }
}

async function getPortalScopeForService(serviceOrderId: string, customerId: string) {
  const serviceOrderRef = db.collection('service_orders').doc(serviceOrderId);
  const serviceOrderSnap = await serviceOrderRef.get();
  if (!serviceOrderSnap.exists) {
    throw new HttpsError('not-found', 'Servicio no encontrado.');
  }

  const serviceOrder = serviceOrderSnap.data() as Record<string, unknown>;
  const buildingId = getString(serviceOrder.buildingId);

  const [buildingSnap, customerSnap] = await Promise.all([
    buildingId ? db.collection('buildings').doc(buildingId).get() : Promise.resolve(null),
    db.collection('customers').doc(customerId).get()
  ]);

  const building: RelatedPortalRecord = buildingSnap?.exists ? { id: buildingSnap.id, ...buildingSnap.data() } : null;
  const customer: RelatedPortalRecord = customerSnap.exists ? { id: customerSnap.id, ...customerSnap.data() } : null;
  const managementCompanyId = getString(serviceOrder.managementCompanyId) ?? getString(serviceOrder.administrationId) ?? getString(building?.managementCompanyId);
  const managementSnap = managementCompanyId ? await db.collection('management_companies').doc(managementCompanyId).get() : null;
  const managementCompany: RelatedPortalRecord = managementSnap?.exists ? { id: managementSnap.id, ...managementSnap.data() } : null;

  return resolveClientPortalScope({ requestedCustomerId: customerId, serviceOrder, building, customer, managementCompany });
}

export const generateClientPortalToken = onCall(async (request) => {
  requirePermission(request.auth, 'regenerate_secure_tokens');
  const serviceOrderId = request.data?.serviceOrderId as string | undefined;
  const customerId = request.data?.customerId as string | undefined;
  if (!serviceOrderId || !customerId) {
    throw new HttpsError('invalid-argument', 'serviceOrderId y customerId son requeridos.');
  }

  const scope = await getPortalScopeForService(serviceOrderId, customerId);
  assertAuthActiveAccount(request.auth, scope.accountId);

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
        accountId: scope.accountId,
        buildingId: scope.buildingId,
        customerId: scope.customerId,
        managementCompanyId: scope.managementCompanyId ?? null,
        revoked: false,
        revokedAt: null,
        tokenIssuedAt: now,
        tokenVersion: nextVersion
      }
    }, { merge: true });

    return nextVersion;
  });

  const token = jwt.sign(
    {
      serviceOrderId,
      accountId: scope.accountId,
      buildingId: scope.buildingId,
      customerId: scope.customerId,
      managementCompanyId: scope.managementCompanyId,
      scope: 'client_portal',
      tokenVersion,
      version: tokenVersion
    },
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
      !getString(payload.accountId) ||
      !getString(payload.buildingId) ||
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
      accountId?: string | null;
      buildingId?: string | null;
      customerId?: string | null;
      managementCompanyId?: string | null;
      administrationId?: string | null;
      title?: string;
      status?: string;
    };

    const scope = await getPortalScopeForService(payload.serviceOrderId, payload.customerId);
    if (
      scope.accountId !== payload.accountId ||
      scope.buildingId !== payload.buildingId ||
      (payload.managementCompanyId && scope.managementCompanyId !== payload.managementCompanyId)
    ) {
      throw new HttpsError('permission-denied', 'Token no corresponde al alcance del servicio.');
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
      portalAccess.accountId !== payload.accountId ||
      portalAccess.buildingId !== payload.buildingId ||
      portalAccess.customerId !== payload.customerId ||
      (portalAccess.managementCompanyId ?? undefined) !== (scope.managementCompanyId ?? undefined)
    ) {
      throw new HttpsError('permission-denied', 'Token revocado, desactualizado o fuera de alcance.');
    }

    return {
      valid: true,
      serviceOrderId: payload.serviceOrderId,
      accountId: scope.accountId,
      buildingId: scope.buildingId,
      customerId: payload.customerId,
      managementCompanyId: scope.managementCompanyId ?? null,
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
