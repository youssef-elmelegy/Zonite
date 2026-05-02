import { api } from './api';

export interface ProfileInfo {
  id: string;
  email: string;
  fullName: string;
  userName: string;
  isEmailVerified: boolean;
  profileImage?: string;
  xp: number;
  level: number;
  totalWins: number;
  totalBlocksMined: number;
  totalMatchesPlayed: number;
  currentWinStreak: number;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW';

export interface MatchRecord {
  id: string;
  outcome: MatchOutcome;
  mode: 'SOLO' | 'TEAM';
  gridSize: number;
  roomCode: string | null;
  blocksClaimed: number;
  xpEarned: number;
  playedAt: string;
}

export interface MatchPage {
  items: MatchRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const profileService = {
  async getProfileInfo(): Promise<ProfileInfo> {
    const { data } = await api.get<ProfileInfo>('/profile/info');
    return data;
  },

  async updateProfileInfo(dto: {
    fullName?: string;
    dateOfBirth?: string;
    profileImage?: string;
  }): Promise<ProfileInfo> {
    const { data } = await api.put<ProfileInfo>('/profile/info', dto);
    return data;
  },

  async updateEmail(newEmail: string): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>('/profile/email', { newEmail });
    return data;
  },

  async uploadProfileImage(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<{ url: string }>(
      '/uploads/image?folder=Zonite%2Favatars',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/profile');
  },

  async getMatchRecords(page: number): Promise<MatchPage> {
    const { data } = await api.get<MatchPage>(`/profile/matches?page=${page}&pageSize=10`);
    return data;
  },
};
