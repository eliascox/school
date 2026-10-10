import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { AdminSchoolsController } from './admin-schools.controller';

@Module({
  controllers: [SchoolsController, AdminSchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
