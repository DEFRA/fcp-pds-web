const {
  getBatchProcessorData,
  postBatchProcessor
} = require('../api')

const minSequenceNumber = 1
const maxSequenceNumber = 9999
const maxCsSequenceNumber = 99999
const csSchemeId = 5

const schemesWithoutSequenceMaximum = [4, 7, 9, 10, 11, 17, 18]

const formatSequence = value =>
  String(value).padStart(4, '0')

module.exports = [{
  method: 'GET',
  path: '/sequence',
  options: {
    auth: false,
    handler: async (_request, h) => {
      const { payload } = await getBatchProcessorData('/sequence')
      const sequences = payload

      const tableRows = sequences.sequences.map(sequenceItem => [
        { text: String(sequenceItem.schemeId) },
        { text: sequenceItem.scheme },
        { text: formatSequence(sequenceItem.next) }
      ])

      return h.view('sequence/sequence', {
        tableRows
      })
    }
  }
},
{
  method: 'GET',
  path: '/edit-sequence',
  options: {
    auth: false,
    handler: async (_request, h) => {
      const { payload } = await getBatchProcessorData('/sequence')

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

      return h.view('sequence/edit-sequence', {
        sequences: payload.sequences,
        schemeItems
      })
    }
  }
},
{
  method: 'POST',
  path: '/edit-sequence',
  options: {
    auth: false,
    handler: async (request, h) => {
      const { schemeId, sequenceNumber } = request.payload
      const { payload } = await getBatchProcessorData('/sequence')

      const numericSchemeId = Number(schemeId)
      const numericSequenceNumber = Number(sequenceNumber)

      const hasNoSequenceMaximum =
        schemesWithoutSequenceMaximum.includes(numericSchemeId)

      const isCsScheme = numericSchemeId === csSchemeId

      const exceedsSequenceMaximum =
        isCsScheme
          ? numericSequenceNumber > maxCsSequenceNumber
          : !hasNoSequenceMaximum &&
          numericSequenceNumber > maxSequenceNumber

      const sequenceNumberInvalid =
        !Number.isInteger(numericSequenceNumber) ||
        numericSequenceNumber < minSequenceNumber ||
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
          errorMessage =
            `Sequence number must be between ${minSequenceNumber} and ${maxCsSequenceNumber}`
        } else if (hasNoSequenceMaximum) {
          errorMessage =
            `Sequence number must be a whole number greater than or equal to ${minSequenceNumber}`
        } else {
          errorMessage =
            `Sequence number must be between ${minSequenceNumber} and ${maxSequenceNumber}`
        }

        return h.view('sequence/edit-sequence', {
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

      return h.view('sequence/confirm-sequence-change', {
        schemeId,
        schemeName: sequence.scheme,
        currentSequence: formatSequence(sequence.next),
        newSequence: formatSequence(sequenceNumber)
      })
    }
  }
},
{
  method: 'POST',
  path: '/edit-sequence/confirm',
  options: {
    auth: false,
    handler: async (request, h) => {
      const { schemeId, sequenceNumber } = request.payload

      await postBatchProcessor('/update-sequence', {
        schemeId: Number(schemeId),
        next: Number(sequenceNumber)
      })

      return h.redirect('/sequence')
    }
  }
}]
