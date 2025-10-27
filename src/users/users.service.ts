import { BadRequestException, Injectable, NotFoundException, Param } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRole } from "src/entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import bcrypt from 'bcrypt'
import { OrganizerProfile } from "src/entities/organizer-profile.entity";

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(OrganizerProfile)
        private orgRepo: Repository<OrganizerProfile>,
    ) { }





    async create(createUserDto: CreateUserDto) {
        const { password, ...userDto } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ ...userDto, password: hashedPassword });

        return await this.userRepository.save(user);
    }

    async findByEmail(email: string) {
        const user = await this.userRepository.findOne(
            {
                where: {
                    email: email
                }
            }
        )

        return user
    }


    async updateHashedRefreshToken(userId: number, refreshToken: string | null) {
        if (refreshToken)
        // const hashed = await bcrypt.hash(refreshToken, 10);
        await this.userRepository.update(userId, { refreshTokenHash: refreshToken });
    }


    async findOne(id: number) {
        const user = await this.userRepository.findOne(
            { where: { id } }
        )

        if (!user) {
            throw new NotFoundException
        }
        return user;

    }

    async getProfile(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['organizerProfile'],
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateProfile(userId: number, data: Partial<User>) {
        await this.userRepository.update(userId, data);
        return this.getProfile(userId);
    }

    async upgradeToOrganizer(userId: number, orgData: Partial<OrganizerProfile>) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === UserRole.ORGANIZER)
            throw new BadRequestException('Already an organizer');

        const profile = this.orgRepo.create({ ...orgData, user });
        await this.orgRepo.save(profile);

        user.role = UserRole.ORGANIZER;
        await this.userRepository.save(user);

        return { message: 'User upgraded to organizer successfully' };
    }



}