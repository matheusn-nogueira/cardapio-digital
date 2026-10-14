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
  /** "Hoje: 18:00 às 02:00" */
  horarioHoje: string;
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
    if (config.status_loja === 'aberto') return { aberta, titulo: 'Aberto agora', detalhe: null, horarioHoje };
    // Turno de ontem que atravessou a meia-noite ainda valendo?
    const turno =
      ontem && ontem.aberto && viraMeiaNoite(ontem) && agora.minutos < minutosDe(ontem.fecha) ? ontem : hoje;
    return {
      aberta,
      titulo: 'Aberto agora',
      detalhe: turno?.aberto ? `Fecha às ${hhmm(turno.fecha)}` : null,
      horarioHoje,
    };
  }

  if (config.status_loja === 'fechado') return { aberta, titulo: 'Fechado agora', detalhe: null, horarioHoje };

  if (hoje?.aberto && agora.minutos < minutosDe(hoje.abre)) {
    return { aberta, titulo: 'Fechado agora', detalhe: `Abre hoje às ${hhmm(hoje.abre)}`, horarioHoje };
  }
  for (let i = 1; i <= 7; i++) {
    const dia = (agora.dia + i) % 7;
    const h = porDia.get(dia);
    if (h?.aberto) {
      const quando = i === 1 ? 'amanhã' : NOMES_DIAS[dia];
      return { aberta, titulo: 'Fechado agora', detalhe: `Abre ${quando} às ${hhmm(h.abre)}`, horarioHoje };
    }
  }
  return { aberta, titulo: 'Fechado agora', detalhe: null, horarioHoje };
}
