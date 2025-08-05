const assert = require('assert')
const app = require('../../src/app')

describe('\'masterConfig\' service', () => {
  it('registered the service', () => {
    const service = app.service('master-config')

    assert.ok(service, 'Registered the service')
  })
})
