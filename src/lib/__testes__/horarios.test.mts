import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descreverStatus, horarioResumido, minutosAteFechar, textoFechaEm } from '../horarios.ts';
import type { Horario } from '../tipos.ts';

const horario = (dia_semana: number, abre: string, fecha: string, aberto = true): Horario => ({ dia_semana, aberto, abre, fecha });
const cfg = { status_loja: 'automatico' as const };

test('texto do "fecha em"', () => {
  assert.equal(textoFechaEm(0), 'Fecha em instantes');
  assert.equal(textoFechaEm(45), 'Fecha em 45 min');
  assert.equal(textoFechaEm(60), 'Fecha em 1h');
  assert.equal(textoFechaEm(204), 'Fecha em 3h 24min');
});

test('minutos até fechar: turno normal e turno que vira a meia-noite', () => {
  assert.equal(minutosAteFechar(horario(6, '11:00:00', '23:59:00'), { dia: 6, minutos: 20 * 60 + 35 }), 204);
  // sábado 23:00, fecha às 02:00 de domingo
  assert.equal(minutosAteFechar(horario(6, '18:00:00', '02:00:00'), { dia: 6, minutos: 23 * 60 }), 180);
  // domingo 01:00 ainda no turno de sábado
  assert.equal(minutosAteFechar(horario(6, '18:00:00', '02:00:00'), { dia: 0, minutos: 60 }), 60);
});

test('status aberta traz "Fecha às" e "Fecha em"', () => {
  const tarde = descreverStatus(true, cfg, [horario(6, '11:00:00', '23:59:00')], { dia: 6, minutos: 20 * 60 + 35 });
  assert.equal(tarde.detalhe, 'Fecha às 23:59');
  assert.equal(tarde.fechaEm, 'Fecha em 3h 24min');

  const madrugada = descreverStatus(
    true,
    cfg,
    [horario(6, '18:00:00', '02:00:00'), horario(0, '12:00:00', '20:00:00')],
    { dia: 0, minutos: 60 },
  );
  assert.equal(madrugada.detalhe, 'Fecha às 02:00');
  assert.equal(madrugada.fechaEm, 'Fecha em 1h');
});

test('status manual "aberto" ou loja fechada não trazem "fecha em"', () => {
  const manual = descreverStatus(true, { status_loja: 'aberto' }, [horario(6, '11:00:00', '23:59:00')], { dia: 6, minutos: 600 });
  assert.equal(manual.fechaEm, null);

  const fechada = descreverStatus(false, cfg, [horario(6, '11:00:00', '23:59:00')], { dia: 6, minutos: 9 * 60 });
  assert.equal(fechada.detalhe, 'Abre hoje às 11:00');
  assert.equal(fechada.fechaEm, null);
});

test('horário resumido do rodapé junta os dias com o mesmo horário', () => {
  const semana = [0, 1, 2, 3, 4].map((d) => horario(d, '11:00:00', '22:00:00')).concat([5, 6].map((d) => horario(d, '11:00:00', '23:59:00')));
  assert.deepEqual(horarioResumido(semana), [
    { dias: 'Domingo a quinta', faixa: '11h às 22h' },
    { dias: 'Sexta e sábado', faixa: '11h à 0h' },
  ]);
  const comFolga = semana.map((h) => (h.dia_semana === 1 ? { ...h, aberto: false } : h));
  assert.deepEqual(horarioResumido(comFolga).map((g) => g.dias), ['Domingo', 'Segunda', 'Terça a quinta', 'Sexta e sábado']);
});
