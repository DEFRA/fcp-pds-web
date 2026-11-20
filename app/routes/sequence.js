const { getSchemeIds } = require('ffc-pay-schemes')
const {
  getBatchProcessorData,
  postBatchProcessor
} = require('../api')
const { BATCH_PROCESSOR_GET, BATCH_PROCESSOR_POST } = require('../constants/api-calls')
const { GET, POST } = require('../constants/api-methods')
const { MAX_SEQUENCE_NUMBER_CS, MAX_SEQUENCE_NUMBER, MIN_SEQUENCE_NUMBER } = require('../constants/min-max-values')
const { SEQUENCE_PATHS } = require('../constants/paths')
const { INVALID_SEQUENCE_CS_ERROR, SEQUENCE_TOO_LOW_ERROR, INVALID_SEQUENCE_ERROR } = require('../constants/validation-errors')
const { SEQUENCE_VIEWS } = require('../constants/views')

const { VET_VISITS, CS, ES, FC, IMPS, FPTT, WMP } = getSchemeIds()

const schemesWithoutSequenceMaximum = new Set([
  VET_VISITS,
  ES,
  FC,
  IMPS,
  FPTT,
  WMP
])

const formatSequence = value =>
  String(value).padStart(4, '0')

module.exports = [{
  method: GET,
  path: SEQUENCE_PATHS.SEQUENCE,
  options: {
    auth: false,
    handler: async (_request, h) => {
      const { payload } = await getBatchProcessorData(BATCH_PROCESSOR_GET.SEQUENCE)
      const sequences = payload

      const tableRows = sequences.sequences.map(sequenceItem => [
        { text: String(sequenceItem.schemeId) },
        { text: sequenceItem.scheme },
        { text: formatSequence(sequenceItem.next) }
      ])

      return h.view(SEQUENCE_VIEWS.SEQUENCE, {
        tableRows
      })
    }
  }
},
{
  method: GET,
  path: SEQUENCE_PATHS.EDIT_SEQUENCE,
  options: {
    auth: false,
    handler: async (_request, h) => {
      const { payload } = await getBatchProcessorData(BATCH_PROCESSOR_GET.SEQUENCE)

      const schemeItems = [
        {
          value: '',
          text: ''
        },
        ...payload.sequences.map(sequenceItem => ({
          value: sequenceItem.schemeId,
          text: sequenceItem.scheme,
          attributes: {
            'data-sequence-number': sequenceItem.next
          }
        }))
      ]

      return h.view(SEQUENCE_VIEWS.EDIT_SEQUENCE, {
        sequences: payload.sequences,
        schemeItems
      })
    }
  }
},
{
  method: POST,
  path: SEQUENCE_PATHS.EDIT_SEQUENCE,
  options: {
    auth: false,
    handler: async (request, h) => {
      const { schemeId, sequenceNumber } = request.payload
      const { payload } = await getBatchProcessorData(BATCH_PROCESSOR_GET.SEQUENCE)

      const numericSchemeId = Number(schemeId)
      const numericSequenceNumber = Number(sequenceNumber)

      const hasNoSequenceMaximum =
        schemesWithoutSequenceMaximum.has(numericSchemeId)

      const isCsScheme = numericSchemeId === CS

      const exceedsSequenceMaximum =
        isCsScheme
          ? numericSequenceNumber > MAX_SEQUENCE_NUMBER_CS
          : !hasNoSequenceMaximum &&
          numericSequenceNumber > MAX_SEQUENCE_NUMBER

      const sequenceNumberInvalid =
        !Number.isInteger(numericSequenceNumber) ||
        numericSequenceNumber < MIN_SEQUENCE_NUMBER ||
        exceedsSequenceMaximum

      if (sequenceNumberInvalid) {
        const schemeItems = [
          {
            value: '',
            text: ''
          },
          ...payload.sequences.map(sequenceItem => ({
            value: sequenceItem.schemeId,
            text: sequenceItem.scheme,
            selected:
              String(sequenceItem.schemeId) === String(schemeId),
            attributes: {
              'data-sequence-number': sequenceItem.next
            }
          }))
        ]

        let errorMessage

        if (isCsScheme) {
          errorMessage = INVALID_SEQUENCE_CS_ERROR
        } else if (hasNoSequenceMaximum) {
          errorMessage = SEQUENCE_TOO_LOW_ERROR
        } else {
          errorMessage = INVALID_SEQUENCE_ERROR
        }

        return h.view(SEQUENCE_VIEWS.EDIT_SEQUENCE, {
          sequences: payload.sequences,
          schemeItems,
          errorMessage,
          sequenceNumber,
          selectedSchemeId: schemeId
        })
      }

      const sequence = payload.sequences.find(
        x => x.schemeId === numericSchemeId
      )

      return h.view(SEQUENCE_VIEWS.CONFIRM_SEQUENCE_CHANGE, {
        schemeId,
        schemeName: sequence.scheme,
        currentSequence: formatSequence(sequence.next),
        newSequence: formatSequence(sequenceNumber)
      })
    }
  }
},
{
  method: POST,
  path: SEQUENCE_PATHS.EDIT_SEQUENCE_CONFIRM,
  options: {
    auth: false,
    handler: async (request, h) => {
      const { schemeId, sequenceNumber } = request.payload

      await postBatchProcessor(BATCH_PROCESSOR_POST.UPDATE_SEQUENCE, {
        schemeId: Number(schemeId),
        next: Number(sequenceNumber)
      })

      return h.redirect(SEQUENCE_PATHS.SEQUENCE)
    }
  }
}]
