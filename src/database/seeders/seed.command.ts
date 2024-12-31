import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Injectable()
export class SeedCommand {
  constructor(private readonly seederService: SeederService) {}

  @Command({
    command: 'seed',
    describe: 'Seed the database with initial data',
  })
  async seed() {
    try {
      const result = await this.seederService.seed();
      console.log(result);
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }
} 