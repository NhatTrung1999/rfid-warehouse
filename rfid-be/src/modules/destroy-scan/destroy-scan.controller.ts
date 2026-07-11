import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DestroyScanService } from './destroy-scan.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { FilterDestroyScanDto } from './dto/filter-destroy-scan.dto';

@Controller('destroy-scan')
export class DestroyScanController {
  constructor(private readonly destroyScanService: DestroyScanService) {}

  @Get('overview-destroy-scan')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyScanOverview(@Query('locationId') locationId: string) {
    return this.destroyScanService.getDestroyScanOverview(locationId);
  }

  @Get('scan-chip')
  @ResponseMessage('Scan chip thành công')
  async getDestroyScanChip(
    @Query('checkInDestroy') checkInDestroy: string,
    @Query('locationScan') locationScan: string,
  ) {
    return this.destroyScanService.getDestroyScanChip(
      checkInDestroy,
      locationScan,
    );
  }

  @Get('data-destroy-scan')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyScanData(
    @Query('locationId') locationId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.destroyScanService.getDestroyScanData({
      locationId,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 50,
    });
  }

  @Post('data-destroy-scan')
  @ResponseMessage('Lay danh sach thanh cong')
  async getDestroyScanDataByFilters(@Body() dto: FilterDestroyScanDto) {
    return this.destroyScanService.getDestroyScanData(dto);
  }
}
