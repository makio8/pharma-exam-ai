import { describe, it, expect } from 'vitest'
import { buildPubChemUrl, parseSmilesResponse, validateSmiles } from '../pubchem-client'

describe('buildPubChemUrl', () => {
  it('builds URL from CID', () => {
    expect(buildPubChemUrl(2519)).toBe(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2519/property/CanonicalSMILES,IsomericSMILES,IUPACName/JSON'
    )
  })
  it('builds URL from name', () => {
    expect(buildPubChemUrl('Caffeine')).toBe(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Caffeine/property/CanonicalSMILES,IsomericSMILES,IUPACName/JSON'
    )
  })
  it('encodes special characters in name', () => {
    const url = buildPubChemUrl('Benzo[a]pyrene')
    expect(url).toContain('Benzo%5Ba%5Dpyrene')
  })
})

describe('parseSmilesResponse', () => {
  it('extracts data from valid response', () => {
    const response = {
      PropertyTable: {
        Properties: [{
          CID: 2519,
          CanonicalSMILES: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          IsomericSMILES: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          IUPACName: '1,3,7-trimethylpurine-2,6-dione',
        }]
      }
    }
    const result = parseSmilesResponse(response)
    expect(result).toEqual({
      cid: 2519,
      canonical_smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      isomeric_smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      iupac_name: '1,3,7-trimethylpurine-2,6-dione',
    })
  })
  it('returns null for empty response', () => {
    expect(parseSmilesResponse({})).toBeNull()
    expect(parseSmilesResponse({ PropertyTable: { Properties: [] } })).toBeNull()
  })
})

describe('validateSmiles', () => {
  it('accepts valid SMILES', () => {
    expect(validateSmiles('c1ccccc1')).toBe(true)
  })
  it('rejects empty', () => {
    expect(validateSmiles('')).toBe(false)
    expect(validateSmiles('  ')).toBe(false)
  })
})
