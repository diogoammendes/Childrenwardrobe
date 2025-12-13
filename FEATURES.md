# Funcionalidades da Aplicação

## Área de Administração

### Gestão de Utilizadores
- Visualizar todos os utilizadores
- Criar novos utilizadores (Admin ou Pai/Mãe)
- Ver estatísticas gerais (total de utilizadores, crianças, peças)

## Área de Pais

### Gestão de Crianças
- Adicionar crianças com:
  - Nome
  - Género
  - Data de nascimento
- Atualizar informações:
  - Altura (cm)
  - Peso (kg)
  - Tamanho de sapato atual
- Visualizar lista de todas as crianças do utilizador

### Gestão de Guarda-Roupa

#### Adicionar Peças de Roupa
Cada peça inclui:
- **Categoria**: Roupa, Sapatos, Acessórios, Banho/Cama
- **Subcategoria**: Específica para cada categoria (ver lista completa abaixo)
- **Tamanho**: Livre (ex: "2 anos", "86", "M")
- **Cores**: Múltiplas cores separadas por vírgula
- **Foto**: URL da imagem (opcional)
- **Estado**: Em uso, Uso futuro, Retirado
- **Disposição**: Manter, Vendido, Oferecido
- **Conjunto**: Possibilidade de vincular a outra peça (opcional)

#### Categorias e Subcategorias

**Roupa:**
- Bodies (curto/comprido/sem mangas)
- T-shirts (curto/comprido/sem mangas)
- Calções
- Calças (fato treino, leggings, ganga, sarja, tecido)
- Casacos (fato de treino, malha, corta vento, bomber)
- Saia
- Peça única (fofo, vestido)
- Macacão (saia, calça, calção)
- Pijama (onesie c/pés, onesie curto, onesie s/pés, 2 peças)
- Camisolas (malha, sweat c/capuz, sweat sem capuz)
- Colete

**Sapatos:**
- Ténis
- Sandálias
- Chinelos
- Botas

**Acessórios:**
- Meias
- Collants
- Gorro
- Chapéu
- Cachecol
- Laços/bandoletes

**Banho/Cama:**
- Toalha
- Lençóis
- Edredom
- Manta
- Protetor de colchão

#### Funcionalidades de Gestão
- **Editar peças**: Modificar qualquer informação da peça
- **Transferir peças**: Mover peças entre crianças do mesmo pai/mãe
- **Eliminar peças**: Remover peças do guarda-roupa
- **Visualização organizada**: Peças agrupadas por categoria

### Mínimos por Categoria
- Definir quantidade mínima desejada para cada categoria/subcategoria
- Útil para controlo de stock e planeamento de compras
- Visualização e gestão dos mínimos na página de cada criança

## Segurança e Acesso

- Autenticação obrigatória para todas as áreas
- Pais só têm acesso às suas próprias crianças
- Administradores têm acesso a todas as funcionalidades
- Proteção de rotas baseada em roles

## Interface

- Design moderno e responsivo
- Interface intuitiva e fácil de usar
- Visualização clara de todas as informações
- Organização por categorias para fácil navegação




