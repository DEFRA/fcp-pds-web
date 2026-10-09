const {
  getBatchProcessorData,
  postBatchProcessor
} = require('../api')

const minSequenceNumber = 1
const maxSequenceNumber = 9999

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
        { text: sequenceItem.scheme.scheme },
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
          text: sequenceItem.scheme.scheme,
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

      if (
        !Number.isInteger(Number(sequenceNumber)) ||
        Number(sequenceNumber) < minSequenceNumber ||
        Number(sequenceNumber) > maxSequenceNumber
      ) {
        const schemeItems = [
          {
            value: '',
            text: ''
          },
          ...payload.sequences.map(sequenceItem => ({
            value: sequenceItem.schemeId,
            text: sequenceItem.scheme.scheme,
            selected: String(sequenceItem.schemeId) === String(schemeId),
            attributes: {
              'data-sequence-number': sequenceItem.next
            }
          }))
        ]

        return h.view('sequence/edit-sequence', {
          sequences: payload.sequences,
          schemeItems,
          errorMessage: 'Sequence number must be between 1 and 9999',
          sequenceNumber,
          selectedSchemeId: schemeId
        })
      }

      const sequence = payload.sequences.find(
        x => x.schemeId === Number(schemeId)
      )

      return h.view('sequence/confirm-sequence-change', {
        schemeId,
        schemeName: sequence.scheme.scheme,
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