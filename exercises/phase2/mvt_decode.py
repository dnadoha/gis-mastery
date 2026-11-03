#!/usr/bin/env python3
"""Decode MVT command integers, not an entire Protocol Buffers tile."""


def unzigzag(n):
    return (n >> 1) ^ -(n & 1)


def decode(geom):
    if any(isinstance(n, bool) or not isinstance(n, int) or not 0 <= n <= 0xFFFFFFFF for n in geom):
        raise ValueError("geometry commands and parameters must be uint32 integers")
    i, x, y, out, started = 0, 0, 0, [], False
    while i < len(geom):
        cid, count = geom[i] & 7, geom[i] >> 3
        i += 1
        if cid not in (1, 2, 7) or count == 0:
            raise ValueError("unknown command or zero count")
        if cid == 7:
            if count != 1 or not started:
                raise ValueError("ClosePath requires a started path and count 1")
            out.append(("ClosePath",))
            started = False
            continue
        if cid == 2 and not started:
            raise ValueError("LineTo requires MoveTo first")
        if i + count * 2 > len(geom):
            raise ValueError("truncated command parameters")
        for _ in range(count):
            x += unzigzag(geom[i])
            y += unzigzag(geom[i + 1])
            i += 2
            out.append(("MoveTo" if cid == 1 else "LineTo", x, y))
        started = True
    return out


def cmd(cid, count):
    if cid not in (1, 2, 7) or not 1 <= count < 2 ** 29:
        raise ValueError("invalid command ID or count")
    return cid | count << 3


def zz(v):
    if not isinstance(v, int) or isinstance(v, bool) or not -(2 ** 31) <= v < 2 ** 31:
        raise ValueError("zigzag input must be a signed 32-bit integer")
    return (v << 1) ^ (v >> 31)


if __name__ == "__main__":
    ring = [(10, 10), (30, 10), (30, 30), (10, 30)]
    stream = [cmd(1, 1), zz(10), zz(10), cmd(2, 3)]
    for a, b in zip(ring, ring[1:]):
        stream.extend([zz(b[0] - a[0]), zz(b[1] - a[1])])
    stream.append(cmd(7, 1))
    print(stream)
    print(decode(stream))
    print(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1])) / 2)
