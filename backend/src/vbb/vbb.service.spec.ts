import { describe, it, expect, beforeAll } from '@jest/globals';
import { VbbService } from './vbb.service';

describe('VbbService (unit)', () => {
  let service: VbbService;
  let mockHttpService: any;

  beforeAll(() => {
    mockHttpService = {
      get: jest.fn(),
    };

    service = new VbbService(mockHttpService);
  });

  describe('getStations', () => {
    it('should call API with correct parameters', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Test Station',
          location: { latitude: 52.52, longitude: 13.405 },
        },
      ];

      mockHttpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: mockData }),
      });

      const result = await service.getStations('Test', 10);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations'),
        expect.any(Object),
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty results', async () => {
      mockHttpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: [] }),
      });

      const result = await service.getStations('Unknown', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      await expect(service.getStations('Test', 10)).rejects.toThrow(
        'API Error',
      );
    });
  });
});
