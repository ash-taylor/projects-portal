import { Reflector } from '@nestjs/core';
import { Role } from './models/role.enum';
import { ROLES_KEY, Roles } from './role.decorator';

describe('Roles Decorator', () => {
  const reflector = new Reflector();

  class TestClass {
    @Roles(Role.Admin)
    adminMethod() {}

    @Roles(Role.User, Role.Admin)
    multiRoleMethod() {}

    noRoleMethod() {}
  }

  it('should set metadata with single role', () => {
    const roles = reflector.get(ROLES_KEY, TestClass.prototype.adminMethod);
    expect(roles).toEqual([Role.Admin]);
  });

  it('should set metadata with multiple roles', () => {
    const roles = reflector.get(ROLES_KEY, TestClass.prototype.multiRoleMethod);
    expect(roles).toEqual([Role.User, Role.Admin]);
  });

  it('should not set metadata when decorator is not used', () => {
    const roles = reflector.get(ROLES_KEY, TestClass.prototype.noRoleMethod);
    expect(roles).toBeUndefined();
  });

  it('should use the correct metadata key', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});