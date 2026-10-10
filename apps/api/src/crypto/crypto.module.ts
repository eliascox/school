import { Module, Global } from '@nestjs/common';
import { KeyManagementService } from './key-management.service';

@Global()
@Module({
  providers: [KeyManagementService],
  exports: [KeyManagementService],
})
export class CryptoModule {}
