# Swagger/OpenAPI - Exemplos de Documentação

Este arquivo contém exemplos de como documentar diferentes tipos de endpoints com Swagger.

## Exemplo 1: GET simples

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 */
router.get('/api/users', async (req, res) => {
  // Implementação
});
```

## Exemplo 2: POST com body

```javascript
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - volumes_por_unidade
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Coxinha"
 *               volumes_por_unidade:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/api/products', async (req, res) => {
  // Implementação
});
```

## Exemplo 3: GET com parâmetros de rota

```javascript
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Busca um pedido por ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/api/orders/:id', async (req, res) => {
  // Implementação
});
```

## Exemplo 4: GET com query parameters

```javascript
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lista pedidos com filtros
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDENTE, FATURADO, EM_ROTA, ENTREGUE, CANCELADO]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/api/orders', async (req, res) => {
  // Implementação
});
```

## Exemplo 5: Endpoint protegido com autenticação

```javascript
/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Atualiza configurações do sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horario_corte:
 *                 type: string
 *                 example: "14:00"
 *     responses:
 *       200:
 *         description: Configurações atualizadas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/api/admin/settings', authenticateAdmin, async (req, res) => {
  // Implementação
});
```

## Exemplo 6: DELETE

```javascript
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Remove um produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       204:
 *         description: Produto removido com sucesso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
  // Implementação
});
```

## Schemas Reutilizáveis

Você pode definir schemas reutilizáveis em `src/config/swagger.js` na seção `components.schemas`:

```javascript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        role: { 
          type: 'string',
          enum: ['ADMIN', 'COMPRADOR', 'MOTORISTA']
        },
      }
    }
  }
}
```

E então referenciar no endpoint:

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
```

## Referências

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc Examples](https://github.com/Surnet/swagger-jsdoc/tree/master/docs)
