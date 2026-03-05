import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";

// Mock do Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
};

// Dados mock de veículos
const mockVehicles = [
  {
    id: 1,
    tipo: "Van Sprinter",
    placa: "ABC-1234",
    capacidade_em_volumes: 150,
    consumo_medio: 8.5,
    autonomia_max: 600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    tipo: "Caminhão 3/4",
    placa: "DEF-5678",
    capacidade_em_volumes: 300,
    consumo_medio: 6.2,
    autonomia_max: 450,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Variável para controlar os retornos dos mocks
let mockVehicleToReturn = mockVehicles[0];
let mockUserRole = "ADMIN";

// Mock do Knex
const mockKnex = jest.fn((table) => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn(),
    returning: jest.fn(),
    count: jest.fn(),
  };

  // Configurar comportamentos específicos para a tabela veiculos
  if (table === "veiculos") {
    // Para count
    chain.count.mockResolvedValue([{ count: "2" }]);

    // Para first - usa a variável de controle
    chain.first.mockImplementation(() => {
      return Promise.resolve(mockVehicleToReturn);
    });

    // Para select com paginação - offset deve retornar uma Promise
    chain.offset.mockImplementation(() => {
      return Promise.resolve(mockVehicles);
    });

    // Para insert
    chain.returning.mockImplementation(() => {
      return Promise.resolve([
        {
          id: 3,
          tipo: "Van Kangoo",
          placa: "GHI-9012",
          capacidade_em_volumes: 100,
          consumo_medio: 10.5,
          autonomia_max: 550,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    });

    // Para update
    chain.update.mockImplementation(() => {
      return {
        returning: jest.fn().mockResolvedValue([
          {
            ...mockVehicles[0],
            consumo_medio: 9.0,
            updated_at: new Date().toISOString(),
          },
        ]),
      };
    });

    // Para delete
    chain.delete.mockResolvedValue(1);

    // Para verificar se já existe (usado no create e update)
    chain.where.mockImplementation((condition) => {
      const whereChain = {
        first: jest.fn(() => {
          let result = null;
          if (condition && condition.placa === "GHI-9012") {
            // Placa nova, não existe
            result = null;
          } else if (condition && condition.placa === "ABC-1234") {
            // Placa existente
            result = mockVehicles[0];
          } else if (condition && condition.id) {
            // Para buscas por ID
            result = mockVehicleToReturn;
          } else {
            // Para outros casos, usar mockVehicleToReturn
            result = mockVehicleToReturn;
          }
          return Promise.resolve(result);
        }),
        delete: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            ...mockVehicles[0],
            consumo_medio: 9.0,
            updated_at: new Date().toISOString(),
          },
        ]),
      };

      return whereChain;
    });
  }

  // Para a tabela users (usado no middleware de autenticação)
  if (table === "users") {
    chain.first.mockImplementation(() => {
      return Promise.resolve({
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@example.com",
        role: mockUserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  return chain;
});

// Adicionar o método fn ao mockKnex para poder usar knex.fn.now()
mockKnex.fn = {
  now: jest.fn(() => new Date()),
};

// Adicionar o método raw para o health check
mockKnex.raw = jest.fn().mockResolvedValue({});

// Mock dos módulos antes de importar
jest.unstable_mockModule("../config/supabase.js", () => ({
  default: mockSupabase,
  supabase: mockSupabase,
  supabaseAdmin: null,
}));

jest.unstable_mockModule("../db.js", () => ({
  default: mockKnex,
}));

// Importar app depois dos mocks
const { default: app } = await import("../app.js");

describe("Vehicle Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar variáveis de controle
    mockVehicleToReturn = mockVehicles[0];
    mockUserRole = "ADMIN";

    // Mock padrão do Supabase getUser para autenticação bem-sucedida
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "admin@example.com",
        },
      },
      error: null,
    });
  });

  describe("GET /vehicles", () => {
    it("should list all vehicles with pagination (ADMIN)", async () => {
      mockUserRole = "ADMIN";

      const response = await request(app)
        .get("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .query({ page: 1, limit: 10 })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
    });

    it("should list all vehicles with pagination (MOTORISTA)", async () => {
      mockUserRole = "MOTORISTA";

      const response = await request(app)
        .get("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .query({ page: 1, limit: 10 })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it("should reject access for COMPRADOR", async () => {
      mockUserRole = "COMPRADOR";

      await request(app)
        .get("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should reject unauthenticated requests", async () => {
      await request(app)
        .get("/vehicles")
        .expect("Content-Type", /json/)
        .expect(401);
    });

    it("should use default pagination values when not specified", async () => {
      mockUserRole = "ADMIN";

      const response = await request(app)
        .get("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
    });
  });

  describe("GET /vehicles/:id", () => {
    it("should get a vehicle by id (ADMIN)", async () => {
      mockUserRole = "ADMIN";

      const response = await request(app)
        .get("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("tipo");
      expect(response.body.data).toHaveProperty("placa");
    });

    it("should get a vehicle by id (MOTORISTA)", async () => {
      mockUserRole = "MOTORISTA";

      const response = await request(app)
        .get("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });

    it("should reject access for COMPRADOR", async () => {
      mockUserRole = "COMPRADOR";

      await request(app)
        .get("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should return 400 for invalid id", async () => {
      mockUserRole = "ADMIN";

      await request(app)
        .get("/vehicles/invalid")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(400);
    });

    it("should return 404 when vehicle not found", async () => {
      mockUserRole = "ADMIN";
      mockVehicleToReturn = null;

      await request(app)
        .get("/vehicles/999")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(404);
    });
  });

  describe("POST /vehicles", () => {
    it("should create a new vehicle (ADMIN)", async () => {
      mockUserRole = "ADMIN";

      const newVehicle = {
        tipo: "Van Kangoo",
        placa: "GHI-9012",
        capacidade_em_volumes: 100,
        consumo_medio: 10.5,
        autonomia_max: 550,
      };

      const response = await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(newVehicle)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
    });

    it("should reject creation for MOTORISTA", async () => {
      mockUserRole = "MOTORISTA";

      const newVehicle = {
        tipo: "Van Kangoo",
        placa: "GHI-9012",
        capacidade_em_volumes: 100,
        consumo_medio: 10.5,
        autonomia_max: 550,
      };

      await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(newVehicle)
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should reject creation with invalid data", async () => {
      mockUserRole = "ADMIN";

      const invalidVehicle = {
        tipo: "Van Kangoo",
        placa: "INVALID",
        capacidade_em_volumes: -10,
        consumo_medio: -5,
        autonomia_max: -100,
      };

      const response = await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(invalidVehicle)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject creation with negative consumo_medio", async () => {
      mockUserRole = "ADMIN";

      const invalidVehicle = {
        tipo: "Van Kangoo",
        placa: "GHI-9012",
        capacidade_em_volumes: 100,
        consumo_medio: -5.5,
        autonomia_max: 550,
      };

      const response = await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(invalidVehicle)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should reject creation with negative autonomia_max", async () => {
      mockUserRole = "ADMIN";

      const invalidVehicle = {
        tipo: "Van Kangoo",
        placa: "GHI-9012",
        capacidade_em_volumes: 100,
        consumo_medio: 10.5,
        autonomia_max: -100,
      };

      const response = await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(invalidVehicle)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should reject duplicate placa", async () => {
      mockUserRole = "ADMIN";
      mockVehicleToReturn = mockVehicles[0]; // Simula que a placa já existe

      const duplicateVehicle = {
        tipo: "Van Sprinter",
        placa: "ABC-1234",
        capacidade_em_volumes: 150,
        consumo_medio: 8.5,
        autonomia_max: 600,
      };

      await request(app)
        .post("/vehicles")
        .set("Authorization", "Bearer valid-token")
        .send(duplicateVehicle)
        .expect("Content-Type", /json/)
        .expect(409);
    });
  });

  describe("PUT /vehicles/:id", () => {
    it("should update a vehicle (ADMIN)", async () => {
      mockUserRole = "ADMIN";

      const updateData = {
        consumo_medio: 9.0,
        autonomia_max: 650,
      };

      const response = await request(app)
        .put("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
    });

    it("should reject update for MOTORISTA", async () => {
      mockUserRole = "MOTORISTA";

      const updateData = {
        consumo_medio: 9.0,
      };

      await request(app)
        .put("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should return 400 for invalid id", async () => {
      mockUserRole = "ADMIN";

      await request(app)
        .put("/vehicles/invalid")
        .set("Authorization", "Bearer valid-token")
        .send({ consumo_medio: 9.0 })
        .expect("Content-Type", /json/)
        .expect(400);
    });

    it("should return 404 when vehicle not found", async () => {
      mockUserRole = "ADMIN";
      mockVehicleToReturn = null;

      await request(app)
        .put("/vehicles/999")
        .set("Authorization", "Bearer valid-token")
        .send({ consumo_medio: 9.0 })
        .expect("Content-Type", /json/)
        .expect(404);
    });

    it("should reject update with invalid consumo_medio", async () => {
      mockUserRole = "ADMIN";

      const updateData = {
        consumo_medio: -5.5,
      };

      const response = await request(app)
        .put("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should reject update with invalid autonomia_max", async () => {
      mockUserRole = "ADMIN";

      const updateData = {
        autonomia_max: -100,
      };

      const response = await request(app)
        .put("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });
  });

  describe("DELETE /vehicles/:id", () => {
    it("should delete a vehicle (ADMIN)", async () => {
      mockUserRole = "ADMIN";

      await request(app)
        .delete("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .expect(204);
    });

    it("should reject deletion for MOTORISTA", async () => {
      mockUserRole = "MOTORISTA";

      await request(app)
        .delete("/vehicles/1")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(403);
    });

    it("should return 400 for invalid id", async () => {
      mockUserRole = "ADMIN";

      await request(app)
        .delete("/vehicles/invalid")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(400);
    });

    it("should return 404 when vehicle not found", async () => {
      mockUserRole = "ADMIN";
      mockVehicleToReturn = null;

      await request(app)
        .delete("/vehicles/999")
        .set("Authorization", "Bearer valid-token")
        .expect("Content-Type", /json/)
        .expect(404);
    });
  });
});
