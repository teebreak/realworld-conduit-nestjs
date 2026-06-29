import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        name: true,
      },
    });

    return {
      tags: tags.map((tag) => tag.name),
    };
  }
}
