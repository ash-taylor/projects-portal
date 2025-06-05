import { ClassConstructor, plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

export const loadEnvConfig = <T extends object>(cls: ClassConstructor<T>): T => {
  let parsedSettings: T;

  try {
    parsedSettings = plainToClass(cls, process.env, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });
  } catch (e) {
    throw new Error(`Error parsing environment config from ${cls.name}: ${e}`);
  }

  const errors = validateSync(parsedSettings, { skipMissingProperties: false, forbidUnknownValues: true });

  if (errors.length) throw new Error(`Invalid environment config from ${cls.name}: ${errors}`);

  return parsedSettings;
};
