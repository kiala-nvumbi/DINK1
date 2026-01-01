
import { Account } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  // CLASSE 1: MEIOS FIXOS E INVESTIMENTOS
  { id: '1', code: '1', name: 'Meios fixos e investimentos', type: 'debit', isSystem: true },
  { id: '11', code: '11', name: 'Imobilizações corpóreas', type: 'debit', parentId: '1' },
  { id: '11.1', code: '11.1', name: 'Terrenos e recursos naturais', type: 'debit', parentId: '11' },
  { id: '11.1.1', code: '11.1.1', name: 'Terrenos em bruto', type: 'debit', parentId: '11.1' },
  { id: '11.2', code: '11.2', name: 'Edifícios e outras construções', type: 'debit', parentId: '11' },
  { id: '11.3', code: '11.3', name: 'Equipamento básico', type: 'debit', parentId: '11' },
  { id: '11.4', code: '11.4', name: 'Equipamento de carga e transporte', type: 'debit', parentId: '11' },
  { id: '11.5', code: '11.5', name: 'Equipamento administrativo', type: 'debit', parentId: '11' },
  { id: '12', code: '12', name: 'Imobilizações incorpóreas', type: 'debit', parentId: '1' },
  { id: '12.1', code: '12.1', name: 'Trespasses', type: 'debit', parentId: '12' },
  { id: '12.2', code: '12.2', name: 'Despesas de investigação e desenvolvimento', type: 'debit', parentId: '12' },
  { id: '13', code: '13', name: 'Investimentos financeiros', type: 'debit', parentId: '1' },
  { id: '14', code: '14', name: 'Imobilizações em curso', type: 'debit', parentId: '1' },
  { id: '18', code: '18', name: 'Amortizações acumuladas', type: 'credit', parentId: '1' },
  { id: '18.1', code: '18.1', name: 'Amort. Imob. corpóreas', type: 'credit', parentId: '18' },
  { id: '19', code: '19', name: 'Provisões para investimentos financeiros', type: 'credit', parentId: '1' },

  // CLASSE 2: EXISTÊNCIAS
  { id: '2', code: '2', name: 'Existências', type: 'debit', isSystem: true },
  { id: '21', code: '21', name: 'Compras', type: 'debit', parentId: '2' },
  { id: '21.1', code: '21.1', name: 'Matérias-primas, subsid. e consumo', type: 'debit', parentId: '21' },
  { id: '21.2', code: '21.2', name: 'Mercadorias', type: 'debit', parentId: '21' },
  { id: '22', code: '22', name: 'Matérias-primas, subsidiárias e de consumo', type: 'debit', parentId: '2' },
  { id: '23', code: '23', name: 'Produtos e trabalhos em curso', type: 'debit', parentId: '2' },
  { id: '24', code: '24', name: 'Produtos acabados e intermédios', type: 'debit', parentId: '2' },
  { id: '26', code: '26', name: 'Mercadorias', type: 'debit', parentId: '2' },
  { id: '29', code: '29', name: 'Provisão para depreciação de existências', type: 'credit', parentId: '2' },

  // CLASSE 3: TERCEIROS
  { id: '3', code: '3', name: 'Terceiros', type: 'mixed', isSystem: true },
  { id: '31', code: '31', name: 'Clientes', type: 'mixed', parentId: '3' },
  { id: '31.1', code: '31.1', name: 'Clientes - correntes', type: 'mixed', parentId: '31' },
  { id: '31.8', code: '31.8', name: 'Clientes de cobrança duvidosa', type: 'mixed', parentId: '31' },
  { id: '32', code: '32', name: 'Fornecedores', type: 'mixed', parentId: '3' },
  { id: '32.1', code: '32.1', name: 'Fornecedores - correntes', type: 'mixed', parentId: '32' },
  { id: '33', code: '33', name: 'Empréstimos', type: 'credit', parentId: '3' },
  { id: '34', code: '34', name: 'Estado', type: 'mixed', parentId: '3' },
  { id: '34.3', code: '34.3', name: 'Imposto rendimento trabalho (IRT)', type: 'mixed', parentId: '34' },
  { id: '34.5', code: '34.5', name: 'IVA', type: 'mixed', parentId: '34' },
  { id: '34.5.1', code: '34.5.1', name: 'IVA suportado', type: 'mixed', parentId: '34.5' },
  { id: '34.5.2', code: '34.5.2', name: 'IVA dedutível', type: 'mixed', parentId: '34.5' },
  { id: '34.5.3', code: '34.5.3', name: 'IVA liquidado', type: 'mixed', parentId: '34.5' },
  { id: '34.5.5', code: '34.5.5', name: 'IVA apuramento', type: 'mixed', parentId: '34.5' },
  { id: '36', code: '36', name: 'Pessoal', type: 'mixed', parentId: '3' },
  { id: '36.1', code: '36.1', name: 'Pessoal - remunerações', type: 'credit', parentId: '36' },
  { id: '37', code: '37', name: 'Outros valores a receber e a pagar', type: 'mixed', parentId: '3' },
  { id: '38', code: '38', name: 'Provisões para cobranças duvidosas', type: 'credit', parentId: '3' },

  // CLASSE 4: MEIOS MONETÁRIOS
  { id: '4', code: '4', name: 'Meios monetários', type: 'debit', isSystem: true },
  { id: '41', code: '41', name: 'Títulos negociáveis', type: 'debit', parentId: '4' },
  { id: '42', code: '42', name: 'Depósitos a prazo', type: 'debit', parentId: '4' },
  { id: '43', code: '43', name: 'Depósitos à ordem', type: 'debit', parentId: '4' },
  { id: '43.1', code: '43.1', name: 'Moeda nacional', type: 'debit', parentId: '43' },
  { id: '45', code: '45', name: 'Caixa', type: 'debit', parentId: '4' },
  { id: '45.1', code: '45.1', name: 'Fundo fixo', type: 'debit', parentId: '45' },
  { id: '49', code: '49', name: 'Provisões para aplicações de tesouraria', type: 'credit', parentId: '4' },

  // CLASSE 5: CAPITAL E RESERVAS
  { id: '5', code: '5', name: 'Capital e reservas', type: 'credit', isSystem: true },
  { id: '51', code: '51', name: 'Capital', type: 'credit', parentId: '5' },
  { id: '55', code: '55', name: 'Reservas legais', type: 'credit', parentId: '5' },
  { id: '58', code: '58', name: 'Reservas livres', type: 'credit', parentId: '5' },

  // CLASSE 6: PROVEITOS E GANHOS POR NATUREZA
  { id: '6', code: '6', name: 'Proveitos e ganhos por natureza', type: 'credit', isSystem: true },
  { id: '61', code: '61', name: 'Vendas', type: 'credit', parentId: '6' },
  { id: '61.1', code: '61.1', name: 'Produtos acabados e intermédios', type: 'credit', parentId: '61' },
  { id: '61.3', code: '61.3', name: 'Mercadorias', type: 'credit', parentId: '61' },
  { id: '62', code: '62', name: 'Prestações de serviços', type: 'credit', parentId: '6' },
  { id: '66', code: '66', name: 'Proveitos e ganhos financeiros gerais', type: 'credit', parentId: '6' },

  // CLASSE 7: CUSTOS E PERDAS POR NATUREZA
  { id: '7', code: '7', name: 'Custos e perdas por natureza', type: 'debit', isSystem: true },
  { id: '71', code: '71', name: 'Custo das mercadorias vendidas e matérias consumidas', type: 'debit', parentId: '7' },
  { id: '72', code: '72', name: 'Custos com o pessoal', type: 'debit', parentId: '7' },
  { id: '72.2', code: '72.2', name: 'Remunerações - Pessoal', type: 'debit', parentId: '72' },
  { id: '73', code: '73', name: 'Amortizações do exercício', type: 'debit', parentId: '7' },
  { id: '75', code: '75', name: 'Outros custos e perdas operacionais', type: 'debit', parentId: '7' },
  { id: '75.2', code: '75.2', name: 'Fornecimentos e serviços de terceiros (FSE)', type: 'debit', parentId: '75' },
  { id: '75.2.11', code: '75.2.11', name: 'Água', type: 'debit', parentId: '75.2' },
  { id: '75.2.12', code: '75.2.12', name: 'Electricidade', type: 'debit', parentId: '75.2' },
  { id: '75.2.21', code: '75.2.21', name: 'Rendas e alugueres', type: 'debit', parentId: '75.2' },
  { id: '76', code: '76', name: 'Custos e perdas financeiros gerais', type: 'debit', parentId: '7' },

  // CLASSE 8: RESULTADOS
  { id: '8', code: '8', name: 'Resultados', type: 'mixed', isSystem: true },
  { id: '81', code: '81', name: 'Resultados transitados', type: 'mixed', parentId: '8' },
  { id: '82', code: '82', name: 'Resultados operacionais', type: 'mixed', parentId: '8' },
  { id: '88', code: '88', name: 'Resultado líquido do exercício', type: 'mixed', parentId: '8' },
];
