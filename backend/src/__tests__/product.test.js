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

// Dados mock de produtos
const mockProducts = [
  {
    id: 1,
    nome: "Coxinha de Frango",
    descricao: "Coxinha tradicional recheada com frango desfiado",
    preco_venda: 5.5,
    qtd_estoque: 100,
    volumes_por_unidade: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    nome: "Pastel de Carne",
    descricao: "Pastel crocante com recheio de carne moída",
    preco_venda: 4.0,
    qtd_estoque: 150,
    volumes_por_unidade: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Variável para controlar os retornos dos mocks
let mockProductToReturn = mockProducts[0];
let mockProductExists = false;
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

  // Configurar comportamentos específicos para a tabela produtos
  if (table === "produtos") {
    // Para count
    chain.count.mockResolvedValue([{ count: "2" }]);

    // Para first - usa a variável de controle
    chain.first.mockImplementation(() => {
      return Promise.resolve(mockProductToReturn);
    });

    // Para select com paginação - offset deve retornar uma Promise
    chain.offset.mockImplementation(() => {
      return Promise.resolve(mockProducts);
    });

    // Para insert
    chain.returning.mockImplementation(() => {
      return Promise.resolve([
        {
          id: 3,
          nome: "Kibe",
          descricao: "Kibe assado tradicional",
          preco_venda: 6.0,
          qtd_estoque: 0,
          volumes_por_unidade: 1,
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
            ...mockProducts[0],
            preco_venda: 7.0,
            updated_at: new Date().toISOString(),
          },
        ]),
      };
    });

    // Para delete
    chain.delete.mockResolvedValue(1);

    // Para verificar se já existe (usado no create)
    chain.where.mockImplementation((condition) => {
      const whereChain = {
        first: jest.fn(() => {
          // Se o nome é "Kibe", não existe (para teste de criação)
          // Se é "Coxinha de Frango", existe (para teste de duplicado)
          let result = null;
          if (condition && condition.nome === "Kibe") {
            result = null;
          } else if (condition && condition.nome === "Coxinha de Frango") {
            result = mockProducts[0];
          } else if (condition && condition.id) {
            // Para buscas por ID
            result = mockProductToReturn;
          } else {
            // Para outros casos, usar mockProductToReturn
            result = mockProductToReturn;
          }
          return Promise.resolve(result);
        }),
        delete: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            ...mockProducts[0],
            preco_venda: 7.0,
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

describe("Product Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar variáveis de controle
    mockProductToReturn = mockProducts[0];
    mockProductExists = false;
    mockUserRole = "ADMIN";
  });

  describe("GET /products", () => {
    it("should list all products with pagination (public route)", async () => {
      const response = await request(app)
        .get("/products")
        .query({ page: 1, limit: 10 })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");
      expect(response.body.pagination).toHaveProperty("hasNext");
      expect(response.body.pagination).toHaveProperty("hasPrev");
    });

    it("should use default pagination values when not specified", async () => {
      const response = await request(app)
        .get("/products")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 10);
    });

    it("should handle invalid page number gracefully", async () => {
      // page=0 é convertido para 1 pelo parseInt || 1
      // Então o teste deve verificar que a requisição funciona
      const response = await request(app)
        .get("/products")
        .query({ page: 0 })
        .expect("Content-Type", /json/)
        .expect(200);

      // Deve retornar dados mesmo com page=0 (convertido para 1)
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
    });

    it("should limit maximum items per page to 100", async () => {
      const response = await request(app)
        .get("/products")
        .query({ page: 1, limit: 200 })
        .expect("Content-Type", /json/)
        .expect(200);

      // O limite deve ser reduzido para 100
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe("GET /products/:id", () => {
    it("should get a product by id (public route)", async () => {
      const response = await request(app)
        .get("/products/1")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("nome");
      expect(response.body.data).toHaveProperty("preco_venda");
      expect(response.body.data).toHaveProperty("volumes_por_unidade");
    });

    it("should return 400 for invalid product id", async () => {
      const response = await request(app)
        .get("/products/invalid")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.message).toContain("deve ser um número");
    });

    it("should return 404 when product not found", async () => {
      // Configurar mock para retornar null
      mockProductToReturn = null;

      const response = await request(app)
        .get("/products/999")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.message).toContain("não existe");
    });
  });

  describe("POST /products", () => {
    it("should create a new product when authenticated as ADMIN", async () => {
      // Garantir que o produto não existe
      mockProductExists = false;
      
      // Mock para usuário ADMIN autenticado
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const newProduct = {
        nome: "Kibe",
        descricao: "Kibe assado tradicional",
        preco_venda: 6.0,
        qtd_estoque: 0,
        volumes_por_unidade: 1,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer mock_admin_token")
        .send(newProduct)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("nome", "Kibe");
    });

    it("should return 401 when not authenticated", async () => {
      const newProduct = {
        nome: "Kibe",
        preco_venda: 6.0,
        volumes_por_unidade: 1,
      };

      const response = await request(app)
        .post("/products")
        .send(newProduct)
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 403 when authenticated as COMPRADOR", async () => {
      // Configurar mock para usuário COMPRADOR
      mockUserRole = "COMPRADOR";
      mockProductExists = false;
      
      // Mock para usuário COMPRADOR
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "comprador@example.com",
          },
        },
        error: null,
      });

      const newProduct = {
        nome: "Kibe",
        preco_venda: 6.0,
        volumes_por_unidade: 1,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer mock_comprador_token")
        .send(newProduct)
        .expect("Content-Type", /json/)
        .expect(403);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for validation errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const invalidProduct = {
        // nome faltando (obrigatório)
        preco_venda: -5.0, // negativo (inválido)
        volumes_por_unidade: 0, // deve ser >= 1
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer mock_admin_token")
        .send(invalidProduct)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("validação");
      expect(response.body).toHaveProperty("details");
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it("should return 409 when product name already exists", async () => {
      // Configurar mock para produto já existente
      mockProductExists = true;
      
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const duplicateProduct = {
        nome: "Coxinha de Frango",
        preco_venda: 6.0,
        volumes_por_unidade: 1,
      };

      const response = await request(app)
        .post("/products")
        .set("Authorization", "Bearer mock_admin_token")
        .send(duplicateProduct)
        .expect("Content-Type", /json/)
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("já existe");
    });
  });

  describe("PUT /products/:id", () => {
    it("should update a product when authenticated as ADMIN", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const updates = {
        preco_venda: 7.0,
        qtd_estoque: 200,
      };

      const response = await request(app)
        .put("/products/1")
        .set("Authorization", "Bearer mock_admin_token")
        .send(updates)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("preco_venda", 7.0);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/products/1")
        .send({ preco_venda: 7.0 })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid product id", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const response = await request(app)
        .put("/products/invalid")
        .set("Authorization", "Bearer mock_admin_token")
        .send({ preco_venda: 7.0 })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when no fields to update", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const response = await request(app)
        .put("/products/1")
        .set("Authorization", "Bearer mock_admin_token")
        .send({})
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.message).toContain("pelo menos um campo");
    });
  });

  describe("DELETE /products/:id", () => {
    it("should delete a product when authenticated as ADMIN", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const response = await request(app)
        .delete("/products/1")
        .set("Authorization", "Bearer mock_admin_token")
        .expect(204);

      expect(response.body).toEqual({});
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete("/products/1")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid product id", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const response = await request(app)
        .delete("/products/invalid")
        .set("Authorization", "Bearer mock_admin_token")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when product not found", async () => {
      // Configurar mock para produto não encontrado
      mockProductToReturn = null;
      
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "admin@example.com",
          },
        },
        error: null,
      });

      const response = await request(app)
        .delete("/products/999")
        .set("Authorization", "Bearer mock_admin_token")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.message).toContain("não existe");
    });
  });
});
