/**
 * Minimal ZIP builder (STORE method, no compression)
 * Creates a ZIP archive from in-memory files without external deps.
 * Note: Filenames should be ASCII. For UTF-8 names, set UTF-8 flag (not needed here).
 */

function crc32(buf: Uint8Array): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crc = (crc >>> 8) ^ c
  }
  return ~crc >>> 0
}

function toDosTimeDate(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2) & 0x1f
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | (d.getDate() & 0x1f)
  return { time: time & 0xffff, date: date & 0xffff }
}

function writeUInt16LE(arr: number[], n: number) { arr.push(n & 0xff, (n >>> 8) & 0xff) }
function writeUInt32LE(arr: number[], n: number) { arr.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff) }

export interface ZipInputFile {
  name: string
  data: Uint8Array
  mtime?: Date
}

export function createZip(files: ZipInputFile[]): Uint8Array {
  const encoder = new TextEncoder()
  const fileRecords: any[] = []
  const out: number[] = []
  let offset = 0

  // Write Local File Headers + file data
  for (const f of files) {
    const nameBytes = encoder.encode(f.name)
    const data = f.data
    const { time, date } = toDosTimeDate(f.mtime)
    const crc = crc32(data)
    const compressedSize = data.length
    const uncompressedSize = data.length

    // Local file header
    writeUInt32LE(out, 0x04034b50) // signature
    writeUInt16LE(out, 20) // version needed to extract
    writeUInt16LE(out, 0) // general purpose bit flag
    writeUInt16LE(out, 0) // compression method (0 = store)
    writeUInt16LE(out, time)
    writeUInt16LE(out, date)
    writeUInt32LE(out, crc)
    writeUInt32LE(out, compressedSize)
    writeUInt32LE(out, uncompressedSize)
    writeUInt16LE(out, nameBytes.length)
    writeUInt16LE(out, 0) // extra length
    // filename
    for (const b of nameBytes) out.push(b)
    // data
    for (const b of data) out.push(b)

    fileRecords.push({
      nameBytes,
      crc,
      compressedSize,
      uncompressedSize,
      time,
      date,
      offset
    })

    offset = out.length
  }

  const centralDirStart = out.length

  // Central directory headers
  for (const fr of fileRecords) {
    writeUInt32LE(out, 0x02014b50) // central file header signature
    writeUInt16LE(out, 20) // version made by
    writeUInt16LE(out, 20) // version needed to extract
    writeUInt16LE(out, 0) // flags
    writeUInt16LE(out, 0) // method
    writeUInt16LE(out, fr.time)
    writeUInt16LE(out, fr.date)
    writeUInt32LE(out, fr.crc)
    writeUInt32LE(out, fr.compressedSize)
    writeUInt32LE(out, fr.uncompressedSize)
    writeUInt16LE(out, fr.nameBytes.length) // name length
    writeUInt16LE(out, 0) // extra length
    writeUInt16LE(out, 0) // comment length
    writeUInt16LE(out, 0) // disk number start
    writeUInt16LE(out, 0) // internal file attributes
    writeUInt32LE(out, 0) // external file attributes
    writeUInt32LE(out, fr.offset) // relative offset of local header
    for (const b of fr.nameBytes) out.push(b)
  }

  const centralDirEnd = out.length
  const centralDirSize = centralDirEnd - centralDirStart
  const totalEntries = fileRecords.length

  // End of central directory record
  writeUInt32LE(out, 0x06054b50)
  writeUInt16LE(out, 0) // disk number
  writeUInt16LE(out, 0) // disk where central directory starts
  writeUInt16LE(out, totalEntries) // number of entries on this disk
  writeUInt16LE(out, totalEntries) // total number of entries
  writeUInt32LE(out, centralDirSize) // size of central directory
  writeUInt32LE(out, centralDirStart) // offset of start of central directory
  writeUInt16LE(out, 0) // comment length

  return new Uint8Array(out)
}
