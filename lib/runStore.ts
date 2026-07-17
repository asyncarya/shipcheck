import { TestRun, StepResult, Evidence, ConsoleError } from './schemas';
import { createAdminClient, createServer } from './supabaseServer';
import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';

function createPublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createSupabaseJSClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getSupabaseClient() {
  // 1. Try admin client (service role)
  const admin = createAdminClient();
  if (admin) return admin;

  // 2. Try server client with user session (cookies)
  try {
    const server = await createServer();
    if (server) return server;
  } catch (e) {
    // cookies() failed or not in request context
  }

  // 3. Fallback to public client (anon key, no cookies)
  return createPublicClient();
}

// Prevent hot-reloading from clearing our in-memory store in development
const globalForRuns = global as unknown as { runsMap?: Map<string, TestRun>; plansMap?: Map<string, any> };
const globalRuns = globalForRuns.runsMap || new Map<string, TestRun>();
const globalPlans = globalForRuns.plansMap || new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalForRuns.runsMap = globalRuns;
  globalForRuns.plansMap = globalPlans;
}

function mapSchemaToDb(run: Partial<TestRun>): any {
  const db: any = {};
  if (run.id !== undefined) db.id = run.id;
  if (run.url !== undefined) db.url = run.url;
  if (run.task !== undefined) db.task = run.task;
  if (run.expectedResult !== undefined) db.expected_result = run.expectedResult;
  if (run.status !== undefined) db.status = run.status;
  if (run.progress !== undefined) db.progress = run.progress;
  if (run.planId !== undefined) db.plan_id = run.planId;
  if (run.plan !== undefined) db.plan = run.plan;
  if (run.steps !== undefined) db.steps = run.steps;
  if (run.evidence !== undefined) db.evidence = run.evidence;
  if (run.consoleErrors !== undefined) db.console_errors = run.consoleErrors;
  if (run.bugReport !== undefined) db.bug_report = run.bugReport;
  if (run.latestScreenshotPath !== undefined) db.latest_screenshot_path = run.latestScreenshotPath;
  if (run.errorMessage !== undefined) db.error_message = run.errorMessage;
  if (run.createdAt !== undefined) db.created_at = run.createdAt;
  if (run.finishedAt !== undefined) db.finished_at = run.finishedAt;
  return db;
}

function mapDbToSchema(db: any): TestRun {
  return {
    id: db.id,
    url: db.url,
    task: db.task,
    expectedResult: db.expected_result || undefined,
    status: db.status,
    progress: db.progress,
    planId: db.plan_id || undefined,
    plan: db.plan || undefined,
    steps: db.steps || [],
    evidence: db.evidence || [],
    consoleErrors: db.console_errors || [],
    bugReport: db.bug_report || undefined,
    latestScreenshotPath: db.latest_screenshot_path || undefined,
    errorMessage: db.error_message || undefined,
    createdAt: db.created_at,
    finishedAt: db.finished_at || undefined,
  };
}

