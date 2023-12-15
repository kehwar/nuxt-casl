import dedent from 'dedent'
import type { ParsedPath } from '../runtime/parse-path'

export function getAbilityTemplate(paths: ParsedPath[]) {
    return dedent`
        import type { MongoQuery, RawRuleFrom } from '@casl/ability'
        import { createMongoAbility } from '@casl/ability'
        import type { LiteralUnion, OmitIndexSignature, Paths } from 'type-fest'
        import _ from 'lodash'
        import { guard } from '@ucast/mongo2js'

        ${paths.map(({ importPath, importName }) => `import type ${importName} from '${importPath}'`).join('\n        ')}

        type DistributeFlatArray<A> = A extends [infer H, ...infer T] ? (H extends H ? [H, ...DistributeFlatArray<T>] : never) : []

        type AppAbility = ${paths.length === 0 ? 'any' : `DistributeFlatArray<${paths.map(({ importName }) => `typeof ${importName}`).join(' | ')}>`}

        type Actions = AppAbility[0]
        type Subjects = AppAbility[1]
        type Models = Extract<AppAbility, [any, { __typename: string }]>[1]
        type SubjectsForAction<TAction extends Actions> = Extract<AppAbility, [TAction, unknown]>[1]
        type GetModel<TSubject extends Subjects> = TSubject extends string
            ? Extract<Models, { __typename: TSubject }>
            : TSubject extends { __typename: string } ? Extract<Models, TSubject> : never
        type GetPathsForSubject<TSubject extends Subjects> = Paths<Omit<OmitIndexSignature<GetModel<TSubject>>, '__typename'>>
        type RawRule = RawRuleFrom<AppAbility, MongoQuery> & { scope?: unknown }

        export function getCaslAbility(rawRules: (string | RawRule | RawRule[])[], meta?: any) {
            // Compile rules with lodash template and parse with JSON
            const rules = rawRules.flatMap(rule => {
                if (typeof rule === 'string')
                    return JSON.parse(_.template(rule)(meta)) as RawRule[]
                return rule
            })

            // Filter rules by scope
            const scopedRules = meta != null ? rules.filter(rule => rule.scope == null || guard(rule.scope)(meta)) : rules

            // Define CASL Ability
            const ability = createMongoAbility<AppAbility>(scopedRules, {
                detectSubjectType: object => object.__typename,
            })

            // Create helper functions with better type inference
            function can<TAction extends Actions, TSubject extends SubjectsForAction<TAction>>(action: TAction, subject?: TSubject, field?: LiteralUnion<GetPathsForSubject<TSubject>, string>): boolean {
                return ability.can(action, subject as any, field as any)
            }
            function cannot<TAction extends Actions, TSubject extends SubjectsForAction<TAction>>(action: TAction, subject?: TSubject, field?: LiteralUnion<GetPathsForSubject<TSubject>, string>): boolean {
                return ability.cannot(action, subject as any, field as any)
            }

            return {
                ability,
                can,
                cannot,
                rules: scopedRules,
                debug: {
                    unescopedRules: rules,
                    rawRules,
                }
            }
        }
    `
}
