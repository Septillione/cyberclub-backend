import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          nickname: createUserDto.nickname,
          email: createUserDto.email,
          passwordHash: hashedPassword,
          role: createUserDto.role || 'USER',
        },
      });
    } catch (error) {
      if (error.code === 'P2002') { // Код ошибки уникальности в Prisma
        throw new ConflictException('Пользователь с таким email или никнеймом уже существует')
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    if (!user) return null;

    // Убираем секретные поля из ответа
    const { passwordHash, hashedRt, ...result } = user;
    return result;
  }
}


// import { ConflictException, Injectable } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// // import { UpdateUserDto } from './dto/update-user.dto';
// import { PrismaService } from 'src/prisma/prisma.service';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class UsersService {
//   constructor(private prisma: PrismaService) { }

//   async create(createUserDto: CreateUserDto) {
//     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

//     try {
//       return this.prisma.user.create({
//         data: {
//           nickname: createUserDto.nickname,
//           email: createUserDto.email,
//           passwordHash: hashedPassword,
//           role: createUserDto.role || 'USER',
//         },
//       });
//     } catch (error) {
//       if (error.code === 'P2002') {
//         throw new ConflictException('Пользователь с таким email или никнеймом уже существует')
//       }
//       throw error;
//     }

//   }

//   async findByEmail(email: string) {
//     return this.prisma.user.findUnique({ where: { email }, });
//   }

//   async findAll() {
//     return this.prisma.user.findMany();
//   }

//   async findOne(id: string) {
//     return this.prisma.user.findUnique({
//       where: { id },
//     })
//   }

//   // update(id: number, updateUserDto: UpdateUserDto) {
//   //   return `This action updates a #${id} user`;
//   // }

//   // remove(id: number) {
//   //   return `This action removes a #${id} user`;
//   // }
// }
