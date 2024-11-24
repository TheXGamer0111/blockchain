import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProposals = createAsyncThunk(
  'governance/fetchProposals',
  async () => {
    const response = await api.get('/proposals');
    return response.data;
  }
);

export const createProposal = createAsyncThunk(
  'governance/createProposal',
  async (proposalData) => {
    const response = await api.post('/proposals', proposalData);
    return response.data;
  }
);

export const voteOnProposal = createAsyncThunk(
  'governance/voteOnProposal',
  async ({ proposalId, vote }) => {
    const response = await api.post(`/proposals/${proposalId}/vote`, { vote });
    return response.data;
  }
);

const governanceSlice = createSlice({
  name: 'governance',
  initialState: {
    proposals: [],
    activeProposals: [],
    userVotes: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.loading = false;
        state.proposals = action.payload;
        state.activeProposals = action.payload.filter(
          (p) => p.status === 'active'
        );
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(voteOnProposal.fulfilled, (state, action) => {
        const { proposalId, vote } = action.payload;
        state.userVotes[proposalId] = vote;
      });
  },
});

export default governanceSlice.reducer; 