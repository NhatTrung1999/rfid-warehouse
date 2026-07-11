import { Controller, Get, Post, Body } from '@nestjs/common';
import { DestroyRequestService } from './destroy-request.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { FilterDestroyRequestDto } from './dto/filter-destroy-request.dto';
import { CancelDestroyRequestDto } from './dto/cancel-destroy-request.dto';
import { UpdateCheckExportDto } from './dto/update-check-export.dto';

@Controller('destroy-request')
export class DestroyRequestController {
  constructor(private readonly destroyRequestService: DestroyRequestService) {}

  @Get('model-name')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestModelName() {
    return this.destroyRequestService.getDestroyRequestModelName();
  }

  @Get('stage')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestStage() {
    return this.destroyRequestService.getDestroyRequestStage();
  }

  @Get('season')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestSeason() {
    return this.destroyRequestService.getDestroyRequestSeason();
  }

  @Get('category')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestCategory() {
    return this.destroyRequestService.getDestroyRequestCategory();
  }

  @Get('article')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestArticle() {
    return this.destroyRequestService.getDestroyRequestArticle();
  }

  @Get('fd')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestFD() {
    return this.destroyRequestService.getDestroyRequestFD();
  }

  @Get('notice-no')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestNoticeNo() {
    return this.destroyRequestService.getDestroyRequestNoticeNo();
  }

  @Get('location')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestLocation() {
    return this.destroyRequestService.getDestroyRequestLocation();
  }

  @Post('data-warehouses')
  @ResponseMessage('Lấy danh sách thành công')
  async getDestroyRequestDataWarehouses(@Body() dto: FilterDestroyRequestDto) {
    return this.destroyRequestService.getDestroyRequestDataWarehouses(
      dto.epc ?? '',
      dto.modelName ?? [],
      dto.stage ?? [],
      dto.season ?? [],
      dto.category ?? [],
      dto.article ?? [],
      dto.fd ?? [],
      dto.location ?? [],
      dto.status ?? [],
      dto.noticeNo ?? [],
      dto.page ?? 1,
      dto.pageSize ?? 50,
    );
  }

  @Post('cancel')
  @ResponseMessage('Há»§y destroy request thÃ nh cÃ´ng')
  async cancelDestroyRequest(@Body() dto: CancelDestroyRequestDto) {
    return this.destroyRequestService.cancelDestroyRequest(dto.epcs);
  }

  @Post('check-export')
  @ResponseMessage('Cap nhat check export thanh cong')
  async updateCheckExport(@Body() dto: UpdateCheckExportDto) {
    return this.destroyRequestService.updateCheckExport(dto.epcs);
  }
}
