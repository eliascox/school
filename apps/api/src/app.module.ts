import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AcademicModule } from './academic/academic.module';
import { PrismaModule } from './prisma/prisma.module';
import { HrModule } from './hr/hr.module';
import { FinanceModule } from './finance/finance.module';
import { CommunicationModule } from './communication/communication.module';
import { CryptoModule } from './crypto/crypto.module';
import { SchoolsModule } from './schools/schools.module';
import { LicenseModule } from './license/license.module';
import { UpdatesModule } from './updates/updates.module';
import { SyncModule } from './sync/sync.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    AuthModule,
    SchoolsModule,
    LicenseModule,
    UpdatesModule,
    SyncModule,
    BackupModule,
    TenantModule,
    AcademicModule,
    HrModule,
    FinanceModule,
    CommunicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
