import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SentenceTokensService } from './sentence-tokens.service';
import { CreateSentenceTokenDto } from './dto/create-sentence-token.dto';
import { UpdateSentenceTokenDto } from './dto/update-sentence-token.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('sentence-tokens')
@UseGuards(JWTGuard)
export class SentenceTokensController {
  constructor(private readonly sentenceTokensService: SentenceTokensService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createSentenceTokenDto: CreateSentenceTokenDto) {
    return this.sentenceTokensService.create(createSentenceTokenDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  createMany(@Body() createSentenceTokenDtos: CreateSentenceTokenDto[]) {
    return this.sentenceTokensService.createMany(createSentenceTokenDtos);
  }

  @Get()
  findAll() {
    return this.sentenceTokensService.findAll();
  }

  @Get('sentence/:sentenceId')
  findBySentenceId(@Param('sentenceId', ParseIntPipe) sentenceId: number) {
    return this.sentenceTokensService.findBySentenceId(sentenceId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceTokensService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSentenceTokenDto: UpdateSentenceTokenDto,
  ) {
    return this.sentenceTokensService.update(id, updateSentenceTokenDto);
  }

  @Patch('sentence/:sentenceId/reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  reorderTokens(
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
    @Body() tokenOrders: { id: number; position: number }[],
  ) {
    return this.sentenceTokensService.reorderTokens(sentenceId, tokenOrders);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sentenceTokensService.remove(id);
  }

  @Delete('sentence/:sentenceId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  removeAllBySentenceId(@Param('sentenceId', ParseIntPipe) sentenceId: number) {
    return this.sentenceTokensService.removeAllBySentenceId(sentenceId);
  }
}
