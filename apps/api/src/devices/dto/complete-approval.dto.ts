import { IsString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WrappedDEKEntryDto {
  @IsUUID()
  environmentId: string;

  @IsString()
  wrappedDEK: string;

  @IsString()
  wrappedByPublicKey: string;
}

export class CompleteApprovalDto {
  @IsUUID()
  deviceId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WrappedDEKEntryDto)
  environments: WrappedDEKEntryDto[];
}
