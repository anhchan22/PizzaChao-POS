export interface Setting {
    key: string;
    value: string;
    group?: string;
    description?: string;
}

export interface BankSetting {
    bankId: string;
    accountNo: string;
    accountName: string;
    transferPrefix: string;
    storeName: string;
    qrImageUrl: string;
}
