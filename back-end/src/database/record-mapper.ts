/**
 * RECORD MAPPER — plain app objects <-> PostgreSQL rows.
 *
 * The services work with plain objects ({ id: 'EVT012', date: '2027-03-10',
 * quotedPrice: 25000, vendorResponses: [...] }). Each table has typed columns
 * for the fields the app filters / links / enforces rules on, plus an `extra`
 * JSONB column for everything else. This file does the conversion for every
 * table, using Prisma's own description of the schema (Prisma.dmmf), so there is
 * no hand-written converter per table.
 *
 *   toRow('Event', obj)   -> { id, name, date: Date, quotedPrice: 25000, ..., extra: { vendorResponses } }
 *   fromRow('Event', row) -> the original plain object again
 *
 * Conversions: DATE <-> 'YYYY-MM-DD', TIMESTAMPTZ <-> ISO string, NUMERIC <-> number.
 * A value that does not fit its column (e.g. a budget typed as "₹5,000") is kept
 * in `extra` instead of being dropped, so nothing is ever lost.
 */
import { Prisma } from '@prisma/client';

type Field = { name: string; kind: string; type: string; isList: boolean; isRequired: boolean; nativeType?: [string, string[]] | null; hasDefaultValue: boolean };

// Columns per model, read once from the generated Prisma client
const FIELDS: Record<string, Field[]> = {};
for (const model of Prisma.dmmf.datamodel.models) {
  FIELDS[model.name] = (model.fields as unknown as Field[]).filter((f) => f.kind === 'scalar' && f.name !== 'extra');
}

const INVALID = Symbol('invalid');

// Turns one app value into what the column expects (or INVALID)
function toColumn(field: Field, value: any): any {
  if (value === undefined || value === null || value === '') return field.type === 'String' && value === '' ? '' : null;
  if (field.isList) return Array.isArray(value) ? value.map(String) : INVALID;
  switch (field.type) {
    case 'String':
      return typeof value === 'object' ? INVALID : String(value);
    case 'Int': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.round(n) : INVALID;
    }
    case 'Decimal': {
      const n = Number(value);
      return Number.isFinite(n) ? n : INVALID;
    }
    case 'Boolean':
      return typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : INVALID;
    case 'DateTime': {
      const onlyDate = field.nativeType?.[0] === 'Date';
      const text = String(value);
      const date = onlyDate && /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00.000Z`) : new Date(text);
      return Number.isNaN(date.getTime()) ? INVALID : date;
    }
    case 'Json':
      return value;
    default:
      return value;
  }
}

// Turns one column value back into the app's plain value
function fromColumn(field: Field, value: any): any {
  if (value === null || value === undefined) return undefined;
  if (field.type === 'Decimal') return Number(value);
  if (field.type === 'DateTime') {
    const iso = (value as Date).toISOString();
    return field.nativeType?.[0] === 'Date' ? iso.slice(0, 10) : iso;
  }
  return value;
}

/** Plain object -> data for prisma.<model>.create / update. */
export function toRow(model: string, obj: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  const extra: Record<string, any> = {};
  const columns = new Map(FIELDS[model].map((f) => [f.name, f]));
  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined) continue;
    const field = columns.get(key);
    if (!field) {
      extra[key] = value;
      continue;
    }
    const converted = toColumn(field, value);
    if (converted === INVALID) {
      extra[key] = value; // keep the original, never lose data
      if (!field.isRequired) row[key] = null;
    } else {
      row[key] = converted;
    }
  }
  // Optional columns missing from the object are cleared (an update replaces the record)
  for (const field of columns.values()) {
    if (!(field.name in row) && !field.isRequired && !field.hasDefaultValue && !(field.name in extra)) row[field.name] = null;
  }
  row.extra = JSON.parse(JSON.stringify(extra)); // JSON-safe (drops undefined)
  return row;
}

/** Database row -> the plain object the services use. */
export function fromRow(model: string, row: Record<string, any> | null): any {
  if (!row) return row;
  const obj: Record<string, any> = { ...(row.extra || {}) };
  for (const field of FIELDS[model]) {
    const value = fromColumn(field, row[field.name]);
    if (value !== undefined) obj[field.name] = value;
  }
  return obj;
}

/** Column names of a model (for tests and the import report). */
export function columnsOf(model: string): string[] {
  return FIELDS[model].map((f) => f.name);
}

/** Required columns without a default (an import must fill these before inserting). */
export function requiredColumnsOf(model: string): Array<{ name: string; type: string }> {
  return FIELDS[model].filter((f) => f.isRequired && !f.hasDefaultValue && !f.isList).map((f) => ({ name: f.name, type: f.type }));
}
