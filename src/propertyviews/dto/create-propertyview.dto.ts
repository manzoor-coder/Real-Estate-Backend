
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePropertyviewDto {
  @ApiProperty({
    description: "The ID of the property being viewed",
    example: "68b97b907ce8ce5376c97cf9",
  })
  @IsNotEmpty()
  @IsString()
  propertyId: string; // jis property ko view kiya

  @ApiPropertyOptional({
    description: "The ID of the user who viewed the property (if logged in)",
    example: "68a84b87a3a233957506f479",
  })
  @IsOptional()
  @IsString()
  userId?: string; // login user (agar available ho)

  @ApiPropertyOptional({
    description: "IP address of the viewer (auto-captured for guests)",
    example: "192.168.1.15",
  })
  @IsOptional()
  @IsString()
  ipAddress?: string; // guest ke liye

  @ApiPropertyOptional({
    description: "Browser or device information of the viewer",
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0",
  })
  @IsOptional()
  @IsString()
  userAgent?: string; // browser/device info

  @ApiPropertyOptional({
    description: "The timestamp when the property was viewed",
    example: "2025-09-10T12:34:56.000Z",
  })
  @IsOptional()
  viewedAt?: Date; // default backend me set hoga
}
