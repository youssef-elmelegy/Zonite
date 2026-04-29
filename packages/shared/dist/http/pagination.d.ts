import type { SuccessResponse } from './envelope.js';
export type PaginationQuery = {
    page?: number;
    pageSize?: number;
};
export type PaginationMeta = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};
export type PaginatedData<T> = {
    items: T[];
} & PaginationMeta;
export type PaginatedResponse<T> = SuccessResponse<PaginatedData<T>>;
//# sourceMappingURL=pagination.d.ts.map