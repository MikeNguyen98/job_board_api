import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { redisClient } from 'src/config/redis.config';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    // private notificationsService: NotificationsService,
  ) {}

  async create(jobData: Partial<Job>) {
    const job = this.jobsRepository.create(jobData);
    await this.jobsRepository.save(job);

    // Cache job in Redis
    await redisClient.set(`job:${job.id}`, JSON.stringify(job));

    // Send notification
    // await this.notificationsService.createNotification({
    //   type: 'NEW_JOB',
    //   content: `New job posted: ${job.title} at ${job.company}`,
    //   metadata: { jobId: job.id },
    // });

    return job;
  }

  async findAll() {
    return this.jobsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
