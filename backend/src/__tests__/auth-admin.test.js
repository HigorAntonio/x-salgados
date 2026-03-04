import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";

// Mock do Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
  },
};

// Mock do Supabase Admin
const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

// Mock do Knex
const mockKnex = jest.fn((tableName) => {
  const chain = {
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
  };
  
  // Configurar comportamento padrão para diferentes tabelas
  if (tableName === 'users') {
    chain.first.mockResolvedValue({
      id: "admin-uuid-123",
      email: "admin@example.com",
      role: "ADMIN",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    chain.returning.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        role: "COMPRADOR",
        created_at: new Date().toISOString(),
      },
    ]);
  }
  
  return chain;
});

// Mock dos módulos antes de importar
jest.unstable_mockModule("../config/supabase.js", () => ({
  default: mockSupabase,
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin,
}));

jest.unstable_mockModule("../db.js", () => ({
  default: mockKnex,
}));

// Importar app depois dos mocks
const { default: app } = await import("../app.js");

describe("Auth Admin Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register - Public Registration (COMPRADOR)", () => {
    it("should register a new COMPRADOR user without role field", async () => {
      const mockUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "comprador@example.com",
      };

      const mockSession = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
      };

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "comprador@example.com",
          password: "password123",
        })
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("role", "COMPRADOR");
      expect(response.body).toHaveProperty("session");

      // Verificar se o Supabase foi chamado
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "comprador@example.com",
        password: "password123",
      });
    });

    it("should reject role field in public registration", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "hacker@example.com",
          password: "password123",
          role: "ADMIN", // Tentativa de manipular role
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
      // O schema publicRegisterSchema não aceita o campo role
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          password: "password123",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should return 400 for missing password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });
  });

  describe("POST /auth/admin/register-user - Admin Registration", () => {
    const validAdminToken = "valid_admin_token";

    beforeEach(() => {
      // Mock do authenticate middleware
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "admin-uuid-123",
            email: "admin@example.com",
          },
        },
        error: null,
      });
    });

    it("should reject COMPRADOR role in admin registration", async () => {
      const response = await request(app)
        .post("/auth/admin/register-user")
        .set("Authorization", `Bearer ${validAdminToken}`)
        .send({
          email: "comprador@example.com",
          password: "password123",
          role: "COMPRADOR",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
      expect(mockSupabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/auth/admin/register-user")
        .send({
          email: "motorista@example.com",
          password: "password123",
          role: "MOTORISTA",
        })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token não fornecido");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/auth/admin/register-user")
        .set("Authorization", `Bearer ${validAdminToken}`)
        .send({
          email: "motorista@example.com",
          // Faltando password e role
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });
  });
});
