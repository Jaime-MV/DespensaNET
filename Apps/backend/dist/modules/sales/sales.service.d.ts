export declare class SalesService {
    searchProductByCode(code: string, idSucursal: number): Promise<any>;
    createSale(data: {
        idSucursal: number;
        idUsuario: number;
        metodoPago: string;
        items: Array<{
            idProducto: number;
            idOferta?: number | null;
            cantidad: number;
            precioUnitario: number;
            precioOriginal: number;
            subtotal: number;
        }>;
        total: number;
    }): Promise<{
        idVenta: any;
        fechaHora: any;
        total: number;
    }>;
    getTodaySales(idSucursal: number): Promise<any[]>;
    getActiveOffers(idSucursal: number): Promise<any[]>;
}
