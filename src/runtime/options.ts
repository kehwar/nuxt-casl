import type { Nuxt } from '@nuxt/schema'

export const DefaultModuleOptions = {
    pattern: '**/*.casl.{ts,js,mjs}',
}
export type ModuleOptions = typeof DefaultModuleOptions
export type Options = ModuleOptions & {
    cwd: string
    nuxt: Nuxt
}
