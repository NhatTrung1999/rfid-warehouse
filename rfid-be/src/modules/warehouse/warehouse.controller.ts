import { Controller, Get } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('warehouses')
  @ResponseMessage('Lấy danh sách kho thành công')
  async getWarehouses() {
    return this.warehouseService.getWarehouses();
  }
}
