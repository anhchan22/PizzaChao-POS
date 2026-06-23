import axiosInstance from '@/apis/axios';
import type { Shift, ShiftOpenRequest, ShiftCloseRequest } from '../types/shift.types';
import type { ApiResponse } from '@/types';

export const shiftApi = {
    getCurrentShift: async (): Promise<ApiResponse<Shift>> => {
        const response = await axiosInstance.get('/shifts/current');
        return response.data;
    },

    openShift: async (data: ShiftOpenRequest): Promise<ApiResponse<Shift>> => {
        const response = await axiosInstance.post('/shifts/open', data);
        return response.data;
    },

    closeShift: async (data: ShiftCloseRequest): Promise<ApiResponse<Shift>> => {
        const response = await axiosInstance.post('/shifts/close', data);
        return response.data;
    }
};
