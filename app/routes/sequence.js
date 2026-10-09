const {
  getBatchProcessorData,
  postBatchProcessor
} = require('../api')

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

      const tableRows = sequences.sequences.map(sequence => [
        { text: String(sequence.schemeId) },
        { text: sequence.scheme.scheme },
        { text: formatSequence(sequence.next) }
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
        ...payload.sequences.map(sequence => ({
          value: sequence.schemeId,
          text: sequence.scheme.scheme,
          attributes: {
            'data-sequence-number': sequence.next
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
                Number(sequenceNumber) < 1 ||
                Number(sequenceNumber) > 9999
      ) {
        const schemeItems = [
          {
            value: '',
            text: ''
          },
          ...payload.sequences.map(sequence => ({
            value: sequence.schemeId,
            text: sequence.scheme.scheme,
            selected: String(sequence.schemeId) === String(schemeId),
            attributes: {
              'data-sequence-number': sequence.next
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
