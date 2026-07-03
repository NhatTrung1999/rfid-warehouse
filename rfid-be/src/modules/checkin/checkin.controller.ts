import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('shelf')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInShelf(@Query('locationId') locationId?: string) {
    return this.checkinService.getCheckInShelf(
      this.requiredQuery(locationId, 'locationId'),
    );
  }

  @Get('carton')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInCarton(@Query('shelfId') shelfId?: string) {
    return this.checkinService.getCheckInCarton(
      this.requiredQuery(shelfId, 'shelfId'),
    );
  }

  @Get('delivery')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInDelivery(@Query('locationId') locationId?: string) {
    return this.checkinService.getCheckInDelivery(
      this.requiredQuery(locationId, 'locationId'),
    );
  }

  @Get('scan')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInScan(@Query('deliveryNo') deliveryNo?: string) {
    return this.checkinService.getCheckInScan(
      this.requiredQuery(deliveryNo, 'deliveryNo'),
    );
  }

  @Get('check-epc')
  @ResponseMessage('Kiểm tra EPC thành công')
  async checkEpc(@Query('epc') epc?: string) {
    return this.checkinService.checkEpc(this.requiredQuery(epc, 'epc'));
  }
  @Get('carton-number')
  @ResponseMessage('Lấy carton number thành công')
  async getCartonNumber(@Query('epc') epc?: string) {
    return this.checkinService.getCartonNumber(this.requiredQuery(epc, 'epc'));
  }
  private requiredQuery(value: string | undefined, name: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(name + ' is required');
    }
    return value;
  }
}
