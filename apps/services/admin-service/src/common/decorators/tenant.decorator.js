"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const common_1 = require("@nestjs/common");
exports.Tenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantIdFromHeader = request.headers['x-tenant-id'];
    if (tenantIdFromHeader) {
        return tenantIdFromHeader;
    }
    const user = request.user;
    if (user?.tenantId) {
        return user.tenantId;
    }
    return process.env.DEFAULT_TENANT_ID || 'default-tenant';
});
//# sourceMappingURL=tenant.decorator.js.map