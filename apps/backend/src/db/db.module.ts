import { Global, Module } from '@nestjs/common';
import { db, pool } from '.';

@Global()
@Module({
  providers: [
    { provide: 'DB', useValue: db },
    { provide: 'DB_POOL', useValue: pool },
  ],
  exports: ['DB', 'DB_POOL'],
})
export class DbModule {}
