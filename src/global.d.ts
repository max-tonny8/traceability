export {};

declare global {
    interface Window {
        ethereum: {
            request<T>(params: { method: string }): Promise<T>;
            on<T>(event: string, cb: (params: T) => void): void;
            removeListener<T>(event: string, cb: (params: T) => void): void;
            selectedAddress: string | undefined;
        };
    }
}