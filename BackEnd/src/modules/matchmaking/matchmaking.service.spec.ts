/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingRepository } from './repositories/matchmaking.repository';
import { BadRequestException } from '@nestjs/common';
import { BuscarPublicacionesDto } from './dto/buscar-publicaciones.dto';
import { MatchmakingReparadoresDto } from './dto/matchmaking-reparadores.dto';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let repo: MatchmakingRepository;

  const mockMatchmakingRepository = {
    buscarPublicaciones: jest.fn(),
    buscarReparadores: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        {
          provide: MatchmakingRepository,
          useValue: mockMatchmakingRepository,
        },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
    repo = module.get<MatchmakingRepository>(MatchmakingRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarPublicaciones', () => {
    it('debe lanzar BadRequestException si no se especifican latitud o longitud', async () => {
      const dto = { radioKm: 10 } as BuscarPublicacionesDto;

      await expect(service.buscarPublicaciones(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe llamar al repositorio y retornar resultados si vienen coordenadas válidas', async () => {
      const dto: BuscarPublicacionesDto = {
        latitud: 21.15,
        longitud: -101.35,
        radioKm: 15,
      };

      const mockResultados = [
        { id: '1', titulo: 'Articulo 1', distancia_km: 5 },
      ];
      mockMatchmakingRepository.buscarPublicaciones.mockResolvedValue(
        mockResultados,
      );

      const res = await service.buscarPublicaciones(dto);

      expect(repo.buscarPublicaciones).toHaveBeenCalledWith(dto);
      expect(res).toEqual({
        total: 1,
        radioKm: 15,
        resultados: mockResultados,
      });
    });

    it('debe usar un radio por defecto de 10km si no se especifica en el DTO', async () => {
      const dto: BuscarPublicacionesDto = {
        latitud: 21.15,
        longitud: -101.35,
      };

      mockMatchmakingRepository.buscarPublicaciones.mockResolvedValue([]);

      const res = await service.buscarPublicaciones(dto);

      expect(res.radioKm).toBe(10);
    });
  });

  describe('buscarReparadores', () => {
    it('debe llamar al repositorio y retornar reparadores cercanos', async () => {
      const dto: MatchmakingReparadoresDto = {
        latitud: 21.15,
        longitud: -101.35,
        categoria: 'Computadoras',
        radioKm: 25,
      };

      const mockReparadores = [
        { usuarioId: '2', nombreTaller: 'Taller Alfa', distancia_km: 12 },
      ];
      mockMatchmakingRepository.buscarReparadores.mockResolvedValue(
        mockReparadores,
      );

      const res = await service.buscarReparadores(dto);

      expect(repo.buscarReparadores).toHaveBeenCalledWith(dto);
      expect(res).toEqual({
        total: 1,
        radioKm: 25,
        categoria: 'Computadoras',
        resultados: mockReparadores,
      });
    });

    it('debe usar un radio por defecto de 20km para buscar reparadores si no se especifica', async () => {
      const dto: MatchmakingReparadoresDto = {
        latitud: 21.15,
        longitud: -101.35,
        categoria: 'Computadoras',
      };

      mockMatchmakingRepository.buscarReparadores.mockResolvedValue([]);

      const res = await service.buscarReparadores(dto);

      expect(res.radioKm).toBe(20);
    });
  });
});
