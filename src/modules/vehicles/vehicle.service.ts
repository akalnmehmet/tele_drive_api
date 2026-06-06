import crypto from 'crypto';
import { AppError } from '../../common/errors/AppError';
import { VehicleRepository } from './vehicle.repository';
import { VehicleStatus } from './vehicle.entity';
import { UserRepository } from '../users/user.repository';
import { UserRole } from '../users/user.entity';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';

function generateApiKey(): string {
  return 'td_' + crypto.randomBytes(32).toString('hex');
}

export const VehicleService = {
  async findAll(filters: { status?: string; model?: string; limit?: number; offset?: number }) {
    const [vehicles, total] = await VehicleRepository.findAll(filters);
    return { vehicles, total, limit: filters.limit ?? 20, offset: filters.offset ?? 0 };
  },

  async findById(id: string) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    return vehicle;
  },

  async create(dto: CreateVehicleDto) {
    // Plaka benzersizliği
    const existing = await VehicleRepository.findOne({ where: { plate: dto.plate } });
    if (existing) throw new AppError(`"${dto.plate}" plakası zaten kayıtlı`, 409);

    // Mühendis ataması varsa doğrula
    if (dto.assignedEngineerId) {
      const engineer = await UserRepository.findById(dto.assignedEngineerId);
      if (!engineer) throw new AppError('Mühendis bulunamadı', 404);
      if (engineer.role !== UserRole.ENGINEER)
        throw new AppError('Sadece "engineer" rolüne sahip kullanıcılar atanabilir', 400);
    }

    const vehicle = VehicleRepository.create({
      plate: dto.plate.toUpperCase(),
      model: dto.model,
      assignedEngineerId: dto.assignedEngineerId ?? null,
      apiKey: generateApiKey(),
      status: VehicleStatus.IDLE,
    });

    return VehicleRepository.save(vehicle);
  },

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);

    // Plaka değişiyorsa benzersizlik kontrol et
    if (dto.plate && dto.plate.toUpperCase() !== vehicle.plate) {
      const existing = await VehicleRepository.findOne({ where: { plate: dto.plate.toUpperCase() } });
      if (existing) throw new AppError(`"${dto.plate}" plakası zaten kayıtlı`, 409);
      vehicle.plate = dto.plate.toUpperCase();
    }

    if (dto.model)  vehicle.model = dto.model;
    if (dto.status) vehicle.status = dto.status as VehicleStatus;
    if (dto.lowBatteryThreshold !== undefined) vehicle.lowBatteryThreshold = dto.lowBatteryThreshold;
    if (dto.maxSpeedThreshold   !== undefined) vehicle.maxSpeedThreshold   = dto.maxSpeedThreshold;

    if (dto.assignedEngineerId !== undefined) {
      if (dto.assignedEngineerId === null) {
        vehicle.assignedEngineerId = null;
      } else {
        const engineer = await UserRepository.findById(dto.assignedEngineerId);
        if (!engineer) throw new AppError('Mühendis bulunamadı', 404);
        if (engineer.role !== UserRole.ENGINEER)
          throw new AppError('Sadece "engineer" rolüne sahip kullanıcılar atanabilir', 400);
        vehicle.assignedEngineerId = dto.assignedEngineerId;
      }
    }

    return VehicleRepository.save(vehicle);
  },

  async remove(id: string) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    await VehicleRepository.remove(vehicle);
    return { message: 'Araç silindi' };
  },

  async rotateApiKey(id: string) {
    const vehicle = await VehicleRepository.findById(id);
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    vehicle.apiKey = generateApiKey();
    const saved = await VehicleRepository.save(vehicle);
    return { apiKey: saved.apiKey };
  },

  async getStatus(id: string) {
    const vehicle = await VehicleRepository.findOne({
      where: { id },
      relations: { assignedEngineer: true },
    });
    if (!vehicle) throw new AppError('Araç bulunamadı', 404);
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      status: vehicle.status,
      assignedEngineer: vehicle.assignedEngineer
        ? { id: vehicle.assignedEngineer.id, email: vehicle.assignedEngineer.email }
        : null,
    };
  },
};
