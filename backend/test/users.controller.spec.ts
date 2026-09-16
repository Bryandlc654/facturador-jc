import { ForbiddenException } from '@nestjs/common';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('permite al dueño acceder a su propio perfil', async () => {
    usersService.findOne.mockResolvedValue({ id: 1, email: 'a@b.c' });
    await expect(
      controller.findOne({ user: { userId: 1 } } as any, '1'),
    ).resolves.toEqual({ id: 1, email: 'a@b.c' });
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it('impide ver el perfil de otro usuario', () => {
    expect(() => controller.findOne({ user: { userId: 1 } } as any, '2')).toThrow(ForbiddenException);
  });

  it('impide editar a otro usuario', () => {
    expect(() => controller.update({ user: { userId: 1 } } as any, '2', {} as any)).toThrow(ForbiddenException);
  });

  it('impide eliminar a otro usuario', () => {
    expect(() => controller.remove({ user: { userId: 1 } } as any, '2')).toThrow(ForbiddenException);
  });
});