import { AppDataSource } from '../../config/database';
import { User } from './user.entity';

export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  },

  findById(id: string) {
    return this.findOne({ where: { id } });
  },

  findByRefreshToken(token: string) {
    return this.findOne({ where: { refreshToken: token } });
  },
});
