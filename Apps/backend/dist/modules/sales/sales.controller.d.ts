import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    searchProduct(code: string, req: any): Promise<{
        product: any;
    }>;
    createSale(body: any, req: any): Promise<{
        idVenta: any;
        fechaHora: any;
        total: number;
    }>;
    todaySales(req: any): Promise<{
        sales: any[];
    }>;
    activeOffers(req: any): Promise<{
        offers: any[];
    }>;
}
