import dedent from 'dedent'

export function getUtilsTemplate() {
    return dedent`
        import type { InferSubjects } from '@casl/ability'
        import type { LiteralUnion, PartialDeep } from 'type-fest'

        type CRUD = 'create' | 'read' | 'update' | 'delete'
        type CaslModel<TName extends string, TObject extends object> = PartialDeep<TObject> & { __typename: TName, [key: PropertyKey]: unknown }

        type CaslAbility<TActions extends LiteralUnion<CRUD, string>, TName extends string, TObject extends object> = [TActions, InferSubjects<CaslModel<TName, TObject>>]

        type CaslCRUDAbility<TName extends string, TObject extends object> = CaslAbility<CRUD, TName, TObject>

        export function defineCaslAbility<TActions extends LiteralUnion<CRUD, string>, TName extends string = 'all', TObject extends object = {}>() {
            return undefined as unknown as CaslAbility<TActions, TName, TObject>
        }

        export function defineCaslCRUDAbility<TName extends string = 'all', TObject extends object = {}>() {
            return undefined as unknown as CaslCRUDAbility<TName, TObject>
        }
    `
}