export const runStore = {
  savePlan(id: string, plan: any): void {
    globalPlans.set(id, plan);
  },

  async getPlan(id: string): Promise<any | null> {
    const cached = globalPlans.get(id);
    if (cached) return cached;

    const client = await getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('runs').select('plan').eq('plan_id', id).limit(1);
        if (!error && data && data.length > 0 && data[0].plan) {
          const plan = data[0].plan;
          globalPlans.set(id, plan);
          return plan;
        }
      } catch (err) {
        console.error('[runStore] Failed to fetch fallback plan from Supabase:', err);
      }
    }
    return null;
  },

  async createRun(id: string, url: string, task: string, expectedResult?: string, userId?: string): Promise<TestRun> {
    const run: TestRun = {
      id,
      url,
      task,
      expectedResult,
      status: 'created',
      progress: 0,
      steps: [],
      evidence: [],
      consoleErrors: [],
      createdAt: new Date().toISOString(),
    };
    globalRuns.set(id, run);

    const client = await getSupabaseClient();
    if (client) {
      try {
        const dbRow = mapSchemaToDb(run);
        if (userId) {
          dbRow.user_id = userId;
        }
        const { error } = await client.from('runs').insert(dbRow);
        if (error) {
          console.error('[runStore] Error creating run in Supabase:', error);
        }
      } catch (err) {
        console.error('[runStore] Failed to write run to Supabase:', err);
      }
    }

    return run;
  },

  async getRun(id: string): Promise<TestRun | null> {
    const client = await getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('runs').select('*').eq('id', id).single();
        if (error) {
          // Fallback to local map if it exists
          return globalRuns.get(id) || null;
        }
        if (data) {
          const run = mapDbToSchema(data);
          globalRuns.set(id, run);
          return run;
        }
      } catch (err) {
        console.error('[runStore] Supabase select error:', err);
      }
    }
    return globalRuns.get(id) || null;
  },

  async updateRun(id: string, patch: Partial<TestRun>): Promise<TestRun> {
    const run = await this.getRun(id);
    if (!run) {
      throw new Error(`Run with ID ${id} not found`);
    }
    const updated = { ...run, ...patch } as TestRun;
    globalRuns.set(id, updated);

    const client = await getSupabaseClient();
    if (client) {
      try {
        const dbPatch = mapSchemaToDb(patch);
        const { error } = await client.from('runs').update(dbPatch).eq('id', id);
        if (error) {
          console.error('[runStore] Supabase update error:', error);
        }
      } catch (err) {
        console.error('[runStore] Supabase update fail:', err);
      }
    }
    return updated;
  },

  async addStepResult(runId: string, result: StepResult): Promise<void> {
    const run = await this.getRun(runId);
    if (run) {
      const idx = run.steps.findIndex(s => s.stepId === result.stepId);
      if (idx !== -1) {
        run.steps[idx] = result;
      } else {
        run.steps.push(result);
      }
      await this.updateRun(runId, { steps: [...run.steps] });
    }
  },

  async addEvidence(runId: string, item: Evidence): Promise<void> {
    const run = await this.getRun(runId);
    if (run) {
      run.evidence.push(item);
      await this.updateRun(runId, { evidence: [...run.evidence] });
    }
  },

  async addConsoleError(runId: string, error: ConsoleError): Promise<void> {
    const run = await this.getRun(runId);
    if (run) {
      const exists = run.consoleErrors.some(e => e.text === error.text && e.type === error.type);
      if (!exists) {
        run.consoleErrors.push(error);
        await this.updateRun(runId, { consoleErrors: [...run.consoleErrors] });
      }
    }
  },

  async getAllRuns(userId?: string): Promise<TestRun[]> {
    const client = await getSupabaseClient();
    if (client) {
      try {
        let query = client.from('runs').select('*').order('created_at', { ascending: false });
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data, error } = await query;
        if (error) {
          console.error('[runStore] Supabase select all error:', error);
          return Array.from(globalRuns.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        return (data || []).map(r => mapDbToSchema(r));
      } catch (err) {
        console.error('[runStore] Supabase fetch all fail:', err);
      }
    }
    return Array.from(globalRuns.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async deleteRun(id: string): Promise<boolean> {
    globalRuns.delete(id);
    
    const client = await getSupabaseClient();
    if (client) {
      try {
        // 1. Delete associated screenshot assets from Supabase Storage 'evidence' bucket
        try {
          const { data: files, error: listError } = await client.storage
            .from('evidence')
            .list(id);
          
          if (!listError && files && files.length > 0) {
            const pathsToRemove = files.map(file => `${id}/${file.name}`);
            const { error: removeError } = await client.storage
              .from('evidence')
              .remove(pathsToRemove);
            
            if (removeError) {
              console.error(`[runStore] Failed to remove files from storage for run ${id}:`, removeError);
            } else {
              console.log(`[runStore] Successfully deleted ${pathsToRemove.length} screenshot files from storage for run ${id}`);
            }
          }
        } catch (storageErr) {
          console.error('[runStore] Storage deletion error:', storageErr);
        }

        // 2. Delete the run record from database
        const { error } = await client.from('runs').delete().eq('id', id);
        if (error) {
          console.error('[runStore] Supabase delete error:', error);
          return false;
        }
      } catch (err) {
        console.error('[runStore] Supabase delete fail:', err);
        return false;
      }
    }
    return true;
  }
};
