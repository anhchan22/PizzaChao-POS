export interface Shift {
    id: number;
    openedByName: string;
    closedByName: string | null;
    openedAt: string;
    closedAt: string | null;
    startingCash: number;
    expectedCash: number | null;
    actualCash: number | null;
    note: string | null;
    status: 'OPEN' | 'CLOSED';
}

export interface ShiftOpenRequest {
    startingCash: number;
}

export interface ShiftCloseRequest {
    actualCash: number;
    note?: string;
}
