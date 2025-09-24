import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if environment variables are present
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database types
export interface Candidate {
  id: number;
  name: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  call_result?: string;
  call_notes?: string;
  call_time?: string;
  added_at?: string;
  call_start_time?: string;
  call_end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CallConfig {
  id?: number;
  method: "vapi" | "twilio" | "hybrid";
  script: string;
  voice_settings: {
    provider: string;
    voice_id: string;
    speed: number;
    pitch: number;
  };
  call_settings: {
    max_duration: number;
    retry_attempts: number;
    delay_between_calls: number;
  };
  created_at?: string;
  updated_at?: string;
}

// Fallback storage for when Supabase is not configured
let fallbackCandidates: Candidate[] = [];
let fallbackConfig: CallConfig | null = null;

// Candidates table operations
export const candidatesApi = {
  async getAll() {
    if (!supabase) {
      console.warn("Supabase not configured, using fallback storage");
      return fallbackCandidates;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: number) {
    if (!supabase) {
      return fallbackCandidates.find(c => c.id === id) || null;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      const newCandidate = {
        ...candidate,
        id: fallbackCandidates.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackCandidates.push(newCandidate);
      return newCandidate;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert([candidate])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createMany(candidates: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>[]) {
    if (!supabase) {
      const newCandidates = candidates.map((candidate, index) => ({
        ...candidate,
        id: fallbackCandidates.length + index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      fallbackCandidates.push(...newCandidates);
      return newCandidates;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidates)
      .select();
    
    if (error) throw error;
    return data || [];
  },

  async update(id: number, updates: Partial<Candidate>) {
    if (!supabase) {
      const index = fallbackCandidates.findIndex(c => c.id === id);
      if (index !== -1) {
        fallbackCandidates[index] = { ...fallbackCandidates[index], ...updates, updated_at: new Date().toISOString() };
        return fallbackCandidates[index];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('candidates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    if (!supabase) {
      fallbackCandidates = fallbackCandidates.filter(c => c.id !== id);
      return;
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByStatus(status: string) {
    if (!supabase) {
      return fallbackCandidates.filter(c => c.status === status);
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Call queue operations
export const callQueueApi = {
  async getQueue() {
    return candidatesApi.getByStatus('pending');
  },

  async addToQueue(candidates: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>[]) {
    const candidatesWithStatus = candidates.map(candidate => ({
      ...candidate,
      status: 'pending',
      added_at: new Date().toISOString()
    }));
    
    return candidatesApi.createMany(candidatesWithStatus);
  },

  async updateStatus(id: number, status: string, additionalData?: Partial<Candidate>) {
    const updates: Partial<Candidate> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'calling') {
      updates.call_start_time = new Date().toISOString();
    } else if (status === 'completed') {
      updates.call_end_time = new Date().toISOString();
    }

    return candidatesApi.update(id, updates);
  },

  async clearQueue() {
    if (!supabase) {
      fallbackCandidates = fallbackCandidates.filter(c => c.status !== 'pending');
      return;
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('status', 'pending');
    
    if (error) throw error;
  }
};

// Call history operations
export const callHistoryApi = {
  async getHistory() {
    return candidatesApi.getByStatus('completed');
  },

  async addToHistory(candidate: Candidate) {
    const historyCandidate = {
      ...candidate,
      status: 'completed',
      call_end_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return candidatesApi.update(candidate.id, historyCandidate);
  }
};

// Configuration operations
export const configApi = {
  async get() {
    if (!supabase) {
      return fallbackConfig;
    }

    const { data, error } = await supabase
      .from('call_configs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  },

  async save(config: Omit<CallConfig, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      fallbackConfig = {
        ...config,
        id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return fallbackConfig;
    }

    const existing = await this.get();
    
    if (existing) {
      const { data, error } = await supabase
        .from('call_configs')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('call_configs')
        .insert([config])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};

// Export/Import operations
export const dataApi = {
  async exportData() {
    const [candidates, config] = await Promise.all([
      candidatesApi.getAll(),
      configApi.get()
    ]);

    return {
      candidates,
      config,
      exported_at: new Date().toISOString()
    };
  },

  async importData(data: any) {
    if (data.candidates && Array.isArray(data.candidates)) {
      if (!supabase) {
        fallbackCandidates = data.candidates;
      } else {
        // Clear existing data
        await supabase.from('candidates').delete().neq('id', 0);
        
        // Insert new data
        await candidatesApi.createMany(data.candidates);
      }
    }

    if (data.config) {
      await configApi.save(data.config);
    }
  },

  async clearAllData() {
    if (!supabase) {
      fallbackCandidates = [];
      fallbackConfig = null;
    } else {
      await supabase.from('candidates').delete().neq('id', 0);
      await supabase.from('call_configs').delete().neq('id', 0);
    }
  }
};
