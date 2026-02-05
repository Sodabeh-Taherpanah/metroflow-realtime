export interface Provider {
    fetchData(): Promise<any>;
    normalizeData(data: any): any;
}
