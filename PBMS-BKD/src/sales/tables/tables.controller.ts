import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from 'src/dto/table.dto';

@Controller('api/tables')
export class TablesController {
  constructor(private readonly tableService: TablesService) {}

  @Post('create')
  create(@Body() dto: CreateTableDto) {
    return this.tableService.create(dto);
  }

  @Get('fetch-all')
  findAll() {
    return this.tableService.findAll();
  }

  @Get('fetch/:id')
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(Number(id));
  }

  @Put('modify/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tableService.update(Number(id), dto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.tableService.remove(Number(id));
  }
}
