import { IsString } from 'class-validator';

export class AppraiseDto {
  @IsString({ message: 'Title must be a string' })
  title: string;
  @IsString({ message: 'Platform must be a string' })
  platform: string;
  @IsString({ message: 'Region must be a string' })
  region: string;
  @IsString({ message: 'Condition must be a string' })
  condition: string;
}
