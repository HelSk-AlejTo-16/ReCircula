import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { EntityManager } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let entityManagerMock: Partial<EntityManager>;

  beforeEach(async () => {
    entityManagerMock = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe retornar estado saludable cuando la base de datos responde', async () => {
    (entityManagerMock.query as jest.Mock).mockResolvedValue([{ 1: 1 }]);

    const result = await controller.check();

    expect(result).toBeDefined();
    expect(result.status).toBe('up');
    expect(result.database).toBe('connected');
    expect(entityManagerMock.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('debe lanzar ServiceUnavailableException cuando la base de datos falla', async () => {
    const errorMsg = 'Connection lost';
    (entityManagerMock.query as jest.Mock).mockRejectedValue(
      new Error(errorMsg),
    );

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );

    try {
      await controller.check();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      expect(err.getResponse().status).toBe('down');
      expect(err.getResponse().database).toBe('disconnected');
      expect(err.getResponse().error).toBe(errorMsg);
    }
  });
});
