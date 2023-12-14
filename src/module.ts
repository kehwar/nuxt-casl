import { addImports, addServerImports, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import fg from 'fast-glob'
import _ from 'lodash'
import { DefaultModuleOptions, type Options } from './runtime/options'
import { parsePath } from './runtime/parse-path'
import { getAbilityTemplate } from './templates/get-ability-template'
import { getUtilsTemplate } from './templates/get-utils-template'

export default defineNuxtModule({
    meta: {
        name: '@kehwar/nuxt-casl-auto',
        configKey: 'casl',
    },

    defaults: DefaultModuleOptions,

    // The function holding your module logic, it can be asynchronous
    async setup(moduleOptions, nuxt) {
        // Options
        const options: Options = { ...moduleOptions, nuxt, cwd: nuxt.options.srcDir }

        // Scan TRPC files
        const files: string[] = []
        async function scanCaslFiles() {
            files.length = 0
            const updatedFiles = await fg(options.pattern, {
                cwd: options.nuxt.options.srcDir,
                absolute: true,
                onlyFiles: true,
                ignore: ['!**/node_modules', '!**/dist'],
            })
            files.push(...new Set(updatedFiles))
            return files
        }
        await scanCaslFiles()

        // Files
        const parsedPaths = files.map(file => parsePath(file, options))

        // Resolver
        const resolver = createResolver(nuxt.options.buildDir)

        // Add templates
        addTemplate({
            filename: 'casl/utils.ts',
            write: true,
            getContents: () => getUtilsTemplate(),
        })
        addTemplate({
            filename: 'casl/ability.ts',
            write: true,
            getContents: () => getAbilityTemplate(parsedPaths),
        })
        nuxt.hook('prepare:types', (options) => {
            options.tsConfig.include?.unshift('./casl')
        })

        // Add imports
        addImports([
            { name: 'defineCaslAbility', from: resolver.resolve('casl/utils') },
            { name: 'defineCaslCRUDAbility', from: resolver.resolve('casl/utils') },
            { name: 'getCaslAbility', from: resolver.resolve('casl/ability') },
        ])
        addServerImports([
            { name: 'defineCaslAbility', from: resolver.resolve('casl/utils') },
            { name: 'defineCaslCRUDAbility', from: resolver.resolve('casl/utils') },
            { name: 'getCaslAbility', from: resolver.resolve('casl/ability') },
        ])
    },
})
