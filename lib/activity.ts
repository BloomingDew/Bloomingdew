import { supabaseService } from './admin-server';

// Best-effort activity logging for admin actions. Never throws — a logging
// failure must not break the action itself. Table: activity_log (RLS,
// service-role only).
export async function logActivity(params: {
  adminEmail: string | null | undefined;
  action: 'create' | 'update' | 'delete' | 'status' | 'reply' | 'reorder';
  entity: string;
  entityId?: string | number | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseService.from('activity_log').insert({
      admin_email: params.adminEmail ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId != null ? String(params.entityId) : null,
      details: params.details ?? null,
    });
  } catch {
    // Swallow — logging is auxiliary.
  }
}
