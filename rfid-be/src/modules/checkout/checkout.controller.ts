import { Controller, Get, Query } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('from')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckOutFrom(@Query('locationId') locationId: string) {
    return this.checkoutService.getCheckOutFrom(locationId);
  }

  @Get('to')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckOutTo(@Query('locationFrom') locationFrom: string) {
    return this.checkoutService.getCheckOutTo(locationFrom);
  }

  @Get('shelf')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckOutShelf(@Query('locationId') locationId: string) {
    return this.checkoutService.getCheckOutShelf(locationId);
  }

  @Get('carton')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckOutCarton(@Query('shelfId') shelfId: string) {
    return this.checkoutService.getCheckOutShelf(shelfId);
  }

  @Get('epc')
  @ResponseMessage('Lấy danh sách thành công')
  async getCheckOutEPC(@Query('epc') epc: string) {
    return this.checkoutService.getCheckOutEPC(epc);
  }
}
