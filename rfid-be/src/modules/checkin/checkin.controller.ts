import { Controller, Get, Query } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('shelf')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInShelf(@Query('locationId') locationId: string) {
    return this.checkinService.getCheckInShelf(locationId);
  }

  @Get('carton')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInCarton(@Query('shelfId') shelfId: string) {
    return this.checkinService.getCheckInCarton(shelfId);
  }

  @Get('delivery')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInDelivery(@Query('locationId') locationId: string) {
    return this.checkinService.getCheckInDelivery(locationId);
  }

  @Get('scan')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckInScan(@Query('deliveryNo') deliveryNo: string) {
    return this.checkinService.getCheckInScan(deliveryNo);
  }
}
