import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLES_KEY } from "src/auth/decorators/roles.decorator";
import { UserRole } from "src/entities/user.entity";



@Injectable()
export class RolesGuard implements CanActivate {

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if (!requiredRoles) return true
        // this roles guard must be used with JwtAuthGuard because it requires user object in the request
        const user = context.switchToHttp().getRequest().user;
        const hasRequiredRole = requiredRoles.some((role) => user.role === role);
        return hasRequiredRole;
    }
}