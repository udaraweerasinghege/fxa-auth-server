/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Shared helpers for mocking things out in the tests.
 */

const sinon = require('sinon')
const extend = require('util')._extend
const P = require('../lib/promise')
const crypto = require('crypto')
const config = require('../config').getProperties()
const error = require('../lib/error')

const CUSTOMS_METHOD_NAMES = [
  'check',
  'checkAuthenticated',
  'flag',
  'reset'
]

const DB_METHOD_NAMES = [
  'account',
  'accountEmails',
  'accountResetToken',
  'consumeUnblockCode',
  'createAccount',
  'createDevice',
  'createEmailBounce',
  'createEmail',
  'createKeyFetchToken',
  'createPasswordForgotToken',
  'createSessionToken',
  'createSigninCode',
  'createUnblockCode',
  'createVerificationReminder',
  'deleteAccount',
  'deleteDevice',
  'deleteEmail',
  'deleteKeyFetchToken',
  'deletePasswordChangeToken',
  'deleteSessionToken',
  'deleteVerificationReminder',
  'deviceFromTokenVerificationId',
  'devices',
  'emailBounces',
  'emailRecord',
  'forgotPasswordVerified',
  'getSecondaryEmail',
  'keyFetchToken',
  'keyFetchTokenWithVerificationStatus',
  'passwordChangeToken',
  'passwordForgotToken',
  'resetAccount',
  'securityEvent',
  'securityEvents',
  'sessions',
  'sessionToken',
  'sessionTokenWithVerificationStatus',
  'sessionWithDevice',
  'updateDevice',
  'updateLocale',
  'updateSessionToken',
  'verifyEmail',
  'verifyTokens'
]

const LOG_METHOD_NAMES = [
  'activityEvent',
  'begin',
  'error',
  'flowEvent',
  'increment',
  'info',
  'notifyAttachedServices',
  'warn',
  'summary',
  'timing',
  'trace'
]

const MAILER_METHOD_NAMES = [
  'sendNewDeviceLoginNotification',
  'sendPasswordChangedNotification',
  'sendPasswordResetNotification',
  'sendPostVerifyEmail',
  'sendPostVerifySecondaryEmail',
  'sendUnblockCode',
  'sendVerifyCode',
  'sendVerifyLoginEmail',
  'sendVerifySecondaryEmail',
  'sendRecoveryCode'
]

const METRICS_CONTEXT_METHOD_NAMES = [
  'clear',
  'gather',
  'setFlowCompleteSignal',
  'stash',
  'validate'
]

const PUSH_METHOD_NAMES = [
  'notifyDeviceConnected',
  'notifyDeviceDisconnected',
  'notifyPasswordChanged',
  'notifyPasswordReset',
  'notifyAccountDestroyed',
  'notifyUpdate',
  'pushToAllDevices',
  'pushToDevices'
]

module.exports = {
  generateMetricsContext: generateMetricsContext,
  mockBounces: mockObject(['check']),
  mockCustoms: mockObject(CUSTOMS_METHOD_NAMES),
  mockDB: mockDB,
  mockDevices: mockDevices,
  mockLog: mockLog,
  spyLog: spyLog,
  mockMailer: mockObject(MAILER_METHOD_NAMES),
  mockMetricsContext: mockMetricsContext,
  mockPush: mockPush,
  mockRequest: mockRequest
}

