export interface Coin {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number | null;
    market_cap: number | null;
    price_change_percentage_24h: number | null;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: number;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map