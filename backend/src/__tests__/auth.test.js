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

// Mock do Knex
const mockKnex = jest.fn(() => ({
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      role: "COMPRADOR",
      created_at: new Date().toISOString(),
    },
  ]),
  where: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "COMPRADOR",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
}));

// Mock dos módulos antes de importar
jest.unstable_mockModule("../config/supabase.js", () => ({
  default: mockSupabase,
  supabase: mockSupabase,
}));

jest.unstable_mockModule("../db.js", () => ({
  default: mockKnex,
}));

// Importar app depois dos mocks
const { default: app } = await import("../app.js");

describe("Auth Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "newuser@example.com",
      };

      const mockSession = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
      };

      // Mock Supabase signUp
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
          email: "newuser@example.com",
          password: "password123",
          role: "COMPRADOR",
        })
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
      expect(response.body.user).toHaveProperty("role", "COMPRADOR");
      expect(response.body).toHaveProperty("session");

      // Verificar se o Supabase foi chamado
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
      });

      // Verificar se o banco local foi atualizado
      expect(mockKnex).toHaveBeenCalledWith("users");
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "invalid-email",
          password: "password123",
          role: "COMPRADOR",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 for short password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "123",
          role: "COMPRADOR",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should return 400 for invalid role", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          role: "INVALID_ROLE",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });

    it("should return 400 when Supabase returns error", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "User already exists" },
      });

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "existing@example.com",
          password: "password123",
          role: "COMPRADOR",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty(
        "error",
        "Erro ao criar usuário no Supabase",
      );
    });
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const mockUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
      };

      const mockSession = {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Login realizado com sucesso",
      );
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("role");
      expect(response.body).toHaveProperty("session");
      expect(response.body.session).toHaveProperty("access_token");
    });

    it("should return 401 for invalid credentials", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Credenciais inválidas");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Erro de validação");
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout user successfully", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "Bearer mock_token")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Logout realizado com sucesso",
      );
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should return 401 when token is not provided", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token não fornecido");
    });

    it("should return 401 when token format is invalid", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "InvalidFormat token")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Token não fornecido");
    });
  });
});
