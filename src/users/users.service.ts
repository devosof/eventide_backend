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





    // async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    //     try {
    //         const { password, ...userDto } = createUserDto;
    //         const hashedPassword = await bcrypt.hash(password, 10);

            
    //         const user = this.userRepository.create({ ...userDto, password: hashedPassword });

    //         const savedUser = await this.userRepository.save(user);
    //         return this.toResponse(savedUser)
    //     } catch (error) {
    //         console.log(error)
    //         throw error
    //     }
    // }

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
        const { password, organizerProfile, ...userDto } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Set initial role based on whether organizerProfile is provided
        const initialRole = organizerProfile ? UserRole.ORGANIZER : UserRole.ATTENDEE;
        
        // Create user with appropriate role
        const user = this.userRepository.create({ 
            ...userDto, 
            password: hashedPassword,
            role: initialRole
        });

        console.log(`This is the Initial user created ${user}`)

        // Use transaction to ensure data consistency
        return await this.userRepository.manager.transaction(async transactionalEntityManager => {
            // Save the user first
            const savedUser = await transactionalEntityManager.save(User, user);

            // If organizer profile data is provided, create it
            if (organizerProfile) {
                const profile = this.orgRepo.create({
                    ...organizerProfile,
                    user: savedUser
                });
                await transactionalEntityManager.save(OrganizerProfile, profile);
                
                // Fetch the complete user with profile
                const userWithProfile = await transactionalEntityManager.findOne(User, {
                    where: { id: savedUser.id },
                    relations: ['organizerProfile']
                });

                if(!userWithProfile) throw new NotFoundException('User created not found')
                
                return this.toResponse(userWithProfile);
            }

            return this.toResponse(savedUser);
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === '23505') { // Unique constraint violation
            throw new BadRequestException('Email already exists or user already has an organizer profile');
        }
        throw error;
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



// async upgradeToOrganizer(userId: number, dto: CreateOrganizerProfileDto): Promise<UserResponseDto> {
//     console.log('Upgrading user to organizer:', { userId, dto });
    
//     if (!userId) throw new BadRequestException('Invalid user ID');
//     if (!dto) throw new BadRequestException('Profile data is required');

//     const user = await this.userRepository.findOne({
//         where: { id: userId },
//         relations: ['organizerProfile']
//     });

//     if (!user) throw new NotFoundException('User not found');
//     if (user.role === UserRole.ORGANIZER) {
//         throw new BadRequestException('Already an organizer');
//     }

//     try {
//         console.log('Creating organizer profile for user:', user.id);
//         const profile = this.orgRepo.create({ ...dto, user });
//         await this.orgRepo.save(profile);

//         console.log('Updating user role to ORGANIZER');
//         user.role = UserRole.ORGANIZER;
//         await this.userRepository.save(user);

//         return this.getProfile(userId);
//     } catch (error) {
//         console.error('Error in upgradeToOrganizer:', error);
//         console.error('Stack trace:', error.stack);
//         throw new BadRequestException(`Failed to create organizer profile: ${error.message}`);
//     }
// }

    async upgradeToOrganizer(userId: number, dto: CreateOrganizerProfileDto): Promise<UserResponseDto> {
    console.log('Upgrading user to organizer:', { userId, dto });
    
    if (!userId) throw new BadRequestException('Invalid user ID');
    if (!dto) throw new BadRequestException('Profile data is required');

    const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['organizerProfile']
    });

    if (!user) throw new NotFoundException('User not found');
    
    // Check if user already has an organizer profile
    if (user.organizerProfile) {
        console.log(`User already has organizer profile here : ${user.organizerProfile}`)
        throw new BadRequestException('User already has an organizer profile');
    }

    // Check if user is already an organizer
    if (user.role === UserRole.ORGANIZER) {
        throw new BadRequestException('User is already an organizer');
    }

    try {
        return await this.userRepository.manager.transaction(async transactionalEntityManager => {
            // Create organizer profile
            const profile = this.orgRepo.create({ ...dto, user });
            await transactionalEntityManager.save(OrganizerProfile, profile);

            // Update user role
            user.role = UserRole.ORGANIZER;
            await transactionalEntityManager.save(User, user);

            // Fetch updated user with profile
            const updatedUser = await transactionalEntityManager.findOne(User, {
                where: { id: userId },
                relations: ['organizerProfile']
            });

            if(!updatedUser) throw new NotFoundException('Failed to find Updated user')

            return this.toResponse(updatedUser);
        });
    } catch (error) {
        console.error('Error in upgradeToOrganizer:', error);
        throw new BadRequestException(`Failed to create organizer profile: ${error.message}`);
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