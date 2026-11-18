import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'vendor-client' }) @IsString() threadId: string;
  @ApiPropertyOptional({ description: 'Ignored: the signed-in user is the sender' }) @IsOptional() @IsString() sender?: string;
  @ApiPropertyOptional({ example: 'SW' }) @IsOptional() @IsString() initials?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() self?: boolean;
  @ApiProperty({ example: 'Can we confirm the revised seating plan?' }) @IsString() text: string;
  @ApiPropertyOptional({ example: 'teal' }) @IsOptional() @IsString() avatar?: string;
}

/** POST /admin-chat: a message in the admin support chat. */
export class AdminChatDto {
  @ApiProperty({ example: 'The payout for BK007 has not arrived.' }) @IsString() @IsNotEmpty() @MaxLength(2000) text: string;
  @ApiPropertyOptional({ example: 'mike.staff@eliteevents.com', description: 'Required when an admin replies: who the reply is for' })
  @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional({ example: 'issue-report' }) @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional({ example: 'ISS004' }) @IsOptional() @IsString() issueId?: string;
}
