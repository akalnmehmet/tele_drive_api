import { AppError } from '../../common/errors/AppError';
import { UserRepository } from './user.repository';
import { User, UserRole } from './user.entity';
import type { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true, email: true, role: true,
  totpEnabled: true, createdAt: true, updatedAt: true,
} as const;

// Hassas alanları (hash, token, totp) yanıttan çıkar
function sanitize(user: User) {
  const { passwordHash: _, refreshToken: __, totpSecret: ___, ...safe } = user as unknown as Record<string, unknown>;
  return safe;
}

export const UserService = {
  async findAll(limit = 20, offset = 0) {
    const [users, total] = await UserRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
      select: SAFE_SELECT,
    });
    return { users, total, limit, offset };
  },

  async findById(id: string) {
    const user = await UserRepository.findOne({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    return user;
  },

  async updateRole(id: string, dto: UpdateUserDto, requesterId: string) {
    if (id === requesterId)
      throw new AppError('Kendi rolünüzü değiştiremezsiniz', 400);

    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    user.role = dto.role as UserRole;
    const saved = await UserRepository.save(user);
    return sanitize(saved);
  },

  async remove(id: string, requesterId: string) {
    if (id === requesterId)
      throw new AppError('Kendi hesabınızı silemezsiniz', 400);

    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    await UserRepository.remove(user);
    return { message: 'Kullanıcı silindi' };
  },
};