function mockDB (data, errors) {
  data = data || {}
  errors = errors || {}

  return mockObject(DB_METHOD_NAMES)({
    account: sinon.spy(() => {
      return P.resolve({
        email: data.email,
        emailCode: data.emailCode,
        emailVerified: data.emailVerified,
        uid: data.uid,
        verifierSetAt: Date.now(),
        wrapWrapKb: data.wrapWrapKb
      })
    }),
    accountEmails: sinon.spy(() => {
      return P.resolve([
        {
          email: data.email || 'primary@email.com',
          normalizedEmail: (data.email || 'primary@email.com').toLowerCase(),
          emailCode: data.emailCode,
          isPrimary: true,
          isVerified: data.emailVerified
        },
        {
          email: data.secondEmail || 'secondEmail@email.com',
          normalizedEmail: (data.secondEmail || 'secondEmail@email.com').toLowerCase(),
          emailCode: data.secondEmailCode || crypto.randomBytes(16).toString('hex'),
          isVerified: data.secondEmailisVerified || false,
          isPrimary: false
        }
      ])
    }),
    createAccount: sinon.spy(() => {
      return P.resolve({
        uid: data.uid,
        email: data.email,
        emailCode: data.emailCode,
        emailVerified: data.emailVerified,
        locale: data.locale,
        wrapWrapKb: data.wrapWrapKb
      })
    }),
    createDevice: sinon.spy(() => {
      return P.resolve(Object.keys(data.device).reduce((result, key) => {
        result[key] = data.device[key]
        return result
      }, {
        id: data.deviceId,
        createdAt: data.deviceCreatedAt
      }))
    }),
    createKeyFetchToken: sinon.spy(() => {
      return P.resolve({
        data: crypto.randomBytes(32),
        tokenId: data.keyFetchTokenId,
        uid: data.uid
      })
    }),
    createPasswordForgotToken: sinon.spy(() => {
      return P.resolve({
        data: crypto.randomBytes(32),
        passCode: data.passCode,
        tokenId: data.passwordForgotTokenId,
        uid: data.uid,
        ttl: function () {
          return data.passwordForgotTokenTTL || 100
        }
      })
    }),
    createSessionToken: sinon.spy(() => {
      return P.resolve({
        data: crypto.randomBytes(32),
        email: data.email,
        emailVerified: data.emailVerified,
        lastAuthAt: () => {
          return Date.now()
        },
        tokenId: data.sessionTokenId,
        tokenVerificationId: data.tokenVerificationId,
        tokenVerified: ! data.tokenVerificationId,
        uaBrowser: data.uaBrowser,
        uaBrowserVersion: data.uaBrowserVersion,
        uaOS: data.uaOS,
        uaOSVersion: data.uaOSVersion,
        uaDeviceType: data.uaDeviceType,
        uid: data.uid
      })
    }),
    createSigninCode: sinon.spy(() => {
      return P.resolve(data.signinCode || [])
    }),
    devices: sinon.spy(() => {
      return P.resolve(data.devices || [])
    }),
    deleteSessionToken: sinon.spy(() => {
      return P.resolve()
    }),
    emailRecord: sinon.spy(() => {
      if (errors.emailRecord) {
        return P.reject(errors.emailRecord)
      }
      return P.resolve({
        authSalt: crypto.randomBytes(32),
        createdAt: data.createdAt || Date.now(),
        data: crypto.randomBytes(32),
        email: data.email,
        emailVerified: data.emailVerified,
        kA: crypto.randomBytes(32),
        lastAuthAt: () => {
          return Date.now()
        },
        uid: data.uid,
        wrapWrapKb: crypto.randomBytes(32)
      })
    }),
    forgotPasswordVerified: sinon.spy(() => {
      return P.resolve(data.accountResetToken)
    }),
    getSecondaryEmail: sinon.spy(() => {
      return P.reject(error.unknownSecondaryEmail())
    }),
    securityEvents: sinon.spy(() => {
      return P.resolve([])
    }),
    sessions: sinon.spy(() => {
      return P.resolve(data.sessions || [])
    }),
    updateDevice: sinon.spy((uid, sessionTokenId, device) => {
      return P.resolve(device)
    }),
    sessionTokenWithVerificationStatus: sinon.spy(() => {
      return P.resolve({
        tokenVerified: true,
        uaBrowser: data.uaBrowser,
        uaBrowserVersion: data.uaBrowserVersion,
        uaOS: data.uaOS,
        uaOSVersion: data.uaOSVersion,
        uaDeviceType: data.uaDeviceType
      })
    }),
    verifyTokens: sinon.spy(() => {
      if (errors.verifyTokens) {
        return P.reject(errors.verifyTokens)
      }
      return P.resolve()
    })
  })
}

function mockObject (methodNames) {
  return methods => {
    return methodNames.reduce((object, name) => {
      object[name] = methods && methods[name] || sinon.spy(() => P.resolve())
      return object
    }, {})
  }
}

