import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/entities/user.entity";


export const ROLES_KEY = "roles"
export const Role = (...roles: [UserRole, ...UserRole[]]) => SetMetadata(ROLES_KEY, roles)