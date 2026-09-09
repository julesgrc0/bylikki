import * as v from 'valibot';

type ConstrainAttrs = Record<string, unknown>;

type WrapperSchema = { type: 'optional' | 'nullable'; wrapped: v.GenericSchema };
type PipedSchema = { pipe: readonly unknown[] };
type UnionMemberSchema = { type: 'union'; options: readonly v.GenericSchema[] };

function isWrapper(schema: v.GenericSchema): schema is v.GenericSchema & WrapperSchema {
	return schema.type === 'optional' || schema.type === 'nullable';
}

function hasPipe(schema: v.GenericSchema): schema is v.GenericSchema & PipedSchema {
	return 'pipe' in schema && Array.isArray((schema as PipedSchema).pipe);
}

function isUnion(schema: v.GenericSchema): schema is v.GenericSchema & UnionMemberSchema {
	return schema.type === 'union';
}

function isEmptyStringLiteral(schema: v.GenericSchema): boolean {
	return schema.type === 'literal' && (schema as unknown as { literal: unknown }).literal === '';
}

/**
 * Traduit un schema Valibot en attributs HTML de validation. Le navigateur
 * rend alors le meme verdict que le serveur, immediatement et sans reseau ;
 * la validation serveur reste la seule qui fasse autorite.
 */
export function constrains(schema: v.GenericSchema): ConstrainAttrs {
	if (isWrapper(schema)) {
		return { ...constrains(schema.wrapped), required: false };
	}

	if (isUnion(schema)) {
		const hasEmptyStringBranch = schema.options.some(isEmptyStringLiteral);
		const nonEmptyBranch = schema.options.find((option) => !isEmptyStringLiteral(option));
		const base = nonEmptyBranch ? constrains(nonEmptyBranch) : { required: true };

		return { ...base, required: hasEmptyStringBranch ? false : base.required };
	}

	const attrs: ConstrainAttrs = { required: true };

	if (!hasPipe(schema)) {
		return attrs;
	}

	for (const action of schema.pipe) {
		if (!action || typeof action !== 'object' || !('type' in action)) {
			continue;
		}

		const item = action as {
			type: string;
			requirement?: unknown;
			metadata?: Record<string, unknown>;
		};

		switch (item.type) {
			case 'min_length':
				attrs.minlength = item.requirement;
				break;
			case 'max_length':
				attrs.maxlength = item.requirement;
				break;
			case 'length':
				attrs.minlength = item.requirement;
				attrs.maxlength = item.requirement;
				break;
			case 'min_value':
				attrs.min = item.requirement;
				break;
			case 'max_value':
				attrs.max = item.requirement;
				break;
			case 'regex':
				attrs.pattern = (item.requirement as RegExp).source;
				break;
			case 'metadata':
				Object.assign(attrs, item.metadata);
				break;
		}
	}

	return attrs;
}

/** Contraintes d'un champ d'un schema objet, designe par son nom. */
export function constrainsOf<Schema extends v.ObjectSchema<v.ObjectEntries, undefined>>(
	schema: Schema,
	field: keyof Schema['entries'] & string
): ConstrainAttrs {
	return constrains(schema.entries[field] as v.GenericSchema);
}
