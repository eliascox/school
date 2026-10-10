import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { generateEd25519KeyPair } from '@sms/crypto-utils';

@Injectable()
export class KeyManagementService implements OnModuleInit {
  private readonly logger = new Logger(KeyManagementService.name);
  private privateKeyPem: string = '';
  private publicKeyPem: string = '';
  private readonly keysDir = path.resolve(process.cwd(), '.keys');
  private readonly privateKeyPath = path.join(this.keysDir, 'server_ed25519_private.pem');
  private readonly publicKeyPath = path.join(this.keysDir, 'server_ed25519_public.pem');

  onModuleInit() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // 1. Check Environment Variables
    if (process.env.ED25519_PRIVATE_KEY && process.env.ED25519_PUBLIC_KEY) {
      this.privateKeyPem = process.env.ED25519_PRIVATE_KEY.replace(/\\n/g, '\n');
      this.publicKeyPem = process.env.ED25519_PUBLIC_KEY.replace(/\\n/g, '\n');
      this.logger.log('Loaded Ed25519 keys from environment variables.');
      return;
    }

    // 2. Check Local .keys directory
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true });
    }

    if (fs.existsSync(this.privateKeyPath) && fs.existsSync(this.publicKeyPath)) {
      this.privateKeyPem = fs.readFileSync(this.privateKeyPath, 'utf8');
      this.publicKeyPem = fs.readFileSync(this.publicKeyPath, 'utf8');
      this.logger.log('Loaded persistent Ed25519 keys from .keys folder.');
      return;
    }

    // 3. Generate New Keypair and Persist
    this.logger.log('Generating new persistent Ed25519 keypair for Central Server...');
    const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
    this.privateKeyPem = privateKeyPem;
    this.publicKeyPem = publicKeyPem;

    fs.writeFileSync(this.privateKeyPath, privateKeyPem, { encoding: 'utf8', mode: 0o600 });
    fs.writeFileSync(this.publicKeyPath, publicKeyPem, { encoding: 'utf8', mode: 0o644 });
    this.logger.log('Persistent Ed25519 keypair saved to .keys/');
  }

  getPrivateKey(): string {
    return this.privateKeyPem;
  }

  getPublicKey(): string {
    return this.publicKeyPem;
  }
}
