import _ from 'lodash'
import * as path from 'pathe'
import type { Options } from './options'

export function parsePath(file: string, { cwd }: Options) {
    const relativePath = path.relative(cwd, file)
    const dirName = path.dirname(relativePath).split(path.sep).map(dir => _.camelCase(dir)).join('.')
    const fileName = _.camelCase(path.basename(relativePath, path.extname(relativePath)).split('.').slice(0, -1).join('_'))
    const importPath = path.join(cwd, path.dirname(relativePath), path.basename(relativePath, path.extname(relativePath)))
    const importName = [_.camelCase(dirName), fileName].join('_')
    return {
        importPath,
        importName,
    }
}

export type ParsedPath = ReturnType<typeof parsePath>
