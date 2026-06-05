import { AppDataSource } from '../../config/database';
import { Vehicle } from './vehicle.entity';

export const VehicleRepository = AppDataSource.getRepository(Vehicle).extend({
  findById(id: string) {
    return this.findOne({ where: { id }, relations: { assignedEngineer: true } });
  },

  findByApiKey(apiKey: string) {
    return this.findOne({ where: { apiKey } });
  },

  findAll(filters: { status?: string; model?: string }) {
    const qb = this.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.assignedEngineer', 'engineer')
      .orderBy('vehicle.createdAt', 'DESC');

    if (filters.status) qb.andWhere('vehicle.status = :status', { status: filters.status });
    if (filters.model)  qb.andWhere('LOWER(vehicle.model) LIKE :model', { model: `%${filters.model.toLowerCase()}%` });

    return qb.getMany();
  },
});
