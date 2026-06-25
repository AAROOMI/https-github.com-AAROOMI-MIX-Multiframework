import { dbAPI } from '../db';
import type { User, CompanyProfile } from '../types';

export interface AuditRecord {
  id: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  timestamp: number;
  operationType: string;
  previousValue: any;
  newValue: any;
  description: string;
  targetId?: string;
  hash: string;
}

export const useAuditMiddleware = (
  currentUser: User | null,
  company: CompanyProfile | null,
  addAuditLogState?: (action: any, details: string, targetId?: string) => void
) => {
  const logChange = async (
    operationType: string,
    previousValue: any,
    newValue: any,
    description: string,
    targetId?: string
  ) => {
    if (!currentUser) {
      console.warn('AuditMiddleware: Attempted to log without authenticated currentUser.');
      return null;
    }

    const timestamp = Date.now();
    const id = `audit-ledger-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a dynamic compliance cryptographic pseudo-hash of the transaction payload
    const hashPayload = JSON.stringify({
      actor: currentUser.email,
      timestamp,
      operationType,
      previousValue,
      newValue,
      targetId
    });
    
    let hash = 0;
    for (let i = 0; i < hashPayload.length; i++) {
      const char = hashPayload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const cryptoHash = `SEAL-${Math.abs(hash).toString(16).toUpperCase()}-${timestamp}`;

    const ledgerEntry = {
      id,
      artifactName: `SUPER_ADMIN_CONFIG_${operationType}`,
      hash: cryptoHash,
      uploadedBy: currentUser.email,
      timestamp,
      controlId: targetId || 'SYS-CFG',
      metadata: {
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        },
        operationType,
        previousValue,
        newValue,
        description,
      }
    };

    try {
      // 1. Write to general App-level auditLog state
      if (addAuditLogState) {
        addAuditLogState(
          'USER_UPDATED' as any, // valid fallback AuditAction
          `[SuperAdmin Control] ${description} (${operationType})`,
          targetId
        );
      }

      // 2. Persist to Firestore immutable_audit_ledger
      await dbAPI.addImmutableAuditLedgerEntry(company?.id || 'global', ledgerEntry);
      console.log('AuditMiddleware: Secure transaction ledger entry synchronized.', ledgerEntry);
    } catch (error) {
      console.error('AuditMiddleware: Failed to record Super Admin operation:', error);
    }

    return ledgerEntry;
  };

  return { logChange };
};
