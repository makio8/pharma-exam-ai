const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound'
const PROPERTIES = 'CanonicalSMILES,IsomericSMILES,IUPACName'

export interface PubChemResult {
  cid: number
  canonical_smiles: string
  isomeric_smiles: string
  iupac_name: string
}

export function buildPubChemUrl(cidOrName: number | string): string {
  if (typeof cidOrName === 'number') {
    return `${PUBCHEM_BASE}/cid/${cidOrName}/property/${PROPERTIES}/JSON`
  }
  return `${PUBCHEM_BASE}/name/${encodeURIComponent(cidOrName)}/property/${PROPERTIES}/JSON`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseSmilesResponse(data: any): PubChemResult | null {
  const props = data?.PropertyTable?.Properties
  if (!props || props.length === 0) return null
  const p = props[0]
  // PubChem API returns CanonicalSMILES/IsomericSMILES in older docs,
  // but current API returns ConnectivitySMILES (canonical) and SMILES (isomeric).
  // Support both for forward/backward compatibility.
  const canonical_smiles = p.CanonicalSMILES ?? p.ConnectivitySMILES
  const isomeric_smiles = p.IsomericSMILES ?? p.SMILES
  if (!canonical_smiles) return null
  return {
    cid: p.CID,
    canonical_smiles,
    isomeric_smiles,
    iupac_name: p.IUPACName,
  }
}

export function validateSmiles(smiles: string): boolean {
  return smiles.trim().length > 0
}

export async function fetchSmiles(cidOrName: number | string): Promise<PubChemResult | null> {
  const url = buildPubChemUrl(cidOrName)
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`PubChem API error: ${res.status} for ${cidOrName}`)
  }
  const data = await res.json()
  return parseSmilesResponse(data)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
