import axiosInstance from '@/apis/axios';
import type { Setting } from '../types/setting.types';
import type { ApiResponse } from '@/types';

export const settingApi = {
    getAllSettings: async (): Promise<ApiResponse<Setting[]>> => {
        const response = await axiosInstance.get('/settings');
        return response.data;
    },

    saveSettings: async (settings: Setting[]): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.post('/settings', settings);
        return response.data;
    }
};
