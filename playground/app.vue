<script setup lang="ts">
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
</script>

<template>
    <div>
        {{ can('read', 'DetalleDeComision', 'receptor') }}
        {{ can('update', 'DetalleDeComision', 'receptor') }}
        {{ cannot('read', { __typename: 'DetalleDeComision' }, 'receptor') }}
        {{ cannot('update', { __typename: 'DetalleDeComision' }, 'receptor') }}
        {{ adminCan('read', 'DetalleDeComision', 'receptor') }}
        {{ adminCan('update', 'DetalleDeComision', 'receptor') }}
    </div>
</template>
