import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { Question } from '../../questions/entities/question.entity';
import { Option } from '../../questions/entities/option.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Topic, Question, Option, User])],
  providers: [SeederService],
})
export class SeederModule {}
