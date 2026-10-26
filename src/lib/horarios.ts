// Textos de horário de funcionamento (fuso de São Paulo, igual ao banco).
// Quem decide se a loja está aberta é o banco (`aberta` da view); aqui só
// descrevemos o turno atual / a próxima abertura.
import type { ConfigCardapio, Horario } from './tipos';

export const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const DIAS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface MomentoLocal {
  dia: number;
  minutos: number;
}

export function agoraEmSaoPaulo(data: Date = new Date()): MomentoLocal {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '0';
  return {
    dia: Math.max(0, DIAS_EN.indexOf(pegar('weekday'))),
    minutos: Number(pegar('hour')) * 60 + Number(pegar('minute')),
  };
}

/** "18:00:00" → "18:00" */
export function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

function minutosDe(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function viraMeiaNoite(h: Horario): boolean {
  return minutosDe(h.fecha) <= minutosDe(h.abre);
}

export function faixaHorario(h: Horario | undefined): string {
  if (!h || !h.aberto) return 'fechado';
  return `${hhmm(h.abre)} às ${hhmm(h.fecha)}`;
}

export interface StatusLoja {
  aberta: boolean;
  /** "Aberto agora" / "Fechado agora" */
  titulo: string;
  /** "Fecha às 02:00", "Abre hoje às 18:00"… */
  detalhe: string | null;
  /** "Fecha em 3h 24min" (só aberta e com turno conhecido); null nos outros casos. */
  fechaEm: string | null;
  /** "Hoje: 18:00 às 02:00" */
  horarioHoje: string;
}

/** Minutos até o fim do turno (turno que vira a meia-noite conta até o dia seguinte). */
export function minutosAteFechar(turno: Horario, agora: MomentoLocal): number {
  const falta = minutosDe(turno.fecha) - agora.minutos;
  return viraMeiaNoite(turno) && agora.minutos >= minutosDe(turno.abre) ? falta + 24 * 60 : falta;
}

/** "Fecha em 3h 24min", "Fecha em 45 min", "Fecha em instantes". */
export function textoFechaEm(minutos: number): string {
  if (minutos < 1) return 'Fecha em instantes';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `Fecha em ${m} min`;
  return m === 0 ? `Fecha em ${h}h` : `Fecha em ${h}h ${m}min`;
}

export function descreverStatus(
  aberta: boolean,
  config: Pick<ConfigCardapio, 'status_loja'>,
  horarios: Horario[],
  agora: MomentoLocal = agoraEmSaoPaulo(),
): StatusLoja {
  const porDia = new Map(horarios.map((h) => [h.dia_semana, h]));
  const hoje = porDia.get(agora.dia);
  const ontem = porDia.get((agora.dia + 6) % 7);
  const horarioHoje = `Hoje: ${faixaHorario(hoje)}`;

  if (aberta) {
    if (config.status_loja === 'aberto') {
      return { aberta, titulo: 'Aberto agora', detalhe: null, fechaEm: null, horarioHoje };
    }
    // Turno de ontem que atravessou a meia-noite ainda valendo?
    const turno =
      ontem && ontem.aberto && viraMeiaNoite(ontem) && agora.minutos < minutosDe(ontem.fecha) ? ontem : hoje;
    // turno já vencido (status manual ou página antiga) fica só com "Fecha às"
    const falta = turno?.aberto ? minutosAteFechar(turno, agora) : null;
    return {
      aberta,
      titulo: 'Aberto agora',
      detalhe: turno?.aberto ? `Fecha às ${hhmm(turno.fecha)}` : null,
      fechaEm: falta != null && falta >= 0 ? textoFechaEm(falta) : null,
      horarioHoje,
    };
  }

  if (config.status_loja === 'fechado') {
    return { aberta, titulo: 'Fechado agora', detalhe: null, fechaEm: null, horarioHoje };
  }

  if (hoje?.aberto && agora.minutos < minutosDe(hoje.abre)) {
    return { aberta, titulo: 'Fechado agora', detalhe: `Abre hoje às ${hhmm(hoje.abre)}`, fechaEm: null, horarioHoje };
  }
  for (let i = 1; i <= 7; i++) {
    const dia = (agora.dia + i) % 7;
    const h = porDia.get(dia);
    if (h?.aberto) {
      const quando = i === 1 ? 'amanhã' : NOMES_DIAS[dia];
      return { aberta, titulo: 'Fechado agora', detalhe: `Abre ${quando} às ${hhmm(h.abre)}`, fechaEm: null, horarioHoje };
    }
  }
  return { aberta, titulo: 'Fechado agora', detalhe: null, fechaEm: null, horarioHoje };
}

/** "11h", "11h30", e o fim do dia (23:59) como "0h". */
export function horaCurta(hora: string): string {
  const [h, m] = hhmm(hora).split(':').map(Number);
  if (h === 23 && m === 59) return '0h';
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/**
 * Horário da semana em poucas linhas, juntando os dias seguidos com o mesmo horário:
 * "Domingo a quinta: 11h às 22h", "Sexta e sábado: 11h à 0h". Dia fechado vira "Fechado".
 */
export function horarioResumido(horarios: Horario[]): { dias: string; faixa: string }[] {
  const porDia = new Map(horarios.map((h) => [h.dia_semana, h]));
  const faixaDo = (dia: number) => {
    const h = porDia.get(dia);
    if (!h || !h.aberto) return 'Fechado';
    const fim = horaCurta(h.fecha);
    return `${horaCurta(h.abre)} ${fim === '0h' ? 'à' : 'às'} ${fim}`;
  };
  const grupos: { de: number; ate: number; faixa: string }[] = [];
  for (let dia = 0; dia < 7; dia++) {
    const faixa = faixaDo(dia);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.faixa === faixa) ultimo.ate = dia;
    else grupos.push({ de: dia, ate: dia, faixa });
  }
  const nome = (d: number) => NOMES_DIAS[d].charAt(0).toUpperCase() + NOMES_DIAS[d].slice(1);
  return grupos.map((g) => ({
    dias:
      g.de === g.ate
        ? nome(g.de)
        : g.ate === g.de + 1
          ? `${nome(g.de)} e ${NOMES_DIAS[g.ate]}`
          : `${nome(g.de)} a ${NOMES_DIAS[g.ate]}`,
    faixa: g.faixa,
  }));
}