function mockPush (methods) {
  const push = extend({}, methods)
  // So far every push method has a uid for first argument, let's keep it simple.
  PUSH_METHOD_NAMES.forEach((name) => {
    if (! push[name]) {
      push[name] = sinon.spy(uid => {
        if (! (uid instanceof Uint8Array)) {
          throw new Error('The first param –uid– of ' + name + ' must be a Buffer!')
        }
        return P.resolve()
      })
    }
  })
  return push
}

function mockDevices (data) {
  data = data || {}

  return {
    upsert: sinon.spy(() => {
      return P.resolve({
        id: data.deviceId || crypto.randomBytes(16),
        name: data.deviceName || 'mock device name',
        type: data.deviceType || 'desktop'
      })
    }),
    synthesizeName: sinon.spy(() => {
      return data.deviceName || null
    })
  }
}

// A logging mock that doesn't capture anything.
// You can pass in an object of custom logging methods
// if you need to e.g. make assertions about logged values.
function mockLog (methods) {
  const log = extend({}, methods)
  LOG_METHOD_NAMES.forEach((name) => {
    if (! log[name]) {
      log[name] = function() {}
    }
  })
  return log
}

// A logging mock where all logging methods are sinon spys,
// and we capture a log of all their calls in order.
function spyLog (methods) {
  methods = extend({}, methods)
  methods.messages = methods.messages || []
  LOG_METHOD_NAMES.forEach(name => {
    if (! methods[name]) {
      // arrow function would alter `this` inside the method
      methods[name] = function() {
        this.messages.push({
          level: name,
          args: Array.prototype.slice.call(arguments)
        })
      }
    }
    methods[name] = sinon.spy(methods[name])
  })
  return mockLog(methods)
}

function mockMetricsContext (methods) {
  methods = methods || {}
  return mockObject(METRICS_CONTEXT_METHOD_NAMES)({
    gather: methods.gather || sinon.spy(function (data) {
      const time = Date.now()
      return P.resolve()
        .then(() => {
          if (this.payload && this.payload.metricsContext) {
            return Object.assign(data, {
              time: time,
              flow_id: this.payload.metricsContext.flowId,
              flow_time: time - this.payload.metricsContext.flowBeginTime,
              flowCompleteSignal: this.payload.metricsContext.flowCompleteSignal
            })
          }

          return data
        })
    }),

    setFlowCompleteSignal: sinon.spy(function (flowCompleteSignal) {
      if (this.payload && this.payload.metricsContext) {
        this.payload.metricsContext.flowCompleteSignal = flowCompleteSignal
      }
    }),

    validate: methods.validate || sinon.spy(() => true)
  })
}

function generateMetricsContext(){
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const flowBeginTime = Date.now()
  const flowSignature = crypto.createHmac('sha256', config.metrics.flow_id_key)
    .update([
      randomBytes,
      flowBeginTime.toString(16),
      undefined
    ].join('\n'))
    .digest('hex')
    .substr(0, 32)

  return {
    flowBeginTime: flowBeginTime,
    flowId: randomBytes + flowSignature
  }
}

function mockRequest (data) {
  const events = require('../lib/metrics/events')(data.log || module.exports.mockLog())
  const metricsContext = data.metricsContext || module.exports.mockMetricsContext()

  return {
    app: {
      acceptLanguage: 'en-US',
      clientAddress: data.clientAddress || '63.245.221.32',
      locale: data.locale || 'en-US',
      features: new Set(data.features)
    },
    auth: {
      credentials: data.credentials
    },
    clearMetricsContext: metricsContext.clear,
    emitMetricsEvent: events.emit,
    emitRouteFlowEvent: events.emitRouteFlowEvent,
    gatherMetricsContext: metricsContext.gather,
    headers: data.headers || {
      'user-agent': 'test user-agent'
    },
    path: data.path,
    payload: data.payload,
    query: data.query || {},
    setMetricsFlowCompleteSignal: metricsContext.setFlowCompleteSignal,
    stashMetricsContext: metricsContext.stash,
    validateMetricsContext: metricsContext.validate
  }
}
