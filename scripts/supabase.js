/**
 * APEX AUTO GEAR - Supabase Client & Connection Manager
 * Manages Supabase Cloud connection, real-time sync, and UI status indicator.
 */

export class SupabaseManager {
  constructor() {
    this.status = 'checking';
    this.engine = 'sqlite';
    this.supabaseUrl = '';
  }

  async checkStatus() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      this.engine = data.engine || 'sqlite';
      this.status = data.status || 'healthy';
      this.supabaseUrl = data.supabase_url || '';
      return data;
    } catch (e) {
      console.warn('Status check warning:', e);
      return { engine: 'sqlite', status: 'offline' };
    }
  }

  async configureSupabase(url, key) {
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, key })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async syncToSupabase() {
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const supabaseMgr = new SupabaseManager();
