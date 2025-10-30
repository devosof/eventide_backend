import { BadRequestException, Injectable, NotFoundException, Param } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserRole } from "src/entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import bcrypt from 'bcrypt'
import { OrganizerProfile } from "src/entities/organizer-profile.entity";
import { CreateOrganizerProfileDto, UpdateUserDto, UserResponseDto } from "./dto/user.dto";

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(OrganizerProfile)
        private orgRepo: Repository<OrganizerProfile>,
    ) { }





    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        try {
            const { password, ...userDto } = createUserDto;
            const hashedPassword = await bcrypt.hash(password, 10);

            
            const user = this.userRepository.create({ ...userDto, password: hashedPassword });

            const savedUser = await this.userRepository.save(user);
            return this.toResponse(savedUser)
        } catch (error) {
            throw error
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        if (!email) return null
        const user = await this.userRepository.findOne(
            {
                where: {
                    email: email
                }
            }
        )

        return user
    }


    async updateHashedRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        if (!userId) throw new BadRequestException('Invalid user ID');
        await this.userRepository.update(userId, { refreshTokenHash: refreshToken });
    }


    async findOne(id: number): Promise<User> {
        if (!id) throw new BadRequestException('Invalid User ID')

        const user = await this.userRepository.findOne(
            { where: { id } }
        )

        if (!user) {
            throw new NotFoundException
        }
        return user;

    }

    // async getProfile(userId: number) {
    //     const user = await this.userRepository.findOne({
    //         where: { id: userId },
    //         relations: ['organizerProfile'],
    //     });
    //     if (!user) throw new NotFoundException('User not found');
    //     return user;
    // }

    // async updateProfile(userId: number, data: Partial<User>) {
    //     await this.userRepository.update(userId, data);
    //     return this.getProfile(userId);
    // }

    // async upgradeToOrganizer(userId: number, orgData: Partial<OrganizerProfile>) {
    //     const user = await this.userRepository.findOne({ where: { id: userId } });
    //     if (!user) throw new NotFoundException('User not found');
    //     if (user.role === UserRole.ORGANIZER)
    //         throw new BadRequestException('Already an organizer');

    //     const profile = this.orgRepo.create({ ...orgData, user });
    //     await this.orgRepo.save(profile);

    //     user.role = UserRole.ORGANIZER;
    //     await this.userRepository.save(user);

    //     return { message: 'User upgraded to organizer successfully' };
    // }


    async getProfile(userId: number): Promise<UserResponseDto> {
        if (!userId) throw new BadRequestException('Invalid user ID');

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['organizerProfile'],
        });

        if (!user) throw new NotFoundException('User not found');
        return this.toResponse(user);

    }

    async updateProfile(userId: number, dto: UpdateUserDto): Promise<UserResponseDto> {
        if (!userId) throw new BadRequestException('Invalid user ID');
        if (!dto || !dto.name) throw new BadRequestException('Name is required');

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.name = dto.name;
        await this.userRepository.save(user);

        return this.getProfile(userId);
    }

    async upgradeToOrganizer(userId: number, dto: CreateOrganizerProfileDto): Promise<UserResponseDto> {
        if (!userId) throw new BadRequestException('Invalid user ID');
        if (!dto) throw new BadRequestException('Profile data is required');

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['organizerProfile']
        });

        if (!user) throw new NotFoundException('User not found');
        if (user.role === UserRole.ORGANIZER) {
            throw new BadRequestException('Already an organizer');
        }

        try {
            const profile = this.orgRepo.create({ ...dto, user });
            await this.orgRepo.save(profile);

            user.role = UserRole.ORGANIZER;
            await this.userRepository.save(user);

            return this.getProfile(userId);
        } catch (error) {
            throw new BadRequestException('Failed to create organizer profile');
        }
    }

    private toResponse(user: User): UserResponseDto {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizerProfile: user.organizerProfile ? {
                id: user.organizerProfile.id,
                organizationName: user.organizerProfile.organizationName,
                address: user.organizerProfile.address,
                city: user.organizerProfile.city,
                state: user.organizerProfile.state,
                country: user.organizerProfile.country,
                zipCode: user.organizerProfile.zipCode,
            } : undefined,
            createdAt: user.createdAt,
        };
    }



}