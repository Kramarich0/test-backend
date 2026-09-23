import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({
    example: 'Approved by regional security director.',
    description: 'Internal operator comment',
  })
  @IsString()
  comment!: string;
}
