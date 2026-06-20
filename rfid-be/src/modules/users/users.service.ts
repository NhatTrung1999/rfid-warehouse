import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';

const SALT_ROUNDS = 10;

export interface User {
  id: string;
  username: string;
  password: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'password'>;

export interface CreateUserInput {
  username: string;
  password: string;
  name?: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.prisma.$queryRaw<User[]>`
      SELECT id, username, password, name, role, createdAt, updatedAt
      FROM dbo.users
      WHERE username = ${username}
    `;
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<SafeUser | null> {
    const rows = await this.prisma.$queryRaw<SafeUser[]>`
      SELECT id, username, name, role, createdAt, updatedAt
      FROM dbo.users
      WHERE id = ${id}
    `;
    return rows[0] ?? null;
  }

  async create(input: CreateUserInput): Promise<SafeUser> {
    const existing = await this.findByUsername(input.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const now = new Date();
    const role = input.role ?? Role.USER;

    const rows = await this.prisma.$queryRaw<SafeUser[]>`
      INSERT INTO dbo.users (id, username, password, name, role, createdAt, updatedAt)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.name, INSERTED.role,
             INSERTED.createdAt, INSERTED.updatedAt
      VALUES (NEWID(), ${input.username}, ${hashedPassword}, ${input.name ?? null}, ${role}, ${now}, ${now})
    `;
    return rows[0];
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
