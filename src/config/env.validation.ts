import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

type DurationUnit = 'ms' | 's' | 'm' | 'h' | 'd';
export type Duration = `${number}${DurationUnit}`;

const DURATION_PATTERN = /^\d+(ms|s|m|h|d)$/;

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  PORT: number = 3000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1)
  JWT_SECRET!: string;

  @IsString()
  @Matches(DURATION_PATTERN)
  JWT_EXPIRES_IN: Duration = '15m';

  @IsString()
  @MinLength(1)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @Matches(DURATION_PATTERN)
  JWT_REFRESH_EXPIRES_IN: Duration = '7d';
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const constraints = Object.values(error.constraints ?? {}).join('; ');
        return `  - ${error.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }

  return validatedConfig;
}
