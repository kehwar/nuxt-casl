/* eslint-disable no-console */

import type { InferSubjects, MongoQuery, RawRuleFrom } from '@casl/ability'
import { createMongoAbility } from '@casl/ability'
import type { LiteralUnion, OmitIndexSignature, PartialDeep, Paths } from 'type-fest'
import _ from 'lodash'
import { expect, it } from 'vitest'
import { guard } from '@ucast/mongo2js'

type CRUD = 'create' | 'read' | 'update' | 'delete'
type CaslModel<TName extends string, TObject extends object> = PartialDeep<TObject> & { __typename: TName, [key: PropertyKey]: unknown }
type CaslAbility<TActions extends LiteralUnion<CRUD, string>, TName extends string, TObject extends object> = [TActions, InferSubjects<CaslModel<TName, TObject>>]
type CaslCRUDAbility<TName extends string, TObject extends object> = CaslAbility<CRUD, TName, TObject>

type DetalleDeComision = CaslCRUDAbility<'DetalleDeComision', {
    receptor: string
    periodo: string
    role: string
}>

type DistributeFlatArray<A> = A extends [infer H, ...infer T] ? (H extends H ? [H, ...DistributeFlatArray<T>] : never) : []
type AppAbility = DistributeFlatArray<DetalleDeComision>

type Actions = AppAbility[0]
type Subjects = AppAbility[1]
type Models = Extract<AppAbility, [any, { __typename: string }]>[1]
type SubjectsForAction<TAction extends Actions> = Extract<AppAbility, [TAction, unknown]>[1]
type GetModel<TSubject extends Subjects> = TSubject extends string
    ? Extract<Models, { __typename: TSubject }>
    : TSubject extends { __typename: string } ? Extract<Models, TSubject> : never
type GetPathsForSubject<TSubject extends Subjects> = Paths<Omit<OmitIndexSignature<GetModel<TSubject>>, '__typename'>>
type RawRule = RawRuleFrom<AppAbility, MongoQuery> & { scope?: unknown }

function getCaslAbility(jsonRules: string[], meta: any) {
    // Compile rules with lodash template and parse with JSON
    const rules: RawRule[] = jsonRules.flatMap(rule => JSON.parse(_.template(rule)(meta)))

    // Filter rules by scope
    const scopedRules = rules.filter(rule => rule.scope == null || guard(rule.scope)(meta))

    // Define CASL Ability
    const ability = createMongoAbility<AppAbility>(scopedRules, {
        detectSubjectType: object => object.__typename,
    })

    // Create helper functions with better type inference
    function can<TAction extends Actions, TSubject extends SubjectsForAction<TAction>>(action: TAction, subject: TSubject, field?: LiteralUnion<GetPathsForSubject<TSubject>, string>): boolean {
        return ability.can(action, subject as any, field as any)
    }
    function cannot<TAction extends Actions, TSubject extends SubjectsForAction<TAction>>(action: TAction, subject: TSubject, field?: LiteralUnion<GetPathsForSubject<TSubject>, string>): boolean {
        return ability.cannot(action, subject as any, field as any)
    }

    return {
        rules,
        scopedRules,
        ability,
        can,
        cannot,
    }
}

const rawRules = [
    `
        [{
            "action": "read",
            "subject": "DetalleDeComision",
            "conditions": {
                "receptor": "<%= user.name %>",
                "role": { "$in": <%= JSON.stringify(user.roles) %> }
            },
            "scope": {
                "user.name": "<%= user.name %>"
            }
        }]
    `,
    `
        [{
            "action": "read",
            "subject": "DetalleDeComision",
            "scope": {
                "user.name": "KENYI"
            }
        }]
    `,
]
const meta = {
    user: {
        name: 'DIEGO',
        roles: ['SALES'],
    },
}

const { rules, scopedRules, can, cannot } = getCaslAbility(rawRules, meta)
const { can: adminCan } = getCaslAbility(rawRules, { user: { name: 'KENYI', roles: ['SYSADMIN'] } })

can('read', 'DetalleDeComision', 'receptor')
// ^?
can('update', 'DetalleDeComision', 'receptor')
// ^?
cannot('read', { __typename: 'DetalleDeComision' }, 'receptor')
// ^?
cannot('update', { __typename: 'DetalleDeComision' }, 'receptor')
// ^?

it('should work', () => {
    console.log(rules)
    console.log(scopedRules)
    expect(can('read', 'DetalleDeComision')).toBe(true)
    expect(can('read', { __typename: 'DetalleDeComision' })).toBe(false)
    expect(can('read', { __typename: 'DetalleDeComision', receptor: 'DIEGO', role: 'SALES' })).toBe(true)
    expect(adminCan('read', { __typename: 'DetalleDeComision' })).toBe(true)
})
