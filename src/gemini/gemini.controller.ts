/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppraiseDto } from './dto/AppraiseDto';

@Controller('api')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('identify')
  @UseInterceptors(FileInterceptor('image'))
  async identify(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required.');
    return this.geminiService.identifyGame(file.buffer, file.mimetype);
  }

  @Post('appraise')
  async appraise(@Body() body: AppraiseDto) {
    return this.geminiService.appraiseGame(body);
  }
}
