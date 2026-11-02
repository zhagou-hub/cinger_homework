/* Local ZIP reader. Supports ordinary Store/Deflate archives without a server. */
(function (global) {
  'use strict';
  var crcTable = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function fail(message) { throw new Error(message); }
  function filename(bytes, utf8) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (e) {
      if (utf8) fail('ZIP 文件名编码损坏，请重新压缩为 UTF-8 ZIP。');
      return new TextDecoder('gb18030', { fatal: true }).decode(bytes);
    }
  }
  async function inflate(bytes, expected) {
    var stream;
    try { stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); }
    catch (e) { fail('当前浏览器不支持 ZIP 解压，请使用新版 Chrome / Edge，或解压后选择文件夹。'); }
    var reader = stream.getReader(), chunks = [], size = 0;
    try {
      while (true) {
        var part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > expected) { await reader.cancel(); fail('ZIP 解压大小与目录不一致。'); }
        chunks.push(part.value);
      }
    } catch (e) { throw new Error('ZIP 解压失败：' + e.message); }
    var out = new Uint8Array(size), offset = 0;
    chunks.forEach(function (chunk) { out.set(chunk, offset); offset += chunk.length; });
    return out;
  }
  async function read(file, options) {
    var limit = options && options.maxTotal || 6 * 1024 * 1024;
    if (file.size > limit) fail('ZIP 文件超过 6 MB，请精简案例素材后重试。');
    var bytes = new Uint8Array(await file.arrayBuffer());
    var view = new DataView(bytes.buffer), end = -1;
    for (var p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) {
      if (view.getUint32(p, true) === 0x06054b50 && p + 22 + view.getUint16(p + 20, true) === bytes.length) { end = p; break; }
    }
    if (end < 0) fail('无法识别 ZIP 目录，文件可能损坏。请选择普通 .zip 文件。');
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) fail('不支持分卷 ZIP，请合并后导入。');
    var count = view.getUint16(end + 10, true), dirSize = view.getUint32(end + 12, true), pos = view.getUint32(end + 16, true);
    if (count === 65535 || dirSize === 0xffffffff || pos === 0xffffffff) fail('不支持 ZIP64，请使用普通 ZIP。');
    if (count > 600) fail('ZIP 内文件过多，最多支持 600 个目录项。');
    if (view.getUint16(end + 8, true) !== count || pos + dirSize !== end) fail('ZIP 目录结构不完整。');
    var entries = [], total = 0, seen = Object.create(null);
    for (var j = 0; j < count; j++) {
      if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50) fail('ZIP 目录损坏。');
      var flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true);
      var crc = view.getUint32(pos + 16, true), packed = view.getUint32(pos + 20, true), size = view.getUint32(pos + 24, true);
      var nameLen = view.getUint16(pos + 28, true), extraLen = view.getUint16(pos + 30, true), commentLen = view.getUint16(pos + 32, true);
      var start = view.getUint32(pos + 42, true), next = pos + 46 + nameLen + extraLen + commentLen;
      if (next > end) fail('ZIP 文件目录超出边界。');
      var name = filename(bytes.subarray(pos + 46, pos + 46 + nameLen), !!(flags & 2048)).replace(/\\/g, '/');
      pos = next;
      if (!name || name[0] === '/' || /^[a-z]:/i.test(name) || name.split('/').indexOf('..') >= 0 || /[\x00-\x1f]/.test(name)) fail('ZIP 含有无效文件路径。');
      if (name.endsWith('/') || name.split('/').some(function (v) { return v === '__MACOSX' || v === '.DS_Store' || v.indexOf('._') === 0; })) continue;
      if (flags & 1) fail('不支持加密 ZIP，请取消密码后重新压缩。');
      if (method !== 0 && method !== 8) fail('ZIP 压缩方式不受支持，请使用标准 ZIP（Store / Deflate）。');
      if (seen[name]) fail('ZIP 中存在同名文件：' + name);
      seen[name] = true;
      total += size;
      if (total > limit) fail('ZIP 解压后的文件总量超过 6 MB，请精简素材。');
      if (start + 30 > bytes.length || view.getUint32(start, true) !== 0x04034b50) fail('ZIP 文件头损坏。');
      var dataStart = start + 30 + view.getUint16(start + 26, true) + view.getUint16(start + 28, true);
      if (dataStart + packed > end - dirSize) fail('ZIP 文件数据超出边界。');
      entries.push({ name: name, method: method, crc: crc, size: size, data: bytes.subarray(dataStart, dataStart + packed) });
    }
    if (pos !== end) fail('ZIP 目录长度不一致。');
    if (!entries.length) fail('ZIP 内没有可导入的文件。');
    if (entries.filter(function (e) { return /(^|\/)case\.json$/i.test(e.name); }).length > 1) fail('ZIP 内包含多个案例，请每次导入一个案例压缩包。');
    var files = [];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i], data = entry.method === 0 ? entry.data : await inflate(entry.data, entry.size);
      if (data.length !== entry.size || crc32(data) !== entry.crc) fail('ZIP 文件校验失败：' + entry.name + '，请重新压缩。');
      var f = new File([data], entry.name.split('/').pop());
      Object.defineProperty(f, 'webkitRelativePath', { value: entry.name, configurable: true });
      files.push(f);
    }
    return files;
  }
  global.CaseZip = { read: read };
})(window);
