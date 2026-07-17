import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase';

export interface ProfileState {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  firstName: '',
  lastName: '',
  username: '',
  avatarUrl: '',
  loading: false,
  error: null,
};

// Async Thunk: Fetch profile details from public.profiles database table
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client is not available');

      // Fetch profile row
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile row doesn't exist, create it (self-healing for legacy users)
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          const newProfile = {
            id: userId,
            first_name: userData.user?.user_metadata?.first_name || '',
            last_name: userData.user?.user_metadata?.last_name || '',
            username: userData.user?.user_metadata?.username || '',
            avatar_url: '',
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (insertError) throw insertError;
          return {
            firstName: inserted.first_name || '',
            lastName: inserted.last_name || '',
            username: inserted.username || '',
            avatarUrl: inserted.avatar_url || '',
          };
        }
        throw error;
      }

      return {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        username: data.username || '',
        avatarUrl: data.avatar_url || '',
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch user profile.');
    }
  }
);

// Async Thunk: Save/update profile details in public.profiles table
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (
    payload: {
      userId: string;
      firstName: string;
      lastName: string;
      username: string;
      avatarUrl: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client is not available');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: payload.userId,
          first_name: payload.firstName,
          last_name: payload.lastName,
          username: payload.username,
          avatar_url: payload.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        username: data.username || '',
        avatarUrl: data.avatar_url || '',
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update user profile.');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.firstName = '';
      state.lastName = '';
      state.username = '';
      state.avatarUrl = '';
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
        state.username = action.payload.username;
        state.avatarUrl = action.payload.avatarUrl;
      })
      .addCase(fetchProfile.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
        state.username = action.payload.username;
        state.avatarUrl = action.payload.avatarUrl;
      })
      .addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
